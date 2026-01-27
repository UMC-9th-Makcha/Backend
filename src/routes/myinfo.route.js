import { Router } from "express";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import { getMyInfoHandler, updateMyPhoneHandler } from "../controllers/myinfo.controller.js";

const router = Router();

router.get(
    "/",
    isLoggedIn,
    getMyInfoHandler);

router.patch(
    "/phone",
    isLoggedIn,
    updateMyPhoneHandler);

export default router;