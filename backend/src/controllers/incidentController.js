const IncidentReport = require('../models/IncidentReport');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const CommunitySafetyService = require('../services/safety/communitySafetyService');

class IncidentController {
  static createReport = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { category, title, description, severity, latitude, longitude, locationName } = req.body;

    let imageUrls = [];
    if (req.files && req.files.images) {
      imageUrls = req.files.images.map((f) => `/uploads/${f.filename}`);
    }

    let videoUrls = [];
    if (req.files && req.files.videos) {
      videoUrls = req.files.videos.map((f) => `/uploads/${f.filename}`);
    }

    const report = await IncidentReport.create({
      userId,
      category,
      title,
      description,
      severity,
      latitude,
      longitude,
      locationName,
      imageUrls,
      videoUrls
    });

    // Broadcast incident activity to Admin Dashboard
    try {
      const { broadcastTouristActivity } = require('../socket/sosSocket');
      broadcastTouristActivity({
        id: report.id || Date.now(),
        type: 'incident_report',
        title: `Incident Report (${severity ? severity.toUpperCase() : 'MEDIUM'})`,
        description: `${title || category}: ${description || 'No description'} @ ${locationName || 'GPS Location'}`,
        touristName: req.user?.full_name || 'Tourist User',
        touristPhone: req.user?.phone || '+919876543210',
        details: report
      });
    } catch (err) {}

    return res.status(201).json(new ApiResponse(201, report, 'Incident report submitted successfully for review.'));
  });

  static getAllReports = asyncHandler(async (req, res) => {
    const { category, status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const reports = await IncidentReport.findAll({ category, status, limit: parseInt(limit), offset });
    return res.status(200).json(new ApiResponse(200, reports, 'Incident reports retrieved.'));
  });

  static getReportById = asyncHandler(async (req, res) => {
    const report = await IncidentReport.findById(req.params.id);
    if (!report) {
      throw new ApiError(404, 'Incident report not found.');
    }
    return res.status(200).json(new ApiResponse(200, report, 'Incident report details.'));
  });

  static updateReportStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const report = await IncidentReport.findById(id);
    if (!report) {
      throw new ApiError(404, 'Incident report not found.');
    }

    const updated = await IncidentReport.updateStatus(id, status, req.user.id);

    // Automatic Verified Incident -> Danger Zone conversion processor
    const IncidentZoneService = require('../services/incidentZoneService');
    let conversionResult = null;

    if (status === 'verified') {
      try {
        conversionResult = await IncidentZoneService.processVerifiedIncident(updated, req.user.id);
      } catch (zoneErr) {
        console.warn('[IncidentController] Warning: Could not process automatic danger zone conversion:', zoneErr.message);
      }
    } else if (status === 'rejected' || status === 'dismissed') {
      try {
        await IncidentZoneService.deactivateZoneForIncident(id);
      } catch (err) {}
    }

    // Check clustering recommendation
    let clusterRecommendation = null;
    if (status === 'verified') {
      const cLat = parseFloat(updated.latitude);
      const cLng = parseFloat(updated.longitude);
      const category = updated.category;

      const allIncidents = await IncidentReport.findAll({ status: 'verified', limit: 1000 });
      const calculateDist = (lat1, lon1, lat2, lon2) => {
        const R = 6371000;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      const nearby = allIncidents.filter(inc => {
        return calculateDist(cLat, cLng, parseFloat(inc.latitude), parseFloat(inc.longitude)) <= 500;
      });

      if (nearby.length >= 3) {
        clusterRecommendation = {
          clusterDetected: true,
          incidentCount: nearby.length,
          recommendedName: `Emerging ${category || 'Safety'} Risk Area`,
          recommendedRadius: 400,
          recommendedSeverity: nearby.length >= 5 ? 'high' : 'moderate'
        };
      }
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          report: updated,
          zoneCreated: conversionResult?.zoneCreated || false,
          zoneUpdated: conversionResult?.zoneUpdated || false,
          safetyZone: conversionResult?.zone || null,
          conversionReason: conversionResult?.reason || `Incident status updated to ${status}.`,
          clusterRecommendation
        },
        `Incident status updated to ${status}.`
      )
    );
  });

  static getClusterRecommendation = asyncHandler(async (req, res) => {
    const { lat, lng, category } = req.query;
    if (!lat || !lng) {
      throw new ApiError(400, 'lat and lng parameters are required.');
    }

    const cLat = parseFloat(lat);
    const cLng = parseFloat(lng);

    const allIncidents = await IncidentReport.findAll({ status: 'verified', limit: 1000 });

    const calculateDist = (lat1, lon1, lat2, lon2) => {
      const R = 6371000;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const nearby = allIncidents.filter(inc => {
      if (category && inc.category !== category) return false;
      const distance = calculateDist(cLat, cLng, parseFloat(inc.latitude), parseFloat(inc.longitude));
      return distance <= 500;
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          clusterDetected: nearby.length >= 3,
          incidentCount: nearby.length,
          incidents: nearby,
          recommendedName: `Emerging ${category || 'Safety'} Risk Area`,
          recommendedRadius: 400,
          recommendedSeverity: nearby.length >= 5 ? 'high' : 'moderate'
        },
        'Cluster recommendation retrieved.'
      )
    );
  });
}

module.exports = IncidentController;
