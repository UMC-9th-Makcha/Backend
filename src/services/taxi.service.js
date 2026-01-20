import { TaxiFareResponseDto } from '../dtos/response/taxiFare.dto.js';
import { appConfig } from '../config/app.config.js';

class TaxiService {
  constructor(kakaoClient, distanceUtil) {
    this.kakaoClient = kakaoClient;
    this.distanceUtil = distanceUtil;
    this.fareConfig = appConfig.taxiFare;
  }

  async estimateFare(fareDto) {
    const { from, to, departureTime } = fareDto;
    const isNightTime = this._isNightTime(departureTime);

    try {
      const route = await this.kakaoClient.getCarDirections({
        origin: from,
        destination: to
      });

      const distanceInKm = route.distance / 1000;
      const durationInMin = Math.ceil(route.duration / 60);

      if (route.taxiFare && route.taxiFare > 0) {
        const baseFare = route.taxiFare;
        const nightSurcharge = isNightTime 
          ? Math.round(baseFare * this.fareConfig.nightSurchargeRate) 
          : 0;
        
        return new TaxiFareResponseDto({
          estimatedFare: {
            base: baseFare,
            distance: 0,
            time: 0,
            nightSurcharge,
            total: Math.round((baseFare + nightSurcharge) / 100) * 100
          },
          route: {
            distance: parseFloat(distanceInKm.toFixed(1)),
            duration: durationInMin
          },
          isNightTime,
          surchargeRate: isNightTime ? this.fareConfig.nightSurchargeRate : 0,
          source: 'kakao'
        });
      }

      const fareBreakdown = this._calculateFare({
        distance: route.distance,
        duration: route.duration,
        isNightTime
      });

      return new TaxiFareResponseDto({
        estimatedFare: fareBreakdown,
        route: {
          distance: parseFloat(distanceInKm.toFixed(1)),
          duration: durationInMin
        },
        isNightTime,
        surchargeRate: isNightTime ? this.fareConfig.nightSurchargeRate : 0,
        source: 'calculated'
      });

    } catch (error) {
      console.error('[TaxiService] Route calculation failed:', error.message);
      
      const straightDistance = this.distanceUtil.calculate(
        from.lat, from.lng, to.lat, to.lng
      );
      
      const estimatedDuration = Math.ceil((straightDistance / 1000) * 180);
      const fareBreakdown = this._calculateFare({
        distance: straightDistance * 1.3,
        duration: estimatedDuration,
        isNightTime
      });

      return new TaxiFareResponseDto({
        estimatedFare: fareBreakdown,
        route: {
          distance: parseFloat((straightDistance / 1000).toFixed(1)),
          duration: Math.ceil(estimatedDuration / 60)
        },
        isNightTime,
        surchargeRate: isNightTime ? this.fareConfig.nightSurchargeRate : 0,
        source: 'estimated',
        warning: '정확한 경로를 계산할 수 없어 예상 요금입니다.'
      });
    }
  }

  _calculateFare({ distance, duration, isNightTime }) {
    const config = this.fareConfig;
    
    let base = config.baseFare;
    let distanceFare = 0;
    let timeFare = 0;

    if (distance > config.baseDistance) {
      const extraDistance = distance - config.baseDistance;
      const units = Math.floor(extraDistance / config.distanceUnit);
      distanceFare = units * config.distanceRate;
    }

    const timeUnits = Math.floor(duration / config.timeUnit);
    timeFare = timeUnits * config.timeRate;

    const subtotal = base + Math.max(distanceFare, timeFare);
    const nightSurcharge = isNightTime 
      ? Math.round(subtotal * config.nightSurchargeRate) 
      : 0;

    return {
      base,
      distance: distanceFare,
      time: timeFare,
      nightSurcharge,
      total: Math.round((subtotal + nightSurcharge) / 100) * 100
    };
  }

  _isNightTime(dateTime) {
    const hour = dateTime.getHours();
    return hour >= this.fareConfig.nightStartHour && 
           hour < this.fareConfig.nightEndHour;
  }
}

export default TaxiService;