import { Router } from "express";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import { getSaveReportHandler } from "../controllers/saveReport.controller.js";

const router = Router();

router.get(
    "/",
    isLoggedIn,
    getSaveReportHandler
);

export default router;