import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"; //쿠키 파싱
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger/swagger.js";

//import notificationRouter from "./routes/notification.route.js"; -> 서버 오류로 주석처리함.
//아예 이 알림은 현재 제외 후 배포하겠습니다:)
import authRouter from "./routes/auth.route.js";
import recentDestinationRouter from './routes/recentDestination.route.js';
import placeRouter from './routes/myPlace.route.js';
import homeRouter from './routes/home.route.js';

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

app.use("/api", recentDestinationRouter);
app.use("/api", placeRouter);
app.use("/api/routes", routeCandidateRouter);

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
  res.send("server on");
});

//health 엔드포인트 추가. CORS 설정을 "운영 기준"으로 정리했습니다.
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use(globalErrorHandler);

export default app;
