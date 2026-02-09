import rateLimit from 'express-rate-limit';

// Refresh Token 재발급 전용 limiter
export const refreshLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 15, // 1분에 15번으로 증가 (PWA 동시 요청 고려) - 프론트 요청 사항.
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 성공한 요청은 카운트 안 함
  handler: (req, res) => {
    // globalErrorHandler 형식에 맞춤
    res.status(429).json({
      errorCode: 'AUTH-429-001',
      message: '토큰 재발급 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      path: req.url,
      result: {}
    });
  },
});
