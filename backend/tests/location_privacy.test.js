const LocationPermissionService = require('../src/services/locationPermissionService');
const { inMemoryStore } = require('../src/config/database');

describe('Strict Location-Sharing Consent & Permission Enforcement Engine', () => {
  beforeEach(() => {
    // Reset in-memory database mock for clean test isolation
    inMemoryStore.users = [
      { id: 1, full_name: 'System Admin', email: 'admin@rakshasetu.gov.in', role: 'Admin', status: 'active' },
      { id: 2, full_name: 'Police Chief', email: 'police@rakshasetu.gov.in', role: 'Police', status: 'active' },
      { id: 10, full_name: 'Alice Tourist', email: 'alice@example.com', role: 'Tourist', status: 'active', latitude: 28.6139, longitude: 77.2090 },
      { id: 11, full_name: 'Bob Tourist', email: 'bob@example.com', role: 'Tourist', status: 'active', latitude: 28.6320, longitude: 77.2190 },
      { id: 12, full_name: 'Charlie Emergency', email: 'charlie@example.com', role: 'Tourist', status: 'in_emergency', latitude: 28.6562, longitude: 77.2410 }
    ];

    inMemoryStore.location_permissions = [
      { user_id: 10, location_sharing_active: false },
      { user_id: 11, location_sharing_active: true },
      { user_id: 12, location_sharing_active: false }
    ];

    inMemoryStore.location_requests = [
      { id: 1, user_id: 10, requested_by: 1, status: 'pending', message: 'Safety check' },
      { id: 2, user_id: 10, requested_by: 2, status: 'approved', message: 'Patrol check' }
    ];

    inMemoryStore.sos_requests = [
      { id: 99, user_id: 12, status: 'active' }
    ];
  });

  describe('1. Central Location Authorization Service (canAdminViewTouristLocation)', () => {
    test('denies location access when tourist global sharing is OFF and no approved request exists', async () => {
      const canView = await LocationPermissionService.canAdminViewTouristLocation(1, 10);
      expect(canView).toBe(false);
    });

    test('grants location access when tourist has approved the admin request', async () => {
      const canView = await LocationPermissionService.canAdminViewTouristLocation(2, 10);
      expect(canView).toBe(true);
    });

    test('grants location access when tourist global sharing switch is ON', async () => {
      const canView = await LocationPermissionService.canAdminViewTouristLocation(1, 11);
      expect(canView).toBe(true);
    });

    test('grants location access during an active SOS emergency exception', async () => {
      const canView = await LocationPermissionService.canAdminViewTouristLocation(1, 12);
      expect(canView).toBe(true);
    });

    test('denies location access to non-admin / non-emergency roles', async () => {
      const canView = await LocationPermissionService.canAdminViewTouristLocation(10, 11);
      expect(canView).toBe(false);
    });

    test('denies location access for pending or revoked requests', async () => {
      // Pending request from Admin 1 to Tourist 10
      expect(await LocationPermissionService.hasApprovedAdminRequest(1, 10)).toBe(false);

      // Revoke Admin 2 request
      await LocationPermissionService.revokeLocationPermission(10, 2);
      expect(await LocationPermissionService.canAdminViewTouristLocation(2, 10)).toBe(false);
    });
  });

  describe('2. Request Creation & Response Authorization', () => {
    test('new location request starts as pending and is never automatically approved', async () => {
      const newReq = { id: 10, user_id: 10, requested_by: 1, status: 'pending' };
      inMemoryStore.location_requests.push(newReq);

      const canView = await LocationPermissionService.canAdminViewTouristLocation(1, 10);
      expect(canView).toBe(false);
    });

    test('revokeLocationPermission immediately updates permission state to inactive', async () => {
      // Initially Bob Tourist has global sharing ON
      expect(await LocationPermissionService.isGlobalSharingActive(11)).toBe(true);

      // Tourist stops sharing
      await LocationPermissionService.revokeLocationPermission(11);
      expect(await LocationPermissionService.isGlobalSharingActive(11)).toBe(false);
      expect(await LocationPermissionService.canAdminViewTouristLocation(1, 11)).toBe(false);
    });
  });

  describe('3. Authorized Tourist Location Filtering', () => {
    test('returns only authorized tourist IDs for requesting admin', async () => {
      const authorizedIds = await LocationPermissionService.getAuthorizedTouristIdsForAdmin(1);
      // Admin 1 can view Tourist 11 (global ON) and Tourist 12 (active SOS emergency), but NOT Tourist 10 (pending request, global OFF)
      expect(authorizedIds).toContain(11);
      expect(authorizedIds).toContain(12);
      expect(authorizedIds).not.toContain(10);
    });
  });
});
