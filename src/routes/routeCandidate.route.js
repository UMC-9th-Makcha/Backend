import { Router } from "express";
import { postRouteCandidates } from "../controllers/routeCandidate.controller.js";
import { getRoutePolyline } from "../controllers/routePolyline.controller.js";

const router = Router();

router.post("/candidates", postRouteCandidates);
router.get("/polylines/:route_token", getRoutePolyline);

export default router;
