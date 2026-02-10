import express from "express";
import * as notiController from "../controllers/notification.controller.js";
import { isLoggedIn } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/alerts:
 *   post:
 *     summary: 막차 알림 예약 생성
 *     tags: [Alert]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cacheKey, alert_time]
 *             properties:
 *               cacheKey:
 *                 type: string
 *                 example: "route-token-abc123"
 *               alert_time:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       201:
 *         description: 막차 알림 예약 성공
 *         content:
 *           application/json:
 *             example:
 *               notification_id: "15"
 *               title: "홍대입구역"
 *               scheduled: "2026-02-02T00:20:00.000Z"
 *               trigger_time: "SENT_TEN"
 *               alert_time: 10
 *       404:
 *         description: 경로 캐시 만료 또는 유효하지 않음
 */
// 알림 예약 생성
router.post("/", isLoggedIn, notiController.createNotification);

/**
 * @swagger
 * /api/alerts/{notification_id}/cancel:
 *   patch:
 *     summary: 막차 알림 예약 취소
 *     tags: [Alert]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notification_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 알림 취소 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "알림이 정상적으로 취소되었습니다."
 *       403:
 *         description: 본인의 알림이 아님
 *       404:
 *         description: 알림 정보 없음
 */
// 알림 예약 취소
router.patch("/:notification_id/cancel", isLoggedIn, notiController.cancelNotification);

/**
 * @swagger
 * /api/alerts:
 *   post:
 *     summary: 막차 알림 예약 생성
 *     tags: [Alert]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cacheKey, alert_time]
 *             properties:
 *               cacheKey:
 *                 type: string
 *                 example: "route-token-abc123"
 *               alert_time:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       201:
 *         description: 막차 알림 예약 성공
 *         content:
 *           application/json:
 *             example:
 *               notification_id: "15"
 *               title: "홍대입구역"
 *               scheduled: "2026-02-02T00:20:00.000Z"
 *               trigger_time: "SENT_TEN"
 *               alert_time: 10
 *       404:
 *         description: 알림 설정 정보 없음
 */
// 알림 설정 조회
router.get("/settings", isLoggedIn, notiController.getSettings);

/**
 * @swagger
 * /api/alerts:
 *   post:
 *     summary: 막차 알림 예약 생성
 *     tags: [Alert]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cacheKey, alert_time]
 *             properties:
 *               cacheKey:
 *                 type: string
 *                 example: "route-token-abc123"
 *               alert_time:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       201:
 *         description: 막차 알림 예약 성공
 *         content:
 *           application/json:
 *             example:
 *               notification_id: "15"
 *               title: "홍대입구역"
 *               scheduled: "2026-02-02T00:20:00.000Z"
 *               trigger_time: "SENT_TEN"
 *               alert_time: 10
 *       404:
 *         description: 알림 설정 정보 없음
 */
// 알림 설정 수정
router.patch("/settings", isLoggedIn, notiController.updateSettings);

/**
 * @swagger
 * /api/alerts/history:
 *   get:
 *     summary: 알림 통합 조회 (마이페이지)
 *     tags: [Alert]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 알림 통합 조회 성공
 *         content:
 *           application/json:
 *             example:
 *               user_setting:
 *                 notify_mask: 26
 *                 enabled: true
 *                 timeList: [30, 10, 3]
 *               current_alert:
 *                 id: "12"
 *                 station_name: "강남역"
 *                 scheduled_time: "2026-02-01T23:40:00.000Z"
 *                 lines: ["2호선", "분당선"]
 *                 total_duration_min: 35
 *                 transfer_count: 1
 *                 walking_time_min: 6
 *                 minutes_left: 12
 *               history:
 *                 - id: "8"
 *                   origin: "강남역"
 *                   destination: "홍대입구역"
 *                   departure_time: "2026-01-20T23:30:00.000Z"
 *                   arrival_time: "2026-01-21T00:05:00.000Z"
 *                   total_duration_min: 35
 *                   transfer_count: 1
 *                   walking_time_min: 6
 *       404:
 *         description: 경로 정보 없음
 */
// 과거 알림 내역 조회
router.get("/history", isLoggedIn, notiController.getNotificationHistoryView);

router.get("/history/:notification_history_id/detail", isLoggedIn, notiController.getHistoryDetail);
/**
 * @swagger
 * /api/alerts/{notification_id}/detail:
 *   get:
 *     summary: 알림 상세 경로 조회
 *     tags: [Alert]
 *     parameters:
 *       - in: path
 *         name: notification_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 알림 상세 조회 성공
 *         content:
 *           application/json:
 *             example:
 *               is_optimal: true
 *               lines: ["6호선"]
 *               total_duration_min: 28
 *               transfer_count: 0
 *               walking_time_min: 4
 *               minutes_left: 5
 *               departure_at: "2026-02-02T00:10:00.000Z"
 *               arrival_at: "2026-02-02T00:38:00.000Z"
 *       404:
 *         description: 경로 정보 없음
 */
// 상세 조회 
router.get("/:notification_id/detail", isLoggedIn, notiController.getNotiDetail);


export default router;
