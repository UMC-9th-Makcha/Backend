import { Router } from 'express';
import FacilityController from '../controllers/facility.controller.js';
import FacilityService from '../services/facility.service.js';

const router = Router();

// 서비스와 컨트롤러 인스턴스 생성
const facilityService = new FacilityService();
const facilityController = new FacilityController(facilityService);

/**
 * @swagger
 * /facilities/search:
 *   get:
 *     summary: 주변 시설 통합 검색
 *     description: |
 *       사용자의 현재 위치를 기준으로 주변 시설을 통합 검색합니다.
 *       검색 반경과 키워드를 지정할 수 있습니다.
 *     tags:
 *       - 주변 시설
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *         description: 현재 위치의 위도
 *         example: 37.5665
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *         description: 현재 위치의 경도
 *         example: 126.9780
 *       - in: query
 *         name: radius
 *         schema:
 *           type: integer
 *         description: 검색 반경(미터)
 *         example: 1000
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 검색할 시설명 또는 키워드
 *         example: "카페"
 *     responses:
 *       200:
 *         description: 주변 시설 검색 성공
 *       400:
 *         description: 필수 파라미터 누락 또는 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.get('/search', (req, res, next) => 
  facilityController.searchFacilities(req, res, next)
);

/**
 * @swagger
 * /facilities/category/{categoryType}:
 *   get:
 *     summary: 카테고리별 시설 검색
 *     description: |
 *       특정 카테고리에 해당하는 시설만 검색합니다.
 *       카페, 음식점, PC방 등의 카테고리별로 필터링됩니다.
 *     tags:
 *       - 주변 시설
 *     parameters:
 *       - in: path
 *         name: categoryType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [CAFE, RESTAURANT, PARK, LIBRARY, SHOPPING_MALL, PC_ROOM]
 *         description: 시설 카테고리 타입
 *         example: "CAFE"
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: 현재 위치의 위도
 *         example: 37.5665
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: 현재 위치의 경도
 *         example: 126.9780
 *       - in: query
 *         name: radius
 *         schema:
 *           type: integer
 *         description: 검색 반경(미터)
 *         example: 1000
 *     responses:
 *       200:
 *         description: 카테고리별 시설 검색 성공
 *       400:
 *         description: 필수 파라미터 누락
 *       404:
 *         description: 해당 카테고리를 찾을 수 없음
 */
router.get('/category/:categoryType', (req, res, next) => 
  facilityController.searchByCategory(req, res, next)
);

export default router;