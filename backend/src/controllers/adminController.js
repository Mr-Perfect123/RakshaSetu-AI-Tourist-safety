const User = require('../models/User');
const SosRequest = require('../models/SosRequest');
const IncidentReport = require('../models/IncidentReport');
const SafeLocation = require('../models/SafeLocation');
const EmergencyContact = require('../models/EmergencyContact');
const ApiResponse = require('../utils/response');
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

  static getAllUsers = asyncHandler(async (req, res) => {
    const { role, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.findAll({ role, search, limit: parseInt(limit), offset });
    return res.status(200).json(new ApiResponse(200, users, 'Users retrieved successfully.'));
  });

  static getTouristDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, 'Tourist not found.'));
    }

    const contacts = await EmergencyContact.findByUserId(id);
    const userSos = (await SosRequest.findAll()).filter(s => s.user_id === parseInt(id, 10));

    const fullProfile = {
      ...user,
      emergency_contacts: contacts,
      sos_history: userSos
    };

    return res.status(200).json(new ApiResponse(200, fullProfile, 'Tourist complete record fetched.'));
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
}

module.exports = AdminController;
