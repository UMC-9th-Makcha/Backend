import { Router } from "express";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import {
  upsertHomeHandler,
  removeHomeHandler,
} from "../controllers/home.controller.js";

/**
 * @swagger
 * tags:
 *   - name: Home
 *     description: 홈(HOME) 설정 API
 */


const router = Router();

router.put(
/**
 * @swagger
 * /api/myplaces/home:
 *   put:
 *     tags: [Home]
 *     summary: 홈 추가/수정 (Upsert)
 *     description: 홈(HOME)을 추가/수정합니다. 홈이 없으면 생성, 있으면 업데이트합니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HomeUpsertRequest'
 *           example:
 *             provider_place_id: "123"
 *             place_address: "서울시 ..."
 *             place_detail_address: "101동"
 *             latitude: 37.5665
 *             longitude: 126.978
 *     responses:
 *       200:
 *         description: 홈 설정 성공 (생성/수정 동일 응답)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     successCode:
 *                       type: string
 *                       example: HOME-200-001
 *                     statusCode:
 *                       type: number
 *                       example: 200
 *                     message:
 *                       type: string
 *                       example: 홈 설정 성공
 *                     result:
 *                       $ref: '#/components/schemas/HomeResult'
 *             examples:
 *               create:
 *                 summary: 홈이 없을 때 생성
 *                 value:
 *                   successCode: HOME-200-001
 *                   statusCode: 200
 *                   message: 홈 설정 성공
 *                   result:
 *                     myplace_id: "8"
 *                     user_id: "2"
 *                     place_type: "HOME"
 *                     provider_place_id: "123"
 *                     place_address: "서울시 ..."
 *                     place_detail_address: "101동"
 *                     latitude: 37.5665
 *                     longitude: 126.978
 *               update:
 *                 summary: 홈 수정
 *                 value:
 *                   successCode: HOME-200-001
 *                   statusCode: 200
 *                   message: 홈 설정 성공
 *                   result:
 *                     myplace_id: "8"
 *                     user_id: "2"
 *                     place_type: "HOME"
 *                     provider_place_id: "456"
 *                     place_address: "서울시 ..."
 *                     place_detail_address: "201동"
 *                     latitude: 37.5665
 *                     longitude: 126.978
 *       400:
 *         description: 잘못된 요청값 (필수값 누락/형식 오류 등)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               errorCode: HOME-400-001
 *               message: Invalid request body
 *               path: /api/myplaces/home
 *               result:
 *                 field: provider_place_id
 *       401:
 *         description: 인증 실패 (만료/누락)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               errorCode: AUTH-401-001
 *               message: Access Token 만료 또는 누락
 *               path: /api/myplaces/home
 *               result: {}
 *       404:
 *         description: 홈 설정 요청 시 필수 값 누락 또는 형식 오류 등 (명세 기준)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               errorCode: HOME-404-001
 *               message: Home not found
 *               path: /api/myplaces/home
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
    upsertHomeHandler
)

router.delete(
/**
 * @swagger
 * /api/myplaces/home:
 *   delete:
 *     tags: [Home]
 *     summary: 홈 삭제
 *     description: 홈(HOME)을 삭제합니다. 홈이 없어도 200 OK를 반환합니다(멱등).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 홈 삭제 성공 (멱등)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     successCode:
 *                       type: string
 *                       example: HOME-200-002
 *                     statusCode:
 *                       type: number
 *                       example: 200
 *                     message:
 *                       type: string
 *                       example: 홈 삭제 성공
 *                     result:
 *                       type: object
 *             example:
 *               successCode: HOME-200-002
 *               statusCode: 200
 *               message: 홈 삭제 성공
 *               result: {}
 *       401:
 *         description: 인증 실패 (만료/누락)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               errorCode: AUTH-401-001
 *               message: Access Token 만료 또는 누락
 *               path: /api/myplaces/home
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
    removeHomeHandler
)

export default router;