import express from 'express';
import WaitingPlaceController from '../controllers/waitingPlace.controller.js';
import WaitingPlaceService from '../services/waitingPlace.service.js';
import KakaoMapClient from '../clients/kakaoMap.client.js';
import { DistanceUtil } from '../utils/distance.util.js';

// 의존성 주입
const kakaoClient = new KakaoMapClient();
const distanceUtil = new DistanceUtil();
const waitingPlaceService = new WaitingPlaceService(kakaoClient, distanceUtil, null);  // timeUtil은 실제로 사용 안 함
const waitingPlaceController = new WaitingPlaceController(waitingPlaceService);

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: 대기 장소
 *   description: 대기 장소 관리 API
 */

/**
 * @swagger
 * /api/waiting-places:
 *   get:
 *     summary: 첫 차 대기 장소 조회
 *     description: |
 *       현재 위치 기준으로 주변 대기 장소를 조회합니다.
 *       카페, 도서관, 공원 등 대기 가능한 장소들을 반환합니다.
 *     tags:
 *       - 대기 장소
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *         description: 현재 위치 위도
 *         example: 37.5665
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *         description: 현재 위치 경도
 *         example: 126.9780
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *         description: 검색 반경 (미터)
 *         example: 500
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 장소 카테고리 필터
 *         example: "CAFE"
 *     responses:
 *       200:
 *         description: 대기 장소 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "MAP-200-001"
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "대기 장소 조회 성공"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       placeId:
 *                         type: string
 *                         example: "12345"
 *                       name:
 *                         type: string
 *                         example: "스타벅스 강남점"
 *                       category:
 *                         type: string
 *                         example: "CAFE"
 *                       address:
 *                         type: string
 *                         example: "서울시 강남구 테헤란로 123"
 *                       latitude:
 *                         type: number
 *                         example: 37.5012
 *                       longitude:
 *                         type: number
 *                         example: 127.0396
 *                       distance:
 *                         type: number
 *                         description: 현재 위치로부터의 거리 (미터)
 *                         example: 250
 *                       thumbnailUrl:
 *                         type: string
 *                         nullable: true
 *                         description: 장소 카카오맵 링크 (썸네일 대용)
 *                         example: "http://place.map.kakao.com/12345"
 *                       operatingHours:
 *                         type: string
 *                         description: 운영 시간 정보
 *                         example: "24시간 영업"
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "COM-400-001"
 *                 message:
 *                   type: string
 *                   example: "요청 파라미터가 유효하지 않습니다"
 *       500:
 *         description: 서버 오류
 */
// 첫 차 대기 장소 조회
router.get('/', (req, res, next) => 
  waitingPlaceController.getWaitingPlaces(req, res, next)
);

/**
 * @swagger
 * /api/waiting-places/{placeId}/directions:
 *   get:
 *     summary: 대기 장소 길찾기
 *     description: |
 *       특정 대기 장소까지의 길찾기 정보를 제공합니다.
 *       도보 경로 및 예상 소요 시간을 포함합니다.
 *     tags:
 *       - 대기 장소
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         schema:
 *           type: string
 *         description: 대기 장소 ID
 *         example: "12345"
 *       - in: query
 *         name: fromLat
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *         description: 출발지 위도
 *         example: 37.5665
 *       - in: query
 *         name: fromLng
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *         description: 출발지 경도
 *         example: 126.9780
 *     responses:
 *       200:
 *         description: 길찾기 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "MAP-200-003"
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "길찾기 정보 조회 성공"
 *                 data:
 *                   type: object
 *                   properties:
 *                     distance:
 *                       type: number
 *                       description: 거리 (미터)
 *                       example: 450
 *                     duration:
 *                       type: number
 *                       description: 예상 소요 시간 (초)
 *                       example: 360
 *                     path:
 *                       type: array
 *                       description: 경로 좌표 배열
 *                       items:
 *                         type: object
 *                         properties:
 *                           latitude:
 *                             type: number
 *                             example: 37.5665
 *                           longitude:
 *                             type: number
 *                             example: 126.9780
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
// 길찾기
router.get('/:placeId/directions', (req, res, next) => 
  waitingPlaceController.getDirections(req, res, next)
);

/**
 * @swagger
 * /api/waiting-places/{placeId}/deeplink:
 *   get:
 *     summary: 카카오맵 딥링크 생성
 *     description: |
 *       카카오맵 앱으로 연결되는 딥링크를 생성합니다.
 *       모바일 환경에서 카카오맵 앱을 직접 실행할 수 있습니다.
 *     tags:
 *       - 대기 장소
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         schema:
 *           type: string
 *         description: 대기 장소 ID
 *         example: "12345"
 *       - in: query
 *         name: fromLat
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *         description: 출발지 위도
 *         example: 37.5665
 *       - in: query
 *         name: fromLng
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *         description: 출발지 경도
 *         example: 126.9780
 *       - in: query
 *         name: toLat
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *         description: 목적지 위도
 *         example: 37.5700
 *       - in: query
 *         name: toLng
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *         description: 목적지 경도
 *         example: 126.9800
 *       - in: query
 *         name: placeName
 *         required: true
 *         schema:
 *           type: string
 *         description: 장소명
 *         example: "스타벅스 강남점"
 *     responses:
 *       200:
 *         description: 카카오맵 딥링크 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "MAP-200-004"
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "카카오맵 딥링크 생성 성공"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deepLink:
 *                       type: string
 *                       description: 카카오맵 딥링크 URL
 *                       example: "kakaomap://route?sp=37.5665,126.9780&ep=37.5700,126.9800&by=FOOT"
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
// 딥링크
router.get('/:placeId/deeplink', (req, res, next) => 
  waitingPlaceController.getDeepLink(req, res, next)
);

/**
 * @swagger
 * /api/waiting-places/{placeId}:
 *   get:
 *     summary: 장소 상세 정보 조회
 *     description: |
 *       특정 대기 장소의 상세 정보를 조회합니다.
 *       주소, 전화번호, 운영시간, 편의시설 등의 상세 정보를 제공합니다.
 *     tags:
 *       - 대기 장소
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 장소의 ID
 *         example: "12345"
 *     responses:
 *       200:
 *         description: 장소 상세 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "MAP-200-002"
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "장소 상세 조회 성공"
 *                 data:
 *                   type: object
 *                   properties:
 *                     placeId:
 *                       type: string
 *                       example: "12345"
 *                     name:
 *                       type: string
 *                       example: "스타벅스 강남점"
 *                     category:
 *                       type: string
 *                       example: "CAFE"
 *                     address:
 *                       type: string
 *                       example: "서울시 강남구 테헤란로 123"
 *                     phone:
 *                       type: string
 *                       example: "02-1234-5678"
 *                     latitude:
 *                       type: number
 *                       example: 37.5012
 *                     longitude:
 *                       type: number
 *                       example: 127.0396
 *                     openingHours:
 *                       type: string
 *                       example: "08:00-22:00"
 *                     facilities:
 *                       type: object
 *                       properties:
 *                         wifi:
 *                           type: boolean
 *                           example: true
 *                         parking:
 *                           type: boolean
 *                           example: false
 *                         restroom:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "COM-400-001"
 *                 message:
 *                   type: string
 *                   example: "장소 ID가 필요합니다"
 *       404:
 *         description: 장소를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
// 장소 상세 정보
router.get('/:placeId', (req, res, next) => 
  waitingPlaceController.getPlaceDetail(req, res, next)
);

export default router;