import { CustomSuccess } from '../response/customSuccess.js'; 
import { CustomError } from '../response/customError.js'; 

class RouteController {
  constructor(routeService) {
    this.service = routeService;
  }

  /**
   * 도보 길안내
   * POST /route/walking
   */
  async getWalkingRoute(req, res, next) {
    try {
      const { startLat, startLng, endLat, endLng } = req.body;

      // 필수 파라미터 검증
      if (!startLat || !startLng || !endLat || !endLng) {
        throw new CustomError(
          'COM-400-001',
          '출발지와 목적지 좌표는 필수입니다',
          '/route/walking',
          { 
            missingParams: {
              startLat: !startLat ? 'required' : 'ok',
              startLng: !startLng ? 'required' : 'ok',
              endLat: !endLat ? 'required' : 'ok',
              endLng: !endLng ? 'required' : 'ok'
            }
          }
        );
      }

      // 숫자 유효성 검증
      const sLat = parseFloat(startLat);
      const sLng = parseFloat(startLng);
      const eLat = parseFloat(endLat);
      const eLng = parseFloat(endLng);
      
      if (isNaN(sLat) || isNaN(sLng) || isNaN(eLat) || isNaN(eLng)) {
        throw new CustomError(
          'COM-400-001',
          '좌표는 유효한 숫자여야 합니다',
          '/route/walking'
        );
      }

      // 위도/경도 범위 검증
      if (sLat < -90 || sLat > 90 || eLat < -90 || eLat > 90 ||
          sLng < -180 || sLng > 180 || eLng < -180 || eLng > 180) {
        throw new CustomError(
          'COM-400-001',
          '좌표 값이 유효 범위를 벗어났습니다',
          '/route/walking'
        );
      }

      const routeParams = {
        startLat: sLat,
        startLng: sLng,
        endLat: eLat,
        endLng: eLng
      };

      const result = await this.service.getWalkingRoute(routeParams);

      const response = new CustomSuccess(
        'ROUTE-200-001',
        200,
        '도보 경로 조회 성공',
        result
      );

      return res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 길찾기 경로 안내 (대중교통/자동차)
   * POST /route/navigation
   */
  async getNavigation(req, res, next) {
    try {
      const { startLat, startLng, endLat, endLng, transportType } = req.body;

      // 필수 파라미터 검증
      if (!startLat || !startLng || !endLat || !endLng || !transportType) {
        throw new CustomError(
          'COM-400-001',
          '모든 필수 파라미터가 필요합니다',
          '/route/navigation',
          { 
            missingParams: {
              startLat: !startLat ? 'required' : 'ok',
              startLng: !startLng ? 'required' : 'ok',
              endLat: !endLat ? 'required' : 'ok',
              endLng: !endLng ? 'required' : 'ok',
              transportType: !transportType ? 'required' : 'ok'
            }
          }
        );
      }

      // 교통수단 타입 검증
      const validTransportTypes = ['PUBLIC', 'CAR'];
      if (!validTransportTypes.includes(transportType)) {
        throw new CustomError(
          'COM-400-001',
          '유효하지 않은 교통수단 타입입니다',
          '/route/navigation',
          {
            validTypes: validTransportTypes,
            receivedType: transportType
          }
        );
      }

      // 숫자 유효성 검증
      const sLat = parseFloat(startLat);
      const sLng = parseFloat(startLng);
      const eLat = parseFloat(endLat);
      const eLng = parseFloat(endLng);
      
      if (isNaN(sLat) || isNaN(sLng) || isNaN(eLat) || isNaN(eLng)) {
        throw new CustomError(
          'COM-400-001',
          '좌표는 유효한 숫자여야 합니다',
          '/route/navigation'
        );
      }

      // 위도/경도 범위 검증
      if (sLat < -90 || sLat > 90 || eLat < -90 || eLat > 90 ||
          sLng < -180 || sLng > 180 || eLng < -180 || eLng > 180) {
        throw new CustomError(
          'COM-400-001',
          '좌표 값이 유효 범위를 벗어났습니다',
          '/route/navigation'
        );
      }

      const routeParams = {
        startLat: sLat,
        startLng: sLng,
        endLat: eLat,
        endLng: eLng,
        transportType
      };

      const result = await this.service.getNavigation(routeParams);

      const response = new CustomSuccess(
        'ROUTE-200-002',
        200,
        `${transportType} 경로 조회 성공`,
        result
      );

      return res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default RouteController;