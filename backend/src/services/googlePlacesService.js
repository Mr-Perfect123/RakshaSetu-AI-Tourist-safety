const axios = require('axios');

class GooglePlacesService {
  /**
   * Get Google Maps / Places API Key from environment
   * @returns {string|null}
   */
  static getApiKey() {
    const key = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
    if (key && key.trim() !== '' && !key.includes('your_google_maps_api_key')) {
      return key.trim();
    }
    return null;
  }

  /**
   * Autocomplete search for places worldwide with optional location bias
   * @param {Object} params
   * @param {string} params.input - User search query
   * @param {number} [params.lat] - Optional user latitude for biasing
   * @param {number} [params.lng] - Optional user longitude for biasing
   * @param {number} [params.radius=50000] - Bias radius in meters
   * @param {Array} [params.curatedPool=[]] - Local curated destinations pool for fallback
   * @returns {Promise<Array>} List of autocomplete suggestions
   */
  static async searchAutocomplete({ input, lat, lng, radius = 50000, curatedPool = [] }) {
    if (!input || typeof input !== 'string' || input.trim().length < 2) {
      return [];
    }

    const cleanInput = input.trim();
    const apiKey = this.getApiKey();

    if (apiKey) {
      try {
        const queryParams = {
          input: cleanInput,
          key: apiKey,
          language: 'en'
        };

        if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
          queryParams.location = `${parseFloat(lat)},${parseFloat(lng)}`;
          queryParams.radius = radius;
        }

        const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
          params: queryParams,
          timeout: 4000
        });

        if (response.data && response.data.status === 'OK' && Array.isArray(response.data.predictions)) {
          return response.data.predictions.map(p => ({
            placeId: p.place_id,
            name: p.structured_formatting?.main_text || p.description.split(',')[0].trim(),
            formattedAddress: p.structured_formatting?.secondary_text || p.description,
            fullDescription: p.description,
            types: p.types || [],
            source: 'google'
          }));
        } else if (response.data && response.data.status === 'ZERO_RESULTS') {
          return [];
        } else {
          // Log warning without exposing API key
          console.warn(`[GooglePlaces] Autocomplete API status: ${response.data?.status || 'UNKNOWN'}. Utilizing fallback search.`);
        }
      } catch (err) {
        console.warn(`[GooglePlaces] Autocomplete request failed: ${err.message}. Utilizing fallback search.`);
      }
    }

    // ── Resilient Fallback Search (Curated Destinations + OSM) ─────────────
    return this.fallbackAutocomplete(cleanInput, lat, lng, curatedPool);
  }

  /**
   * Fetch exact place details / coordinates for a selected place
   * @param {Object} params
   * @param {string} params.placeId - Google Place ID or fallback ID
   * @param {string} [params.name] - Optional fallback search name
   * @param {Array} [params.curatedPool=[]] - Local curated destinations pool
   * @returns {Promise<Object|null>}
   */
  static async getPlaceDetails({ placeId, name, curatedPool = [] }) {
    if (!placeId && !name) return null;

    const apiKey = this.getApiKey();

    // 1. If we have a Google Place ID and API key, call Google Place Details API
    if (apiKey && placeId && !placeId.startsWith('curated-') && !placeId.startsWith('osm-')) {
      try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
          params: {
            place_id: placeId,
            fields: 'place_id,name,formatted_address,geometry,types,address_components',
            key: apiKey,
            language: 'en'
          },
          timeout: 4000
        });

        if (response.data && response.data.status === 'OK' && response.data.result) {
          const res = response.data.result;
          return {
            placeId: res.place_id,
            name: res.name || name || 'Selected Destination',
            formattedAddress: res.formatted_address || '',
            latitude: res.geometry?.location?.lat ?? null,
            longitude: res.geometry?.location?.lng ?? null,
            types: res.types || [],
            source: 'google'
          };
        }
      } catch (err) {
        console.warn(`[GooglePlaces] Place Details request failed: ${err.message}. Using fallback details.`);
      }
    }

    // 2. Check local curated pool
    if (curatedPool && curatedPool.length > 0) {
      const match = curatedPool.find(p => 
        p.id === placeId || 
        (name && p.name.toLowerCase() === name.toLowerCase()) ||
        (p.id && placeId && p.id.replace(/-/g, '') === placeId.replace(/-/g, ''))
      );
      if (match) {
        return {
          placeId: match.id,
          name: match.name,
          formattedAddress: match.address || `${match.city}, ${match.state}, ${match.country}`,
          latitude: match.latitude,
          longitude: match.longitude,
          types: ['tourist_attraction'],
          source: 'curated'
        };
      }
    }

    // 3. Fallback Geocoding via OpenStreetMap for fallback IDs or names
    try {
      const query = name || placeId.replace(/^(osm-|curated-)/, '').replace(/-/g, ' ');
      const geoRes = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`,
        {
          headers: { 'User-Agent': 'RakshaSetu-Tourist-Safety/2.0' },
          timeout: 3500
        }
      );

      if (geoRes.data && geoRes.data[0]) {
        const item = geoRes.data[0];
        return {
          placeId: placeId || `osm-${item.place_id}`,
          name: item.display_name.split(',')[0].trim(),
          formattedAddress: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          types: [item.type || 'point_of_interest'],
          source: 'fallback'
        };
      }
    } catch (_) {}

    return null;
  }

  /**
   * Resilient fallback autocomplete implementation
   * @private
   */
  static async fallbackAutocomplete(cleanInput, lat, lng, curatedPool) {
    const results = [];
    const lower = cleanInput.toLowerCase();
    const seen = new Set();

    // 1. Curated Destinations matching query
    if (Array.isArray(curatedPool)) {
      curatedPool.forEach(p => {
        const pName = (p.name || '').toLowerCase();
        const pCity = (p.city || '').toLowerCase();
        const pState = (p.state || '').toLowerCase();
        const pCountry = (p.country || '').toLowerCase();

        if (pName.includes(lower) || pCity.includes(lower) || pState.includes(lower) || pCountry.includes(lower)) {
          const key = p.name.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            results.push({
              placeId: p.id || `curated-${pName.replace(/\s+/g, '-')}`,
              id: p.id,
              name: p.name,
              formattedAddress: p.address || `${p.city}, ${p.state}, ${p.country}`,
              fullDescription: `${p.name}, ${p.city}, ${p.state}, ${p.country}`,
              city: p.city,
              state: p.state,
              country: p.country,
              category: p.category,
              photos: p.photos || [],
              safetyScore: p.safetyScore || 88,
              types: ['tourist_attraction', 'point_of_interest'],
              source: 'curated'
            });
          }
        }
      });
    }

    // 2. Query Nominatim for worldwide suggestions (limit 5)
    try {
      const biasParam = (lat && lng && !isNaN(lat) && !isNaN(lng)) ? `&lat=${lat}&lon=${lng}` : '';
      const geoRes = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanInput)}&format=json&limit=5&addressdetails=1${biasParam}`,
        {
          headers: { 'User-Agent': 'RakshaSetu-Tourist-Safety/2.0' },
          timeout: 3000
        }
      );

      if (geoRes.data && Array.isArray(geoRes.data)) {
        geoRes.data.forEach(item => {
          const mainName = item.display_name.split(',')[0].trim();
          const key = mainName.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            results.push({
              placeId: `osm-${item.place_id}`,
              name: mainName,
              formattedAddress: item.display_name,
              fullDescription: item.display_name,
              types: [item.type || 'establishment'],
              source: 'fallback'
            });
          }
        });
      }
    } catch (_) {}

    return results;
  }
}

module.exports = GooglePlacesService;
