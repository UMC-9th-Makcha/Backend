import { Router } from "express";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import { getSaveReportHandler } from "../controllers/saveReport.controller.js";

/**
 * @swagger
 * tags:
 *   - name: SaveReport
 *     description: 세이브 리포트 API
 */


const router = Router();

router.get(
/**
 * @swagger
 * /api/save-reports:
 *   get:
 *     tags: [SaveReport]
 *     summary: 세이브 리포트 조회
 *     description: 세이브 리포트 화면에서 사용할 3개월 차트 데이터와 선택 월의 상세 리스트를 조회합니다. 좌/우 이동 시 month만 바꿔 재호출합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: string
 *           example: "2025-12"
 *         description: 기준 월(YYYY-MM). 미지정 시 현재 월 기준으로 3개월 구성
 *     responses:
 *       200:
 *         description: 세이브 리포트 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     successCode:
 *                       type: string
 *                       example: SAVEREPORT-200-001
 *                     statusCode:
 *                       type: number
 *                       example: 200
 *                     message:
 *                       type: string
 *                       example: 세이브 리포트 조회 성공
 *                     result:
 *                       $ref: '#/components/schemas/SaveReportResult'
 *             example:
 *               successCode: SAVEREPORT-200-001
 *               statusCode: 200
 *               message: 세이브 리포트 조회 성공
 *               result:
 *                 selectedMonth: "2025-12"
 *                 range:
 *                   from: "2025-11"
 *                   to: "2026-01"
 *                 chart:
 *                   - month: "2025-11"
 *                     savedAmount: 12000
 *                     totalCount: 3
 *                     highlight: false
 *                   - month: "2025-12"
 *                     savedAmount: 45000
 *                     totalCount: 9
 *                     highlight: true
 *                   - month: "2026-01"
 *                     savedAmount: 8000
 *                     totalCount: 1
 *                     highlight: false
 *                 items:
 *                   - notificationHistoryId: "2"
 *                     originName: "홍대입구"
 *                     destinationName: "잠실"
 *                     departureDatetime: "2025-12-18T18:05:00.000Z"
 *                     arrivalDatetime: "2025-12-18T18:55:00.000Z"
 *                     savedFareWon: 2300
 *                   - notificationHistoryId: "1"
 *                     originName: "서울역"
 *                     destinationName: "강남역"
 *                     departureDatetime: "2025-12-03T22:10:00.000Z"
 *                     arrivalDatetime: "2025-12-03T22:40:00.000Z"
 *                     savedFareWon: 1500
 *       400:
 *         description: month 형식 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               errorCode: SAVEREPORT-400-001
 *               message: "invalid month format. (YYYY-MM)"
 *               path: /api/save-reports?month=2025.01
 *               result:
 *                 month: "2025.01"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               errorCode: UNAUTHORIZED
 *               message: unauthorized
 *               path: /api/save-reports
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
 *               path: /api/save-reports
 *               result: {}
 */

    "/",
    isLoggedIn,
    getSaveReportHandler
);

export default router;