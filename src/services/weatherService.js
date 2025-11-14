import axios from 'axios';

// Weather service for handling API calls
class WeatherService {
  constructor() {
    // Use environment variable for API URL in production
    this.baseURL = process.env.REACT_APP_API_URL || '/api/weather';
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    
    // OpenWeatherMap API key for direct calls (backup)
    this.directAPIKey = '439d4b804bc8187953eb36d2a8c26a02';
  }

  // Get cache key for location
  getCacheKey(lat, lon) {
    return `${lat.toFixed(2)},${lon.toFixed(2)}`;
  }

  // Check if cache is valid
  isCacheValid(cacheEntry) {
    return Date.now() - cacheEntry.timestamp < this.cacheTimeout;
  }

  // Get weather data from cache or API
  async getWeatherData(lat, lon) {
    const cacheKey = this.getCacheKey(lat, lon);
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }

    try {
      const response = await axios.get(`${this.baseURL}/coords`, {
        params: { lat, lon }
      });

      const weatherData = this.transformWeatherData(response.data);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now()
      });

      return weatherData;
    } catch (error) {
      console.error('Weather API error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  // Get weather by coordinates
  async getWeatherByCoords(lat, lon) {
    return this.getWeatherData(lat, lon);
  }

  // Get weather by ZIP code with direct API fallback
  async getWeatherByZip(zipCode) {
    console.log('weatherService.getWeatherByZip called with:', zipCode);
    
    try {
      // Try backend first
      console.log('Trying backend API...');
      const url = `${this.baseURL}/zip`;
      const response = await axios.get(url, {
        params: { zip: zipCode }
      });

      const weatherData = this.transformWeatherData(response.data);
      
      // Cache by coordinates
      const { lat, lon } = weatherData.location;
      const cacheKey = this.getCacheKey(lat, lon);
      this.cache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now()
      });

      return weatherData;
      
    } catch (error) {
      console.warn('Backend failed, trying direct API...', error.message);
      
      // Fallback to direct OpenWeatherMap API
      try {
        return await this.getWeatherByZipDirect(zipCode);
      } catch (directError) {
        console.error('Direct API also failed:', directError);
        throw new Error('Weather service unavailable. Please try again later.');
      }
    }
  }

  // Direct OpenWeatherMap API call (fallback)
  async getWeatherByZipDirect(zipCode) {
    console.log('Using direct API for ZIP:', zipCode);
    
    try {
      // Get current weather by ZIP
      const currentResponse = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          zip: `${zipCode},US`,
          appid: this.directAPIKey,
          units: 'imperial'
        }
      });

      console.log('Direct API response:', currentResponse.data);
      
      const { coord, name, sys } = currentResponse.data;
      
      // Get forecast data
      const forecastResponse = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
        params: {
          lat: coord.lat,
          lon: coord.lon,
          appid: this.directAPIKey,
          units: 'imperial'
        }
      });

      // Transform data to our format
      const weatherData = this.transformDirectWeatherData(currentResponse.data, forecastResponse.data);
      
      console.log('Direct API weather data:', weatherData);
      return weatherData;
      
    } catch (error) {
      console.error('Direct API error:', error);
      throw error;
    }
  }

  // Transform direct API data
  transformDirectWeatherData(current, forecast) {
    const hourly = forecast.list.slice(0, 24).map(item => ({
      time: item.dt * 1000,
      temperature: item.main.temp,
      condition: item.weather[0]?.main?.toLowerCase() || 'clear',
      description: item.weather[0]?.description || 'Clear sky',
      icon: item.weather[0]?.icon || '01d',
      precipitation: item.pop ? item.pop * 100 : 0,
      windSpeed: item.wind?.speed || 0
    }));

    const dailyMap = new Map();
    forecast.list.forEach(item => {
      const date = new Date(item.dt * 1000).toDateString();
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date: item.dt * 1000,
          temperatureMin: item.main.temp,
          temperatureMax: item.main.temp,
          condition: item.weather[0]?.main?.toLowerCase() || 'clear',
          description: item.weather[0]?.description || 'Clear sky',
          icon: item.weather[0]?.icon || '01d',
          precipitation: item.pop ? item.pop * 100 : 0,
          humidity: item.main.humidity,
          windSpeed: item.wind?.speed || 0
        });
      } else {
        const day = dailyMap.get(date);
        day.temperatureMin = Math.min(day.temperatureMin, item.main.temp);
        day.temperatureMax = Math.max(day.temperatureMax, item.main.temp);
      }
    });

    return {
      location: {
        name: current.name || 'Unknown Location',
        lat: current.coord.lat,
        lon: current.coord.lon,
        country: current.sys?.country || 'US',
        timezone: current.timezone || 0
      },
      current: {
        temperature: current.main.temp,
        feelsLike: current.main.feels_like,
        humidity: current.main.humidity,
        pressure: current.main.pressure,
        windSpeed: current.wind?.speed || 0,
        windDirection: current.wind?.deg || 0,
        visibility: current.visibility ? current.visibility / 1609.34 : 10,
        uvIndex: 0,
        condition: current.weather[0]?.main?.toLowerCase() || 'clear',
        description: current.weather[0]?.description || 'Clear sky',
        icon: current.weather[0]?.icon || '01d',
        timestamp: Date.now()
      },
      hourly,
      daily: Array.from(dailyMap.values()).slice(0, 7)
    };
  }

  // Transform raw API data to standardized format
  transformWeatherData(rawData) {
    return {
      location: {
        name: rawData.location?.name || 'Unknown Location',
        lat: rawData.location?.lat || 0,
        lon: rawData.location?.lon || 0,
        country: rawData.location?.country || '',
        timezone: rawData.location?.timezone || 'UTC'
      },
      current: {
        temperature: rawData.current?.temperature || 0,
        feelsLike: rawData.current?.feelsLike || 0,
        humidity: rawData.current?.humidity || 0,
        pressure: rawData.current?.pressure || 0,
        windSpeed: rawData.current?.windSpeed || 0,
        windDirection: rawData.current?.windDirection || 0,
        visibility: rawData.current?.visibility || 0,
        uvIndex: rawData.current?.uvIndex || 0,
        condition: rawData.current?.condition || 'clear',
        description: rawData.current?.description || 'Clear sky',
        icon: rawData.current?.icon || '01d',
        timestamp: rawData.current?.timestamp || Date.now()
      },
      hourly: rawData.hourly?.map(hour => ({
        time: hour.time,
        temperature: hour.temperature,
        condition: hour.condition,
        description: hour.description,
        icon: hour.icon,
        precipitation: hour.precipitation || 0,
        windSpeed: hour.windSpeed || 0
      })) || [],
      daily: rawData.daily?.map(day => ({
        date: day.date,
        temperatureMin: day.temperatureMin,
        temperatureMax: day.temperatureMax,
        condition: day.condition,
        description: day.description,
        icon: day.icon,
        precipitation: day.precipitation || 0,
        humidity: day.humidity || 0,
        windSpeed: day.windSpeed || 0
      })) || []
    };
  }

  // Get user-friendly error message
  getErrorMessage(error) {
    if (error.response) {
      switch (error.response.status) {
        case 404:
          return 'Location not found. Please check your ZIP code.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
          return 'Weather service is temporarily unavailable.';
        default:
          return 'Unable to fetch weather data. Please try again.';
      }
    } else if (error.request) {
      return 'No internet connection. Please check your network.';
    } else {
      return 'Something went wrong. Please try again.';
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

export const weatherService = new WeatherService();