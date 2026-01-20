export class DirectionsDto {
  constructor({ placeId, fromLat, fromLng }) {
    this.placeId = placeId;
    this.fromLat = parseFloat(fromLat);
    this.fromLng = parseFloat(fromLng);
  }

  validate() {
    const errors = [];

    if (!this.placeId || typeof this.placeId !== 'string') {
      errors.push({ 
        field: 'placeId', 
        message: '장소 ID가 필요합니다.' 
      });
    }

    if (!this.fromLat || isNaN(this.fromLat) || this.fromLat < -90 || this.fromLat > 90) {
      errors.push({ 
        field: 'fromLat', 
        message: '출발지 위도가 유효하지 않습니다.' 
      });
    }

    if (!this.fromLng || isNaN(this.fromLng) || this.fromLng < -180 || this.fromLng > 180) {
      errors.push({ 
        field: 'fromLng', 
        message: '출발지 경도가 유효하지 않습니다.' 
      });
    }

    return errors;
  }
}