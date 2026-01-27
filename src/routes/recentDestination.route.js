import { Router } from "express";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import {
    createRecentDestinationHandler,
    getRecentDestinationsHandler,
    deleteRecentDestinationHandler
} from "../controllers/recentDestination.controller.js";

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

router.delete(
    "/recent-destinations/:recentId",
    isLoggedIn,
    deleteRecentDestinationHandler
)

export default router;