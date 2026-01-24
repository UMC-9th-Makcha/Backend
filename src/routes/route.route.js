import { Router } from 'express';
import routeController from '../controllers/route.controller.js';
import { isLoggedIn } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /route/walking:
 *   post:
 *     summary: 도보 길안내
 *     description: |
 *       출발지에서 목적지까지의 도보 경로를 안내합니다.
 *       예상 소요 시간과 거리 정보를 포함합니다.
 *     tags:
 *       - 길안내
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startLat
 *               - startLng
 *               - endLat
 *               - endLng
 *             properties:
 *               startLat:
 *                 type: number
 *                 format: double
 *                 description: 출발지 위도
 *                 example: 37.5665
 *               startLng:
 *                 type: number
 *                 format: double
 *                 description: 출발지 경도
 *                 example: 126.9780
 *               endLat:
 *                 type: number
 *                 format: double
 *                 description: 목적지 위도
 *                 example: 37.5700
 *               endLng:
 *                 type: number
 *                 format: double
 *                 description: 목적지 경도
 *                 example: 126.9800
 *     responses:
 *       200:
 *         description: 도보 경로 안내 성공
 *       400:
 *         description: 필수 파라미터 누락
 *       500:
 *         description: 서버 오류
 */
router.post('/walking', routeController.getWalkingRoute);

/**
 * @swagger
 * /route/navigation:
 *   post:
 *     summary: 길찾기 경로 안내
 *     description: |
 *       대중교통 또는 자동차 경로를 안내합니다.
 *       교통수단별 예상 소요 시간, 요금, 경유지 정보를 제공합니다.
 *     tags:
 *       - 길안내
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startLat
 *               - startLng
 *               - endLat
 *               - endLng
 *               - transportType
 *             properties:
 *               startLat:
 *                 type: number
 *                 format: double
 *                 description: 출발지 위도
 *                 example: 37.5665
 *               startLng:
 *                 type: number
 *                 format: double
 *                 description: 출발지 경도
 *                 example: 126.9780
 *               endLat:
 *                 type: number
 *                 format: double
 *                 description: 목적지 위도
 *                 example: 37.5700
 *               endLng:
 *                 type: number
 *                 format: double
 *                 description: 목적지 경도
 *                 example: 126.9800
 *               transportType:
 *                 type: string
 *                 enum: [PUBLIC, CAR]
 *                 description: 교통수단 타입 (PUBLIC-대중교통, CAR-자동차)
 *                 example: "PUBLIC"
 *     responses:
 *       200:
 *         description: 경로 안내 성공
 *       400:
 *         description: 필수 파라미터 누락 또는 잘못된 교통수단 타입
 *       500:
 *         description: 서버 오류
 */
router.post('/navigation', routeController.getNavigation);

export default router;