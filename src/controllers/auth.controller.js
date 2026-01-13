import authService from '../services/auth.service.js';
import { CustomSuccess } from '../response/customSuccess.js';
import { CustomError } from '../response/customError.js'; //공통 응답 구조 사용함.


//POST /auth/kakao 카카오 로그인 컨트롤러
const kakaoLogin = async (req, res, next) => {
    try {
      const { code } = req.body;
  
      if (!code) {
        throw new CustomError(
          'COM-400-001',
          'code is required',
          req.originalUrl
        );
      }
  
      const result = await authService.kakaoLogin(code);
  
      // Refresh Token 쿠키 저장
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
      });
  
      const response = new CustomSuccess(
        'AUTH-200-001',
        200,
        '카카오 로그인 성공',
        result.response
      );
  
      return res.status(response.statusCode).json(response);
    } catch (err) {
      next(err);
    }
  };
  
  export default { kakaoLogin };
