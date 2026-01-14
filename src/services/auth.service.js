import axios from 'axios';
import jwt from 'jsonwebtoken';
import prisma from '../database/prisma.js';
import { CustomError } from '../response/customError.js';

/**
 * 카카오 로그인 서비스
 * @param {string} code - 카카오 인가 코드
 */
const kakaoLogin = async (code) => {
  try {
    // 카카오 Access Token 발급 진행.
    const tokenRes = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID,
        redirect_uri: process.env.KAKAO_REDIRECT_URI,
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
    const user = await prisma.user.upsert({
      where: { kakao_id: kakaoId },
      update: {
        nickname,
        email,
        last_login_at: new Date(),
      },
      create: {
        kakao_id: kakaoId,
        nickname,
        email,
        social_type: 'KAKAO',
        phone_number: '',          // NOT NULL 대응
        refresh_token: '',         // 최초 빈 값
      },
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
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '14d',
    });

    // Refresh Token DB 저장 
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { refresh_token: refreshToken },
    });

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
    const user = await prisma.user.findUnique({
      where: { user_id: BigInt(payload.userId) },
    });

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
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '14d' }
    );

    // RT 교체 
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { refresh_token: newRefreshToken },
    });

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


export default { kakaoLogin, refresh };
