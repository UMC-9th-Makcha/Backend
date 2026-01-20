import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"; //쿠키 파싱


//import notificationRouter from "./routes/notification.route.js"; -> 서버 오류로 주석처리함. 
//아예 이 알림은 현재 제외 후 배포하겠습니다:)
import authRouter from "./routes/auth.route.js";
import placeRouter from './routes/myPlace.route.js';
import { globalErrorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

// CORS - 쿠키 전송 필수
app.use(cors({
  origin: 'http://localhost:3000', // FE 주소(아직 배포 전임으로 로컬로 놓음)
  credentials: true,
}));

//라우터
// app.use("/api/alerts", notificationRouter);
// 아예 이 알림은 현재 제외 후 배포하겠습니다:)
app.use('/auth', authRouter);
app.use("/api", placeRouter);

app.get("/", (req, res) => {
  res.send("server on");
});

export default app;