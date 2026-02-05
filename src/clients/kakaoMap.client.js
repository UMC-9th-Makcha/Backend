import axios from 'axios';
import { kakaoConfig } from '../config/kakao.config.js';

class KakaoMapClient {
  constructor() {
    this.config = kakaoConfig;
    this.placeCache = new Map();  // ⭐ 캐시 추가
    this.axiosInstance = axios.create({
      timeout: this.config.timeout,
      headers: {
        'Authorization': `KakaoAK ${this.config.restApiKey}`
      }
    });
  }

  async getPlaceDetail(placeId) {
    try {
      // ⭐ 캐시에서 먼저 확인
      if (this.placeCache.has(placeId)) {
        console.log(`[KakaoMapClient] Cache hit for place ${placeId}`);
        return this.placeCache.get(placeId);
      }
      
      // 캐시에 없으면 null 반환
      console.warn(`[KakaoMapClient] Place ${placeId} not found in cache`);
      return null;
    } catch (error) {
      throw this._handleError(error, 'PLACE_DETAIL_FAILED');
    }
  }

  async searchPlacesByCategory({ lat, lng, radius, category, page = 1 }) {
    try {
      const categoryCode = this.config.categoryCode[category];
      
      // PC방은 키워드 검색 사용
      if (!categoryCode && this.config.keywordCategories[category]) {
        const keyword = this.config.keywordCategories[category];
        return await this.searchPlacesByKeyword({ 
          lat, 
          lng, 
          radius, 
          keyword,
          category  // 카테고리 정보 전달
        });
      }
      
      // 일반 카테고리 검색
      const response = await this.axiosInstance.get(
        `${this.config.baseURL.local}/search/category.json`,
        {
          params: {
            category_group_code: categoryCode,
            x: lng,
            y: lat,
            radius,
            sort: 'distance',
            page,
            size: 15
          }
        }
      );

      return this._normalizeSearchResults(response.data, category);
    } catch (error) {
      throw this._handleError(error, 'SEARCH_FAILED');
    }
  }

  async searchPlacesByKeyword({ lat, lng, radius, keyword, category = null }) {
    try {
      const response = await this.axiosInstance.get(
        `${this.config.baseURL.local}/search/keyword.json`,
        {
          params: {
            query: keyword,
            x: lng,
            y: lat,
            radius,
            sort: 'distance',
            size: 15
          }
        }
      );

      // category가 전달되면 normalizeSearchResults 사용
      if (category) {
        return this._normalizeSearchResults(response.data, category);
      }
      
      return this._normalizeKeywordResults(response.data);
    } catch (error) {
      throw this._handleError(error, 'SEARCH_FAILED');
    }
  }

  async getWalkingDirections({ origin, destination }) {
    try {
      const response = await this.axiosInstance.get(
        this.config.baseURL.directions,
        {
          params: {
            origin: `${origin.lng},${origin.lat}`,
            destination: `${destination.lng},${destination.lat}`,
            priority: 'RECOMMEND'
          }
        }
      );

      return this._normalizeDirections(response.data);
    } catch (error) {
      throw this._handleError(error, 'DIRECTIONS_FAILED');
    }
  }

  async getCarDirections({ origin, destination }) {
    try {
      const response = await this.axiosInstance.get(
        this.config.baseURL.directions,
        {
          params: {
            origin: `${origin.lng},${origin.lat}`,
            destination: `${destination.lng},${destination.lat}`,
            priority: 'RECOMMEND'
          }
        }
      );

      const route = response.data.routes[0];
      return {
        distance: route.summary.distance,
        duration: route.summary.duration,
        taxiFare: route.summary.fare?.taxi || null
      };
    } catch (error) {
      throw this._handleError(error, 'DIRECTIONS_FAILED');
    }
  }

  async getAddressFromCoords({ lat, lng }) {
    try {
      const response = await this.axiosInstance.get(
        `${this.config.baseURL.local}/geo/coord2address.json`,
        {
          params: { x: lng, y: lat }
        }
      );

      const document = response.data.documents[0];
      if (!document) return null;

      return {
        address: document.address?.address_name || null,
        roadAddress: document.road_address?.address_name || null,
        buildingName: document.road_address?.building_name || null
      };
    } catch (error) {
      console.warn('[KakaoClient] Address conversion failed', error);
      return null;
    }
  }

  _normalizeSearchResults(data, category) {
    const places = data.documents
      .filter(place => {
        // PC_ROOM 카테고리일 때만 추가 필터링
        if (category === 'PC_ROOM') {
          const categoryName = place.category_name || '';
          
          // 카테고리 경로에 'PC방'이 정확히 포함되어 있는지 확인
          // 예: "문화시설 > PC방" 형태
          return categoryName.includes('PC방');
        }
        
        // 다른 카테고리는 필터링 없이 전부 반환
        return true;
      })
      .map(place => {
        const normalized = {
          id: place.id,
          name: place.place_name,
          category: category,
          lat: parseFloat(place.y),
          lng: parseFloat(place.x),
          address: place.address_name,
          roadAddress: place.road_address_name,
          phoneNumber: place.phone || null,
          placeUrl: place.place_url,
          distance: parseInt(place.distance),
          isOpen24Hours: this._detect24Hours(place.place_name),
          source: 'kakao'
        };
        
        // ⭐ 캐시에 저장
        this.placeCache.set(place.id, normalized);
        
        return normalized;
      });

    return {
      places,
      meta: {
        totalCount: data.meta.total_count,
        isEnd: data.meta.is_end
      }
    };
  }

  _normalizeKeywordResults(data) {
    const places = data.documents.map(place => {
      const normalized = {
        id: place.id,
        name: place.place_name,
        lat: parseFloat(place.y),
        lng: parseFloat(place.x),
        address: place.address_name,
        roadAddress: place.road_address_name,
        phoneNumber: place.phone || null,
        placeUrl: place.place_url,
        distance: parseInt(place.distance),
        isOpen24Hours: this._detect24Hours(place.place_name),
        source: 'kakao'
      };
      
      // ⭐ 캐시에 저장
      this.placeCache.set(place.id, normalized);
      
      return normalized;
    });

    return {
      places,
      meta: {
        totalCount: data.meta.total_count,
        isEnd: data.meta.is_end
      }
    };
  }

  _normalizeDirections(data) {
    const route = data.routes[0];
    const summary = route.summary;
    
    return {
      distance: summary.distance,
      duration: summary.duration,
      sections: route.sections.map(section => ({
        distance: section.distance,
        duration: section.duration,
        roads: section.roads?.map(road => ({
          name: road.name,
          distance: road.distance,
          duration: road.duration
        })) || []
      }))
    };
  }

  _detect24Hours(placeName) {
    const name = placeName.toLowerCase();
    return name.includes('24') || 
           name.includes('24시간') || 
           name.includes('24hour');
  }

  _handleError(error, defaultCode) {
    if (error.response) {
      const status = error.response.status;
      
      if (status === 400) {
        const err = new Error('카카오 API 요청이 잘못되었습니다.');
        err.code = 'KAKAO_INVALID_REQUEST';
        err.statusCode = 400;
        throw err;
      }
      
      if (status === 401) {
        const err = new Error('카카오 API 인증에 실패했습니다.');
        err.code = 'KAKAO_UNAUTHORIZED';
        err.statusCode = 401;
        throw err;
      }
      
      if (status === 429) {
        const err = new Error('API 호출 한도를 초과했습니다.');
        err.code = 'KAKAO_RATE_LIMIT';
        err.statusCode = 429;
        throw err;
      }
      
      if (status >= 500) {
        const err = new Error('카카오 API 서버 오류입니다.');
        err.code = 'KAKAO_SERVER_ERROR';
        err.statusCode = 503;
        throw err;
      }
    }

    const err = new Error('카카오 API 연결에 실패했습니다.');
    err.code = defaultCode;
    err.statusCode = 503;
    throw err;
  }
}

export default KakaoMapClient;