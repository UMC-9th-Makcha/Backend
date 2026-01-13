import express from "express";
import notificationRouter from "./routes/notification.route.js";
import authRouter from "./routes/auth.route.js";
import { globalErrorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(express.json());

//라우터
app.use("/api/alerts", notificationRouter);
app.use('/auth', authRouter);

app.get("/", (req, res) => {
  res.send("server on");
});

app.use(globalErrorHandler);

export default app;