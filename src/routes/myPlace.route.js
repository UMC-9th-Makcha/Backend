import { Router } from "express";
import { devAuth } from "../middlewares/devAuth.js";
import { createMyPlaceHandler } from "../controllers/myPlace.controller.js";
//import { updateMyPlaceHandler } from "../controllers/myPlace.controller.js";
//import { deleteMyPlaceHandler } from "../controllers/myPlace.controller.js";

const router = Router();

router.post(
    "/places",
    devAuth,
    createMyPlaceHandler
);
// router.put(
//     "/places/:myPlaceId",
//     devAuth,
//     updateMyPlaceHandler
// )
// router.delete(
//     "/places/:myPlaceId",
//     devAuth,
//     deleteMyPlaceHandler
// )

export default router;