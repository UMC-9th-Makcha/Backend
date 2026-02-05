import axios from 'axios';
import jwt from 'jsonwebtoken';
import authRepository from '../repositories/auth.repository.js';
import { CustomError } from '../response/customError.js';

/**
 * 카카오 로그인 서비스
 * @param {string} code - 카카오 인가 코드
 * @param {string} redirectUri - 프론트에서 인가코드 받을 때 사용한 redirect URI (선택)
 */
const kakaoLogin = async (code, redirectUri ) => { // redirectUri 파라미터 추가
  try {

    // redirectUri가 없으면 .env 기본값 사용
    const finalRedirectUri = redirectUri || process.env.KAKAO_REDIRECT_URI;
    
    // 카카오 Access Token 발급 진행.
    const tokenRes = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID,
        redirect_uri: finalRedirectUri, //동적으로 처리하도록 함.
        code,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const kakaoAccessToken = tokenRes.data.access_token;

    // 카카오 유저 정보 조회
    const meRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${kakaoAccessToken}` },
    });
    
    const kakaoId = BigInt(meRes.data.id);
    
    // 파싱을 안전하게 받을 수 있도록 변경함.
    const kakaoAccount = meRes.data.kakao_account ?? {};
    const profile = kakaoAccount.profile ?? {};
    
    const nickname = profile.nickname ?? '카카오유저';
    const profileImage = profile.profile_image_url ?? null;
    const email = kakaoAccount.email ?? '';

    // 사용자 upsert -> 프리즈마에 일치하게 구현을 완료함.
    const user = await authRepository.upsertKakaoUser({
      kakaoId,
      nickname,
      email,
    });

    //  JWT Payload
    const payload = {
      kakaoId: kakaoId.toString(),
      userId: user.user_id.toString(),
    };

    // Access Token
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: Number(process.env.JWT_EXPIRES_IN || 3600),
    });

    // Refresh Token
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    });

    // Refresh Token DB 저장 
    await authRepository.updateRefreshToken(user.user_id, refreshToken);


    // 회원가입 이후, 전화번호 받아야 하는 유저 계산(지금 사업자번호가 없기에 모든 유저가 대상.)
    const needsPhoneVerification = user.phone_number === '';

    // 응답
    return {
      refreshToken,
      response: {
        accessToken,
        expiresIn: Number(process.env.JWT_EXPIRES_IN || 3600),
        user: {
          id: user.user_id.toString(),
          nickname: user.nickname,
          profileImage,
          needsPhoneVerification,
        },
      },
    };
  } catch (err) {
    console.error('Kakao login error detail:'); //카카오톡 로그인 에러 확인
    console.error(err.response?.data || err.message || err);
  
    throw new CustomError(
      'COM-500-001',
      'Kakao login failed',
      'auth.service.kakaoLogin'
    );
  }
};

//카카오톡 토큰 재발급 api
const refresh = async (refreshToken) => {
  try {
    // RT 검증
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // DB RT 비교
    const user = await authRepository.findUserById(payload.userId);

    if (!user || user.refresh_token !== refreshToken) {
      throw new CustomError(
        'AUTH-401-003',
        'Refresh Token 무효',
        'auth.service.refresh'
      );
    }

    // 새 토큰 발급
    const newPayload = {
      userId: payload.userId,
      kakaoId: payload.kakaoId,
    };

    const newAccessToken = jwt.sign(
      newPayload,
      process.env.JWT_SECRET,
      { expiresIn: Number(process.env.JWT_EXPIRES_IN || 3600) }
    );

    const newRefreshToken = jwt.sign(
      newPayload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    // RT 교체 
    await authRepository.updateRefreshToken(user.user_id, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (err) {
    throw new CustomError(
      'AUTH-401-004',
      'Refresh Token 만료 또는 오류',
      'auth.service.refresh'
    );
  }
};

// 로그아웃
const logout = async (userId) => {
  // refresh token 무효화 DB에서 제거 되도록 함.
  await authRepository.updateRefreshToken(userId, '');
};

// 회원 탈퇴
const withdraw = async (user) => {
  const { userId } = user;

  try {
      //지금 구조상 서버에 kakao accessToken 저장 안 하므로
      // 추후 카카오 연결 해제 로직 수행 단계로 구현을 진행함.

    // 유저 삭제
    await authRepository.deleteUserById(userId);
  } catch (err) {
    throw new CustomError(
      'AUTH-500-001',
      '회원 탈퇴 처리 중 오류 발생',
      'auth.service.withdraw'
    );
  }
};



export default { kakaoLogin, refresh, logout, withdraw };
