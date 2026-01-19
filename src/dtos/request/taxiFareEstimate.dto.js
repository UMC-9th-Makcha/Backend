export class TaxiFareEstimateDto {
  constructor({ from, to, departureTime }) {
    this.from = {
      lat: parseFloat(from?.lat),
      lng: parseFloat(from?.lng)
    };
    this.to = {
      lat: parseFloat(to?.lat),
      lng: parseFloat(to?.lng)
    };
    this.departureTime = departureTime ? new Date(departureTime) : new Date();
  }

  validate() {
    const errors = [];

    if (!this.from.lat || isNaN(this.from.lat) || this.from.lat < -90 || this.from.lat > 90) {
      errors.push({ field: 'from.lat', message: '출발지 위도가 유효하지 않습니다.' });
    }

    if (!this.from.lng || isNaN(this.from.lng) || this.from.lng < -180 || this.from.lng > 180) {
      errors.push({ field: 'from.lng', message: '출발지 경도가 유효하지 않습니다.' });
    }

    if (!this.to.lat || isNaN(this.to.lat) || this.to.lat < -90 || this.to.lat > 90) {
      errors.push({ field: 'to.lat', message: '도착지 위도가 유효하지 않습니다.' });
    }

    if (!this.to.lng || isNaN(this.to.lng) || this.to.lng < -180 || this.to.lng > 180) {
      errors.push({ field: 'to.lng', message: '도착지 경도가 유효하지 않습니다.' });
    }

    if (isNaN(this.departureTime.getTime())) {
      errors.push({ field: 'departureTime', message: '유효하지 않은 날짜 형식입니다.' });
    }

    return errors;
  }
}