import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { isLoggedIn, isNotLoggedIn } from '../middleware/auth.middleware.js';
import { refreshLimiter } from '../middleware/rateLimit.middleware.js';
import phoneController from '../controllers/phone.controller.js';

const router = Router();

//카카오 로그인 api
//밑에는 스웨거 배포 테스트 입니다.

/**
 * @swagger
 * /auth/kakao:
 *   post:
 *     summary: 카카오 로그인
 *     description: |
 *       카카오 OAuth 인가 코드(code)를 받아 로그인 또는 회원가입을 진행합니다.
 *       성공 시 Access Token은 응답 body로,
 *       Refresh Token은 HttpOnly 쿠키로 전달됩니다.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: 카카오 OAuth 인가 코드
 *                 example: "authorization_code_from_kakao"
 *     responses:
 *       200:
 *         description: 카카오 로그인 성공
 *       400:
 *         description: code 누락
 *       401:
 *         description: 인증 실패
 */

router.post('/kakao', isNotLoggedIn, authController.kakaoLogin);
//카카오 토큰 재발급 api

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: 카카오 Access Token 재발급
 *     description: |
 *       HttpOnly 쿠키에 저장된 Refresh Token을 이용해
 *       새로운 Access Token을 발급합니다.
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: 토큰 재발급 성공
 *       401:
 *         description: Refresh Token 누락 또는 만료
 */
router.post('/refresh', refreshLimiter, authController.refresh);
//카카오 로그아웃 api
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: 로그아웃
 *     description: |
 *       로그인된 사용자를 로그아웃 처리합니다.
 *       서버에 저장된 Refresh Token을 삭제하고
 *       클라이언트의 Refresh Token 쿠키를 제거합니다.
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *       401:
 *         description: 인증 실패
 */
router.post('/logout', isLoggedIn, authController.logout);

//카카오 회원 탈퇴
/**
 * @swagger
 * /auth/withdraw:
 *   delete:
 *     summary: 회원 탈퇴
 *     description: |
 *       로그인된 사용자의 계정을 삭제합니다.
 *       회원 정보 삭제 후 Refresh Token 쿠키를 제거합니다.
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: 회원 탈퇴 성공
 *       401:
 *         description: 인증 실패
 */
router.delete('/withdraw', isLoggedIn, authController.withdraw);

//sms 인증 요청 api
/**
 * @swagger
 * /auth/phone/send:
 *   post:
 *     summary: 전화번호 인증번호 발송
 *     description: |
 *       로그인된 사용자의 전화번호로 SMS 인증번호를 발송합니다.
 *       - 전화번호는 010으로 시작하는 11자리 숫자만 허용됩니다.
 *       - 3분 내 최대 3회까지 요청할 수 있습니다.
 *     tags:
 *       - Phone
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: 전화번호 (하이픈 없이 전달 권장)
 *                 example: "01025034084"
 *     responses:
 *       200:
 *         description: 인증번호 발송 성공
 *       400:
 *         description: 전화번호 누락 또는 형식 오류
 *       401:
 *         description: 인증 실패 (Access Token 누락/만료)
 *       429:
 *         description: 인증번호 요청 횟수 초과
 */
router.post('/phone/send', isLoggedIn, phoneController.send);

//sms 확인 요청 api
/**
 * @swagger
 * /auth/phone/verify:
 *   post:
 *     summary: 전화번호 인증번호 검증
 *     description: |
 *       SMS로 발송된 인증번호를 검증하고,
 *       인증에 성공하면 사용자의 전화번호를 저장합니다.
 *     tags:
 *       - Phone
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - code
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: 전화번호 (010으로 시작하는 11자리)
 *                 example: "01025034084"
 *               code:
 *                 type: string
 *                 description: SMS로 받은 6자리 인증번호
 *                 example: "590624"
 *     responses:
 *       200:
 *         description: 전화번호 인증 완료
 *       400:
 *         description: 전화번호 또는 인증번호 누락 / 형식 오류
 *       401:
 *         description: 인증 실패 (잘못된 인증번호 또는 토큰 만료)
 */
router.post('/phone/verify', isLoggedIn, phoneController.verify);



export default router;
