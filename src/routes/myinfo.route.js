import { Router } from "express";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import { getMyInfoHandler, updateMyPhoneHandler } from "../controllers/myinfo.controller.js";

/**
 * @swagger
 * tags:
 *   - name: MyInfo
 *     description: 내 정보 API
 */


const router = Router();

router.get(
/**
 * @swagger
 * /api/me:
 *   get:
 *     tags: [MyInfo]
 *     summary: 내 정보 조회
 *     description: 로그인한 사용자의 기본 프로필 정보를 조회합니다. 토큰의 subject로 사용자 식별하며 URL에 userId를 받지 않습니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 내 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     successCode:
 *                       type: string
 *                       example: MYINFO-200-001
 *                     statusCode:
 *                       type: number
 *                       example: 200
 *                     message:
 *                       type: string
 *                       example: 내 정보 조회 성공
 *                     result:
 *                       $ref: '#/components/schemas/MyInfoResult'
 *             example:
 *               successCode: MYINFO-200-001
 *               statusCode: 200
 *               message: 내 정보 조회 성공
 *               result:
 *                 userId: "2"
 *                 name: "서막차"
 *                 email: "makcah@kakao.com"
 *                 phone: ""
 *       401:
 *         description: 인증 실패 (만료/누락)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               errorCode: AUTH-401-001
 *               message: Access Token 만료 또는 누락
 *               path: /api/me
 *               result: {}
 *       404:
 *         description: 없거나 접근할 수 없는 userId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               errorCode: USER-404-001
 *               message: User not found
 *               path: /api/me
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
 *               path: /api/me
 *               result: {}
 */

    "/",
    isLoggedIn,
    getMyInfoHandler);

router.patch(
/**
 * @swagger
 * /api/me/phone:
 *   patch:
 *     tags: [MyInfo]
 *     summary: 내 전화번호 수정
 *     description: 로그인한 사용자의 전화번호(phone_number)를 수정합니다. 토큰의 subject로 사용자 식별하며 URL에 userId를 받지 않습니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMyPhoneRequest'
 *           example:
 *             phone: "010-1234-5678"
 *     responses:
 *       200:
 *         description: 전화번호 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     successCode:
 *                       type: string
 *                       example: MYINFO-200-002
 *                     statusCode:
 *                       type: number
 *                       example: 200
 *                     message:
 *                       type: string
 *                       example: 전화번호 수정 성공
 *                     result:
 *                       $ref: '#/components/schemas/MyInfoResult'
 *             example:
 *               successCode: MYINFO-200-002
 *               statusCode: 200
 *               message: 전화번호 수정 성공
 *               result:
 *                 userId: "2"
 *                 name: "서막차"
 *                 email: "makcha@kakao.com"
 *                 phone: "01012345678"
 *       400:
 *         description: 잘못된 phone (누락/빈값/숫자만 남겼을 때 10~11자리 아님)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               errorCode: USER-400-001
 *               message: Invalid phone number
 *               path: /api/me/phone
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
 *               path: /api/me/phone
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
 *               path: /api/me/phone
 *               result: {}
 */

    "/phone",
    isLoggedIn,
    updateMyPhoneHandler);

export default router;