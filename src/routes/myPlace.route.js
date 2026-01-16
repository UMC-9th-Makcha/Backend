import { Router } from "express";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import { createMyPlaceHandler } from "../controllers/myPlace.controller.js";
import { updateMyPlaceHandler } from "../controllers/myPlace.controller.js";
import { deleteMyPlaceHandler } from "../controllers/myPlace.controller.js";

const router = Router();

router.post(
    "/myplaces",
    isLoggedIn,
    createMyPlaceHandler
);
router.patch(
    "/myplaces/:myPlaceId",
    isLoggedIn,
    updateMyPlaceHandler
)
router.delete(
    "/myplaces/:myPlaceId",
    isLoggedIn,
    deleteMyPlaceHandler
)

export default router;