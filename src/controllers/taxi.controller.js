import { TaxiFareEstimateDto } from '../dtos/request/taxiFareEstimate.dto.js';

class TaxiController {
  constructor(taxiService) {
    this.service = taxiService;
  }

  async estimateFare(req, res, next) {
    try {
      const fareDto = new TaxiFareEstimateDto(req.body);

      const errors = fareDto.validate();
      if (errors.length > 0) {
        return res.status(400).json({
          code: 'COM-400-001',
          statusCode: 400,
          message: '요청 파라미터가 유효하지 않습니다.',
          errors
        });
      }

      const result = await this.service.estimateFare(fareDto);

      return res.status(200).json({
        code: 'TAXI-200-001',
        statusCode: 200,
        message: '택시 요금 계산 성공',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export default TaxiController;