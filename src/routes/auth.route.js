import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { isLoggedIn, isNotLoggedIn } from '../middleware/auth.middleware.js';
import { refreshLimiter } from '../middleware/rateLimit.middleware.js';


const router = Router();

//카카오 로그인 api
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
