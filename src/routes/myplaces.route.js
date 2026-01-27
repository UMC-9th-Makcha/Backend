import { Router } from "express";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import { getMyPlacesHandler } from "../controllers/myplaces.controller.js";

const router = Router();

router.get(
    "/",
    isLoggedIn,
    getMyPlacesHandler
);

export default router;