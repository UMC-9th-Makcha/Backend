import authService from '../services/auth.service.js';
import { CustomSuccess } from '../response/customSuccess.js';
import { CustomError } from '../response/customError.js'; //공통 응답 구조 사용함.

const isProd = process.env.NODE_ENV === 'production'; //http 상태(웹 미배포)에서도 쿠키를 브라우저에서 받을 수 있도록 함.
// 30일
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

//POST /auth/kakao 카카오 로그인 컨트롤러
const kakaoLogin = async (req, res, next) => {
    try {
      // const { code } = req.body;
      const { code, redirectUri } = req.body;  // redirectUri를 파라미터를 받을 수 있도록 추가
  
      if (!code) {
        throw new CustomError(
          'COM-400-001',
          'code is required',
          req.originalUrl
        );
      }
      
      // redirectUri를 service로 전달
      const result = await authService.kakaoLogin(code, redirectUri);
  
      // Refresh Token 쿠키 저장
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: isProd, 
        // secure: true,
        sameSite: isProd ? 'none' : 'lax', 
        maxAge: REFRESH_COOKIE_MAX_AGE, //기간 연장
        // sameSite: 'none',
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

  //POST /auth/refresh 카카오 토큰 재발급
  const refresh = async (req, res, next) => {
    try {
      const refreshToken = req.cookies.refreshToken;
  
      if (!refreshToken) {
        throw new CustomError(
          'AUTH-401-002',
          'Refresh Token 누락',
          req.originalUrl
        );
      }
  
      const result = await authService.refresh(refreshToken);
  
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: isProd,
        // secure: true,
        sameSite: isProd ? 'none' : 'lax', 
        maxAge: REFRESH_COOKIE_MAX_AGE,
        //sameSite: 'none',
      });
  
      const response = new CustomSuccess(
        'AUTH-200-002',
        200,
        '토큰 재발급 성공',
        { accessToken: result.accessToken }
      );
  
      return res.status(response.statusCode).json(response);
    } catch (err) {
      next(err);
    }
  };

  // POST /auth/logout
const logout = async (req, res, next) => {
  try {
    const { userId } = req.user; // isLoggedIn에서 주입됨

    await authService.logout(userId);

    // refreshToken 쿠키 삭제
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });

    const response = new CustomSuccess(
      'AUTH-200-004',
      200,
      '로그아웃 성공'
    );

    return res.status(response.statusCode).json(response);
  } catch (err) {
    next(err);
  }
};

// DELETE /auth/withdraw -> 회원탈퇴 api
const withdraw = async (req, res, next) => {
  try {
    const user = req.user;

    await authService.withdraw(user);

    // refreshToken 쿠키 삭제
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });

    const response = new CustomSuccess(
      'AUTH-200-005',
      200,
      '회원 탈퇴 성공'
    );
    
    return res.status(response.statusCode).json(response);
  } catch (err) {
    next(err);
  }
};

// 백엔드 테스트 용도. -> 프론트 사용 X
const kakaoTestCallback = (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.send(`<h2>❌ Kakao Error</h2><p>${error}</p>`);
  }

  return res.send(`
    <h2> Kakao Auth Test Success</h2>
    <p><b>code:</b> ${code}</p>
    <p>이 code를 Postman에 넣어주세요.</p>
  `);
};

export default { kakaoLogin, refresh, logout, withdraw,kakaoTestCallback };

