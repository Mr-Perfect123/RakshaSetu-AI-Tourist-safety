const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test_jwt_secret_for_weather_and_alerts_tests_12345';
if (!process.env.JWT_REFRESH_SECRET) process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_12345';

const http = require('http');
const app = require('../src/app');
const weatherService = require('../src/services/weatherService');
const temporaryAlertService = require('../src/services/temporaryAlertService');
const GeofenceEngine = require('../src/utils/geofence');
const safetyDataService = require('../src/services/safety/safetyDataService');

const TEST_PORT = 5015;
const server = http.createServer(app);

const makeRequest = (path, method = 'GET', body = null, token = '') => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: TEST_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(data && { 'Content-Length': Buffer.byteLength(data) }),
        ...(token && { Authorization: `Bearer ${token}` })
      }
    };

    const req = http.request(options, (res) => {
      let resData = '';
      res.on('data', (chunk) => resData += chunk);
      res.on('end', () => {
        try {
          const parsed = resData ? JSON.parse(resData) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resData });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (data) req.write(data);
    req.end();
  });
};

server.listen(TEST_PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`--- RUNNING WEATHER & TEMPORARY SAFETY ALERTS TEST SUITE ---`);
  console.log(`======================================================\n`);

  let testsPassed = 0;
  let testsTotal = 0;

  const assert = (condition, msg) => {
    testsTotal++;
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      testsPassed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  };

  try {
    // ── 1. AUTHENTICATION (Login as admin or token generator) ───────────────
    console.log('[SECTION 1] Authenticating Admin User...');
    let adminToken = '';
    try {
      const loginRes = await makeRequest('/api/v1/auth/login', 'POST', {
        email: 'admin@rakshasetu.gov.in',
        password: 'Password@123'
      });
      if (loginRes.status === 200 && loginRes.data.data?.accessToken) {
        adminToken = loginRes.data.data.accessToken;
      }
    } catch (e) {}

    if (!adminToken) {
      const { generateAccessToken } = require('../src/config/jwt');
      adminToken = generateAccessToken({ id: 1, email: 'admin@rakshasetu.gov.in', role: 'admin', full_name: 'Test Admin' });
    }
    assert(!!adminToken, 'Obtained JWT access token for admin operations');

    // ── 2. WEATHER SERVICE & API TESTS ─────────────────────────────────────
    console.log('\n[SECTION 2] Real-Time Worldwide Weather Monitoring...');
    
    // 2.1 Current Weather endpoint for Coimbatore (11.0168, 76.9558)
    const weatherRes1 = await makeRequest('/api/v1/weather/current?lat=11.0168&lng=76.9558');
    assert(weatherRes1.status === 200, `Current weather API returned status 200 (got ${weatherRes1.status})`);
    assert(weatherRes1.data.data && typeof weatherRes1.data.data.temperature === 'number', 'Weather payload contains numerical temperature');
    assert(typeof weatherRes1.data.data.weatherCondition === 'string', 'Weather payload contains human-readable weatherCondition');
    assert(typeof weatherRes1.data.data.latitude === 'number' && weatherRes1.data.data.latitude === 11.0168, 'Correct coordinates returned');

    // 2.2 Weather Cache Verification (Second call should be served from memory cache)
    const weatherRes2 = await makeRequest('/api/v1/weather/current?lat=11.0168&lng=76.9558');
    assert(weatherRes2.status === 200, 'Second weather request returned status 200');
    assert(weatherRes2.data.data.cached === true, 'Subsequent weather query served from backend in-memory cache');

    // 2.3 Worldwide Weather Location Search (Open-Meteo Geocoding)
    const searchRes = await makeRequest('/api/v1/weather/search?q=London');
    assert(searchRes.status === 200, `Weather location search returned status 200 (got ${searchRes.status})`);
    assert(Array.isArray(searchRes.data.data) && searchRes.data.data.length > 0, 'Location search returned array of matches');
    assert(searchRes.data.data[0].name.toLowerCase().includes('london'), 'First match contains London');
    assert(typeof searchRes.data.data[0].latitude === 'number', 'Location search result contains numerical latitude');

    // 2.4 Worldwide Weather Overview / Key Cities Highlights
    const overviewRes = await makeRequest('/api/v1/weather/overview');
    assert(overviewRes.status === 200, `Weather overview API returned status 200 (got ${overviewRes.status})`);
    assert(Array.isArray(overviewRes.data.data.highlights) && overviewRes.data.data.highlights.length > 0, 'Overview contains key cities highlights');
    console.log(`    Sample overview city: ${overviewRes.data.data.highlights[0].cityName} (${overviewRes.data.data.highlights[0].weather?.temperature}°C, ${overviewRes.data.data.highlights[0].weather?.weatherCondition})`);

    // 2.5 Weather-Based Warning Detection Rule Testing
    const testWarningsSevereRain = weatherService.evaluateWeatherWarnings({
      temperature: 22,
      precipitation: 35, // > 10mm triggers rainfall warning
      windSpeed: 20,
      weatherCode: 65,
      weatherCondition: 'Heavy rain'
    });
    assert(Array.isArray(testWarningsSevereRain) && testWarningsSevereRain.length > 0, 'Severe rainfall triggers weather warning');
    assert(testWarningsSevereRain[0].type === 'HEAVY_RAIN', `Warning type is HEAVY_RAIN (got ${testWarningsSevereRain[0]?.type})`);

    const testWarningsExtremeHeat = weatherService.evaluateWeatherWarnings({
      temperature: 44, // > 40C triggers heatwave warning
      precipitation: 0,
      windSpeed: 10,
      weatherCode: 0,
      weatherCondition: 'Clear sky'
    });
    assert(Array.isArray(testWarningsExtremeHeat) && testWarningsExtremeHeat.length > 0, 'Extreme temperature (>40C) triggers heatwave warning');
    assert(testWarningsExtremeHeat[0].type === 'EXTREME_HEAT', `Warning type is EXTREME_HEAT (got ${testWarningsExtremeHeat[0]?.type})`);

    // ── 3. DYNAMIC TEMPORARY SAFETY ALERT ZONES (PART B) ───────────────────
    console.log('\n[SECTION 3] Dynamic Temporary Safety Alert Zones Lifecycle...');

    // 3.1 Create Circular Temporary Alert Zone
    const createCirclePayload = {
      title: 'Monsoon Flash Flood Warning Corridor',
      alert_type: 'FLOOD',
      severity: 'HIGH',
      geometry_type: 'circle',
      latitude: 11.0200,
      longitude: 76.9600,
      radius_meters: 1500,
      description: 'Severe seasonal waterlogging near Noyyal riverbed. Traffic diversion advised.',
      advisory_message: 'Do not approach riverside footpaths. Follow traffic police signals.',
      source_attribution: 'District Disaster Management Authority',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Coimbatore',
      status: 'ACTIVE',
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // +24 hours
    };

    const createCircleRes = await makeRequest('/api/v1/temporary-alerts', 'POST', createCirclePayload, adminToken);
    assert(createCircleRes.status === 201, `Create circular alert returned status 201 (got ${createCircleRes.status})`);
    const circleAlert = createCircleRes.data.data;
    assert(circleAlert && circleAlert.id, 'Created alert has a valid unique ID');
    assert(circleAlert.geometry_type === 'circle', 'Alert geometry type is circle');
    assert(circleAlert.radius_meters === 1500, 'Alert radius stored accurately');

    // 3.2 Create Polygon Temporary Alert Zone
    const createPolygonPayload = {
      title: 'Hill Highway Landslide Warning Sector',
      alert_type: 'LANDSLIDE',
      severity: 'CRITICAL',
      geometry_type: 'polygon',
      latitude: 11.4100,
      longitude: 76.7000,
      polygon_coordinates: [
        [11.4100, 76.7000],
        [11.4150, 76.7100],
        [11.4050, 76.7150],
        [11.4000, 76.7050]
      ],
      description: 'Active mudslide reports on Ghat Road hairpin bends 8-12.',
      advisory_message: 'Highway closed for all non-emergency vehicles.',
      source_attribution: 'State Highway Patrol',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Nilgiris',
      status: 'ACTIVE',
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
    };

    const createPolygonRes = await makeRequest('/api/v1/temporary-alerts', 'POST', createPolygonPayload, adminToken);
    assert(createPolygonRes.status === 201, `Create polygon alert returned status 201 (got ${createPolygonRes.status})`);
    const polygonAlert = createPolygonRes.data.data;
    assert(polygonAlert.geometry_type === 'polygon', 'Polygon alert geometry type is polygon');
    const parsedPolyCoords = typeof polygonAlert.polygon_coordinates === 'string' ? JSON.parse(polygonAlert.polygon_coordinates) : polygonAlert.polygon_coordinates;
    assert(Array.isArray(parsedPolyCoords) && parsedPolyCoords.length >= 4, `Polygon vertices stored correctly (${parsedPolyCoords ? parsedPolyCoords.length : 0} vertices)`);

    // 3.3 Fetch Active Temporary Alerts
    const activeRes = await makeRequest('/api/v1/temporary-alerts/active');
    assert(activeRes.status === 200, `Get active alerts returned status 200 (got ${activeRes.status})`);
    assert(Array.isArray(activeRes.data.data), 'Active alerts returns an array');
    const foundCircle = activeRes.data.data.find(a => a.id === circleAlert.id);
    assert(!!foundCircle, 'Newly created circle alert present in active alerts list');

    // 3.4 Extend Expiry of Temporary Alert
    const extendRes = await makeRequest(`/api/v1/temporary-alerts/${circleAlert.id}/extend`, 'POST', {
      hours: 12,
      extension_reason: 'Monsoon forecast extended through the morning'
    }, adminToken);
    assert(extendRes.status === 200, `Extend alert expiry returned status 200 (got ${extendRes.status})`);
    const originalTime = new Date(circleAlert.valid_until || circleAlert.expires_at).getTime();
    const extendedTime = new Date(extendRes.data.data.valid_until || extendRes.data.data.expires_at).getTime();
    console.log(`    Original Expiry: ${circleAlert.valid_until}, Extended Expiry: ${extendRes.data.data.valid_until}`);
    assert(extendedTime > originalTime, 'Valid until timestamp successfully extended into the future');

    // 3.5 Geofence Engine Containment Check
    console.log('\n[SECTION 4] Geofencing & Route Intersection with Temporary Alerts...');
    
    // Test point right at circle center (11.0200, 76.9600) -> State should be INSIDE
    const insideState = GeofenceEngine.getZoneState([11.0200, 76.9600], circleAlert);
    assert(insideState.state === 'INSIDE', `Point inside circular alert detected as INSIDE (got ${insideState.state})`);

    // Test point 10km away -> State should be OUTSIDE
    const outsideState = GeofenceEngine.getZoneState([11.1500, 76.9600], circleAlert);
    assert(outsideState.state === 'OUTSIDE', `Point 10km away detected as OUTSIDE (got ${outsideState.state})`);

    // Test point inside polygon (11.4075, 76.7075) -> State should be INSIDE
    const polygonInsideState = GeofenceEngine.getZoneState([11.4075, 76.7075], polygonAlert);
    assert(polygonInsideState.state === 'INSIDE', `Point inside polygon alert detected as INSIDE (got ${polygonInsideState.state})`);

    // 3.6 Route Safety Analysis with Active Temporary Alerts
    const testRouteCoordinates = [
      [11.0100, 76.9500], // Start before circle
      [11.0200, 76.9600], // Crosses directly through circle center
      [11.0300, 76.9700]  // End after circle
    ];
    const routeSafetyRes = await safetyDataService.analyzeRouteSafety(testRouteCoordinates);
    assert(routeSafetyRes.warnings && routeSafetyRes.warnings.length > 0, 'Route safety analysis detected intersection with temporary alert zone');
    const tempWarning = routeSafetyRes.warnings.find(w => 
      w.id === circleAlert.id || 
      w.temporaryAlertId === circleAlert.id || 
      w.title === circleAlert.title || 
      (w.name && w.name.includes(circleAlert.title))
    );
    assert(!!tempWarning, 'Route warning scorecard includes active temporary alert');
    console.log(`    Route Safety Score: ${routeSafetyRes.safetyScore}/100, Status: ${routeSafetyRes.safetyStatus}`);

    // 3.7 Resolve Temporary Alert
    console.log('\n[SECTION 5] Resolving and Cleaning Up Temporary Alert...');
    const resolveRes = await makeRequest(`/api/v1/temporary-alerts/${circleAlert.id}/resolve`, 'POST', {
      resolution_notes: 'Flood waters receded. Road cleared for normal operations.'
    }, adminToken);
    assert(resolveRes.status === 200, `Resolve alert returned status 200 (got ${resolveRes.status})`);
    assert(resolveRes.data.data.status === 'RESOLVED', 'Alert status updated to RESOLVED');

    // 3.8 Active list should no longer include resolved alert
    const activeAfterResolve = await makeRequest('/api/v1/temporary-alerts/active');
    const foundResolvedInActive = activeAfterResolve.data.data.find(a => a.id === circleAlert.id);
    assert(!foundResolvedInActive, 'Resolved alert no longer present in /active feed');

    // 3.9 Delete Temporary Alerts Clean-Up
    const delRes1 = await makeRequest(`/api/v1/temporary-alerts/${circleAlert.id}`, 'DELETE', null, adminToken);
    assert(delRes1.status === 200, 'Circle alert deleted cleanly');
    const delRes2 = await makeRequest(`/api/v1/temporary-alerts/${polygonAlert.id}`, 'DELETE', null, adminToken);
    assert(delRes2.status === 200, 'Polygon alert deleted cleanly');

    console.log(`\n======================================================`);
    console.log(`--- ALL ${testsPassed}/${testsTotal} TESTS PASSED WITH 100% SUCCESS ---`);
    console.log(`======================================================\n`);

  } catch (err) {
    console.error('\n❌ TEST RUN ABORTED DUE TO ERROR:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
    process.exit(process.exitCode || 0);
  }
});
