// src/controllers/waitingPlace.controller.js
import { WaitingPlaceSearchDto } from '../dtos/request/waitingPlaceSearch.dto.js';
import { DirectionsDto } from '../dtos/request/directions.dto.js';
import { successResponse, errorResponse } from '../response/apiResponse.js';

class WaitingPlaceController {
  constructor(waitingPlaceService) {
    this.service = waitingPlaceService;
  }

  /*
   - 첫 차 대기 장소 조회
   - GET /api/waiting-places
   */
  async getWaitingPlaces(req, res, next) {
    try {
      const searchDto = new WaitingPlaceSearchDto(req.query);

      const errors = searchDto.validate();
      if (errors.length > 0) {
        return res.status(400).json(
          errorResponse('INVALID_PARAMETERS', '요청 파라미터가 유효하지 않습니다.', errors)
        );
      }

      const result = await this.service.findNearbyPlaces(searchDto);

      return res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  /*
   - 대기 장소 길찾기
   - GET /api/waiting-places/:placeId/directions
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
        return res.status(400).json(
          errorResponse('INVALID_PARAMETERS', '요청 파라미터가 유효하지 않습니다.', errors)
        );
      }

      const result = await this.service.getDirections(directionsDto);

      return res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  /*
   - 대기 장소 상세 조회
   - GET /api/waiting-places/:placeId
   */
  async getPlaceDetail(req, res, next) {
    try {
      const { placeId } = req.params;

      if (!placeId) {
        return res.status(400).json(
          errorResponse('INVALID_PARAMETERS', '장소 ID가 필요합니다.')
        );
      }

      const result = await this.service.getPlaceDetail(placeId);

      return res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }
}

export default WaitingPlaceController;  