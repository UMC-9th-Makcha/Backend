import express from "express";
import recentDestinationRouter from './routes/recentDestination.route.js';

const app = express();

app.use(express.json());
app.use("/api", recentDestinationRouter);

app.get("/", (req, res) => {
  res.send("server on");
});

export default app;
