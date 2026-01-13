// src/app.js
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

// Clients
import KakaoMapClient from './clients/kakaoMap.client.js';

// Services
import WaitingPlaceService from './services/waitingPlace.service.js';
import TaxiService from './services/taxi.service.js';

// Controllers (각각 별도로 import!)
import WaitingPlaceController from './controllers/waitingPlace.controller.js';
import TaxiController from './controllers/taxi.controller.js';

// Utils
import { DistanceUtil } from './utils/distance.util.js';
import { TimeUtil } from './utils/time.util.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import { createWaitingPlaceRouter } from './routes/waitingPlace.routes.js';
import { createTaxiRouter } from './routes/taxi.routes.js';

// Response
import { successResponse } from './response/apiResponse.js';

const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  const kakaoMapClient = new KakaoMapClient();
  const distanceUtil = new DistanceUtil();
  const timeUtil = new TimeUtil();

  const waitingPlaceService = new WaitingPlaceService(
    kakaoMapClient,
    distanceUtil,
    timeUtil
  );

  const taxiService = new TaxiService(kakaoMapClient, distanceUtil);

  const waitingPlaceController = new WaitingPlaceController(waitingPlaceService);
  const taxiController = new TaxiController(taxiService);

  app.get('/health', (req, res) => {
    res.status(200).json(
      successResponse({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        kakaoApiKey: process.env.KAKAO_REST_API_KEY ? '설정됨' : '미설정'
      })
    );
  });

  app.use('/api/v1/waiting-places', createWaitingPlaceRouter(waitingPlaceController));
  app.use('/api/v1/taxi', createTaxiRouter(taxiController));

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `요청한 리소스를 찾을 수 없습니다: ${req.method} ${req.path}`
      }
    });
  });

  app.use(errorHandler);

  return app;
};

export default createApp;