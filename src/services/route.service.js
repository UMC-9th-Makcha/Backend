import { CustomError } from '../response/customError.js';

class RouteService {
  constructor(kakaoClient, distanceUtil) {
    this.kakaoClient = kakaoClient;
    this.distanceUtil = distanceUtil;
  }

  /**
   * 도보 경로 조회
   */
  async getWalkingRoute(routeParams) {
    const { startLat, startLng, endLat, endLng } = routeParams;

    try {
      // 거리 계산
      const distance = this.distanceUtil.calculate(
        startLat,
        startLng,
        endLat,
        endLng
      );

      // 도보 시간 계산 (평균 시속 4km 기준)
      const estimatedDuration = Math.ceil((distance / 1000) * 15); // 분 단위

      return {
        route: {
          start: {
            lat: startLat,
            lng: startLng
          },
          end: {
            lat: endLat,
            lng: endLng
          },
          distance: Math.round(distance), // 미터
          estimatedDuration, // 분
          transportType: 'WALKING'
        },
        navigation: {
          available: false,
          message: '세부 경로는 카카오맵에서 확인하세요',
          kakaoMapUrl: `https://map.kakao.com/link/to/목적지,${endLat},${endLng}`
        }
      };

    } catch (error) {
      console.error('[RouteService] getWalkingRoute error:', error);

      throw new CustomError(
        'ROUTE-500-001',
        '도보 경로 조회 실패',
        '/route/walking',
        { originalError: error.message }
      );
    }
  }

  /**
   * 길찾기 경로 안내 (대중교통/자동차)
   */
  async getNavigation(routeParams) {
    const { startLat, startLng, endLat, endLng, transportType } = routeParams;

    try {
      // 거리 계산
      const distance = this.distanceUtil.calculate(
        startLat,
        startLng,
        endLat,
        endLng
      );

      // 교통수단별 예상 시간 계산
      let estimatedDuration;
      let estimatedFare = null;

      if (transportType === 'PUBLIC') {
        // 대중교통: 평균 시속 30km 기준
        estimatedDuration = Math.ceil((distance / 1000) * 2);
        estimatedFare = this._estimatePublicTransportFare(distance);
      } else if (transportType === 'CAR') {
        // 자동차: 평균 시속 40km 기준
        estimatedDuration = Math.ceil((distance / 1000) * 1.5);
      }

      return {
        route: {
          start: {
            lat: startLat,
            lng: startLng
          },
          end: {
            lat: endLat,
            lng: endLng
          },
          distance: Math.round(distance), // 미터
          estimatedDuration, // 분
          transportType,
          estimatedFare
        },
        navigation: {
          available: false,
          message: `${transportType === 'PUBLIC' ? '대중교통' : '자동차'} 경로는 카카오맵에서 확인하세요`,
          kakaoMapUrl: `https://map.kakao.com/link/to/목적지,${endLat},${endLng}`
        }
      };

    } catch (error) {
      console.error('[RouteService] getNavigation error:', error);

      throw new CustomError(
        'ROUTE-500-002',
        '경로 안내 조회 실패',
        '/route/navigation',
        { originalError: error.message }
      );
    }
  }

  /**
   * 대중교통 요금 추정 (간단한 계산)
   */
  _estimatePublicTransportFare(distance) {
    const distanceKm = distance / 1000;

    if (distanceKm <= 10) {
      return 1400; // 기본요금
    } else if (distanceKm <= 50) {
      return 1400 + Math.ceil((distanceKm - 10) / 5) * 100;
    } else {
      return 2200; // 최대 요금 (예시)
    }
  }
}

export default RouteService;