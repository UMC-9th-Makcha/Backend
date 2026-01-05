import express from "express";
import cookieParser from 'cookie-parser'; //카카오 로그인
import authRouter from './routes/auth.js'; //카카오 로그인

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRouter);


app.get("/", (req, res) => {
  res.send("server on");
});

export default app;
