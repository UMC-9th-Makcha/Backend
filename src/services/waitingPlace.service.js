import { WaitingPlaceResponseDto } from '../dtos/response/waitingPlace.dto.js';
import { CustomError } from '../response/customError.js';
import { appConfig } from '../config/app.config.js';

class WaitingPlaceService {
  constructor(kakaoClient, googleClient, distanceUtil, timeUtil) {
    this.kakaoClient = kakaoClient;
    this.googleClient = googleClient; //추가함(대표 사진, 영업 시간)
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
          '/api/waiting-places/deeplink',
          { required: ['fromLat', 'fromLng', 'toLat', 'toLng'] }
        );
      }

      // 좌표 유효성 검증
      if (!this._isValidCoordinate(deepLinkDto.fromLat, deepLinkDto.fromLng) ||
          !this._isValidCoordinate(deepLinkDto.toLat, deepLinkDto.toLng)) {
        throw new CustomError(
          'MAP-400-001',
          '잘못된 좌표값',
          '/api/waiting-places/deeplink',
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
        '/api/waiting-places/deeplink',
        { originalError: error.message }
      );
    }
  }

  async findNearbyPlaces(searchDto) {
    const currentTime = new Date();
    const { lat, lng, category, openOnly, limit, sort } = searchDto;  

    // 필수 파라미터 검증
    if (lat === undefined || lat === null || lng === undefined || lng === null) {
      throw new CustomError(
        'COM-400-001',
        '필수 파라미터 누락',
        '/api/waiting-places',  
        { required: ['lat', 'lng'] }
      );
    }

    // 좌표 유효성 검증
    if (!this._isValidCoordinate(lat, lng)) {
      throw new CustomError(
        'MAP-400-001',
        '잘못된 좌표값',
        '/api/waiting-places',
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
            // category 파라미터가 있으면 해당 카테고리만 추가
            const shouldAdd = category 
              ? place.category === category  // category 있으면 필터링
              : true;  // category 없으면 전부 추가
            
            if (shouldAdd && !allPlaces.find(p => p.id === place.id)) {
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

        
      const MAX_DISTANCE = 5000; //반경 5km

      // 정렬 로직 적용
      const sortedPlaces = this._sortPlaces(
        filteredPlaces.filter(p => p.distance <= MAX_DISTANCE),
        sort
      ).slice(0, limit);

      // 디버깅 로그 추가
      console.log('[DEBUG] sort 파라미터:', sort);
      console.log('[DEBUG] 정렬 전 거리:', filteredPlaces.slice(0, 5).map(p => ({ name: p.name, distance: p.distance, isOpen24Hours: p.isOpen24Hours })));
      console.log('[DEBUG] 정렬 후 거리:', sortedPlaces.slice(0, 5).map(p => ({ name: p.name, distance: p.distance, isOpen24Hours: p.isOpen24Hours })));

      // 장소가 없는 경우 - 에러 대신 빈 배열 반환
      if (sortedPlaces.length === 0) {
        return {
          places: [],
          totalCount: 0
        };
      }

      // Google API 호출 추가 - 목록에서도 사진/영업시간 표시
      const enrichedPlaces = await Promise.all(
        sortedPlaces.map(async (place) => {
          const recommendReason = this._generateRecommendReason(place, currentTime);
          
          // Google API로 사진/영업시간 가져오기
          let googleData = null;
          try {
            googleData = await this.googleClient.findPlaceByLocation({
              lat: place.lat,
              lng: place.lng
            });
          } catch (error) {
            console.warn(`[Google] Failed for ${place.name}:`, error.message);
          }
          
          return new WaitingPlaceResponseDto(
            { 
              ...place, 
              recommendReason,
              thumbnailUrl: googleData?.photoReference
                ? `${appConfig.baseUrl}/api/google-photo?ref=${encodeURIComponent(googleData.photoReference)}`
                : null,
              operatingHours: googleData?.operatingHours ?? this._formatOperatingHours(place),
              isCurrentlyOpen: googleData?.isCurrentlyOpen ?? this._isCurrentlyOpen(place, currentTime)
            },
            place.distance,
            currentTime
          );
        })
      );

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
          '/api/waiting-places',
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
        '/api/waiting-places',
        { originalError: error.message }
      );
    }
  }

  async getPlaceDetail(placeId, userLat, userLng) {  // 파라미터 추가
    // 필수 파라미터 검증
    if (!placeId) {
      throw new CustomError(
        'COM-400-001',
        '장소 ID가 필요합니다',
        `/api/waiting-places/${placeId}`
      );
    }

    try {
      const place = await this.kakaoClient.getPlaceDetail(placeId);
      
      if (!place) {
        throw new CustomError(
          'MAP-404-001',
          '대기 장소를 찾을 수 없습니다',
          `/api/waiting-places/${placeId}`,
          { placeId }
        );
      }

      const currentTime = new Date();

      const googleData = await this.googleClient.findPlaceByLocation({
        lat: place.lat,
        lng: place.lng //대표 사진, 영업 시간
      });

      // Google 응답 디버깅
      console.log('================ GOOGLE DEBUG ================');
      console.log('[GOOGLE RAW DATA]', googleData);
      console.log('[GOOGLE photoReference]', googleData?.photoReference);
      console.log('[GOOGLE operatingHours]', googleData?.operatingHours);
      console.log('[GOOGLE isCurrentlyOpen]', googleData?.isCurrentlyOpen);
      console.log('==============================================');

      

      const recommendReason = this._generateRecommendReason(place, currentTime);
      const kakaoMapUrl = this._generateKakaoMapDeepLink(place);

      // 거리 계산 추가
      let distance = 0;
      if (userLat && userLng && this._isValidCoordinate(userLat, userLng)) {
        distance = this.distanceUtil.calculate(
          userLat, 
          userLng, 
          place.lat, 
          place.lng
        );
      }

      // 디버깅 로그 추가
      console.log('[DEBUG] getPlaceDetail - isOpen24Hours:', place.isOpen24Hours);
      console.log('[DEBUG] getPlaceDetail - place name:', place.name);
      console.log('[DEBUG] getPlaceDetail - category:', place.category);

      // 성공 시 데이터만 반환 
      return {
        ...new WaitingPlaceResponseDto(
          { 
            ...place, 
            recommendReason,
            //thumbnailUrl: null,  // 카카오 API는 이미지 미제공
            thumbnailUrl: googleData?.photoReference
              ? `${appConfig.baseUrl}/api/google-photo?ref=${encodeURIComponent(googleData.photoReference)}`
              : null,
            //operatingHours: this._formatOperatingHours(place),
            operatingHours:
            googleData?.operatingHours ?? this._formatOperatingHours(place),  
            isCurrentlyOpen:
              googleData?.isCurrentlyOpen ?? this._isCurrentlyOpen(place)
            //isCurrentlyOpen: this._isCurrentlyOpen(place, currentTime) 
          },
          Math.round(distance),  // 0 → 실제 거리
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
          `/api/waiting-places/${placeId}`,
          { apiError: error.message }
        );
      }

      // 예상치 못한 에러
      throw new CustomError(
        'COM-500-001',
        '서버 내부 오류',
        `/api/waiting-places/${placeId}`,
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
        `/api/waiting-places/${placeId}/directions`,
        { required: ['placeId', 'fromLat', 'fromLng'] }
      );
    }

    // 좌표 유효성 검증
    if (!this._isValidCoordinate(fromLat, fromLng)) {
      throw new CustomError(
        'MAP-400-001',
        '잘못된 좌표값',
        `/api/waiting-places/${placeId}/directions`,
        { lat: fromLat, lng: fromLng }
      );
    }

    try {
      const place = await this.kakaoClient.getPlaceDetail(placeId);
      
      if (!place) {
        throw new CustomError(
          'MAP-404-001',
          '대기 장소를 찾을 수 없습니다',
          `/api/waiting-places/${placeId}/directions`,
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
          `/api/waiting-places/${placeId}/directions`,
          { apiError: error.message }
        );
      }

      // 예상치 못한 에러
      throw new CustomError(
        'COM-500-001',
        '서버 내부 오류',
        `/api/waiting-places/${placeId}/directions`,
        { originalError: error.message }
      );
    }
  }

  // 좌표 유효성 검증 헬퍼 메서드
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
    // 실제 영업시간 체크는 추후 구현
    // 현재는 카카오 API에서 정확한 영업시간 파싱이 어려워 일단 true 반환
    return true;
  }
  
  _formatOperatingHours(place) {
    // 24시간 영업인 경우
    if (place.isOpen24Hours) {
      return '24시간 영업';
    }
    
    // 카카오 API는 영업시간 상세 정보를 제공하지 않음
    // null 반환 (프론트에서 처리)
    return null;
  }

  /**
   * 🔧 수정: 정렬 로직
   * @param {Array} places - 정렬할 장소 목록
   * @param {string} sortOption - 정렬 옵션 ('distance' 또는 '24hour')
   * @returns {Array} 정렬된 장소 목록
   */
  _sortPlaces(places, sortOption) {
    // 원본 배열을 복사한 후 정렬 (불변성 유지)
    const sorted = [...places];
    
    switch (sortOption) {
      case '24hour':
        // 24시간 영업소 우선, 그 다음 거리순
        return sorted.sort((a, b) => {
          // 24시간 영업 여부로 먼저 정렬
          if (a.isOpen24Hours && !b.isOpen24Hours) return -1;
          if (!a.isOpen24Hours && b.isOpen24Hours) return 1;
          // 같은 24시간 상태면 거리순
          return a.distance - b.distance;
        });
        
      case 'distance':
      default:
        // 거리순 정렬 (기본값)
        return sorted.sort((a, b) => a.distance - b.distance);
    }
  }
}

export default WaitingPlaceService;