import express from "express";
import placeRouter from './routes/myPlace.route.js';

const app = express();

app.use(express.json());
app.use("/api", placeRouter);

app.get("/", (req, res) => {
  res.send("server on");
});

export default app;
