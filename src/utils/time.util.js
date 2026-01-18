class TimeUtil {
  /*
   Date 객체를 HH:mm 형식으로 변환
   */
  formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /*
    현재 시간이 특정 시간대인지 확인
   */
  isBetween(currentTime, startHour, endHour) {
    const hour = currentTime.getHours();
    
    if (startHour <= endHour) {
      return hour >= startHour && hour < endHour;
    } else {
      // 자정을 넘어가는 경우 (예: 22:00 ~ 04:00)
      return hour >= startHour || hour < endHour;
    }
  }

  /*
    분 단위를 "X시간 Y분" 형식으로 변환
   */
  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes}분`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
  }

  /*
    ISO 8601 문자열을 Date 객체로 변환
   */
  parseISO(isoString) {
    return new Date(isoString);
  }
}

export { TimeUtil };