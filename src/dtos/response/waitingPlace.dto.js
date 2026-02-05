export class WaitingPlaceResponseDto {
  constructor(place, distance, currentTime) {
    this.id = place.id;
    this.name = place.name;
    this.category = place.category;
    this.location = {
      lat: place.lat,
      lng: place.lng
    };
    this.distance = Math.round(distance);
    this.isOpen24Hours = place.isOpen24Hours;
    this.closingTime = place.closingTime;
    this.phoneNumber = place.phoneNumber;
    this.address = place.address || null;
    this.isCurrentlyOpen = this._checkOpen(place, currentTime);
    this.recommendReason = place.recommendReason || '';
    this.source = place.source || 'db';
    
    // ⭐ 썸네일과 운영시간 추가
    this.thumbnailUrl = place.thumbnailUrl || place.placeUrl || null;
    this.operatingHours = place.operatingHours || this._getDefaultOperatingHours(place.category, place.isOpen24Hours);
  }

  _checkOpen(place, currentTime) {
    if (place.isOpen24Hours) return true;
    if (!place.closingTime) return true;
    
    const now = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
    const closing = place.closingTime;
    
    // 심야 영업 (새벽 마감)
    if (closing < "06:00") {
      return now >= "00:00" && now < closing || now >= "18:00";
    }
    
    return now < closing;
  }
  
  // ⭐ 기본 운영시간 생성 메서드 추가
  _getDefaultOperatingHours(category, isOpen24Hours) {
    if (isOpen24Hours) {
      return '24시간 영업';
    }
    
    const defaultHours = {
      'CAFE': '평일 08:00-22:00',
      'PC_ROOM': '24시간 영업',
      'SAUNA': '06:00-22:00',
      'RESTAURANT': '평일 11:00-21:00'
    };
    
    return defaultHours[category] || '영업시간 정보 없음';
  }
}