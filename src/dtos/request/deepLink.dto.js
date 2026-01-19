export class DeepLinkDto {
  constructor({ placeId, fromLat, fromLng, toLat, toLng, placeName }) {
    this.placeId = placeId;
    this.fromLat = parseFloat(fromLat);
    this.fromLng = parseFloat(fromLng);
    this.toLat = parseFloat(toLat);
    this.toLng = parseFloat(toLng);
    this.placeName = placeName || '';
  }

  validate() {
    const errors = [];

    if (!this.placeId) {
      errors.push({ 
        field: 'placeId', 
        message: '장소 ID는 필수입니다.' 
      });
    }

    if (!this.fromLat || isNaN(this.fromLat) || this.fromLat < -90 || this.fromLat > 90) {
      errors.push({ 
        field: 'fromLat', 
        message: '출발지 위도는 -90에서 90 사이여야 합니다.' 
      });
    }

    if (!this.fromLng || isNaN(this.fromLng) || this.fromLng < -180 || this.fromLng > 180) {
      errors.push({ 
        field: 'fromLng', 
        message: '출발지 경도는 -180에서 180 사이여야 합니다.' 
      });
    }

    if (!this.toLat || isNaN(this.toLat) || this.toLat < -90 || this.toLat > 90) {
      errors.push({ 
        field: 'toLat', 
        message: '목적지 위도는 -90에서 90 사이여야 합니다.' 
      });
    }

    if (!this.toLng || isNaN(this.toLng) || this.toLng < -180 || this.toLng > 180) {
      errors.push({ 
        field: 'toLng', 
        message: '목적지 경도는 -180에서 180 사이여야 합니다.' 
      });
    }

    return errors;
  }
}