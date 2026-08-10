const IncidentReport = require('../models/IncidentReport');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

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
    return res.status(200).json(new ApiResponse(200, updated, `Incident status updated to ${status}.`));
  });
}

module.exports = IncidentController;
