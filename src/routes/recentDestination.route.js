import { Router } from "express";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import { createRecentDestinationHandler, getRecentDestinationsHandler } from "../controllers/recentDestination.controller.js";

const router = Router();

router.post(
    "/recent-destinations",
    isLoggedIn,
    createRecentDestinationHandler
)
router.get(
    "/recent-destinations",
    isLoggedIn,
    getRecentDestinationsHandler
);

export default router;