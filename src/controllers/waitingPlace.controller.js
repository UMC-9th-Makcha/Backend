import { WaitingPlaceSearchDto } from '../dtos/request/waitingPlaceSearch.dto.js';
import { DirectionsDto } from '../dtos/request/directions.dto.js';
import { DeepLinkDto } from '../dtos/request/deepLink.dto.js';
import { CustomSuccess } from '../utils/customSuccess.js'; 
import { CustomError } from '../utils/customError.js'; 

class WaitingPlaceController {
  constructor(waitingPlaceService) {
    this.service = waitingPlaceService;
  }

  /*
   - 첫 차 대기 장소 조회
   - GET /api/v1/waiting-places
   */
  async getWaitingPlaces(req, res, next) {
    try {
      const searchDto = new WaitingPlaceSearchDto(req.query);

      const errors = searchDto.validate();
      if (errors.length > 0) {
        // CustomError 사용
        throw new CustomError(
          'COM-400-001',
          '요청 파라미터가 유효하지 않습니다',
          '/api/v1/waiting-places',
          { validationErrors: errors }
        );
      }

      const result = await this.service.findNearbyPlaces(searchDto);

      // CustomSuccess 사용
      const response = new CustomSuccess(
        'MAP-200-001',
        200,
        '대기 장소 조회 성공',
        result
      );

      return res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /*
   - 대기 장소 길찾기
   - GET /api/v1/waiting-places/:placeId/directions
   */
  async getDirections(req, res, next) {
    try {
      const directionsDto = new DirectionsDto({
        placeId: req.params.placeId,
        fromLat: req.query.fromLat,
        fromLng: req.query.fromLng
      });

      const errors = directionsDto.validate();
      if (errors.length > 0) {
        // CustomError 사용
        throw new CustomError(
          'COM-400-001',
          '요청 파라미터가 유효하지 않습니다',
          `/api/v1/waiting-places/${req.params.placeId}/directions`,
          { validationErrors: errors }
        );
      }

      const result = await this.service.getDirections(directionsDto);

      // CustomSuccess 사용
      const response = new CustomSuccess(
        'MAP-200-003',
        200,
        '길찾기 정보 조회 성공',
        result
      );

      return res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /*
   - 대기 장소 상세 조회
   - GET /api/v1/waiting-places/:placeId
   */
  async getPlaceDetail(req, res, next) {
    try {
      const { placeId } = req.params;

      if (!placeId) {
        // CustomError 사용
        throw new CustomError(
          'COM-400-001',
          '장소 ID가 필요합니다',
          `/api/v1/waiting-places/${placeId}`
        );
      }

      const result = await this.service.getPlaceDetail(placeId);

      // CustomSuccess 사용
      const response = new CustomSuccess(
        'MAP-200-002',
        200,
        '장소 상세 조회 성공',
        result
      );

      return res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /*
   - 카카오맵 딥링크 생성
   - GET /api/v1/waiting-places/:placeId/deeplink
   */
  async getDeepLink(req, res, next) {
    try {
      const deepLinkDto = new DeepLinkDto({
        placeId: req.params.placeId,
        fromLat: req.query.fromLat,
        fromLng: req.query.fromLng,
        toLat: req.query.toLat,
        toLng: req.query.toLng,
        placeName: req.query.placeName
      });

      const errors = deepLinkDto.validate();
      if (errors.length > 0) {
        // CustomError 사용
        throw new CustomError(
          'COM-400-001',
          '요청 파라미터가 유효하지 않습니다',
          `/api/v1/waiting-places/${req.params.placeId}/deeplink`,
          { validationErrors: errors }
        );
      }

      const result = await this.service.getDeepLink(deepLinkDto);

      // CustomSuccess 사용
      const response = new CustomSuccess(
        'MAP-200-004',
        200,
        '카카오맵 딥링크 생성 성공',
        result
      );

      return res.status(response.statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default WaitingPlaceController;