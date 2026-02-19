/**
 * 택시 요금 예상 요청 DTO
 */
export class TaxiFareEstimateDto {
  constructor(data = {}) {
    this.from = {
      lat: parseFloat(data.from?.lat),
      lng: parseFloat(data.from?.lng)
    };
    this.to = {
      lat: parseFloat(data.to?.lat),
      lng: parseFloat(data.to?.lng)
    };
    this.taxiType = data.taxiType || 'REGULAR';
    this.departureTime = data.departureTime ? new Date(data.departureTime) : new Date();
  }

  /**
   * 유효성 검증
   * @returns {Array} 에러 배열
   */
  validate() {
    const errors = [];

    // 출발지 위도 검증
    if (!this.from.lat || isNaN(this.from.lat) || this.from.lat < -90 || this.from.lat > 90) {
      errors.push({
        field: 'from.lat',
        message: '출발지 위도가 유효하지 않습니다.'
      });
    }

    // 출발지 경도 검증
    if (!this.from.lng || isNaN(this.from.lng) || this.from.lng < -180 || this.from.lng > 180) {
      errors.push({
        field: 'from.lng',
        message: '출발지 경도가 유효하지 않습니다.'
      });
    }

    // 도착지 위도 검증
    if (!this.to.lat || isNaN(this.to.lat) || this.to.lat < -90 || this.to.lat > 90) {
      errors.push({
        field: 'to.lat',
        message: '도착지 위도가 유효하지 않습니다.'
      });
    }

    // 도착지 경도 검증
    if (!this.to.lng || isNaN(this.to.lng) || this.to.lng < -180 || this.to.lng > 180) {
      errors.push({
        field: 'to.lng',
        message: '도착지 경도가 유효하지 않습니다.'
      });
    }

    // 택시 타입 검증
    const validTaxiTypes = ['REGULAR', 'DELUXE'];
    if (this.taxiType && !validTaxiTypes.includes(this.taxiType)) {
      errors.push({
        field: 'taxiType',
        message: `택시 타입은 ${validTaxiTypes.join(', ')} 중 하나여야 합니다.`
      });
    }

    return errors;
  }

  /**
   * 유효한지 확인
   * @returns {boolean}
   */
  isValid() {
    return this.validate().length === 0;
  }
}