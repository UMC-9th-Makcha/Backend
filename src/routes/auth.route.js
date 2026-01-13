import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { isNotLoggedIn } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/kakao', isNotLoggedIn, authController.kakaoLogin);

// 로컬 테스트용 임시 콜백 - 로컬 로그인 확인차 넣었으며, 실제 배포 이후 해당 코드는 삭제하겠습니다.
router.get('/kakao/callback', (req, res) => {
  const { code } = req.query;
  return res.json({
    message: 'Kakao OAuth code received',
    code,
  });
});

export default router;
