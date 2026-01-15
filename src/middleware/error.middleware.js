export const globalErrorHandler = (err, req, res, next) => {
    //에러 로깅
    console.error(`[ERROR] ${req.method} ${req.url}`);
    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    const errorCode = err.errorCode || "COMMON-500-001";
    const message = err.message || "서버 내부 오류가 발생했습니다.";
    const result = err.result || {};

    // 클라이언트에게 보낼 표준 응답 객체
    res.status(statusCode).json({
        errorCode: errorCode,
        message: message,
        path: err.path || req.originalUrl, //정의되지 않는 문제가 있습니다.
        result: result
    });
};