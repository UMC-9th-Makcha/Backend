import express from 'express';

export function createWaitingPlaceRouter(controller) {
  const router = express.Router();

  // 첫 차 대기 장소 조회
  router.get('/', (req, res, next) => 
    controller.getWaitingPlaces(req, res, next)
  );

  // 길찾기
  router.get('/:placeId/directions', (req, res, next) => 
    controller.getDirections(req, res, next)
  );

  //딥링크
  router.get('/:placeId/deeplink', (req, res, next) => 
    controller.getDeepLink(req, res, next)
  );

  // 장소 상세 정보
  router.get('/:placeId', (req, res, next) => 
    controller.getPlaceDetail(req, res, next)
  );

  return router;
}