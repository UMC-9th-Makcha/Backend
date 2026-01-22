import express from "express";
import * as notiController from "../controllers/notification.controller.js";

const router = express.Router();

// 알림 예약 생성
router.post("/", notiController.createNotification);

// 알림 예약 취소
router.patch("/:notification_id/cancel", notiController.cancelNotification);

// 알림 설정 조회
router.get("/settings", notiController.getSettings);

// 알림 설정 수정
router.patch("/settings", notiController.updateSettings);

// 과거 알림 내역 조회
router.get("/history", notiController.getNotificationHistoryView);

export default router;
