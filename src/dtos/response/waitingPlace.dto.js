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
    this.isCurrentlyOpen = place.isCurrentlyOpen !== undefined 
      ? place.isCurrentlyOpen 
      : this._checkOpen(place, currentTime);  // Service에서 전달받은 값 우선
    this.recommendReason = place.recommendReason || '';
    this.source = place.source || 'db';
    
    // Service에서 전달된 값을 그대로 사용 (기본값 제거)
    this.thumbnailUrl = place.thumbnailUrl || null;  // placeUrl 폴백 제거
    this.operatingHours = place.operatingHours || null;  // 기본값 제거
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
}