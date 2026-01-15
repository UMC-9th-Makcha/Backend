import { Router } from "express";
import { postRouteCandidates } from "../controllers/routeSearch.controller.js";

const router = Router();

router.post("/routeSearch", postRouteCandidates);

export default router;
