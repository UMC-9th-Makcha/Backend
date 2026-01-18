export class TaxiFareResponseDto {
  constructor({ estimatedFare, route, isNightTime, surchargeRate, source, warning }) {
    this.estimatedFare = {
      base: estimatedFare.base,
      distance: estimatedFare.distance,
      time: estimatedFare.time,
      nightSurcharge: estimatedFare.nightSurcharge,
      total: estimatedFare.total
    };
    this.route = {
      distance: route.distance,
      duration: route.duration
    };
    this.isNightTime = isNightTime;
    this.surchargeRate = surchargeRate;
    this.source = source; // 'kakao' | 'calculated' | 'estimated'
    
    if (warning) {
      this.warning = warning;
    }
  }
}