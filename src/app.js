import express from "express";
import routeSearchRouter from "./routes/routeSearch.route.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("server on");
});

app.use("/api/routes", routeSearchRouter);

export default app;
