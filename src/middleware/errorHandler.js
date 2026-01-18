const errorCodes = {
  // 요청 에러
  INVALID_PARAMETERS: { 
    status: 400, 
    message: '요청 파라미터가 유효하지 않습니다.' 
  },
  INVALID_LOCATION: { 
    status: 400, 
    message: '위치 정보가 유효하지 않습니다.' 
  },
  INVALID_ROUTE: { 
    status: 400, 
    message: '경로를 계산할 수 없습니다.' 
  },
  
  // 리소스 에러
  PLACE_NOT_FOUND: { 
    status: 404, 
    message: '대기 장소를 찾을 수 없습니다.' 
  },
  
  // 외부 서비스 에러
  MAP_SERVICE_UNAVAILABLE: { 
    status: 503, 
    message: '길찾기 서비스를 일시적으로 사용할 수 없습니다.' 
  },
  KAKAO_RATE_LIMIT: { 
    status: 429, 
    message: 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' 
  },
  KAKAO_SERVER_ERROR: { 
    status: 503, 
    message: '지도 서비스가 일시적으로 불안정합니다.' 
  },
  KAKAO_UNAUTHORIZED: { 
    status: 500, 
    message: '지도 서비스 인증에 실패했습니다.' 
  },
  
  // 서버 에러
  INTERNAL_SERVER_ERROR: { 
    status: 500, 
    message: '서버 오류가 발생했습니다.' 
  },
  DATABASE_ERROR: { 
    status: 500, 
    message: '데이터베이스 오류가 발생했습니다.' 
  }
};

function errorHandler(err, req, res, next) {
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const errorInfo = errorCodes[errorCode] || errorCodes.INTERNAL_SERVER_ERROR;
  const statusCode = err.statusCode || errorInfo.status;

  // 로깅
  console.error('[Error]', {
    timestamp: new Date().toISOString(),
    code: errorCode,
    message: err.message,
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // 응답
  const response = {
    success: false,
    error: {
      code: errorCode,
      message: errorInfo.message
    }
  };

  // 개발 환경에서는 상세 정보 추가
  if (process.env.NODE_ENV === 'development') {
    response.error.details = err.message;
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

export { errorHandler };
