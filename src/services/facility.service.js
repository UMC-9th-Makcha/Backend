import { CustomError } from '../response/customError.js';
import { appConfig } from '../config/app.config.js';

class FacilityService {
  constructor(kakaoClient, distanceUtil) {
    this.kakaoClient = kakaoClient;
    this.distanceUtil = distanceUtil;
  }

  /**
   * 주변 시설 통합 검색
   */
  async searchFacilities(searchParams) {
    const { latitude, longitude, radius, keyword } = searchParams;

    try {
      let facilities = [];

      if (keyword) {
        // 키워드로 검색
        const result = await this.kakaoClient.searchPlacesByKeyword({
          lat: latitude,
          lng: longitude,
          radius: radius || appConfig.search.defaultRadius,
          keyword
        });
        facilities = result.places;
      } else {
        // 전체 카테고리 검색
        const categories = ['CAFE', 'RESTAURANT', 'PARK', 'LIBRARY', 'SHOPPING_MALL', 'PC_ROOM'];
        const promises = categories.map(category =>
          this.kakaoClient.searchPlacesByCategory({
            lat: latitude,
            lng: longitude,
            radius: radius || appConfig.search.defaultRadius,
            category
          }).catch(err => {
            console.warn(`[Kakao] ${category} search failed:`, err.message);
            return { places: [] };
          })
        );

        const results = await Promise.all(promises);
        facilities = results.flatMap(r => r.places);
      }

      // 거리 계산 및 정렬
      // 수정: thumbnailUrl과 operatingHours 추가
      const facilitiesWithDistance = facilities.map(facility => ({
        ...facility,
        distance: this.distanceUtil.calculate(
          latitude,
          longitude,
          facility.lat,
          facility.lng
        ),
        thumbnailUrl: facility.placeUrl || null, 
        operatingHours: this._formatOperatingHours(facility)  
      }));

      const sortedFacilities = facilitiesWithDistance.sort((a, b) => a.distance - b.distance);

      // 시설이 없는 경우 - 에러 대신 빈 배열 반환
      if (sortedFacilities.length === 0) {
        return {
          facilities: [],
          totalCount: 0,
          searchParams: {
            latitude,
            longitude,
            radius: radius || appConfig.search.defaultRadius,
            keyword: keyword || null
          }
        };
      }

      return {
        facilities: sortedFacilities,
        totalCount: sortedFacilities.length,
        searchParams: {
          latitude,
          longitude,
          radius: radius || appConfig.search.defaultRadius,
          keyword: keyword || null
        }
      };

    } catch (error) {
      console.error('[FacilityService] searchFacilities error:', error);

      // CustomError는 그대로 throw
      if (error instanceof CustomError) {
        throw error;
      }

      // 카카오 API 에러
      if (error.response) {
        throw new CustomError(
          'FAC-500-001',
          '카카오 API 오류',
          '/facilities/search',
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
        '/facilities/search',
        { originalError: error.message }
      );
    }
  }

  /**
   * 카테고리별 시설 검색
   */
  async searchByCategory(searchParams) {
    const { categoryType, latitude, longitude, radius } = searchParams;

    try {
      const result = await this.kakaoClient.searchPlacesByCategory({
        lat: latitude,
        lng: longitude,
        radius: radius || appConfig.search.defaultRadius,
        category: categoryType
      });

      const facilities = result.places;

      // 거리 계산 및 정렬
      // 수정: thumbnailUrl과 operatingHours 추가
      const facilitiesWithDistance = facilities.map(facility => ({
        ...facility,
        distance: this.distanceUtil.calculate(
          latitude,
          longitude,
          facility.lat,
          facility.lng
        ),
        thumbnailUrl: facility.placeUrl || null,  
        operatingHours: this._formatOperatingHours(facility) 
      }));

      const sortedFacilities = facilitiesWithDistance.sort((a, b) => a.distance - b.distance);

      // 시설이 없는 경우 - 에러 대신 빈 배열 반환 
      if (sortedFacilities.length === 0) {
        return {
          category: categoryType,
          facilities: [],
          totalCount: 0,
          searchParams: {
            latitude,
            longitude,
            radius: radius || appConfig.search.defaultRadius
          }
        };
      }

      return {
        category: categoryType,
        facilities: sortedFacilities,
        totalCount: sortedFacilities.length,
        searchParams: {
          latitude,
          longitude,
          radius: radius || appConfig.search.defaultRadius
        }
      };

    } catch (error) {
      console.error('[FacilityService] searchByCategory error:', error);

      // CustomError는 그대로 throw
      if (error instanceof CustomError) {
        throw error;
      }

      // 카카오 API 에러
      if (error.response) {
        throw new CustomError(
          'FAC-500-001',
          '카카오 API 오류',
          `/facilities/category/${categoryType}`,
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
        `/facilities/category/${categoryType}`,
        { originalError: error.message }
      );
    }
  }

  /**
   * 운영시간 포맷팅 헬퍼 메서드
   * 🆕 새로 추가된 메서드
   */
  _formatOperatingHours(facility) {
    // 24시간 영업소인 경우
    if (facility.isOpen24Hours) {
      return '24시간 영업';
    }
    
    // 카테고리별 일반적인 영업시간 (추정치)
    const defaultHours = {
      'CAFE': '평일 08:00-22:00',
      'PC_ROOM': '24시간 영업',
      'SAUNA': '06:00-22:00',
      'RESTAURANT': '평일 11:00-22:00',
      'PARK': '상시 개방',
      'LIBRARY': '평일 09:00-18:00',
      'SHOPPING_MALL': '평일 10:00-22:00'
    };
    
    return defaultHours[facility.category] || '영업시간 정보 없음';
  }
}

export default FacilityService;