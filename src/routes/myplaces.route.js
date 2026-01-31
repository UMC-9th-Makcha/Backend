import { Router } from "express";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import { getMyPlacesHandler } from "../controllers/myplaces.controller.js";

/**
 * @swagger
 * tags:
 *   - name: MyPlace
 *     description: 내 장소(홈/자주가는 장소) 조회 API
 */


const router = Router();

router.get(

/**
 * @swagger
 * /api/myplaces:
 *   get:
 *     tags: [MyPlace]
 *     summary: 내 장소 조회
 *     description: 사용자가 등록한 자주 가는 장소 목록을 조회합니다. 홈(HOME)과 자주 가는 장소(PLACE)를 모두 포함하여 반환합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 내 장소 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     successCode:
 *                       type: string
 *                       example: MYPLACE-200-001
 *                     statusCode:
 *                       type: number
 *                       example: 200
 *                     message:
 *                       type: string
 *                       example: 내 장소 조회 성공
 *                     result:
 *                       $ref: '#/components/schemas/MyPlacesGetResult'
 *             examples:
 *               empty:
 *                 summary: 홈 없음 + places 비어있음
 *                 value:
 *                   successCode: MYPLACE-200-001
 *                   statusCode: 200
 *                   message: 내 장소 조회 성공
 *                   result:
 *                     home: null
 *                     places: []
 *               full:
 *                 summary: 홈 있음 + places 2개
 *                 value:
 *                   successCode: MYPLACE-200-001
 *                   statusCode: 200
 *                   message: 내 장소 조회 성공
 *                   result:
 *                     home:
 *                       myplace_id: "10"
 *                       user_id: "2"
 *                       place_type: "HOME"
 *                       provider_place_id: "456"
 *                       place_address: "서울시 ..."
 *                       place_detail_address: "201동"
 *                       latitude: 37.5665
 *                       longitude: 126.978
 *                       created_at: "2026-01-19T12:56:30.797Z"
 *                       updated_at: "2026-01-19T13:11:39.758Z"
 *                     places:
 *                       - myplace_id: "11"
 *                         user_id: "2"
 *                         place_type: "PLACE"
 *                         provider_place_id: "321"
 *                         place_address: "서울특별시 강남구 테헤란로 333"
 *                         place_detail_address: "1층"
 *                         latitude: 36.501274
 *                         longitude: 127.039585
 *                         created_at: "2026-01-19T13:12:05.653Z"
 *                         updated_at: "2026-01-19T13:12:05.653Z"
 *                       - myplace_id: "9"
 *                         user_id: "2"
 *                         place_type: "PLACE"
 *                         provider_place_id: "123456789"
 *                         place_address: "서울특별시 강남구 테헤란로 212"
 *                         place_detail_address: "1층"
 *                         latitude: 37.501274
 *                         longitude: 127.039585
 *                         created_at: "2026-01-19T12:56:02.767Z"
 *                         updated_at: "2026-01-19T12:56:02.767Z"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               errorCode: UNAUTHORIZED
 *               message: unauthorized
 *               path: /api/myplaces
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
 *               path: /api/myplaces
 *               result: {}
 */

    "/",
    isLoggedIn,
    getMyPlacesHandler
);

export default router;