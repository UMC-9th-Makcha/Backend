import { Router } from "express";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import { createMyPlaceHandler } from "../controllers/myPlace.controller.js";
import { updateMyPlaceHandler } from "../controllers/myPlace.controller.js";
import { deleteMyPlaceHandler } from "../controllers/myPlace.controller.js";

/**
 * @swagger
 * tags:
 *   - name: MyPlace
 *     description: 자주 가는 장소 API
 */


const router = Router();

router.post(
/**
 * @swagger
 * /api/myplaces:
 *   post:
 *     tags: [MyPlace]
 *     summary: 자주 가는 장소 등록
 *     description: 자주 가는 장소를 1건 등록합니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MyPlaceCreateRequest'
 *           example:
 *             provider_place_id: "123456"
 *             place_address: "서울특별시 강남구 테헤란로 212"
 *             place_detail_address: "12층"
 *             latitude: 37.501274
 *             longitude: 127.039585
 *     responses:
 *       201:
 *         description: 자주 가는 장소 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     successCode:
 *                       type: string
 *                       example: PLACE_CREATE_SUCCESS
 *                     statusCode:
 *                       type: number
 *                       example: 201
 *                     message:
 *                       type: string
 *                       example: 자주 가는 장소 생성 성공
 *                     result:
 *                       $ref: '#/components/schemas/MyPlaceCreateResult'
 *             example:
 *               successCode: PLACE_CREATE_SUCCESS
 *               statusCode: 201
 *               message: 자주 가는 장소 생성 성공
 *               result:
 *                 myplace_id: "4"
 *                 user_id: "2"
 *                 place_type: "PLACE"
 *                 provider_place_id: "123456"
 *                 place_address: "서울특별시 강남구 테헤란로 212"
 *                 place_detail_address: "12층"
 *                 latitude: 37.501274
 *                 longitude: 127.039585
 *                 created_at: "2026-01-16T13:20:57.132Z"
 *       400:
 *         description: 유효성 검증 실패 (필드/길이/좌표 범위 등)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidProviderPlaceId:
 *                 summary: provider_place_id 길이 초과
 *                 value:
 *                   errorCode: PLACE-400-001
 *                   message: Invalid provider_place_id
 *                   path: /api/myplaces
 *                   result:
 *                     field: provider_place_id
 *                     maxLength: 50
 *               invalidPlaceAddress:
 *                 summary: place_address null/공백
 *                 value:
 *                   errorCode: PLACE-400-001
 *                   message: Invalid place_address
 *                   path: /api/myplaces
 *                   result:
 *                     field: place_address
 *               invalidLatitude:
 *                 summary: latitude 범위/타입 오류
 *                 value:
 *                   errorCode: PLACE-400-001
 *                   message: Invalid latitude
 *                   path: /api/myplaces
 *                   result:
 *                     field: latitude
 *                     range: "[-90, 90]"
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
 *       409:
 *         description: 이미 존재하는 자주 가는 장소 (중복 불가)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               errorCode: PLACE-409-001
 *               message: Place already exists
 *               path: /api/myplaces
 *               result:
 *                 fields: ["user_id", "place_type", "provider_place_id"]
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

    "/myplaces",
    isLoggedIn,
    createMyPlaceHandler
);
router.patch(
/**
 * @swagger
 * /api/myplaces/{myPlaceId}:
 *   patch:
 *     tags: [MyPlace]
 *     summary: 자주 가는 장소 수정
 *     description: 등록된 자주 가는 장소 1건의 정보를 수정(일부 갱신)합니다. 전달된 필드만 수정되며 place_type은 수정할 수 없습니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: myPlaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: 수정할 장소 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MyPlaceUpdateRequest'
 *           example:
 *             place_detail_address: "302호"
 *     responses:
 *       200:
 *         description: 자주 가는 장소 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     successCode:
 *                       type: string
 *                       example: PLACE_UPDATE_SUCCESS
 *                     statusCode:
 *                       type: number
 *                       example: 200
 *                     message:
 *                       type: string
 *                       example: 자주 가는 장소 수정 성공
 *                     result:
 *                       $ref: '#/components/schemas/MyPlace'
 *       400:
 *         description: 잘못된 myPlaceId 또는 수정할 필드 없음 또는 필드 검증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidMyPlaceId:
 *                 summary: myPlaceId 형식 오류
 *                 value:
 *                   errorCode: PLACE-400-003
 *                   message: Invalid myPlaceId
 *                   path: /api/myplaces/a
 *                   result:
 *                     field: myPlaceId
 *               noFieldsToUpdate:
 *                 summary: 수정할 필드 없음
 *                 value:
 *                   errorCode: PLACE-400-002
 *                   message: No fields to update
 *                   path: /api/myplaces/4
 *                   result: {}
 *       401:
 *         description: 인증 실패 (만료/누락)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               errorCode: AUTH-401-001
 *               message: Access Token 만료 또는 누락
 *               path: /api/myplaces/4
 *               result: {}
 *       404:
 *         description: 존재하지 않거나 권한 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               errorCode: PLACE-404-001
 *               message: Place not found
 *               path: /places/:myplaceId
 *               result:
 *                 myplace_id: "5"
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

    "/myplaces/:myPlaceId",
    isLoggedIn,
    updateMyPlaceHandler
)
router.delete(
/**
 * @swagger
 * /api/myplaces/{myPlaceId}:
 *   delete:
 *     tags: [MyPlace]
 *     summary: 자주 가는 장소 삭제
 *     description: 등록된 자주 가는 장소 1건을 삭제합니다. 삭제 후 클라이언트는 조회 API를 재호출하여 화면 상태를 동기화해야 합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: myPlaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 장소 ID
 *     responses:
 *       200:
 *         description: 자주 가는 장소 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     successCode:
 *                       type: string
 *                       example: PLACE_DELETE_SUCCESS
 *                     statusCode:
 *                       type: number
 *                       example: 200
 *                     message:
 *                       type: string
 *                       example: 자주 가는 장소 삭제 성공
 *                     result:
 *                       $ref: '#/components/schemas/MyPlaceDeleteResult'
 *             example:
 *               successCode: PLACE_DELETE_SUCCESS
 *               statusCode: 200
 *               message: 자주 가는 장소 삭제 성공
 *               result:
 *                 myplace_id: "4"
 *       400:
 *         description: 잘못된 myPlaceId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               errorCode: PLACE-400-003
 *               message: Invalid myPlaceId
 *               path: /api/myplaces/a
 *               result:
 *                 field: myPlaceId
 *       401:
 *         description: 인증 실패 (만료/누락)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               errorCode: AUTH-401-001
 *               message: Access Token 만료 또는 누락
 *               path: /api/myplaces/4
 *               result: {}
 *       404:
 *         description: 존재하지 않거나 권한 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               errorCode: PLACE-404-001
 *               message: Place not found
 *               path: /places/:myplaceId
 *               result:
 *                 myplace_id: "4"
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

    "/myplaces/:myPlaceId",
    isLoggedIn,
    deleteMyPlaceHandler
)

export default router;