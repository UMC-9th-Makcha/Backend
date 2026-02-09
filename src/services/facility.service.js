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

      const currentTime = new Date();

      // 거리 계산 및 필드 추가
      const facilitiesWithDistance = facilities.map(facility => ({
        ...facility,
        distance: this.distanceUtil.calculate(
          latitude,
          longitude,
          facility.lat,
          facility.lng
        ),
        thumbnailUrl: null,  // 카카오 API는 이미지 미제공
        operatingHours: this._formatOperatingHours(facility), 
        isCurrentlyOpen: this._isCurrentlyOpen(facility, currentTime)  
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
      const currentTime = new Date();

      // 거리 계산 및 필드 추가
      const facilitiesWithDistance = facilities.map(facility => ({
        ...facility,
        distance: this.distanceUtil.calculate(
          latitude,
          longitude,
          facility.lat,
          facility.lng
        ),
        thumbnailUrl: null,  // 카카오 API는 이미지 미제공
        operatingHours: this._formatOperatingHours(facility),  
        isCurrentlyOpen: this._isCurrentlyOpen(facility, currentTime)  
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

  /*
   운영시간 포맷팅 헬퍼 메서드
   */
  _formatOperatingHours(facility) {
    // 24시간 영업인 경우
    if (facility.isOpen24Hours) {
      return '24시간 영업';
    }
    
    // 카카오 API는 영업시간 상세 정보를 제공하지 않음
    // null 반환 (프론트에서 처리)
    return null;
  }

  /**
   현재 영업 중인지 확인하는 헬퍼 메서드
   */
  _isCurrentlyOpen(facility, currentTime) {
    // 24시간 영업이면 항상 true
    if (facility.isOpen24Hours) {
      return true;
    }
    
    // 실제 영업시간 체크는 추후 구현
    // 현재는 카카오 API에서 정확한 영업시간 파싱이 어려워 일단 true 반환
    return true;
  }
}

export default FacilityService;