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
    // 인가 코드 => 카카오 Access Token 발급
    const tokenRes = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID,
        redirect_uri: process.env.KAKAO_REDIRECT_URI,
        code,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const kakaoAccessToken = tokenRes.data.access_token;

    // 카카오 유저 정보 조회
    const meRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${kakaoAccessToken}`,
      },
    });

    const kakaoId = BigInt(meRes.data.id); // 카카오 고유 ID
    const { nickname, profile_image_url: profileImage } =
      meRes.data.kakao_account.profile;
    const email = meRes.data.kakao_account.email;

    // 사용자 정보 upsert
    // 최초 로그인: create
    // 재로그인: update
    const user = await prisma.user.upsert({
      where: { kakaoId },
      update: {
        nickname,
        email,
        lastLoginAt: new Date(),
      },
      create: {
        kakaoId,
        nickname,
        email,
        socialType: 'KAKAO',
      },
    });

    // JWT Payload 
    // Access / Refresh Token 모두 kakaoId + 내부 userId 포함
    const payload = {
      kakaoId: kakaoId.toString(),
      userId: user.userId,
    };

    // Access Token 발급
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || 3600,
    });

    // Refresh Token 발급
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '14d',
    });

    // Refresh Token DB 저장
    // RTR(Refresh Token Rotation) 대비 -> FE.API 반영
    await prisma.user.update({
      where: { userId: user.userId },
      data: { refreshToken },
    });

    // 컨트롤러로 전달할 결과
    return {
      refreshToken, // 쿠키로 내려줄 RT
      response: {
        accessToken,
        expiresIn: Number(process.env.JWT_EXPIRES_IN || 3600),
        user: {
          id: user.userId,        // 내부 사용자 ID
          nickname: user.nickname,
          profileImage,           // 카카오 프로필 이미지
        },
      },
    };
  } catch (err) {
    // 카카오 로그인 처리 중 서버 오류
    throw new CustomError(
      'COM-500-001',
      'Kakao login failed',
      'auth.service.kakaoLogin'
    );
  }
};

export default { kakaoLogin };
