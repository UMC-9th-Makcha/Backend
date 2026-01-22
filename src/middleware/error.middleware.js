export const globalErrorHandler = (err, req, res, next) => {
    // 에러 로깅
    console.error(`[ERROR] ${req.method} ${req.url}`);
    console.error(err.stack);

    const statusCode = err.statusCode || 500; 

    const errorCode = err.errorCode || "COMMON-500-001";
    const message = err.message || "서버 내부 오류가 발생했습니다.";
    const errorPath = err.path || req.url; 
    const result = err.result || {};

    res.status(statusCode).json({
        errorCode: errorCode,
        message: message,
        path: errorPath,
        result: result
    });
};