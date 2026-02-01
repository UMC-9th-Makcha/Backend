import app from "./app.js";
import "dotenv/config"; //dotenv 자동 로그가 되도록 수정함.

console.log("KAKAO KEY:", process.env.KAKAO_REST_API_KEY);
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 카카오 API 키 확인
    if (!process.env.KAKAO_REST_API_KEY) {
      console.error("❌ KAKAO_REST_API_KEY가 설정되지 않았습니다.");
      console.error("💡 .env 파일을 확인하세요.");
      process.exit(1);
    }

    // 서버 시작
    const server = app.listen(PORT, () => {
      console.log(`서버 실행 중 . . .`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);

      server.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
      });

      setTimeout(() => {
        console.error("Forcing shutdown...");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
