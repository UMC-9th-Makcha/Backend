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
      // 카카오맵 API로 실제 도보 경로 조회
      const directions = await this.kakaoClient.getWalkingDirections({
        origin: { lat: startLat, lng: startLng },
        destination: { lat: endLat, lng: endLng }
      });

      // 세부 경로 안내 생성 (개선된 버전)
      const instructions = this._buildDetailedInstructions(directions.sections);

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
          distance: directions.distance, // 미터
          estimatedDuration: Math.ceil(directions.duration / 60), // 초 -> 분
          transportType: 'WALKING'
        },
        navigation: {
          available: true,
          instructions,
          sections: directions.sections // 전체 섹션 정보도 제공
        }
      };

    } catch (error) {
      console.error('[RouteService] getWalkingRoute error:', error);

      // 카카오 API 실패 시 폴백
      return this._getFallbackWalkingRoute(startLat, startLng, endLat, endLng);
    }
  }

  /**
   * 🔧 개선: 더 상세한 경로 안내 생성
   */
  _buildDetailedInstructions(sections) {
    const instructions = [];
    let stepNumber = 1;
    let previousRoadName = null;

    sections.forEach((section, sectionIndex) => {
      if (section.roads && section.roads.length > 0) {
        section.roads.forEach((road, roadIndex) => {
          const roadName = road.name || '도로';
          
          // 같은 도로가 연속되면 하나로 합치기
          if (roadName === previousRoadName) {
            const lastInstruction = instructions[instructions.length - 1];
            if (lastInstruction) {
              lastInstruction.distance += road.distance;
              lastInstruction.duration += Math.ceil(road.duration / 60);
              lastInstruction.guidance = this._generateGuidance(
                lastInstruction.direction,
                roadName === '도로' ? null : roadName,
                lastInstruction.distance
              );
              return;
            }
          }

          // 방향 정보 추론
          const direction = this._inferDirection(
            road, 
            section.roads[roadIndex - 1],
            roadIndex === 0 && sectionIndex === 0
          );

          // 안내 문구 생성
          const guidance = this._generateGuidance(
            direction,
            roadName === '도로' ? null : roadName,
            road.distance
          );

          instructions.push({
            step: stepNumber++,
            direction, // "출발", "직진", "좌회전", "우회전", "진행"
            roadName: roadName === '도로' ? null : roadName,
            distance: road.distance, // 미터
            duration: Math.ceil(road.duration / 60), // 초 -> 분
            guidance // "세종대로를 따라 294m 직진하세요"
          });

          previousRoadName = roadName;
        });
      }
    });

    // 마지막 단계 추가
    if (instructions.length > 0) {
      instructions.push({
        step: stepNumber,
        direction: '도착',
        roadName: null,
        distance: 0,
        duration: 0,
        guidance: '목적지에 도착했습니다'
      });
    }

    return instructions;
  }

  /**
   * 방향 추론
   */
  _inferDirection(currentRoad, previousRoad, isFirst) {
    if (isFirst) {
      return '출발';
    }

    if (!previousRoad) {
      return '직진';
    }

    if (currentRoad.name !== previousRoad.name) {
      return '진행';
    }

    return '직진';
  }

  /**
   * 안내 문구 생성
   */
  _generateGuidance(direction, roadName, distance) {
    const distanceText = distance >= 1000 
      ? `${(distance / 1000).toFixed(1)}km`
      : `${distance}m`;

    if (direction === '출발') {
      return roadName ? `${roadName}에서 출발하세요` : '출발하세요';
    }

    if (direction === '도착') {
      return '목적지에 도착했습니다';
    }

    if (direction === '직진') {
      return roadName 
        ? `${roadName}을(를) 따라 ${distanceText} 직진하세요`
        : `${distanceText} 직진하세요`;
    }

    if (direction === '좌회전') {
      return roadName
        ? `${roadName}에서 좌회전하세요`
        : '좌회전하세요';
    }

    if (direction === '우회전') {
      return roadName
        ? `${roadName}에서 우회전하세요`
        : '우회전하세요';
    }

    return roadName 
      ? `${roadName}(으)로 ${distanceText} 진행하세요`
      : `${distanceText} 진행하세요`;
  }

  _getFallbackWalkingRoute(startLat, startLng, endLat, endLng) {
    const distance = this.distanceUtil.calculate(
      startLat,
      startLng,
      endLat,
      endLng
    );

    const estimatedDuration = Math.ceil((distance / 1000) * 15);

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
        distance: Math.round(distance),
        estimatedDuration,
        transportType: 'WALKING'
      },
      navigation: {
        available: false,
        message: '세부 경로는 카카오맵에서 확인하세요',
        kakaoMapUrl: `https://map.kakao.com/link/to/목적지,${endLat},${endLng}`
      }
    };
  }

  async getNavigation(routeParams) {
    const { startLat, startLng, endLat, endLng, transportType } = routeParams;

    try {
      if (transportType === 'CAR') {
        const carRoute = await this.kakaoClient.getCarDirections({
          origin: { lat: startLat, lng: startLng },
          destination: { lat: endLat, lng: endLng }
        });

        return {
          route: {
            start: { lat: startLat, lng: startLng },
            end: { lat: endLat, lng: endLng },
            distance: carRoute.distance,
            estimatedDuration: Math.ceil(carRoute.duration / 60),
            transportType: 'CAR',
            estimatedFare: carRoute.taxiFare
          },
          navigation: {
            available: true,
            message: '자동차 경로 안내',
            kakaoMapUrl: `https://map.kakao.com/link/to/목적지,${endLat},${endLng}`
          }
        };
      }

      const distance = this.distanceUtil.calculate(startLat, startLng, endLat, endLng);
      const estimatedDuration = Math.ceil((distance / 1000) * 2);
      const estimatedFare = this._estimatePublicTransportFare(distance);

      return {
        route: {
          start: { lat: startLat, lng: startLng },
          end: { lat: endLat, lng: endLng },
          distance: Math.round(distance),
          estimatedDuration,
          transportType: 'PUBLIC',
          estimatedFare
        },
        navigation: {
          available: false,
          message: '대중교통 경로는 카카오맵에서 확인하세요',
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

  _estimatePublicTransportFare(distance) {
    const distanceKm = distance / 1000;

    if (distanceKm <= 10) {
      return 1400;
    } else if (distanceKm <= 50) {
      return 1400 + Math.ceil((distanceKm - 10) / 5) * 100;
    } else {
      return 2200;
    }
  }
}

export default RouteService;