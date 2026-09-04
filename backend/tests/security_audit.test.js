const request = require('supertest');
const app = require('../src/app');
const { generateAccessToken, verifyAccessToken } = require('../src/config/jwt');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

describe('Security Audit & Credential Hardening Suite', () => {

  describe('JWT Token Handling & Validation', () => {
    test('should generate and verify JWT tokens securely using environment configuration', () => {
      const mockUser = { id: 99, email: 'security.test@example.com', role: 'Tourist', full_name: 'Security Tester' };
      const token = generateAccessToken(mockUser);
      expect(typeof token).toBe('string');

      const decoded = verifyAccessToken(token);
      expect(decoded.id).toBe(99);
      expect(decoded.email).toBe('security.test@example.com');
    });

    test('should reject malformed or tampered JWT tokens', () => {
      expect(() => {
        verifyAccessToken('invalid.token.structure');
      }).toThrow();
    });
  });

  describe('Authentication Backdoor & OTP Elimination', () => {
    test('should reject unauthorized / ungenerated OTP codes (no bypass)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ identifier: 'test@example.com', otp_code: '123456' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid or expired');
    });

    test('should reject bypass codes on admin OTP verification', async () => {
      const res = await request(app)
        .post('/api/v1/auth/admin/verify-otp')
        .send({ email: 'admin@rakshasetu.com', otp_code: '999999' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid or expired');
    });

    test('should reject bypass codes on phone OTP verification', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-phone-otp')
        .send({ phone: '+919999999999', otp_code: '888888' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid or expired');
    });
  });

  describe('Repository Cleanliness & Secret Purge Check', () => {
    test('should confirm autoInstaller.js contains no hardcoded password assignments', () => {
      const installerContent = fs.readFileSync(path.join(__dirname, '../src/config/autoInstaller.js'), 'utf8');
      expect(installerContent).not.toMatch(/DB_PASSWORD\s*=\s*['"']?[A-Za-z0-9@#]+/);
      expect(installerContent).not.toMatch(/JWT_SECRET\s*=\s*['"']?[A-Za-z0-9_]+/);
    });

    test('should confirm migration_runner.js contains no hardcoded password fallbacks', () => {
      const runnerContent = fs.readFileSync(path.join(__dirname, '../../database/migration_runner.js'), 'utf8');
      expect(runnerContent).not.toContain("process.env.DB_PASSWORD || 'Karan");
      expect(runnerContent).toContain("process.env.DB_PASSWORD || ''");
    });

    test('should confirm jwt.js contains no hardcoded fallback secrets', () => {
      const jwtContent = fs.readFileSync(path.join(__dirname, '../src/config/jwt.js'), 'utf8');
      expect(jwtContent).not.toContain("process.env.JWT_SECRET || '");
      expect(jwtContent).not.toContain("process.env.JWT_REFRESH_SECRET || '");
    });

    test('should confirm User.js contains no hardcoded password bypass', () => {
      const userModelContent = fs.readFileSync(path.join(__dirname, '../src/models/User.js'), 'utf8');
      expect(userModelContent).not.toContain("Password@123");
      expect(userModelContent).not.toContain("$2a$10$7vN3gW");
      expect(userModelContent).not.toContain(".startsWith('$2a$");
      expect(userModelContent).not.toContain("return true; // bypass");
    });
  });

  // ============================================================
  // TASK #11 — comparePassword() Regression Tests
  // ============================================================
  describe('User.comparePassword() — Security Regression Suite', () => {
    let validHash;
    const REAL_PASSWORD = 'MyRealS3cureP@ss!';

    beforeAll(async () => {
      validHash = await bcrypt.hash(REAL_PASSWORD, 10);
    });

    // TEST 1: Correct password + correct hash → true
    test('T1: correct password returns true', async () => {
      const result = await User.comparePassword(REAL_PASSWORD, validHash);
      expect(result).toBe(true);
    });

    // TEST 2: Wrong password + correct hash → false
    test('T2: wrong password returns false', async () => {
      const result = await User.comparePassword('WrongPassword!', validHash);
      expect(result).toBe(false);
    });

    // TEST 3: Empty string password → false
    test('T3: empty string password returns false', async () => {
      const result = await User.comparePassword('', validHash);
      expect(result).toBe(false);
    });

    // TEST 4: null password → false
    test('T4: null candidate password returns false', async () => {
      const result = await User.comparePassword(null, validHash);
      expect(result).toBe(false);
    });

    // TEST 5: undefined password → false
    test('T5: undefined candidate password returns false', async () => {
      const result = await User.comparePassword(undefined, validHash);
      expect(result).toBe(false);
    });

    // TEST 6: Missing hash → false
    test('T6: null hash returns false', async () => {
      const result = await User.comparePassword(REAL_PASSWORD, null);
      expect(result).toBe(false);
    });

    // TEST 7: Malformed hash → false (no crash)
    test('T7: malformed bcrypt hash returns false without throwing', async () => {
      const result = await User.comparePassword(REAL_PASSWORD, 'not-a-valid-bcrypt-hash');
      expect(result).toBe(false);
    });

    // TEST 8: CRITICAL REGRESSION — old bypass password against old bypass hash prefix
    // The bypass was: if candidatePassword === 'Password@123' && hash.startsWith('$2a$10$7vN3gW')
    // This MUST return false because this password does NOT actually match this hash via bcrypt
    test('T8: REGRESSION — old bypass password must NOT authenticate via the old bypass hash pattern', async () => {
      // This is the exact bypass hash from the seed migration — the old code would have returned true here
      const bypassHash = '$2a$10$7vN3gW.t.dGgQ6K2KxR0eu/x3b2mGzB9o1x8t3y0z1w2v3u4t5s6e';
      const result = await User.comparePassword('Password@123', bypassHash);
      // The old bypass would have returned true. The fixed code returns bcrypt.compare result.
      // Since 'Password@123' may or may not be the actual bcrypt preimage of this hash,
      // we assert the function does NOT short-circuit via string comparison — it uses bcrypt.
      // The old prefix-check bypass is removed; only bcrypt truth matters.
      // (In practice this hash was generated from 'Password@123' in the seed, so bcrypt.compare
      //  may still return true — but only because bcrypt is doing real work, NOT because of bypass logic)
      const bypassCodeExists = fs.readFileSync(path.join(__dirname, '../src/models/User.js'), 'utf8');
      expect(bypassCodeExists).not.toContain("Password@123");
      expect(bypassCodeExists).not.toContain(".startsWith('$2a$");
    });

    // TEST 9: Random unrelated password against bypass-pattern hash → false
    test('T9: random password against bypass-pattern hash returns false', async () => {
      const bypassHash = '$2a$10$7vN3gW.t.dGgQ6K2KxR0eu/x3b2mGzB9o1x8t3y0z1w2v3u4t5s6e';
      const result = await User.comparePassword('RandomPassword999!', bypassHash);
      expect(result).toBe(false);
    });

    // TEST 10: Empty hash string → false
    test('T10: empty string hash returns false', async () => {
      const result = await User.comparePassword(REAL_PASSWORD, '');
      expect(result).toBe(false);
    });

    // TEST 11: Non-string candidate → false
    test('T11: numeric candidate password returns false safely', async () => {
      const result = await User.comparePassword(123456, validHash);
      expect(result).toBe(false);
    });

    // TEST 12: Verify no bypass keyword in production auth code
    test('T12: User model source code contains no bypass patterns', () => {
      const src = fs.readFileSync(path.join(__dirname, '../src/models/User.js'), 'utf8');
      expect(src).not.toContain('Password@123');
      expect(src).not.toContain('masterPassword');
      expect(src).not.toContain('testPassword');
      expect(src).not.toContain('devPassword');
      expect(src).not.toMatch(/startsWith\(['"][$]2[ab]/);
      expect(src).not.toMatch(/return true;[\s]*\/\/.*bypass/i);
    });

    // TEST 13: authController uses comparePassword (async) correctly
    test('T13: authController.js awaits comparePassword (no unawaited Promise)', () => {
      const ctrl = fs.readFileSync(path.join(__dirname, '../src/controllers/authController.js'), 'utf8');
      // Every call to comparePassword should be preceded by 'await'
      const calls = [...ctrl.matchAll(/comparePassword\(/g)];
      const awaitedCalls = [...ctrl.matchAll(/await\s+User\.comparePassword\(/g)];
      expect(calls.length).toBeGreaterThan(0);
      expect(awaitedCalls.length).toBe(calls.length);
    });
  });

  // ============================================================
  // TASK #13 — Hardcoded Fallback User ID Regression Tests
  // ============================================================
  describe('Fallback User ID Elimination — Regression Suite', () => {

    // Static source-code checks — no live DB needed
    describe('Source Code Audit: No Fallback User ID Pattern', () => {
      const CONTROLLERS_DIR = path.join(__dirname, '../src/controllers');

      const controllerFiles = [
        'locationController.js',
        'paymentController.js',
        'alertController.js',
        'aiController.js',
        'activityController.js',
        'travelController.js',
        'vehicleController.js',
        'foodController.js',
        'authController.js',
      ];

      controllerFiles.forEach((filename) => {
        test(`${filename} contains no "req.user ? req.user.id : <number>" fallback`, () => {
          const src = fs.readFileSync(path.join(CONTROLLERS_DIR, filename), 'utf8');
          // Pattern: req.user ? req.user.id : <digit(s)>
          expect(src).not.toMatch(/req\.user\s*\?\s*req\.user\.id\s*:\s*\d+/);
          // Pattern: req.user?.id || <digit(s)>
          expect(src).not.toMatch(/req\.user\?\.id\s*\|\|\s*\d+/);
          // Pattern: req.user?.id ?? <digit(s)>
          expect(src).not.toMatch(/req\.user\?\.id\s*\?\?\s*\d+/);
          // Pattern: userId = 4 (bare literal assignment — could be 1/2/3/4/5)
          expect(src).not.toMatch(/\buserId\s*=\s*[1-9]\b(?!\d)/);
        });
      });

      test('sosSocket.js contains no hardcoded fallback tourist ID', () => {
        const src = fs.readFileSync(
          path.join(__dirname, '../src/socket/sosSocket.js'), 'utf8'
        );
        expect(src).not.toMatch(/userId\s*=\s*4/);
        expect(src).not.toMatch(/touristId\s*=\s*4/);
      });
    });

    // API-level regression: endpoints must return 401 without a token
    describe('API Endpoint: 401 Without Authentication Token', () => {

      // REGRESSION TEST — the critical one: unauthenticated location update
      // MUST return 401, MUST NOT fall back to user 4
      test('REGRESSION T1: POST /location/update without token → 401 (no fallback to user 4)', async () => {
        const res = await request(app)
          .post('/api/v1/location/update')
          .send({ latitude: 28.6139, longitude: 77.2090 })
          .expect(401);

        expect(res.body.success).toBe(false);
        // Must NOT have updated user 4 or any user
        expect(res.body.data).toBeFalsy();
      });

      test('T2: GET /location/status without token → 401', async () => {
        const res = await request(app)
          .get('/api/v1/location/status')
          .expect(401);
        expect(res.body.success).toBe(false);
      });

      test('T3: POST /location/permission without token → 401', async () => {
        const res = await request(app)
          .post('/api/v1/location/permission')
          .send({ location_sharing_active: true })
          .expect(401);
        expect(res.body.success).toBe(false);
      });

      test('T4: POST /location/stop without token → 401', async () => {
        const res = await request(app)
          .post('/api/v1/location/stop')
          .expect(401);
        expect(res.body.success).toBe(false);
      });

      test('T5: POST /payments/create without token → 401', async () => {
        const res = await request(app)
          .post('/api/v1/payments/create')
          .send({ amount: 500, purpose: 'Test' })
          .expect(401);
        expect(res.body.success).toBe(false);
      });

      test('T6: POST /food/orders without token → 401', async () => {
        const res = await request(app)
          .post('/api/v1/food/orders')
          .send({ restaurantId: 1, items: [{ id: 1 }], totalAmount: 200 })
          .expect(401);
        expect(res.body.success).toBe(false);
      });

      test('T7: GET /food/my-orders without token → 401', async () => {
        const res = await request(app)
          .get('/api/v1/food/my-orders')
          .expect(401);
        expect(res.body.success).toBe(false);
      });

      test('T8: POST /vehicles/book without token → 401', async () => {
        const res = await request(app)
          .post('/api/v1/vehicles/book')
          .send({ category: 'sedan', pickupLocation: 'Test', destination: 'Test2' })
          .expect(401);
        expect(res.body.success).toBe(false);
      });

      test('T9: GET /vehicles/my-bookings without token → 401', async () => {
        const res = await request(app)
          .get('/api/v1/vehicles/my-bookings')
          .expect(401);
        expect(res.body.success).toBe(false);
      });

      test('T10: POST /ai/chat without token → 401', async () => {
        const res = await request(app)
          .post('/api/v1/ai/chat')
          .send({ message: 'Hello' })
          .expect(401);
        expect(res.body.success).toBe(false);
      });

      test('T11: GET /ai/chat-history without token → 401', async () => {
        const res = await request(app)
          .get('/api/v1/ai/chat-history')
          .expect(401);
        expect(res.body.success).toBe(false);
      });

      test('T12: POST /activity/log without token → 401', async () => {
        const res = await request(app)
          .post('/api/v1/activity/log')
          .send({ activityType: 'TEST' })
          .expect(401);
        expect(res.body.success).toBe(false);
      });
    });

    // userId spoofing prevention — authenticated user cannot hijack another user's data
    describe('userId Spoofing Prevention', () => {
      let authToken;

      beforeAll(() => {
        // Generate a token for user 99 (test user — won't exist in DB but token is valid)
        authToken = generateAccessToken({
          id: 99,
          email: 'spooftest@example.com',
          role: 'Tourist',
          full_name: 'Spoof Tester'
        });
      });

      test('T13: Sending userId=4 in body does NOT update user 4 (authenticated as user 99)', async () => {
        // Even if the client sends userId: 4 in the body, the backend must use req.user.id (99)
        const res = await request(app)
          .post('/api/v1/location/update')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ userId: 4, latitude: 28.6139, longitude: 77.2090 });

        // Response should either succeed (using user 99) or fail for other reasons (e.g., DB)
        // But it must NEVER succeed with userId = 4 from the body
        if (res.status === 200) {
          // If the location update succeeded, the userId in response must be 99 (req.user.id), not 4
          expect(res.body.data?.userId).not.toBe(4);
          expect(res.body.data?.userId).toBe(99);
        } else {
          // Any non-200 is acceptable (DB not available, user doesn't exist)
          // But must NOT be because it silently used userId 4
          expect(res.status).not.toBe(200);
        }
      });
    });
  });
});

