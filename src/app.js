import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"; //쿠키 파싱
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger/swagger.js";

//import notificationRouter from "./routes/notification.route.js"; -> 서버 오류로 주석처리함.
//아예 이 알림은 현재 제외 후 배포하겠습니다:)
import authRouter from "./routes/auth.route.js";
import placeRouter from "./routes/myPlace.route.js";
import myinfoRouter from "./routes/myinfo.route.js";
import recentDestinationRouter from './routes/recentDestination.route.js';
import placeRouter from './routes/myPlace.route.js';
import saveReportRouter from "./routes/saveReports.route.js";
import homeRouter from './routes/home.route.js';
import myplacesRouter from "./routes/myplaces.route.js";
import { globalErrorHandler } from "./middleware/error.middleware.js";
import routeCandidateRouter from "./routes/routeCandidate.route.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

// CORS - 쿠키 전송 필수
app.use(
  cors({
    origin: true, // 요청 origin 그대로 허용, 쿠키 인증 + HTTPS + Nginx 환경에서 안정. 아직 웹배포 전이므로.
    credentials: true,
  }),
);

//라우터
// app.use("/api/alerts", notificationRouter);
// 아예 이 알림은 현재 제외 후 배포하겠습니다:)
app.use('/auth', authRouter);
app.use("/api/myplaces/home", homeRouter);
app.use("/api/myplaces", myplacesRouter);
app.use("/api", recentDestinationRouter);
app.use("/api", placeRouter);
app.use("/api/save-reports", saveReportRouter);
app.use("/api/me", myinfoRouter);

app.use("/api/routes", routeCandidateRouter);

// Swagger -> ui적으로 보완했는데 팀장님 확인 한 번 부탁드립니다!
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,                 // 상단 검색/탐색 활성화
    swaggerOptions: {
      docExpansion: "list",         // API 목록 접힌 상태로 시작
      defaultModelsExpandDepth: -1, // Models 섹션 숨김
      persistAuthorization: true,   // 새로고침해도 JWT 유지
    },
    customSiteTitle: "Makcha API Docs",
  })
);

app.get("/", (req, res) => {
  res.send("server on");
});

//에러 핸들러
app.use(globalErrorHandler);

//health 엔드포인트 추가. CORS 설정을 "운영 기준"으로 정리했습니다.
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

//에러 핸들러
app.use(globalErrorHandler);

export default app;