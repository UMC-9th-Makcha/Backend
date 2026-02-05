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

    // 수정: lat === undefined || lat === null 체크로 변경
    if (this.lat === undefined || this.lat === null || isNaN(this.lat) || this.lat < -90 || this.lat > 90) {
      errors.push({ 
        field: 'lat', 
        message: '위도는 -90에서 90 사이여야 합니다.' 
      });
    }

    // 수정: lng === undefined || lng === null 체크로 변경
    if (this.lng === undefined || this.lng === null || isNaN(this.lng) || this.lng < -180 || this.lng > 180) {
      errors.push({ 
        field: 'lng', 
        message: '경도는 -180에서 180 사이여야 합니다.' 
      });
    }

    // ⭐ RESTAURANT 추가
    if (this.category && !['CAFE', 'PC_ROOM', 'SAUNA', 'RESTAURANT'].includes(this.category)) {
      errors.push({ 
        field: 'category', 
        message: '유효하지 않은 카테고리입니다. (CAFE, PC_ROOM, SAUNA, RESTAURANT)' 
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