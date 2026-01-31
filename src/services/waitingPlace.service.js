import { WaitingPlaceResponseDto } from '../dtos/response/waitingPlace.dto.js';
import { appConfig } from '../config/app.config.js';
import { CustomError } from '../response/customError.js';

class WaitingPlaceService {
  constructor(kakaoClient, distanceUtil, timeUtil) {
    this.kakaoClient = kakaoClient;
    this.distanceUtil = distanceUtil;
    this.timeUtil = timeUtil;
  }

  async getDeepLink(deepLinkDto) {
    try {
      // 필수 파라미터 검증
      if (!deepLinkDto.fromLat || !deepLinkDto.fromLng || !deepLinkDto.toLat || !deepLinkDto.toLng) {
        throw new CustomError(
          'COM-400-001',
          '필수 파라미터 누락',
          '/api/v1/waiting-places/deeplink',
          { required: ['fromLat', 'fromLng', 'toLat', 'toLng'] }
        );
      }

      // 좌표 유효성 검증
      if (!this._isValidCoordinate(deepLinkDto.fromLat, deepLinkDto.fromLng) ||
          !this._isValidCoordinate(deepLinkDto.toLat, deepLinkDto.toLng)) {
        throw new CustomError(
          'MAP-400-001',
          '잘못된 좌표값',
          '/api/v1/waiting-places/deeplink',
          { 
            from: { lat: deepLinkDto.fromLat, lng: deepLinkDto.fromLng },
            to: { lat: deepLinkDto.toLat, lng: deepLinkDto.toLng }
          }
        );
      }

      // 카카오맵 딥링크 URL 생성
      const deepLink = `kakaomap://route?sp=${deepLinkDto.fromLat},${deepLinkDto.fromLng}&ep=${deepLinkDto.toLat},${deepLinkDto.toLng}&by=FOOT`;

      // 성공 시 데이터만 반환 (success 객체 X)
      return {
        place: {
          id: deepLinkDto.placeId,
          name: deepLinkDto.placeName,
          location: {
            lat: deepLinkDto.toLat,
            lng: deepLinkDto.toLng
          }
        },
        deepLink
      };
    } catch (error) {
      // CustomError는 그대로 throw
      if (error instanceof CustomError) {
        throw error;
      }
      
      // 예상치 못한 에러
      throw new CustomError(
        'COM-500-001',
        '서버 내부 오류',
        '/api/v1/waiting-places/deeplink',
        { originalError: error.message }
      );
    }
  }

  async findNearbyPlaces(searchDto) {
    const currentTime = new Date();
    const { lat, lng, category, openOnly, limit } = searchDto;

    // 필수 파라미터 검증
    if (!lat || !lng) {
      throw new CustomError(
        'COM-400-001',
        '필수 파라미터 누락',
        '/api/v1/waiting-places',
        { required: ['lat', 'lng'] }
      );
    }

    // 좌표 유효성 검증
    if (!this._isValidCoordinate(lat, lng)) {
      throw new CustomError(
        'MAP-400-001',
        '잘못된 좌표값',
        '/api/v1/waiting-places',
        { lat, lng }
      );
    }

    try {
      let allPlaces = [];

      if (category) {
        const result = await this.kakaoClient.searchPlacesByCategory({
          lat, lng,
          radius: appConfig.search.defaultRadius,
          category
        });
        allPlaces = result.places;
      } else {
        const categories = ['CAFE', 'PC_ROOM', 'SAUNA'];
        const promises = categories.map(cat =>
          this.kakaoClient.searchPlacesByCategory({
            lat, lng,
            radius: appConfig.search.defaultRadius,
            category: cat
          }).catch(err => {
            console.warn(`[Kakao] ${cat} search failed:`, err.message);
            return { places: [] };
          })
        );
        
        const results = await Promise.all(promises);
        allPlaces = results.flatMap(r => r.places);
      }

      if (openOnly) {
        try {
          const keyword24h = await this.kakaoClient.searchPlacesByKeyword({
            lat, lng,
            radius: appConfig.search.defaultRadius,
            keyword: '24시간'
          });
          
          keyword24h.places.forEach(place => {
            if (!allPlaces.find(p => p.id === place.id)) {
              allPlaces.push(place);
            }
          });
        } catch (error) {
          console.warn('[Kakao] 24h keyword search failed:', error.message);
        }
      }

      const placesWithDistance = allPlaces.map(place => ({
        ...place,
        distance: this.distanceUtil.calculate(lat, lng, place.lat, place.lng)
      }));

      const filteredPlaces = openOnly
        ? placesWithDistance.filter(p => this._isCurrentlyOpen(p, currentTime))
        : placesWithDistance;

      const sortedPlaces = filteredPlaces
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);

      // 장소가 없는 경우
      if (sortedPlaces.length === 0) {
        throw new CustomError(
          'MAP-404-001',
          '주변에 대기 장소가 없습니다',
          '/api/v1/waiting-places',
          { searchArea: { lat, lng, radius: appConfig.search.defaultRadius } }
        );
      }

      const enrichedPlaces = sortedPlaces.map(place => {
        const recommendReason = this._generateRecommendReason(place, currentTime);
        
        return new WaitingPlaceResponseDto(
          { ...place, recommendReason },
          place.distance,
          currentTime
        );
      });

      // 성공 시 데이터만 반환
      return {
        places: enrichedPlaces,
        totalCount: enrichedPlaces.length
      };

    } catch (error) {
      console.error('[WaitingPlaceService] findNearbyPlaces error:', error);
      
      // CustomError는 그대로 throw
      if (error instanceof CustomError) {
        throw error;
      }

      // 카카오 API 에러
      if (error.response) {
        throw new CustomError(
          'MAP-500-001',
          '카카오 API 오류',
          '/api/v1/waiting-places',
          { 
            apiError: error.response.data?.message || error.message,
            statusCode: error.response.status 
          }
        );
      }

      // 예상치 못한 에러
      throw new CustomError(
        'COM-500-001',
        '서버 내부 오류',
        '/api/v1/waiting-places',
        { originalError: error.message }
      );
    }
  }

  async getPlaceDetail(placeId) {
    // 필수 파라미터 검증
    if (!placeId) {
      throw new CustomError(
        'COM-400-001',
        '장소 ID가 필요합니다',
        `/api/v1/waiting-places/${placeId}`
      );
    }

    try {
      const place = await this.kakaoClient.getPlaceDetail(placeId);
      
      if (!place) {
        throw new CustomError(
          'MAP-404-001',
          '대기 장소를 찾을 수 없습니다',
          `/api/v1/waiting-places/${placeId}`,
          { placeId }
        );
      }

      const currentTime = new Date();
      const recommendReason = this._generateRecommendReason(place, currentTime);
      const kakaoMapUrl = this._generateKakaoMapDeepLink(place);

      // 성공 시 데이터만 반환
      return {
        ...new WaitingPlaceResponseDto(
          { ...place, recommendReason },
          0,
          currentTime
        ),
        kakaoMapUrl,
        detailsAvailable: {
          thumbnail: false,
          reviews: false,
          message: '상세 정보는 카카오맵에서 확인하세요'
        }
      };

    } catch (error) {
      console.error('[WaitingPlaceService] getPlaceDetail error:', error);
      
      // CustomError는 그대로 throw
      if (error instanceof CustomError) {
        throw error;
      }

      // 카카오 API 에러
      if (error.response) {
        throw new CustomError(
          'MAP-500-001',
          '카카오 API 오류',
          `/api/v1/waiting-places/${placeId}`,
          { apiError: error.message }
        );
      }

      // 예상치 못한 에러
      throw new CustomError(
        'COM-500-001',
        '서버 내부 오류',
        `/api/v1/waiting-places/${placeId}`,
        { originalError: error.message }
      );
    }
  }

  async getDirections(directionsDto) {
    const { placeId, fromLat, fromLng } = directionsDto;

    // 필수 파라미터 검증
    if (!placeId || !fromLat || !fromLng) {
      throw new CustomError(
        'COM-400-001',
        '필수 파라미터 누락',
        `/api/v1/waiting-places/${placeId}/directions`,
        { required: ['placeId', 'fromLat', 'fromLng'] }
      );
    }

    // 좌표 유효성 검증
    if (!this._isValidCoordinate(fromLat, fromLng)) {
      throw new CustomError(
        'MAP-400-001',
        '잘못된 좌표값',
        `/api/v1/waiting-places/${placeId}/directions`,
        { lat: fromLat, lng: fromLng }
      );
    }

    try {
      const place = await this.kakaoClient.getPlaceDetail(placeId);
      
      if (!place) {
        throw new CustomError(
          'MAP-404-001',
          '대기 장소를 찾을 수 없습니다',
          `/api/v1/waiting-places/${placeId}/directions`,
          { placeId }
        );
      }

      const distance = this.distanceUtil.calculate(
        fromLat, fromLng,
        place.lat, place.lng
      );

      const estimatedDuration = Math.ceil((distance / 1000) * 15);
      const navigationUrl = this._generateKakaoMapNavigation(
        { lat: fromLat, lng: fromLng },
        place
      );

      // 성공 시 데이터만 반환
      return {
        distance: Math.round(distance),
        estimatedDuration,
        destination: {
          name: place.name,
          address: place.address,
          location: {
            lat: place.lat,
            lng: place.lng
          },
          phoneNumber: place.phoneNumber
        },
        navigation: {
          available: false,
          message: '세부 경로 안내는 카카오맵에서 확인하세요',
          kakaoMapUrl: navigationUrl
        }
      };

    } catch (error) {
      console.error('[WaitingPlaceService] getDirections error:', error);
      
      // CustomError는 그대로 throw
      if (error instanceof CustomError) {
        throw error;
      }

      // 카카오 API 에러
      if (error.response) {
        throw new CustomError(
          'MAP-404-002',
          '경로 탐색 실패',
          `/api/v1/waiting-places/${placeId}/directions`,
          { apiError: error.message }
        );
      }

      // 예상치 못한 에러
      throw new CustomError(
        'COM-500-001',
        '서버 내부 오류',
        `/api/v1/waiting-places/${placeId}/directions`,
        { originalError: error.message }
      );
    }
  }

  // 좌표 유효성 검증 헬퍼 메서드 추가
  _isValidCoordinate(lat, lng) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    return !isNaN(latitude) && 
           !isNaN(longitude) && 
           latitude >= -90 && 
           latitude <= 90 && 
           longitude >= -180 && 
           longitude <= 180;
  }

  _generateKakaoMapDeepLink(place) {
    return `https://map.kakao.com/link/map/${encodeURIComponent(place.name)},${place.lat},${place.lng}`;
  }

  _generateKakaoMapNavigation(from, destination) {
    return `https://map.kakao.com/link/to/${encodeURIComponent(destination.name)},${destination.lat},${destination.lng}`;
  }

  _generateRecommendReason(place, currentTime) {
    const reasons = [];

    if (place.isOpen24Hours) {
      reasons.push('24시간 영업');
    }

    if (place.distance < 300) {
      reasons.push('도보 3분 이내');
    } else if (place.distance < 500) {
      reasons.push('도보 5분 거리');
    } else if (place.distance < 1000) {
      reasons.push('도보 10분 거리');
    }

    const categoryReasons = {
      'SAUNA': '샤워 및 휴식 가능',
      'PC_ROOM': '편의시설 완비',
      'CAFE': '음료 및 간식 이용 가능'
    };
    
    if (categoryReasons[place.category]) {
      reasons.push(categoryReasons[place.category]);
    }

    return reasons.join(', ') || '첫 차 대기 가능';
  }

  _isCurrentlyOpen(place, currentTime) {
    if (place.isOpen24Hours) {
      return true;
    }
    return true;
  }
}

export default WaitingPlaceService;