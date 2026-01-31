import rateLimit from 'express-rate-limit';

// Refresh Token 재발급 전용 limiter
export const refreshLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 5, // 1분에 최대 5번
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    successCode: 'AUTH-429-001',
    message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  },
});
