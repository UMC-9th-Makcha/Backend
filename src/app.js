import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"; //쿠키 파싱

import notificationRouter from "./routes/notification.route.js";
import authRouter from "./routes/auth.route.js";
import placeRouter from './routes/myPlace.route.js';
import waitingPlaceRouter from './routes/waitingPlace.route.js';
import facilitiesRouter from './routes/facility.route.js'; 
import routeRouter from './routes/route.route.js'; 
import { globalErrorHandler } from "./middleware/error.middleware.js";

const app = express();

// 미들웨어 설정 (순서 중요!)
app.use(express.json());
app.use(cookieParser());

// CORS - 먼저 설정
app.use(cors({
  origin: 'http://localhost:3000', // FE 주소
  credentials: true,
}));

// 라우터 연결
app.use("/api/alerts", notificationRouter);
app.use('/auth', authRouter);
app.use("/api", placeRouter);
app.use('/waiting-place', waitingPlaceRouter);
app.use('/facilities', facilitiesRouter); // 추가
app.use('/route', routeRouter); // 추가

app.get("/", (req, res) => {
  res.send("server on");
});

// 에러 핸들러
app.use(globalErrorHandler);

export default app;