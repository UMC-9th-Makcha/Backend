import { CustomSuccess } from '../response/customSuccess.js'; 
import { CustomError } from '../response/customError.js';   

class FacilityController {
  constructor(facilityService) {
    this.service = facilityService;
  }

  /**
   * 주변 시설 통합 검색
   * GET /facilities/search
   */
  async searchFacilities(req, res, next) {
    try {
      const { latitude, longitude, radius, keyword } = req.query;

      // 필수 파라미터 검증
      if (!latitude || !longitude) {
        throw new CustomError(
          'COM-400-001',
          '위도와 경도는 필수 파라미터입니다',
          '/facilities/search',
          { 
            missingParams: {
              latitude: !latitude ? 'required' : 'ok',
              longitude: !longitude ? 'required' : 'ok'
            }
          }
        );
      }

      // 숫자 유효성 검증
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        throw new CustomError(
          'COM-400-001',
          '위도와 경도는 유효한 숫자여야 합니다',
          '/facilities/search'
        );
      }

      // 위도/경도 범위 검증
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new CustomError(
          'COM-400-001',
          '위도와 경도 값이 유효 범위를 벗어났습니다',
          '/facilities/search',
          {
            validRange: {
              latitude: '-90 ~ 90',
              longitude: '-180 ~ 180'
            }
          }
        );
      }

      const searchParams = {
        latitude: lat,
        longitude: lng,
        radius: radius ? parseInt(radius) : 1000, // 기본값 1000m
        keyword: keyword || ''
      };

      // 실제 서비스 로직 호출
      const result = await this.service.searchFacilities(searchParams);

      const response = new CustomSuccess(
        'FAC-200-001',
        200,
        '주변 시설 검색 성공',
        result
      );

      return res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 카테고리별 시설 검색
   * GET /facilities/category/:categoryType
   */
  async searchByCategory(req, res, next) {
    try {
      const { categoryType } = req.params;
      const { latitude, longitude, radius } = req.query;

      // 필수 파라미터 검증
      if (!latitude || !longitude) {
        throw new CustomError(
          'COM-400-001',
          '위도와 경도는 필수 파라미터입니다',
          `/facilities/category/${categoryType}`,
          { 
            missingParams: {
              latitude: !latitude ? 'required' : 'ok',
              longitude: !longitude ? 'required' : 'ok'
            }
          }
        );
      }

      // 카테고리 유효성 검증
      const validCategories = ['CAFE', 'RESTAURANT', 'PARK', 'LIBRARY', 'SHOPPING_MALL', 'PC_ROOM'];
      if (!validCategories.includes(categoryType)) {
        throw new CustomError(
          'COM-404-001',
          '유효하지 않은 카테고리입니다',
          `/facilities/category/${categoryType}`,
          {
            validCategories: validCategories,
            receivedCategory: categoryType
          }
        );
      }

      // 숫자 유효성 검증
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        throw new CustomError(
          'COM-400-001',
          '위도와 경도는 유효한 숫자여야 합니다',
          `/facilities/category/${categoryType}`
        );
      }

      const searchParams = {
        categoryType,
        latitude: lat,
        longitude: lng,
        radius: radius ? parseInt(radius) : 1000
      };

      // 실제 서비스 로직 호출
      const result = await this.service.searchByCategory(searchParams);

      const response = new CustomSuccess(
        'FAC-200-002',
        200,
        `${categoryType} 카테고리 시설 검색 성공`,
        result
      );

      return res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default FacilityController;