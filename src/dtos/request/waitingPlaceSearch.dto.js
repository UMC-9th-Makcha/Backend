export class WaitingPlaceSearchDto {
  constructor({ lat, lng, category, openOnly = true, limit = 10 }) {
    this.lat = parseFloat(lat);
    this.lng = parseFloat(lng);
    this.category = category || null;
    this.openOnly = openOnly === true || openOnly === 'true';
    this.limit = parseInt(limit);
  }

  validate() {
    const errors = [];

    if (!this.lat || isNaN(this.lat) || this.lat < -90 || this.lat > 90) {
      errors.push({ 
        field: 'lat', 
        message: '위도는 -90에서 90 사이여야 합니다.' 
      });
    }

    if (!this.lng || isNaN(this.lng) || this.lng < -180 || this.lng > 180) {
      errors.push({ 
        field: 'lng', 
        message: '경도는 -180에서 180 사이여야 합니다.' 
      });
    }

    if (this.category && !['CAFE', 'PC_ROOM', 'SAUNA'].includes(this.category)) {
      errors.push({ 
        field: 'category', 
        message: '유효하지 않은 카테고리입니다. (CAFE, PC_ROOM, SAUNA)' 
      });
    }

    if (isNaN(this.limit) || this.limit < 1 || this.limit > 50) {
      errors.push({ 
        field: 'limit', 
        message: 'limit은 1에서 50 사이여야 합니다.' 
      });
    }

    return errors;
  }
}