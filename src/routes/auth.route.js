import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { isLoggedIn, isNotLoggedIn } from '../middleware/auth.middleware.js';
import { refreshLimiter } from '../middleware/rateLimit.middleware.js';


const router = Router();

//카카오 로그인 api
//밑에는 스웨거 배포 테스트 입니다.

/**
 * @swagger
 * /auth/kakao:
 *   post:
 *     summary: 카카오 로그인
 *     description: |
 *       카카오 OAuth 인가 코드(code)를 받아 로그인 또는 회원가입을 진행합니다.
 *       성공 시 Access Token은 응답 body로,
 *       Refresh Token은 HttpOnly 쿠키로 전달됩니다.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: 카카오 OAuth 인가 코드
 *                 example: "authorization_code_from_kakao"
 *     responses:
 *       200:
 *         description: 카카오 로그인 성공
 *       400:
 *         description: code 누락
 *       401:
 *         description: 인증 실패
 */

router.post('/kakao', isNotLoggedIn, authController.kakaoLogin);
//카카오 토큰 재발급 api
router.post('/refresh', refreshLimiter, authController.refresh);
//카카오 로그아웃 api
router.post('/logout', isLoggedIn, authController.logout);
//카카오 회원 탈퇴
router.delete('/withdraw', isLoggedIn, authController.withdraw);




//테스트용 보호 api(토큰이 통과 혹은 차단되는지 로컬 테스트 확인용)
router.get('/me', isLoggedIn, (req, res) => {
  res.status(200).json({
    successCode: 'AUTH-200-003',
    message: 'Access Token 검증 성공',
    result: {
      user: req.user, // jwt payload 그대로
    },
  });
});


export default router;
