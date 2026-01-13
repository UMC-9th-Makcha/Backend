import jwt from 'jsonwebtoken';
import { CustomError } from '../response/customError.js';

//로그인된 사용자만 접근 가능
export const isLoggedIn = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new CustomError(
      'AUTH-401-001',
      'Access Token 만료 또는 누락',
      req.originalUrl
    );
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    throw new CustomError(
      'AUTH-401-001',
      'Access Token 만료', //전역 에러 핸들러로 통일함.
      req.originalUrl
    );
  }
};


// 로그인되지 않은 사용자만 접근 가능 (회원가입/소셜 로그인)
export const isNotLoggedIn = (req, res, next) => {
  const token = req.headers.authorization;

  if (token) {
    throw new CustomError(
      'AUTH-403-001',
      '이미 로그인된 사용자입니다.',
      req.originalUrl
    );
  }

  next();
};
