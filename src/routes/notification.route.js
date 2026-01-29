import express from "express";
import * as notiController from "../controllers/notification.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/alerts:
 *   post:
 *     summary: 막차 알림 예약 생성
 *     description: |
 *       캐시된 경로 정보(cacheKey)를 기반으로 막차 알림을 예약합니다.
 *       남은 시간에 따라 초기 알림 트리거가 자동 설정됩니다.
 *       예약 완료 시 SMS 알림이 발송됩니다.
 *     tags:
 *       - Alert
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cacheKey
 *               - alert_time
 *             properties:
 *               cacheKey:
 *                 type: string
 *                 description: 경로 조회 시 발급된 캐시 키
 *                 example: "route-token-abc123"
 *               alert_time:
 *                 type: integer
 *                 description: 기본 알림 시간(분 단위)
 *                 example: 10
 *     responses:
 *       201:
 *         description: 막차 알림 예약 성공
 *       404:
 *         description: 만료되었거나 유효하지 않은 경로 정보
 */
// 알림 예약 생성
router.post("/", notiController.createNotification);

/**
 * @swagger
 * /api/alerts/{notification_id}/cancel:
 *   patch:
 *     summary: 막차 알림 예약 취소
 *     description: |
 *       예약된 막차 알림을 취소합니다.
 *       본인의 알림만 취소할 수 있으며,
 *       취소 시 SMS 안내가 발송됩니다.
 *     tags:
 *       - Alert
 *     parameters:
 *       - in: path
 *         name: notification_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 알림 ID
 *     responses:
 *       200:
 *         description: 알림 취소 성공
 *       403:
 *         description: 본인의 알림이 아님
 *       404:
 *         description: 알림 정보 없음
 */
// 알림 예약 취소
router.patch("/:notification_id/cancel", notiController.cancelNotification);

/**
 * @swagger
 * /api/alerts/settings:
 *   get:
 *     summary: 알림 설정 조회
 *     description: |
 *       사용자의 막차 알림 커스텀 설정 정보를 조회합니다.
 *       (비트마스크 기반 시간 설정)
 *     tags:
 *       - Alert
 *     responses:
 *       200:
 *         description: 알림 설정 조회 성공
 *       404:
 *         description: 알림 설정 정보 없음
 */
// 알림 설정 조회
router.get("/settings", notiController.getSettings);

/**
 * @swagger
 * /api/alerts/settings:
 *   patch:
 *     summary: 알림 설정 수정
 *     description: |
 *       막차 알림 시간을 커스텀으로 설정합니다.
 *       설정된 시간은 비트마스크로 저장됩니다.
 *     tags:
 *       - Alert
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               timeList:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 알림 받을 시간 목록 (분 단위)
 *                 example: [30, 10, 3]
 *     responses:
 *       200:
 *         description: 알림 설정 수정 성공
 */
// 알림 설정 수정
router.patch("/settings", notiController.updateSettings);

/**
 * @swagger
 * /api/alerts/history:
 *   get:
 *     summary: 과거 알림 통합 조회
 *     description: |
 *       알림 설정 정보, 현재 활성화된 알림,
 *       과거 막차 알림 이용 내역을 한 번에 조회합니다.
 *     tags:
 *       - Alert
 *     responses:
 *       200:
 *         description: 알림 통합 정보 조회 성공
 */
// 과거 알림 내역 조회
router.get("/history", notiController.getNotificationHistoryView);

export default router;
