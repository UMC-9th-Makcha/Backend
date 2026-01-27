import { Router } from "express";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import {
  upsertHomeHandler,
  removeHomeHandler,
} from "../controllers/home.controller.js";

const router = Router();

router.put(
    "/",
    isLoggedIn,
    upsertHomeHandler
)

router.delete(
    "/",
    isLoggedIn,
    removeHomeHandler
)

export default router;