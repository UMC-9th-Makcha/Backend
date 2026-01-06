import { Router } from "express";
import { devAuth } from "../middlewares/devAuth.js";
import { getRecentDestinationsHandler } from "../controllers/recentDestination.controller.js";

const router = Router();

router.get(
    "/recent-destinations",
    devAuth,
    getRecentDestinationsHandler
);

export default router;