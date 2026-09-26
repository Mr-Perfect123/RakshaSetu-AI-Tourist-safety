/**
 * Worldwide Real-Time Weather Service
 * 
 * Powered by Open-Meteo API (Worldwide real-time coordinate-based weather & geocoding).
 * Features in-memory caching, request deduplication, transparent rule-based weather warning detection,
 * and normalized weather payloads with timezone support.
 */

const axios = require('axios');

// In-Memory Weather Cache (10-minute TTL)
const weatherCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

// Request deduplication in-flight promises
const inFlightRequests = new Map();

// WMO Weather Interpretation Codes (WMO Code -> Description & Icon)
const WMO_CODE_MAP = {
  0: { condition: 'Clear Sky', icon: '☀️', code: 'CLEAR' },
  1: { condition: 'Mainly Clear', icon: '🌤️', code: 'MAINLY_CLEAR' },
  2: { condition: 'Partly Cloudy', icon: '⛅', code: 'PARTLY_CLOUDY' },
  3: { condition: 'Overcast', icon: '☁️', code: 'OVERCAST' },
  45: { condition: 'Fog', icon: '🌫️', code: 'FOG' },
  48: { condition: 'Depositing Rime Fog', icon: '🌫️', code: 'FOG' },
  51: { condition: 'Light Drizzle', icon: '🌦️', code: 'LIGHT_DRIZZLE' },
  53: { condition: 'Moderate Drizzle', icon: '🌧️', code: 'DRIZZLE' },
  55: { condition: 'Dense Drizzle', icon: '🌧️', code: 'HEAVY_DRIZZLE' },
  56: { condition: 'Light Freezing Drizzle', icon: '🌨️', code: 'FREEZING_DRIZZLE' },
  57: { condition: 'Dense Freezing Drizzle', icon: '🌨️', code: 'FREEZING_DRIZZLE' },
  61: { condition: 'Slight Rain', icon: '🌦️', code: 'LIGHT_RAIN' },
  62: { condition: 'Rain', icon: '🌧️', code: 'RAIN' },
  63: { condition: 'Moderate Rain', icon: '🌧️', code: 'MODERATE_RAIN' },
  65: { condition: 'Heavy Rain', icon: '🌧️', code: 'HEAVY_RAIN' },
  66: { condition: 'Light Freezing Rain', icon: '🌨️', code: 'FREEZING_RAIN' },
  67: { condition: 'Heavy Freezing Rain', icon: '🌨️', code: 'FREEZING_RAIN' },
  71: { condition: 'Slight Snow Fall', icon: '🌨️', code: 'LIGHT_SNOW' },
  73: { condition: 'Moderate Snow Fall', icon: '❄️', code: 'SNOW' },
  75: { condition: 'Heavy Snow Fall', icon: '❄️', code: 'HEAVY_SNOW' },
  77: { condition: 'Snow Grains', icon: '❄️', code: 'SNOW' },
  80: { condition: 'Slight Rain Showers', icon: '🌦️', code: 'LIGHT_SHOWERS' },
  81: { condition: 'Moderate Rain Showers', icon: '🌧️', code: 'SHOWERS' },
  82: { condition: 'Violent Rain Showers', icon: '⛈️', code: 'VIOLENT_SHOWERS' },
  85: { condition: 'Slight Snow Showers', icon: '🌨️', code: 'SNOW_SHOWERS' },
  86: { condition: 'Heavy Snow Showers', icon: '❄️', code: 'SNOW_SHOWERS' },
  95: { condition: 'Thunderstorm', icon: '⛈️', code: 'THUNDERSTORM' },
  96: { condition: 'Thunderstorm with Slight Hail', icon: '⛈️', code: 'THUNDERSTORM_HAIL' },
  99: { condition: 'Thunderstorm with Heavy Hail', icon: '⛈️', code: 'THUNDERSTORM_HEAVY_HAIL' }
};

class WeatherService {
  /**
   * Validate Numeric Coordinates
   */
  static isValidCoord(lat, lng) {
    const pLat = parseFloat(lat);
    const pLng = parseFloat(lng);
    return (
      !isNaN(pLat) &&
      !isNaN(pLng) &&
      pLat >= -90 && pLat <= 90 &&
      pLng >= -180 && pLng <= 180
    );
  }

  /**
   * Evaluate Rule-Based Weather Risk Warnings (Transparent rule-based thresholds)
   * Note: Clearly labeled as "Weather-based warning" and does NOT replace official emergency alerts.
   */
  static evaluateWeatherWarnings(weatherData) {
    const warnings = [];
    const temp = weatherData.temperature;
    const wind = weatherData.windSpeed;
    const precip = weatherData.precipitation;
    const wmo = weatherData.weatherCode;
    const pop = weatherData.precipitationProbability;

    // 1. Extreme Heat Warning (> 40°C)
    if (temp !== null && temp >= 40) {
      warnings.push({
        type: 'EXTREME_HEAT',
        severity: temp >= 45 ? 'critical' : 'high',
        title: 'Extreme High Temperature Advisory',
        message: `High heat conditions detected (${temp}°C). Maintain hydration and avoid direct sun exposure.`,
        source: 'Weather-based warning'
      });
    }

    // 2. Extreme Cold Warning (< -5°C)
    if (temp !== null && temp <= -5) {
      warnings.push({
        type: 'EXTREME_COLD',
        severity: temp <= -15 ? 'critical' : 'high',
        title: 'Severe Cold / Freeze Warning',
        message: `Sub-zero temperatures detected (${temp}°C). Risk of frostbite and icy trail surfaces.`,
        source: 'Weather-based warning'
      });
    }

    // 3. Heavy Rain / Flood Risk (Precipitation >= 10 mm or WMO 65, 82)
    if ((precip !== null && precip >= 10) || [65, 82].includes(wmo)) {
      warnings.push({
        type: 'HEAVY_RAIN',
        severity: precip >= 25 ? 'critical' : 'high',
        title: 'Heavy Rainfall Detected',
        message: `Active heavy precipitation (${precip !== null ? precip + ' mm/h' : 'Intense downpour'}). Water logging and reduced visibility likely.`,
        source: 'Weather-based warning'
      });
    }

    // 4. Thunderstorm / Lightning Hazard (WMO 95, 96, 99)
    if ([95, 96, 99].includes(wmo)) {
      warnings.push({
        type: 'THUNDERSTORM',
        severity: wmo === 99 ? 'critical' : 'high',
        title: 'Active Thunderstorm Alert',
        message: 'Thunderstorm activity detected. Seek sturdy indoor shelter; avoid open water and high ridges.',
        source: 'Weather-based warning'
      });
    }

    // 5. High Wind / Gale Warning (Wind speed >= 45 km/h)
    if (wind !== null && wind >= 45) {
      warnings.push({
        type: 'STRONG_WIND',
        severity: wind >= 65 ? 'critical' : 'high',
        title: 'High Gale Wind Advisory',
        message: `Strong wind gusts recorded (${wind} km/h). Caution on exposed hill roads and coastal walkways.`,
        source: 'Weather-based warning'
      });
    }

    // 6. High Rain Probability with Elevated Risk (> 80% POP with moderate rain)
    if (pop !== null && pop >= 80 && (precip > 2 || [53, 55, 61, 62, 63, 80, 81].includes(wmo))) {
      if (!warnings.some(w => w.type === 'HEAVY_RAIN')) {
        warnings.push({
          type: 'RAIN_ADVISORY',
          severity: 'moderate',
          title: 'High Precipitation Probability',
          message: `Rain probability is ${pop}% with active precipitation. Carry waterproof gear.`,
          source: 'Weather-based warning'
        });
      }
    }

    return warnings;
  }

  /**
   * Fetch Real-Time Weather by Coordinates with Normalization & Caching
   */
  static async getWeatherByCoordinates({ lat, lng, locationName = '', country = '', state = '', isRepresentative = false }) {
    const pLat = parseFloat(lat);
    const pLng = parseFloat(lng);

    if (!this.isValidCoord(pLat, pLng)) {
      throw new Error('Valid latitude (-90 to 90) and longitude (-180 to 180) are required.');
    }

    const cacheKey = `${pLat.toFixed(3)},${pLng.toFixed(3)}`;
    const now = Date.now();

    // Check cache
    if (weatherCache.has(cacheKey)) {
      const cached = weatherCache.get(cacheKey);
      if (now - cached.cachedAt < CACHE_TTL_MS) {
        return {
          ...cached.data,
          locationName: locationName || cached.data.locationName,
          country: country || cached.data.country,
          state: state || cached.data.state,
          isRepresentative: isRepresentative || cached.data.isRepresentative,
          isCached: true,
          cached: true
        };
      }
    }

    // Request deduplication
    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey);
    }

    const requestPromise = (async () => {
      try {
        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
          params: {
            latitude: pLat,
            longitude: pLng,
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,visibility',
            hourly: 'precipitation_probability',
            timezone: 'auto'
          },
          timeout: 6000
        });

        const cur = response.data?.current || {};
        const hourly = response.data?.hourly || {};
        const timezone = response.data?.timezone || 'UTC';

        // Extract current precipitation probability (current hour index)
        let precipProb = null;
        if (Array.isArray(hourly.precipitation_probability) && hourly.precipitation_probability.length > 0) {
          precipProb = hourly.precipitation_probability[0] ?? null;
        }

        const wmoCode = cur.weather_code !== undefined ? cur.weather_code : 0;
        const wmoInfo = WMO_CODE_MAP[wmoCode] || { condition: 'Clear', icon: '🌤️', code: 'CLEAR' };

        // Reverse geocoding if location name is missing
        let resolvedLocation = locationName;
        let resolvedCountry = country;
        let resolvedState = state;

        if (!resolvedLocation) {
          try {
            const geoRes = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pLat}&lon=${pLng}&zoom=10`,
              {
                headers: { 'User-Agent': 'RakshaSetu-Tourist-Safety-Weather/2.0' },
                timeout: 3000
              }
            );
            if (geoRes.data?.address) {
              const a = geoRes.data.address;
              const city = a.city || a.town || a.village || a.suburb || a.county || a.state_district || 'Selected Location';
              resolvedState = a.state || resolvedState || '';
              resolvedCountry = a.country || resolvedCountry || '';
              resolvedLocation = [city, resolvedState, resolvedCountry].filter(Boolean).join(', ');
            } else if (geoRes.data?.display_name) {
              resolvedLocation = geoRes.data.display_name.split(',').slice(0, 3).join(', ');
            }
          } catch (_) {}
        }

        if (!resolvedLocation) {
          resolvedLocation = `${pLat.toFixed(4)}, ${pLng.toFixed(4)}`;
        }

        const normalizedWeather = {
          locationName: resolvedLocation,
          country: resolvedCountry || null,
          state: resolvedState || null,
          latitude: pLat,
          longitude: pLng,
          temperature: cur.temperature_2m !== undefined ? Math.round(cur.temperature_2m * 10) / 10 : null,
          feelsLike: cur.apparent_temperature !== undefined ? Math.round(cur.apparent_temperature * 10) / 10 : null,
          humidity: cur.relative_humidity_2m !== undefined ? Math.round(cur.relative_humidity_2m) : null,
          windSpeed: cur.wind_speed_10m !== undefined ? Math.round(cur.wind_speed_10m * 10) / 10 : null,
          windDirection: cur.wind_direction_10m !== undefined ? cur.wind_direction_10m : null,
          precipitation: cur.precipitation !== undefined ? Math.round(cur.precipitation * 10) / 10 : 0,
          precipitationProbability: precipProb,
          weatherCondition: wmoInfo.condition,
          weatherCode: wmoCode,
          weatherCodeString: wmoInfo.code,
          icon: wmoInfo.icon,
          cloudCover: cur.cloud_cover !== undefined ? cur.cloud_cover : null,
          pressure: cur.surface_pressure !== undefined ? Math.round(cur.surface_pressure) : null,
          visibility: cur.visibility !== undefined ? Math.round(cur.visibility) : null,
          observedAt: cur.time || new Date().toISOString(),
          timezone,
          isRepresentative: Boolean(isRepresentative),
          provider: 'Open-Meteo Realtime Global Weather Engine'
        };

        // Attach rule-based weather warnings
        normalizedWeather.warnings = this.evaluateWeatherWarnings(normalizedWeather);

        // Store in cache
        weatherCache.set(cacheKey, {
          cachedAt: now,
          data: normalizedWeather
        });

        return normalizedWeather;
      } catch (err) {
        // Fallback to stale cache if available
        if (weatherCache.has(cacheKey)) {
          const stale = weatherCache.get(cacheKey);
          return {
            ...stale.data,
            isStale: true,
            warningNotice: 'Live weather service temporarily busy. Displaying last verified observation.'
          };
        }
        throw new Error(`Weather service unavailable: ${err.message}`);
      } finally {
        inFlightRequests.delete(cacheKey);
      }
    })();

    inFlightRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  /**
   * Worldwide Location Search with Representative Geocoding
   */
  static async searchLocations(query) {
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return [];
    }

    const clean = query.trim();

    try {
      // 1. Open-Meteo Worldwide Geocoding API
      const geoRes = await axios.get('https://geocoding-api.open-meteo.org/v1/search', {
        params: {
          name: clean,
          count: 10,
          language: 'en',
          format: 'json'
        },
        timeout: 6000
      });

      if (geoRes.data && Array.isArray(geoRes.data.results) && geoRes.data.results.length > 0) {
        return geoRes.data.results.map(r => {
          const isCountry = (r.feature_code || '').startsWith('PCLI') || (r.admin1 && !r.name);
          const isState = (r.feature_code || '').startsWith('ADM1');
          const isRep = isCountry || isState;

          const parts = [r.name];
          if (r.admin1 && r.admin1 !== r.name) parts.push(r.admin1);
          if (r.country && r.country !== r.name) parts.push(r.country);

          return {
            id: `om-${r.id}`,
            name: r.name,
            fullName: parts.join(', '),
            country: r.country || '',
            countryCode: r.country_code || '',
            state: r.admin1 || '',
            latitude: r.latitude,
            longitude: r.longitude,
            timezone: r.timezone || 'UTC',
            isRepresentative: isRep,
            representativeType: isCountry ? 'Country Reference Point' : isState ? 'State/Regional Reference Point' : 'Exact Location'
          };
        });
      }
    } catch (_) {}

    // 2. Fallback to Nominatim OSM search
    try {
      const nomRes = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(clean)}&format=json&limit=8&addressdetails=1`,
        {
          headers: { 'User-Agent': 'RakshaSetu-Tourist-Safety-Weather/2.0' },
          timeout: 6000
        }
      );

      if (nomRes.data && Array.isArray(nomRes.data) && nomRes.data.length > 0) {
        return nomRes.data.map(item => {
          const addr = item.address || {};
          const isCountry = item.type === 'administrative' && item.class === 'boundary' && !addr.state;
          const isState = item.type === 'administrative' && !!addr.state && !addr.city;
          const isRep = isCountry || isState;

          return {
            id: `osm-${item.place_id}`,
            name: item.display_name.split(',')[0].trim(),
            fullName: item.display_name,
            country: addr.country || '',
            countryCode: addr.country_code?.toUpperCase() || '',
            state: addr.state || '',
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            timezone: 'auto',
            isRepresentative: isRep,
            representativeType: isCountry ? 'Country Reference Point' : isState ? 'State/Regional Reference Point' : 'Exact Location'
          };
        });
      }
    } catch (_) {}

    // 3. Static fallback for prominent worldwide and Indian tourist hubs
    const staticHubs = [
      { name: 'London', fullName: 'London, Greater London, United Kingdom', country: 'United Kingdom', countryCode: 'GB', state: 'England', latitude: 51.5074, longitude: -0.1278 },
      { name: 'Paris', fullName: 'Paris, Île-de-France, France', country: 'France', countryCode: 'FR', state: 'Île-de-France', latitude: 48.8566, longitude: 2.3522 },
      { name: 'New York', fullName: 'New York, New York, United States', country: 'United States', countryCode: 'US', state: 'New York', latitude: 40.7128, longitude: -74.0060 },
      { name: 'Tokyo', fullName: 'Tokyo, Japan', country: 'Japan', countryCode: 'JP', state: 'Tokyo', latitude: 35.6762, longitude: 139.6503 },
      { name: 'Dubai', fullName: 'Dubai, United Arab Emirates', country: 'United Arab Emirates', countryCode: 'AE', state: 'Dubai', latitude: 25.2048, longitude: 55.2708 },
      { name: 'Munnar', fullName: 'Munnar, Idukki, Kerala, India', country: 'India', countryCode: 'IN', state: 'Kerala', latitude: 10.0889, longitude: 77.0595 },
      { name: 'Ooty', fullName: 'Ooty, Nilgiris, Tamil Nadu, India', country: 'India', countryCode: 'IN', state: 'Tamil Nadu', latitude: 11.4102, longitude: 76.6950 },
      { name: 'Goa', fullName: 'Panaji, Goa, India', country: 'India', countryCode: 'IN', state: 'Goa', latitude: 15.4909, longitude: 73.8278 },
      { name: 'Delhi', fullName: 'New Delhi, Delhi, India', country: 'India', countryCode: 'IN', state: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
      { name: 'Manali', fullName: 'Manali, Kullu, Himachal Pradesh, India', country: 'India', countryCode: 'IN', state: 'Himachal Pradesh', latitude: 32.2432, longitude: 77.1892 }
    ];

    const matched = staticHubs.filter(h => 
      h.name.toLowerCase().includes(clean.toLowerCase()) || 
      h.fullName.toLowerCase().includes(clean.toLowerCase()) ||
      h.country.toLowerCase().includes(clean.toLowerCase())
    );

    return matched.map((m, idx) => ({
      id: `fallback-${idx}-${m.name.toLowerCase()}`,
      name: m.name,
      fullName: m.fullName,
      country: m.country,
      countryCode: m.countryCode,
      state: m.state,
      latitude: m.latitude,
      longitude: m.longitude,
      timezone: 'auto',
      isRepresentative: false,
      representativeType: 'Exact Location'
    }));
  }

  /**
   * Aggregated Weather Overview for Admin Dashboard
   */
  static async getWeatherOverview() {
    const keyDestinations = [
      { name: 'Munnar, Kerala', lat: 10.0889, lng: 77.0595, country: 'India', state: 'Kerala' },
      { name: 'Ooty, Tamil Nadu', lat: 11.4102, lng: 76.6950, country: 'India', state: 'Tamil Nadu' },
      { name: 'Kuttalam, Tamil Nadu', lat: 8.9300, lng: 77.2686, country: 'India', state: 'Tamil Nadu' },
      { name: 'Calangute, Goa', lat: 15.5420, lng: 73.7554, country: 'India', state: 'Goa' },
      { name: 'Shimla, Himachal Pradesh', lat: 31.1048, lng: 77.1734, country: 'India', state: 'Himachal Pradesh' },
      { name: 'Paris, France', lat: 48.8566, lng: 2.3522, country: 'France', state: 'Île-de-France' },
      { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, country: 'Japan', state: 'Tokyo' },
      { name: 'Dubai, UAE', lat: 25.2048, lng: 55.2708, country: 'UAE', state: 'Dubai' }
    ];

    const results = await Promise.allSettled(
      keyDestinations.map(d => this.getWeatherByCoordinates(d))
    );

    const successful = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    const activeWarnings = successful.flatMap(w => 
      (w.warnings || []).map(warn => ({ ...warn, location: w.locationName, country: w.country }))
    );

    return {
      monitoredHubsCount: keyDestinations.length,
      activeWarningsCount: activeWarnings.length,
      activeWarnings,
      reports: successful,
      highlights: successful.map(w => ({
        cityName: w.locationName ? w.locationName.split(',')[0] : 'City',
        country: w.country,
        weather: w
      }))
    };
  }
}

module.exports = WeatherService;
