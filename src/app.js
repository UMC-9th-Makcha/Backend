import express from "express";
import recentDestinationRouter from './routes/recentDestination.route.js';
import notificationRouter from "./routes/notification.route.js";
import { globalErrorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(express.json());
app.use("/api", recentDestinationRouter);

//라우터
app.use("/api/alerts", notificationRouter);

app.get("/", (req, res) => {
  res.send("server on");
});

app.use(globalErrorHandler);

export default app;