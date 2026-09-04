/**
 * Central Location Permission & Authorization Service
 * Enforces backend location visibility rules for RakshaSetu.
 * Prevents unauthorized access to tourist live GPS coordinates via REST or Socket.IO.
 */

const { executeQuery, inMemoryStore } = require('../config/database');

class LocationPermissionService {
  /**
   * Check if Tourist has enabled Global Location Sharing switch
   */
  static async isGlobalSharingActive(touristId) {
    if (!touristId) return false;
    const tId = parseInt(touristId, 10);

    if (Array.isArray(inMemoryStore.location_permissions)) {
      const mem = inMemoryStore.location_permissions.find(p => p.user_id === tId);
      return Boolean(mem && mem.location_sharing_active);
    }

    try {
      const rows = await executeQuery(
        'SELECT location_sharing_active FROM location_permissions WHERE user_id = ? LIMIT 1',
        [tId]
      );
      if (rows && rows.length > 0) {
        return Boolean(rows[0].location_sharing_active);
      }
    } catch {}

    return false;
  }

  /**
   * Check if Tourist explicitly approved an Admin's location request
   */
  static async hasApprovedAdminRequest(adminId, touristId) {
    if (!adminId || !touristId) return false;
    const aId = parseInt(adminId, 10);
    const tId = parseInt(touristId, 10);

    if (Array.isArray(inMemoryStore.location_requests)) {
      const mem = inMemoryStore.location_requests.find(
        r => r.user_id === tId && r.requested_by === aId && r.status === 'approved'
      );
      return Boolean(mem);
    }

    try {
      const rows = await executeQuery(
        `SELECT id FROM location_requests WHERE user_id = ? AND requested_by = ? AND status = 'approved' LIMIT 1`,
        [tId, aId]
      );
      if (rows && rows.length > 0) return true;
    } catch {}

    return false;
  }

  /**
   * Check if Tourist has an active emergency SOS trigger (Emergency Exception)
   */
  static async hasActiveSosEmergency(touristId) {
    if (!touristId) return false;
    const tId = parseInt(touristId, 10);

    if (Array.isArray(inMemoryStore.sos_requests) || Array.isArray(inMemoryStore.users)) {
      const memUser = (inMemoryStore.users || []).find(u => u.id === tId);
      const isUserEmergency = memUser && memUser.status === 'in_emergency';

      const memSos = (inMemoryStore.sos_requests || []).find(s => s.user_id === tId && s.status === 'active');
      return Boolean(isUserEmergency || memSos);
    }

    try {
      const userRows = await executeQuery('SELECT status FROM users WHERE id = ? LIMIT 1', [tId]);
      if (userRows && userRows.length > 0 && userRows[0].status === 'in_emergency') {
        return true;
      }
      const sosRows = await executeQuery(`SELECT id FROM sos_requests WHERE user_id = ? AND status = 'active' LIMIT 1`, [tId]);
      if (sosRows && sosRows.length > 0) return true;
    } catch {}

    return false;
  }

  /**
   * Core Backend Authorization Rule: canAdminViewTouristLocation
   * Returns TRUE only when valid permission exists.
   */
  static async canAdminViewTouristLocation(adminId, touristId) {
    if (!adminId || !touristId) return false;
    const aId = parseInt(adminId, 10);
    const tId = parseInt(touristId, 10);

    // Verify requesting user role is an authorized admin role
    let isAdminRole = false;
    if (Array.isArray(inMemoryStore.users)) {
      const memAdmin = inMemoryStore.users.find(u => u.id === aId);
      isAdminRole = Boolean(memAdmin && ['Admin', 'Police', 'Hospital'].includes(memAdmin.role));
    } else {
      try {
        const adminRows = await executeQuery('SELECT role FROM users WHERE id = ? LIMIT 1', [aId]);
        if (adminRows && adminRows.length > 0) {
          isAdminRole = ['Admin', 'Police', 'Hospital'].includes(adminRows[0].role);
        }
      } catch {}
    }

    if (!isAdminRole) return false;

    // Check emergency exception first
    const isEmergency = await this.hasActiveSosEmergency(tId);
    if (isEmergency) return true;

    // Check global sharing consent
    const isGlobalOn = await this.isGlobalSharingActive(tId);

    // Check specific approved admin location request
    const isApprovedRequest = await this.hasApprovedAdminRequest(aId, tId);

    return isGlobalOn || isApprovedRequest;
  }

  /**
   * Get all tourist IDs whose live location an admin is authorized to view
   */
  static async getAuthorizedTouristIdsForAdmin(adminId) {
    if (!adminId) return [];

    let allTourists = [];
    if (Array.isArray(inMemoryStore.users)) {
      allTourists = inMemoryStore.users.filter(u => u.role === 'Tourist');
    } else {
      try {
        allTourists = await executeQuery(`SELECT id FROM users WHERE role = 'Tourist'`);
      } catch {}
    }

    const authorizedIds = [];
    for (const t of allTourists) {
      const canView = await this.canAdminViewTouristLocation(adminId, t.id);
      if (canView) {
        authorizedIds.push(t.id);
      }
    }

    return authorizedIds;
  }

  /**
   * Revoke Location Permission for a tourist
   */
  static async revokeLocationPermission(touristId, adminId = null) {
    if (!touristId) return;
    const tId = parseInt(touristId, 10);

    try {
      await executeQuery(
        `INSERT INTO location_permissions (user_id, location_sharing_active) VALUES (?, FALSE)
         ON DUPLICATE KEY UPDATE location_sharing_active = FALSE`,
        [tId]
      );
      if (adminId) {
        await executeQuery(
          `UPDATE location_requests SET status = 'revoked', responded_at = CURRENT_TIMESTAMP WHERE user_id = ? AND requested_by = ?`,
          [tId, parseInt(adminId, 10)]
        );
      } else {
        await executeQuery(
          `UPDATE location_requests SET status = 'revoked', responded_at = CURRENT_TIMESTAMP WHERE user_id = ? AND status = 'approved'`,
          [tId]
        );
      }
    } catch {}

    if (!inMemoryStore.location_permissions) inMemoryStore.location_permissions = [];
    let perm = inMemoryStore.location_permissions.find(p => p.user_id === tId);
    if (perm) {
      perm.location_sharing_active = false;
    } else {
      inMemoryStore.location_permissions.push({ user_id: tId, location_sharing_active: false });
    }

    if (inMemoryStore.location_requests) {
      inMemoryStore.location_requests.forEach(r => {
        if (r.user_id === tId && (adminId ? r.requested_by === parseInt(adminId, 10) : r.status === 'approved')) {
          r.status = 'revoked';
        }
      });
    }
  }
}

module.exports = LocationPermissionService;
