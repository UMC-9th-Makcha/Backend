import { Router } from "express";
import { devAuth } from "../middlewares/devAuth.js";
import { createMyPlaceHandler } from "../controllers/myPlace.controller.js";
import { patchMyPlaceHandler } from "../controllers/myPlace.controller.js";
//import { deleteMyPlaceHandler } from "../controllers/myPlace.controller.js";

const router = Router();

router.post(
    "/places",
    devAuth,
    createMyPlaceHandler
);
router.put(
    "/places/:myPlaceId",
    devAuth,
    patchMyPlaceHandler
)
// router.delete(
//     "/places/:myPlaceId",
//     devAuth,
//     deleteMyPlaceHandler
// )

export default router;