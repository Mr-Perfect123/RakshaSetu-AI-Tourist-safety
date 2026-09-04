const request = require('supertest');
const app = require('../src/app');
const GooglePlacesService = require('../src/services/googlePlacesService');

describe('Google Places Autocomplete & Details Suite', () => {

  describe('GooglePlacesService Unit Tests', () => {
    test('should return empty list for queries shorter than 2 characters', async () => {
      const resultsShort = await GooglePlacesService.searchAutocomplete({ input: 'a' });
      expect(resultsShort).toEqual([]);

      const resultsEmpty = await GooglePlacesService.searchAutocomplete({ input: '' });
      expect(resultsEmpty).toEqual([]);
    });

    test('should return curated/fallback suggestions when API key is simulated offline', async () => {
      const results = await GooglePlacesService.searchAutocomplete({
        input: 'Oot',
        curatedPool: [
          {
            id: 'ooty-nilgiris-tamil-nadu',
            name: 'Ooty (Udhagamandalam)',
            city: 'Ooty',
            state: 'Tamil Nadu',
            country: 'India',
            address: 'Udhagamandalam, The Nilgiris, Tamil Nadu 643001, India',
            latitude: 11.4102,
            longitude: 76.6950
          }
        ]
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name.toLowerCase()).toContain('ooty');
      expect(results[0].placeId).toBeTruthy();
    });

    test('should return place details with coordinates for curated place', async () => {
      const details = await GooglePlacesService.getPlaceDetails({
        placeId: 'ooty-nilgiris-tamil-nadu',
        name: 'Ooty',
        curatedPool: [
          {
            id: 'ooty-nilgiris-tamil-nadu',
            name: 'Ooty (Udhagamandalam)',
            city: 'Ooty',
            state: 'Tamil Nadu',
            country: 'India',
            address: 'Udhagamandalam, The Nilgiris, Tamil Nadu 643001, India',
            latitude: 11.4102,
            longitude: 76.6950
          }
        ]
      });

      expect(details).toBeTruthy();
      expect(details.latitude).toBeCloseTo(11.4102);
      expect(details.longitude).toBeCloseTo(76.6950);
      expect(details.name).toContain('Ooty');
    });
  });

  describe('GET /api/v1/places/autocomplete', () => {
    test('should return 200 with suggestions for "Ooty"', async () => {
      const res = await request(app)
        .get('/api/v1/places/autocomplete?input=Ooty')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('name');
      expect(res.body.data[0]).toHaveProperty('placeId');
    });

    test('should return 200 with empty array for 1-character input', async () => {
      const res = await request(app)
        .get('/api/v1/places/autocomplete?input=O')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    test('should accept location bias coordinates without error', async () => {
      const res = await request(app)
        .get('/api/v1/places/autocomplete?input=hotel&lat=11.0168&lng=76.9558')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/places/details', () => {
    test('should return 400 when neither placeId nor name is provided', async () => {
      const res = await request(app)
        .get('/api/v1/places/details')
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    test('should return coordinates for curated destination', async () => {
      const res = await request(app)
        .get('/api/v1/places/details?placeId=ooty-nilgiris-tamil-nadu')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('latitude');
      expect(res.body.data).toHaveProperty('longitude');
      expect(typeof res.body.data.latitude).toBe('number');
      expect(typeof res.body.data.longitude).toBe('number');
    });
  });
});
