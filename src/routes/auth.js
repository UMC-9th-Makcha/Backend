//** 로컬 테스트 시 secure: false로 바꿔서 테스트하고, 배포 시 true로 작동해야함.** */

import { Router } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import prisma from '../database/prisma.js';

const router = Router();

/**
 * POST /auth/kakao
 */
router.post('/kakao', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'code is required' });

  try {
    // 1) 인가 코드 → 카카오 토큰
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

    // 2) 카카오 유저 정보
    const meRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${kakaoAccessToken}` },
    });

    const kakaoId = BigInt(meRes.data.id);
    const nickname = meRes.data.kakao_account.profile.nickname;
    const profileImage = meRes.data.kakao_account.profile.profile_image_url;
    const email = meRes.data.kakao_account.email;

    // 3) 우리 서비스 JWT
    const accessToken = jwt.sign(
      { kakaoId: kakaoId.toString() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || 3600 }
    );

    const refreshToken = jwt.sign(
      { kakaoId: kakaoId.toString() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '14d' }
    );

    // 4) DB upsert
    const user = await prisma.user.upsert({
      where: { kakaoId },
      update: {
        nickname,
        email,
        lastLoginAt: new Date(),
        refreshToken,
      },
      create: {
        kakaoId,
        nickname,
        email,
        socialType: 'KAKAO',
        refreshToken,
      },
    });

    // 5) Refresh Token 쿠키
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,       // 로컬 테스트면 false로 , 실제 배포시 secure:true
      sameSite: 'none',
    });

    // 6) 응답
    return res.json({
      accessToken,
      expiresIn: Number(process.env.JWT_EXPIRES_IN || 3600),
      user: {
        id: Number(user.userId),
        nickname: user.nickname,
        profileImage,
      },
    });
  } catch (err) {
    console.error(err.response?.data || err);
    return res.status(500).json({ message: 'Kakao login failed' });
  }
});

/**
 * GET /auth/kakao/callback
 * 카카오가 redirect 해주는 엔드포인트
 */
router.get('/kakao/callback', async (req, res) => {
    const { code } = req.query;
  
    if (!code) {
      return res.status(400).send('No code provided');
    }
  
    // 프론트 미구현으로
    // code가 잘 왔는지만 먼저 확인 -> 테스트용 
    return res.json({
      message: 'Kakao OAuth code received',
      code,
    });
    /*// 배포시 프론트 로그인 페이지로 code 전달
    return res.redirect(
      `${process.env.FRONTEND_URL}/login/callback?code=${code}`
    ); */
  });

export default router;