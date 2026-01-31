import { Router } from "express";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import {
    createRecentDestinationHandler,
    getRecentDestinationsHandler,
    deleteRecentDestinationHandler
} from "../controllers/recentDestination.controller.js";

/**
 * @swagger
 * tags:
 *   - name: RecentDestination
 *     description: 최근 목적지 API
 */

const router = Router();

router.post(
    "/recent-destinations",
    isLoggedIn,
    createRecentDestinationHandler
)
router.get(
/**
 * @swagger
 * /api/recent-destinations:
 *   get:
 *     tags: [RecentDestination]
 *     summary: 최근 목적지 조회
 *     description: 사용자가 최근 도착한 목적지를 조회합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         required: false
 *         description: 조회 개수 (기본 10)
 *     responses:
 *       200:
 *         description: 최근 목적지 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     successCode:
 *                       type: string
 *                       example: RECENT_DESTINATION_FETCH_SUCCESS
 *                     statusCode:
 *                       type: number
 *                       example: 200
 *                     message:
 *                       type: string
 *                       example: 최근 목적지 조회 성공
 *                     result:
 *                       $ref: '#/components/schemas/RecentDestinationListResult'
 *             examples:
 *               empty:
 *                 summary: 목록이 비어있는 경우
 *                 value:
 *                   successCode: RECENT_DESTINATION_FETCH_SUCCESS
 *                   statusCode: 200
 *                   message: 최근 목적지 조회 성공
 *                   result:
 *                     recentDestinations: []
 *               one:
 *                 summary: 최근 목적지 1개 예시
 *                 value:
 *                   successCode: RECENT_DESTINATION_FETCH_SUCCESS
 *                   statusCode: 200
 *                   message: 최근 목적지 조회 성공
 *                   result:
 *                     recentDestinations:
 *                       - recentId: "4"
 *                         userId: "2"
 *                         title: "스타벅스 강남역점"
 *                         roadAddress: "서울 서초구 강남대로 375"
 *                         detailAddress: "2층"
 *                         placeId: "1234567890"
 *                         latitude: 37.497942
 *                         longitude: 127.027621
 *                         usedAt: "2026-01-15T13:12:29.942Z"
 *                         createdAt: "2026-01-15T13:07:43.477Z"
 *       400:
 *         description: limit 입력값이 Integer Type이 아니거나 0 이하
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *                 - type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: INVALID_LIMIT
 *                     message:
 *                       type: string
 *                       example: Invalid limit
 *                     path:
 *                       type: string
 *                       example: /api/recent-destinations
 *             example:
 *               errorCode: INVALID_LIMIT
 *               message: Invalid limit
 *               path: /api/recent-destinations
 *               result: {}
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *                 - type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: UNAUTHORIZED
 *                     message:
 *                       type: string
 *                       example: unauthorized
 *                     path:
 *                       type: string
 *                       example: /api/recent-destinations
 *             example:
 *               errorCode: UNAUTHORIZED
 *               message: unauthorized
 *               path: /api/recent-destinations
 *               result: {}
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *                 - type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: COM-500-001
 *                     message:
 *                       type: string
 *                       example: Internal Server Error
 *                     path:
 *                       type: string
 *                       example: /api/recent-destinations
 *             example:
 *               errorCode: COM-500-001
 *               message: Internal Server Error
 *               path: /api/recent-destinations
 *               result: {}
 */

    "/recent-destinations",
    isLoggedIn,
    getRecentDestinationsHandler
);

router.delete(
/**
 * @swagger
 * /api/recent-destinations/{recentId}:
 *   delete:
 *     tags: [RecentDestination]
 *     summary: 최근 목적지 삭제
 *     description: 사용자가 최근 도착한 목적지를 삭제합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 최근 목적지 ID (DB bigint, 문자열로 전달)
 *     responses:
 *       200:
 *         description: 최근 목적지 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     successCode:
 *                       type: string
 *                       example: RECENT_DESTINATION_DELETE_SUCCESS
 *                     statusCode:
 *                       type: number
 *                       example: 200
 *                     message:
 *                       type: string
 *                       example: 최근 목적지 삭제 성공
 *                     result:
 *                       $ref: '#/components/schemas/RecentDestinationDeleteResult'
 *             example:
 *               successCode: RECENT_DESTINATION_DELETE_SUCCESS
 *               statusCode: 200
 *               message: 최근 목적지 삭제 성공
 *               result:
 *                 recentId: "5"
 *       400:
 *         description: recentId 비어있거나 공백
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *                 - type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: RECENT-400-001
 *                     message:
 *                       type: string
 *                       example: Invalid recentId
 *                     path:
 *                       type: string
 *                       example: /api/recent-destinations
 *             example:
 *               errorCode: RECENT-400-001
 *               message: Invalid recentId
 *               path: /api/recent-destinations
 *               result: {}
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               errorCode: UNAUTHORIZED
 *               message: unauthorized
 *               path: /api/recent-destinations
 *               result: {}
 *       404:
 *         description: 없거나 접근할 수 없는 recentId
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *                 - type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: RECENT-404-001
 *                     message:
 *                       type: string
 *                       example: recent destinations not found
 *                     path:
 *                       type: string
 *                       example: /api/recent-destinations
 *             example:
 *               errorCode: RECENT-404-001
 *               message: recent destinations not found
 *               path: /api/recent-destinations
 *               result: {}
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               errorCode: COM-500-001
 *               message: Internal Server Error
 *               path: /api/recent-destinations
 *               result: {}
 */

    "/recent-destinations/:recentId",
    isLoggedIn,
    deleteRecentDestinationHandler
)

export default router;