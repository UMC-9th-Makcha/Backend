import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { isLoggedIn, isNotLoggedIn } from '../middleware/auth.middleware.js';

const router = Router();

//카카오톡 로그인 api
router.post('/kakao', isNotLoggedIn, authController.kakaoLogin);
//카카오 토큰 재발급 api
router.post('/refresh', authController.refresh);

// 로컬 테스트용 임시 콜백 - 로컬 로그인 확인차 넣었으며, 실제 배포 이후 해당 코드는 삭제하겠습니다.
router.get('/kakao/callback', (req, res) => {
  const { code } = req.query;
  return res.json({
    message: 'Kakao OAuth code received',
    code,
  });
});

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
