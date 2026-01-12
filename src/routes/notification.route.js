import express from "express";
import * as notiController from "../controllers/notification.controller.js";

const router = express.Router();

// 알림 예약 생성
router.post("/", notiController.createNotification);

// 알림 예약 취소
router.patch("/:notification_id/cancel", notiController.cancelNotification);

export default router;
