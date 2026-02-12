import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"; //쿠키 파싱
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger/swagger.js";

import notificationRouter from "./routes/notification.route.js";
import authRouter from "./routes/auth.route.js";
import recentDestinationRouter from './routes/recentDestination.route.js';
import placeRouter from './routes/myPlace.route.js';
import homeRouter from './routes/home.route.js';
import myplacesRouter from "./routes/myplaces.route.js";
import myinfoRouter from "./routes/myinfo.route.js";
import saveReportRouter from "./routes/saveReports.route.js";
import { globalErrorHandler } from "./middleware/error.middleware.js";
import routeCandidateRouter from "./routes/routeCandidate.route.js";
import facilityRouter from "./routes/facility.route.js";
import routeRouter from "./routes/route.route.js";
import waitingPlaceRouter from "./routes/waitingPlace.route.js";

// Taxi 관련 import
import { createTaxiRouter } from "./routes/taxi.route.js";
import TaxiController from "./controllers/taxi.controller.js";
import TaxiService from "./services/taxi.service.js";
import KakaoMapClient from "./clients/kakaoMap.client.js";
import { DistanceUtil } from "./utils/distance.util.js";

const app = express();

// 미들웨어 설정 (순서 중요!)
app.use(express.json());
app.use(cookieParser());

// CORS - 개발/운영 모두 허용으로 수정
const allowedOrigins = [
  // Swagger / API 서버
  'https://api.makcha.store',
  
  // 운영 환경
  'https://makcha.vercel.app',
  'https://www.makcha.store',
  'https://makcha.store',
  // 개발 환경
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // origin이 없는 경우 (Postman, curl, 모바일 앱 등)는 허용
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(` CORS blocked: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,  // 쿠키 전송 필수
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Taxi 의존성 주입 및 라우터 생성
const kakaoClient = new KakaoMapClient();
const distanceUtil = new DistanceUtil();
const taxiService = new TaxiService(kakaoClient, distanceUtil);
const taxiController = new TaxiController(taxiService);
const taxiRouter = createTaxiRouter(taxiController);

// 라우터 연결
app.use("/api/alerts", notificationRouter);
app.use('/auth', authRouter);
app.use("/api/myplaces/home", homeRouter);
app.use("/api/myplaces", myplacesRouter);
app.use("/api", recentDestinationRouter);
app.use("/api", placeRouter);
app.use("/api/save-reports", saveReportRouter);
app.use("/api/me", myinfoRouter);
app.use("/api/facilities", facilityRouter);  
app.use("/api/route", routeRouter);   
app.use("/api/routes", routeCandidateRouter);
app.use("/api/waiting-places", waitingPlaceRouter);
app.use("/api/taxi", taxiRouter);  // Taxi 라우터 추가

// Swagger JSON 직접 노출 (검증용)
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

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