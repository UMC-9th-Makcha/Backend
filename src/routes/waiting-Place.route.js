import { Router } from 'express';
import waitingPlaceController from '../controllers/waiting-place.controller.js';

const router = Router();

/**
 * @swagger
 * /waiting-place/{placeId}:
 *   get:
 *     summary: 대기 장소 상세 정보 조회
 *     description: |
 *       특정 대기 장소의 상세 정보를 조회합니다.
 *       주소, 운영 시간, 편의시설, 혼잡도 등의 정보를 제공합니다.
 *     tags:
 *       - 대기 장소
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 조회할 장소의 ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 대기 장소 상세 정보 조회 성공
 *       404:
 *         description: 해당 장소를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get('/:placeId', waitingPlaceController.getDetail);

export default router;