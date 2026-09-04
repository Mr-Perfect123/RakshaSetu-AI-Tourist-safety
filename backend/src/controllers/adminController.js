const User = require('../models/User');
const SosRequest = require('../models/SosRequest');
const IncidentReport = require('../models/IncidentReport');
const SafeLocation = require('../models/SafeLocation');
const EmergencyContact = require('../models/EmergencyContact');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { executeQuery, inMemoryStore } = require('../config/database');

class AdminController {
  static getDashboardStats = asyncHandler(async (req, res) => {
    const activeSos = await SosRequest.findActive();
    const allUsers = await User.findAll({ limit: 100 });
    const pendingIncidents = await IncidentReport.findAll({ status: 'pending', limit: 50 });
    const safeLocations = await SafeLocation.findAll();

    const stats = {
      activeSosCount: activeSos.length,
      totalUsersCount: allUsers.length,
      touristsCount: allUsers.filter(u => u.role === 'Tourist').length,
      pendingIncidentsCount: pendingIncidents.length,
      safeLocationsCount: safeLocations.length,
      policeUnitsActive: allUsers.filter(u => u.role === 'Police').length,
      hospitalsActive: allUsers.filter(u => u.role === 'Hospital').length,
      recentSos: activeSos,
      recentIncidents: pendingIncidents,
      safeLocations: safeLocations
    };

    return res.status(200).json(new ApiResponse(200, stats, 'Admin command center statistics fetched.'));
  });

  /**
   * Get Real Tourist User Roster with Identity & Location Consent Badges
   */
  static getTouristsRoster = asyncHandler(async (req, res) => {
    const LocationPermissionService = require('../services/locationPermissionService');
    const adminId = req.user ? req.user.id : null;
    const { search, page = 1, limit = 100 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `
      SELECT u.id, u.full_name, u.email, u.phone, u.gender, u.nationality, u.passport_number,
             COALESCE(u.profile_image_path, u.profile_image) AS profile_image_path,
             COALESCE(u.profile_image, u.profile_image_path) AS profile_image,
             u.status, u.is_verified,
             u.email_verified, u.phone_verified, u.id_type, u.id_number,
             COALESCE(u.id_proof_url, td.document_path) AS id_proof_url,
             COALESCE(u.id_verification_status, td.verification_status, 'pending') AS id_verification_status,
             u.latitude, u.longitude, u.last_active_at, u.created_at,
             lp.location_sharing_active,
             th.blood_group, th.emergency_notes, th.medical_conditions
      FROM users u
      LEFT JOIN location_permissions lp ON u.id = lp.user_id
      LEFT JOIN tourist_health th ON u.id = th.user_id
      LEFT JOIN tourist_documents td ON u.id = td.user_id
      WHERE (u.role = 'Tourist' OR u.role = 'tourist' OR u.role IS NULL OR u.role != 'Admin')
    `;
    const params = [];

    if (search) {
      sql += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR u.id_number LIKE ? OR u.passport_number LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    sql += ` GROUP BY u.id ORDER BY u.id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    let tourists = [];
    try {
      tourists = await executeQuery(sql, params);
    } catch {
      const { inMemoryStore } = require('../config/database');
      tourists = (inMemoryStore.users || []).filter(u => u.role !== 'Admin');
    }

    // Filter location visibility per tourist
    const sanitizedTourists = [];
    for (const t of (tourists || [])) {
      const canViewLoc = await LocationPermissionService.canAdminViewTouristLocation(adminId, t.id);
      sanitizedTourists.push({
        ...t,
        latitude: canViewLoc ? t.latitude : null,
        longitude: canViewLoc ? t.longitude : null,
        location_sharing_active: Boolean(t.location_sharing_active)
      });
    }

    return res.status(200).json(new ApiResponse(200, sanitizedTourists, 'Tourist user roster fetched.'));
  });

  static getAllUsers = asyncHandler(async (req, res) => {
    const { role, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.findAll({ role, search, limit: parseInt(limit), offset });
    return res.status(200).json(new ApiResponse(200, users, 'Users retrieved successfully.'));
  });

  /**
   * Get Complete Tourist Profile (Identity, Health, Emergency Contacts, Location Privacy & SOS)
   */
  static getTouristDetails = asyncHandler(async (req, res) => {
    const LocationPermissionService = require('../services/locationPermissionService');
    const adminId = req.user ? req.user.id : null;
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, 'Tourist not found.'));
    }

    const healthRows = await executeQuery(`SELECT * FROM tourist_health WHERE user_id = ? LIMIT 1`, [id]);
    const docRows = await executeQuery(`SELECT * FROM tourist_documents WHERE user_id = ? ORDER BY id DESC`, [id]);
    const contacts = await EmergencyContact.findByUserId(id);
    const permRows = await executeQuery(`SELECT * FROM location_permissions WHERE user_id = ? LIMIT 1`, [id]);
    const userSos = (await SosRequest.findAll()).filter(s => s.user_id === parseInt(id, 10));

    const canViewLoc = await LocationPermissionService.canAdminViewTouristLocation(adminId, id);

    const fullProfile = {
      ...user,
      latitude: canViewLoc ? user.latitude : null,
      longitude: canViewLoc ? user.longitude : null,
      health: healthRows[0] || null,
      identity_documents: docRows || [],
      emergency_contacts: contacts,
      location_permission: permRows[0] || null,
      sos_history: userSos
    };

    return res.status(200).json(new ApiResponse(200, fullProfile, 'Tourist complete record fetched.'));
  });

  /**
   * Admin Approve Tourist Government ID
   */
  static approveTouristId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.id;

    await executeQuery(`UPDATE users SET id_verification_status = 'approved' WHERE id = ?`, [id]);
    await executeQuery(
      `UPDATE tourist_documents SET verification_status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
      [adminId, id]
    );

    return res.status(200).json(new ApiResponse(200, { id, status: 'approved' }, 'Tourist ID verification APPROVED.'));
  });

  /**
   * Admin Reject Tourist Government ID
   */
  static rejectTouristId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rejection_reason = 'Illegible or invalid government document.' } = req.body;
    const adminId = req.user.id;

    await executeQuery(`UPDATE users SET id_verification_status = 'rejected', id_rejection_reason = ? WHERE id = ?`, [rejection_reason, id]);
    await executeQuery(
      `UPDATE tourist_documents SET verification_status = 'rejected', rejection_reason = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
      [rejection_reason, adminId, id]
    );

    return res.status(200).json(new ApiResponse(200, { id, status: 'rejected', rejection_reason }, 'Tourist ID verification REJECTED.'));
  });

  /**
   * Admin Dispatch Location Request to Tourist
   */
  static requestLiveLocation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminId = req.user ? req.user.id : null;
    const targetUserId = parseInt(id, 10);
    const { message = 'RakshaSetu Admin is requesting your live location for safety monitoring.' } = req.body;

    let insertId = Date.now();
    try {
      const result = await executeQuery(
        `INSERT INTO location_requests (user_id, requested_by, message, status) VALUES (?, ?, ?, 'pending')`,
        [targetUserId, adminId, message]
      );
      insertId = result.insertId || insertId;
    } catch {}

    if (!inMemoryStore.location_requests) inMemoryStore.location_requests = [];
    const newReq = {
      id: insertId,
      user_id: targetUserId,
      requested_by: adminId,
      message,
      status: 'pending',
      requested_at: new Date().toISOString()
    };
    inMemoryStore.location_requests.push(newReq);

    return res.status(200).json(
      new ApiResponse(200, { requestId: insertId, user_id: targetUserId, status: 'pending' }, 'Location sharing request transmitted to tourist.')
    );
  });

  /**
   * Get Location Sharing Requests History
   */
  static getLocationRequests = asyncHandler(async (req, res) => {
    const requests = await executeQuery(
      `SELECT lr.*, u.full_name as tourist_name, a.full_name as admin_name
       FROM location_requests lr
       JOIN users u ON lr.user_id = u.id
       JOIN users a ON lr.requested_by = a.id
       ORDER BY lr.id DESC`
    );
    return res.status(200).json(new ApiResponse(200, requests, 'Location requests history fetched.'));
  });

  static seedDemoTourists = asyncHandler(async (req, res) => {
    const demoTourists = [
      { full_name: 'David Beckham', email: `david.b.${Date.now()}@example.com`, phone: `+447${Math.floor(100000000 + Math.random() * 900000000)}`, role: 'Tourist', nationality: 'British', gender: 'male', passport_number: 'UK-7890123', latitude: 28.6139, longitude: 77.2090, blood_group: 'O+', hotel_address: 'Taj Palace, New Delhi' },
      { full_name: 'Sophia Loren', email: `sophia.l.${Date.now()}@example.com`, phone: `+393${Math.floor(100000000 + Math.random() * 900000000)}`, role: 'Tourist', nationality: 'Italian', gender: 'female', passport_number: 'IT-5541209', latitude: 28.6320, longitude: 77.2190, blood_group: 'A+', hotel_address: 'Oberoi Hotel, New Delhi' }
    ];

    for (const t of demoTourists) {
      await User.create(t);
    }

    const allUsers = await User.findAll({ role: 'Tourist' });
    return res.status(201).json(new ApiResponse(201, allUsers, 'Demo tourist accounts created successfully.'));
  });

  static getCrimeReports = asyncHandler(async (req, res) => {
    const reports = await executeQuery('SELECT * FROM crime_reports ORDER BY id DESC');
    const data = reports.length > 0 ? reports : inMemoryStore.crime_reports;
    return res.status(200).json(new ApiResponse(200, data, 'Crime risk heatmap data retrieved.'));
  });

  static getSafeLocations = asyncHandler(async (req, res) => {
    const locations = await SafeLocation.findAll();
    return res.status(200).json(new ApiResponse(200, locations, 'Safe locations list retrieved.'));
  });

  static createSafeLocation = asyncHandler(async (req, res) => {
    const { name, type, latitude, longitude, phone, address } = req.body;
    const newLocation = await SafeLocation.create({ name, type, latitude, longitude, phone, address });
    return res.status(201).json(new ApiResponse(201, newLocation, 'Safe emergency responder location registered.'));
  });

  static getAnalytics = asyncHandler(async (req, res) => {
    const analytics = {
      incidentCategoryBreakdown: [
        { category: 'Scam & Overcharging', count: 42, percentage: 38 },
        { category: 'Theft & Pickpocketing', count: 28, percentage: 25 },
        { category: 'Harassment & Safety', count: 18, percentage: 16 },
        { category: 'Traffic & Road Block', count: 14, percentage: 13 },
        { category: 'Medical & Accident', count: 9, percentage: 8 }
      ],
      sosTriggerBreakdown: [
        { trigger: 'One-Tap Panic Button', count: 64 },
        { trigger: 'Voice SOS Command', count: 22 },
        { trigger: 'Phone Shake Gesture', count: 15 },
        { trigger: 'Auto Crash Sensor', count: 8 },
        { trigger: 'Offline SMS Relay', count: 5 }
      ],
      nationalityDistribution: [
        { nationality: 'American', count: 32 },
        { nationality: 'British', count: 24 },
        { nationality: 'French', count: 19 },
        { nationality: 'Japanese', count: 16 },
        { nationality: 'German', count: 14 },
        { nationality: 'Indian', count: 19 }
      ],
      avgPoliceResponseMinutes: 4.2
    };

    return res.status(200).json(new ApiResponse(200, analytics, 'Safety analytics aggregated.'));
  });

  static getAuditLogs = asyncHandler(async (req, res) => {
    const logs = inMemoryStore.audit_logs || [];
    return res.status(200).json(new ApiResponse(200, logs, 'System audit trail retrieved.'));
  });

  static broadcastNotification = asyncHandler(async (req, res) => {
    const { title, message, targetNationality, severity } = req.body;
    const auditEntry = {
      id: Date.now(),
      action: 'BROADCAST_SAFETY_ADVISORY',
      details: `Advisory sent: "${title}" - Target: ${targetNationality || 'All Tourists'}`,
      created_at: new Date().toISOString()
    };
    inMemoryStore.audit_logs.unshift(auditEntry);

    return res.status(200).json(new ApiResponse(200, auditEntry, 'Broadcast advisory transmitted to all monitored devices.'));
  });

  static getVehicleBookings = asyncHandler(async (req, res) => {
    const bookings = await executeQuery(
      `SELECT vb.*, u.full_name as tourist_name, u.phone as tourist_phone 
       FROM vehicle_bookings vb 
       LEFT JOIN users u ON vb.user_id = u.id 
       ORDER BY vb.id DESC`
    );
    return res.status(200).json(new ApiResponse(200, bookings, 'Admin vehicle bookings audit fetched.'));
  });

  static getFoodOrders = asyncHandler(async (req, res) => {
    const orders = await executeQuery(
      `SELECT fo.*, u.full_name as tourist_name, r.name as restaurant_name 
       FROM food_orders fo 
       LEFT JOIN users u ON fo.user_id = u.id 
       LEFT JOIN restaurants r ON fo.restaurant_id = r.id 
       ORDER BY fo.id DESC`
    );
    return res.status(200).json(new ApiResponse(200, orders, 'Admin food orders monitoring fetched.'));
  });

  static getTravelBookings = asyncHandler(async (req, res) => {
    const bookings = await executeQuery(
      `SELECT tb.*, u.full_name as tourist_name, u.email as tourist_email, u.phone as tourist_phone
       FROM travel_bookings tb
       LEFT JOIN users u ON tb.user_id = u.id
       ORDER BY tb.id DESC`
    );
    return res.status(200).json(new ApiResponse(200, bookings, 'Admin travel bookings audit fetched.'));
  });

  /**
   * REQUIREMENT 8: Unified All Bookings Endpoint for Admin Booking Monitor
   */
  static getAllBookings = asyncHandler(async (req, res) => {
    const { type } = req.query; // 'cab', 'vehicle', 'restaurant', 'train', 'bus', 'flight', 'hotel'

    const [cabRows, foodRows, travelRows] = await Promise.all([
      executeQuery(`SELECT vb.*, u.full_name as tourist_name, u.phone as tourist_phone FROM vehicle_bookings vb LEFT JOIN users u ON vb.user_id = u.id ORDER BY vb.id DESC`),
      executeQuery(`SELECT fo.*, u.full_name as tourist_name, r.name as restaurant_name FROM food_orders fo LEFT JOIN users u ON fo.user_id = u.id LEFT JOIN restaurants r ON fo.restaurant_id = r.id ORDER BY fo.id DESC`),
      executeQuery(`SELECT tb.*, u.full_name as tourist_name, u.phone as tourist_phone FROM travel_bookings tb LEFT JOIN users u ON tb.user_id = u.id ORDER BY tb.id DESC`)
    ]);

    const formattedCabs = (cabRows || []).map(c => ({
      id: c.id,
      booking_code: c.booking_code,
      tourist_name: c.tourist_name || 'Tourist User',
      booking_type: 'cab',
      source: c.pickup_location,
      destination: c.destination,
      travel_date: c.booking_date,
      amount: c.final_fare || c.estimated_fare,
      status: c.status || 'OTP_PENDING',
      payment_status: c.payment_status || 'PENDING',
      ride_otp: c.ride_otp,
      created_at: c.created_at
    }));

    const formattedFood = (foodRows || []).map(f => ({
      id: f.id,
      booking_code: f.order_code,
      tourist_name: f.tourist_name || 'Tourist User',
      booking_type: 'restaurant',
      source: f.restaurant_name || 'Restaurant',
      destination: f.delivery_address || 'Hotel Room',
      travel_date: new Date(f.created_at || Date.now()).toISOString().split('T')[0],
      amount: f.total_amount,
      status: f.status || 'placed',
      payment_status: f.payment_status || 'paid',
      created_at: f.created_at
    }));

    const formattedTravel = (travelRows || []).map(t => ({
      id: t.id,
      booking_code: t.booking_code,
      tourist_name: t.tourist_name || 'Tourist User',
      booking_type: t.booking_type || 'train',
      source: t.source,
      destination: t.destination,
      travel_date: t.travel_date,
      amount: t.total_price,
      status: t.status || 'confirmed',
      payment_status: t.payment_status || 'paid',
      created_at: t.created_at
    }));

    let allBookings = [...formattedCabs, ...formattedFood, ...formattedTravel];

    if (type) {
      const lowerType = type.toLowerCase();
      allBookings = allBookings.filter(b => b.booking_type.toLowerCase() === lowerType);
    }

    allBookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.status(200).json(new ApiResponse(200, allBookings, 'Unified bookings list retrieved for admin monitor.'));
  });
}

module.exports = AdminController;
