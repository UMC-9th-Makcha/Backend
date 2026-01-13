import { WaitingPlaceResponseDto } from '../dtos/response/waitingPlace.dto.js';
import { appConfig } from '../config/app.config.js';

class WaitingPlaceService {
  constructor(kakaoClient, distanceUtil, timeUtil) {
    this.kakaoClient = kakaoClient;
    this.distanceUtil = distanceUtil;
    this.timeUtil = timeUtil;
  }

  async findNearbyPlaces(searchDto) {
    const currentTime = new Date();
    const { lat, lng, category, openOnly, limit } = searchDto;

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

      const enrichedPlaces = sortedPlaces.map(place => {
        const recommendReason = this._generateRecommendReason(place, currentTime);
        
        return new WaitingPlaceResponseDto(
          { ...place, recommendReason },
          place.distance,
          currentTime
        );
      });

      return {
        places: enrichedPlaces,
        totalCount: enrichedPlaces.length
      };

    } catch (error) {
      console.error('[WaitingPlaceService] findNearbyPlaces error:', error);
      throw error;
    }
  }

  async getPlaceDetail(placeId) {
    try {
      const place = await this.kakaoClient.getPlaceDetail(placeId);
      
      if (!place) {
        const error = new Error('대기 장소를 찾을 수 없습니다.');
        error.code = 'PLACE_NOT_FOUND';
        error.statusCode = 404;
        throw error;
      }

      const currentTime = new Date();
      const recommendReason = this._generateRecommendReason(place, currentTime);
      const kakaoMapUrl = this._generateKakaoMapDeepLink(place);

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
      throw error;
    }
  }

  async getDirections(directionsDto) {
    const { placeId, fromLat, fromLng } = directionsDto;

    try {
      const place = await this.kakaoClient.getPlaceDetail(placeId);
      
      if (!place) {
        const error = new Error('대기 장소를 찾을 수 없습니다.');
        error.code = 'PLACE_NOT_FOUND';
        error.statusCode = 404;
        throw error;
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
      throw error;
    }
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