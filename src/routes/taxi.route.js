import express from 'express';

/**
 * @swagger
 * tags:
 *   name: 택시
 *   description: 택시 요금 계산 API
 */

export function createTaxiRouter(controller) {
  const router = express.Router();

  /**
   * @swagger
   * /api/taxi/fare-estimate:
   *   post:
   *     summary: 택시 예상 요금 계산
   *     description: |
   *       출발지와 목적지 좌표를 기반으로 택시 예상 요금을 계산합니다.
   *       거리 기반 요금과 시간 요금을 모두 고려합니다.
   *     tags:
   *       - 택시
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - from
   *               - to
   *             properties:
   *               from:
   *                 type: object
   *                 required:
   *                   - lat
   *                   - lng
   *                 properties:
   *                   lat:
   *                     type: number
   *                     format: double
   *                     description: 출발지 위도
   *                     example: 37.5665
   *                   lng:
   *                     type: number
   *                     format: double
   *                     description: 출발지 경도
   *                     example: 126.9780
   *               to:
   *                 type: object
   *                 required:
   *                   - lat
   *                   - lng
   *                 properties:
   *                   lat:
   *                     type: number
   *                     format: double
   *                     description: 목적지 위도
   *                     example: 37.5700
   *                   lng:
   *                     type: number
   *                     format: double
   *                     description: 목적지 경도
   *                     example: 126.9800
   *               taxiType:
   *                 type: string
   *                 enum: [REGULAR, DELUXE]
   *                 description: 택시 종류 (REGULAR-일반, DELUXE-모범)
   *                 example: "REGULAR"
   *                 default: "REGULAR"
   *           example:
   *             from:
   *               lat: 37.5665
   *               lng: 126.9780
   *             to:
   *               lat: 37.5700
   *               lng: 126.9800
   *             taxiType: "REGULAR"
   *     responses:
   *       200:
   *         description: 택시 요금 계산 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: string
   *                   example: "TAXI-200-001"
   *                 statusCode:
   *                   type: integer
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: "택시 요금 계산 성공"
   *                 data:
   *                   type: object
   *                   properties:
   *                     taxiType:
   *                       type: string
   *                       example: "REGULAR"
   *                     distance:
   *                       type: number
   *                       description: 거리 (미터)
   *                       example: 3500
   *                     distanceKm:
   *                       type: number
   *                       description: 거리 (킬로미터)
   *                       example: 3.5
   *                     estimatedFare:
   *                       type: number
   *                       description: 예상 요금 (원)
   *                       example: 8500
   *                     baseFare:
   *                       type: number
   *                       description: 기본 요금 (원)
   *                       example: 4800
   *                     distanceFare:
   *                       type: number
   *                       description: 거리 요금 (원)
   *                       example: 3700
   *                     estimatedDuration:
   *                       type: number
   *                       description: 예상 소요 시간 (분)
   *                       example: 15
   *       400:
   *         description: 필수 파라미터 누락 또는 잘못된 요청
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: string
   *                   example: "COM-400-001"
   *                 statusCode:
   *                   type: integer
   *                   example: 400
   *                 message:
   *                   type: string
   *                   example: "요청 파라미터가 유효하지 않습니다."
   *                 errors:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       field:
   *                         type: string
   *                         example: "from.lat"
   *                       message:
   *                         type: string
   *                         example: "출발지 위도가 유효하지 않습니다."
   *       500:
   *         description: 서버 오류
   */
  router.post('/fare-estimate', (req, res, next) => 
    controller.estimateFare(req, res, next)
  );

  return router;
}