import express from 'express';

export function createTaxiRouter(controller) {
  const router = express.Router();

  // 택시 예상 비용 계산
  router.post('/fare-estimate', (req, res, next) => 
    controller.estimateFare(req, res, next)
  );

  return router;
}

