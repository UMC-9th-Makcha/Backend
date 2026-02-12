import { Router } from 'express';
import RouteController from '../controllers/route.controller.js';
import RouteService from '../services/route.service.js';
import KakaoMapClient from '../clients/kakaoMap.client.js';
import { DistanceUtil } from '../utils/distance.util.js';

const router = Router();

// 의존성 주입: KakaoMapClient, DistanceUtil 생성 후 RouteService에 전달
const kakaoClient = new KakaoMapClient();
const distanceUtil = new DistanceUtil();

// 디버깅: distanceUtil이 제대로 생성되었는지 확인
console.log('🔍 [route.route.js] DistanceUtil:', DistanceUtil);
console.log('🔍 [route.route.js] distanceUtil instance:', distanceUtil);
console.log('🔍 [route.route.js] distanceUtil.calculate:', distanceUtil.calculate);

const routeService = new RouteService(kakaoClient, distanceUtil);
const routeController = new RouteController(routeService);

/**
 * @swagger
 * /api/route/walking:
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalDistance:
 *                       type: number
 *                       description: 총 거리(미터)
 *                       example: 1500
 *                     totalTime:
 *                       type: number
 *                       description: 총 소요 시간(초)
 *                       example: 1200
 *                     routes:
 *                       type: array
 *                       description: 경로 정보
 *                       items:
 *                         type: object
 *                         properties:
 *                           lat:
 *                             type: number
 *                             example: 37.5665
 *                           lng:
 *                             type: number
 *                             example: 126.9780
 *                           instruction:
 *                             type: string
 *                             example: "직진"
 *       400:
 *         description: 필수 파라미터 누락
 *       500:
 *         description: 서버 오류
 */
router.post('/walking', (req, res, next) => routeController.getWalkingRoute(req, res, next));

/**
 * @swagger
 * /api/route/navigation:
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     transportType:
 *                       type: string
 *                       example: "PUBLIC"
 *                     totalDistance:
 *                       type: number
 *                       description: 총 거리(미터)
 *                       example: 5000
 *                     totalTime:
 *                       type: number
 *                       description: 총 소요 시간(초)
 *                       example: 1800
 *                     totalFare:
 *                       type: number
 *                       description: 총 요금(원)
 *                       example: 1400
 *                     routes:
 *                       type: array
 *                       description: 경로 상세 정보
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             description: 구간 타입 (SUBWAY, BUS, WALK 등)
 *                             example: "SUBWAY"
 *                           name:
 *                             type: string
 *                             description: 노선명 또는 구간명
 *                             example: "2호선"
 *                           startStation:
 *                             type: string
 *                             example: "서울역"
 *                           endStation:
 *                             type: string
 *                             example: "강남역"
 *                           distance:
 *                             type: number
 *                             example: 3000
 *                           time:
 *                             type: number
 *                             example: 900
 *       400:
 *         description: 필수 파라미터 누락 또는 잘못된 교통수단 타입
 *       500:
 *         description: 서버 오류
 */
router.post('/navigation', (req, res, next) => routeController.getNavigation(req, res, next));

export default router;