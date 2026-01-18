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