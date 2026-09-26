const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const TemporaryAlertService = require('../services/temporaryAlertService');

class TemporaryAlertController {
  /**
   * GET /api/v1/temporary-alerts/active
   * Public / Tourist Endpoint - Returns ONLY currently active and non-expired alerts
   */
  static getActiveAlerts = asyncHandler(async (req, res) => {
    const { minLat, maxLat, minLng, maxLng, alertType, severity, limit, offset } = req.query;

    const alerts = await TemporaryAlertService.getActiveAlerts({
      minLat,
      maxLat,
      minLng,
      maxLng,
      alertType,
      severity,
      limit,
      offset
    });

    return res.status(200).json(
      new ApiResponse(200, alerts, 'Active temporary safety alerts retrieved successfully.')
    );
  });

  /**
   * GET /api/v1/temporary-alerts
   * Admin Endpoint - Returns all alerts with status filter tabs (active, draft, resolved, expired, disabled, all)
   */
  static getAllAlerts = asyncHandler(async (req, res) => {
    const { status, alertType, severity, search, limit, offset } = req.query;

    const alerts = await TemporaryAlertService.getAllAlerts({
      status: status || 'ALL',
      alertType,
      severity,
      search,
      limit,
      offset
    });

    return res.status(200).json(
      new ApiResponse(200, alerts, 'Temporary safety alerts list retrieved.')
    );
  });

  /**
   * GET /api/v1/temporary-alerts/:id
   * Public / Admin Details Endpoint
   */
  static getAlertById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const alert = await TemporaryAlertService.getAlertById(id);

    if (!alert) {
      throw new ApiError(404, 'Temporary safety alert not found.');
    }

    return res.status(200).json(
      new ApiResponse(200, alert, 'Temporary safety alert details retrieved.')
    );
  });

  /**
   * POST /api/v1/temporary-alerts
   * Admin / Police - Create & publish temporary alert
   */
  static createAlert = asyncHandler(async (req, res) => {
    const createdBy = req.user?.id ? parseInt(req.user.id, 10) : null;
    const newAlert = await TemporaryAlertService.createAlert(req.body, createdBy);

    return res.status(201).json(
      new ApiResponse(201, newAlert, 'Temporary safety alert registered successfully.')
    );
  });

  /**
   * PUT /api/v1/temporary-alerts/:id
   * Admin / Police - Update existing temporary alert
   */
  static updateAlert = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updated = await TemporaryAlertService.updateAlert(id, req.body);

    if (!updated) {
      throw new ApiError(404, 'Temporary safety alert not found.');
    }

    return res.status(200).json(
      new ApiResponse(200, updated, 'Temporary safety alert updated successfully.')
    );
  });

  /**
   * PATCH /api/v1/temporary-alerts/:id/resolve
   * Admin / Police - Manual resolve alert immediately (ACTIVE -> RESOLVED)
   */
  static resolveAlert = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const resolved = await TemporaryAlertService.resolveAlert(id);

    if (!resolved) {
      throw new ApiError(404, 'Temporary safety alert not found.');
    }

    return res.status(200).json(
      new ApiResponse(200, resolved, 'Temporary safety alert marked as RESOLVED.')
    );
  });

  /**
   * POST or PATCH /api/v1/temporary-alerts/:id/extend
   * Admin / Police - Extend alert expiration time
   */
  static extendAlert = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { expires_at, expiresAt, valid_until, hours, days, minutes, extension_reason } = req.body;
    let newExpiry = expires_at || expiresAt || valid_until;

    if (!newExpiry && (hours || days || minutes)) {
      const existing = await TemporaryAlertService.getAlertById(id);
      const baseTime = (existing && existing.expires_at) ? new Date(existing.expires_at).getTime() : Date.now();
      const addMs = ((parseFloat(hours) || 0) * 3600 + (parseFloat(days) || 0) * 86400 + (parseFloat(minutes) || 0) * 60) * 1000;
      newExpiry = new Date(Math.max(baseTime, Date.now()) + (addMs > 0 ? addMs : 3600 * 1000)).toISOString();
    }

    if (!newExpiry) {
      throw new ApiError(400, 'expires_at timestamp or hours parameter is required.');
    }

    const extended = await TemporaryAlertService.extendAlert(id, newExpiry, extension_reason);

    if (!extended) {
      throw new ApiError(404, 'Temporary safety alert not found.');
    }

    return res.status(200).json(
      new ApiResponse(200, extended, 'Temporary safety alert validity extended.')
    );
  });

  /**
   * PATCH /api/v1/temporary-alerts/:id/disable
   * Admin / Police - Disable alert (ACTIVE -> DISABLED)
   */
  static disableAlert = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const disabled = await TemporaryAlertService.disableAlert(id);

    if (!disabled) {
      throw new ApiError(404, 'Temporary safety alert not found.');
    }

    return res.status(200).json(
      new ApiResponse(200, disabled, 'Temporary safety alert disabled.')
    );
  });

  /**
   * PATCH /api/v1/temporary-alerts/:id/activate
   * Admin / Police - Activate alert (DRAFT/DISABLED -> ACTIVE)
   */
  static activateAlert = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const activated = await TemporaryAlertService.activateAlert(id);

    if (!activated) {
      throw new ApiError(404, 'Temporary safety alert not found.');
    }

    return res.status(200).json(
      new ApiResponse(200, activated, 'Temporary safety alert activated.')
    );
  });

  /**
   * PATCH/POST /api/v1/temporary-alerts/:id/status
   */
  static updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (status === 'ACTIVE') {
      const activated = await TemporaryAlertService.activateAlert(id);
      return res.status(200).json(new ApiResponse(200, activated, 'Temporary safety alert activated.'));
    } else if (status === 'DISABLED') {
      const disabled = await TemporaryAlertService.disableAlert(id);
      return res.status(200).json(new ApiResponse(200, disabled, 'Temporary safety alert disabled.'));
    } else if (status === 'RESOLVED') {
      const resolved = await TemporaryAlertService.resolveAlert(id, req.body.resolution_notes);
      return res.status(200).json(new ApiResponse(200, resolved, 'Temporary safety alert resolved.'));
    }
    const updated = await TemporaryAlertService.updateAlert(id, { status });
    return res.status(200).json(new ApiResponse(200, updated, 'Temporary safety alert status updated.'));
  });

  /**
   * DELETE /api/v1/temporary-alerts/:id
   * Admin / Police - Permanent deletion
   */
  static deleteAlert = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await TemporaryAlertService.deleteAlert(id);

    return res.status(200).json(
      new ApiResponse(200, result, 'Temporary safety alert deleted permanently.')
    );
  });
}

module.exports = TemporaryAlertController;
