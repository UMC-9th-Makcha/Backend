// src/clients/googleClient.js
// 카카오 맵에서는 주지 못하는 가게 대표 사진, 영업시간 정보를 전달합니다.
// 단 구글의 경우 프랜차이즈는 대부분 등록이 되어있지만, 일반 가게는 비어있을 가능성이 큽니다.
import axios from 'axios';

class GooglePlacesClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://places.googleapis.com/v1/places';
    this.axiosInstance = axios.create({
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey
      }
    });
  }

  /**
   * 좌표 기반 주변 장소 검색
   */
  async findPlaceByLocation({ lat, lng, radius = 50 }) {
    try {
      const response = await this.axiosInstance.post(
        `${this.baseURL}:searchNearby`,
        {
          locationRestriction: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius
            }
          },
          maxResultCount: 5,
          languageCode: 'ko'
        },
        {
          headers: {
            'X-Goog-FieldMask':
              'places.id,places.displayName,places.photos,places.currentOpeningHours,places.regularOpeningHours'
          }
        }
      );

      const place = response.data.places?.[0];
      if (!place) return null;

      return this._extractPhotoAndHours(place);

    } catch (error) {
      console.warn('[GoogleClient] API Error:', error.message);
      return null;
    }
  }

  /**
   * 사진 참조값 + 영업시간만 추출
   */
  _extractPhotoAndHours(place) {
    let photoReference = null;

    if (place.photos?.length > 0) {
      photoReference = place.photos[0].name; 
      // ex: places/ChIJxxx/photos/ABC123
    }

    let operatingHours = null;
    let isCurrentlyOpen = null;

    if (place.currentOpeningHours) {
      isCurrentlyOpen = place.currentOpeningHours.openNow ?? null;

      if (place.currentOpeningHours.weekdayDescriptions) {
        operatingHours =
          place.currentOpeningHours.weekdayDescriptions.join('\n');
      }
    } else if (place.regularOpeningHours) {
      if (place.regularOpeningHours.weekdayDescriptions) {
        operatingHours =
          place.regularOpeningHours.weekdayDescriptions.join('\n');
      }
    }

    return {
      photoReference,   // 여기서 URL 안 만듦
      operatingHours,
      isCurrentlyOpen
    };
  }
}

export default GooglePlacesClient;