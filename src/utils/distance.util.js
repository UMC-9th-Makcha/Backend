class DistanceUtil {
  /*
   하버사인 공식으로 두 좌표 간 거리 계산 (미터)
   */
  calculate(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /*
  미터를 킬로미터로 변환
   */
  toKilometers(meters) {
    return parseFloat((meters / 1000).toFixed(1));
  }

  /*
   거리를 사용자 친화적 문자열로 변환
   */
  toReadable(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${this.toKilometers(meters)}km`;
  }
}

export { DistanceUtil };