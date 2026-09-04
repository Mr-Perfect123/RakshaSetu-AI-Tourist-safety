const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const { executeQuery, inMemoryStore } = require('../config/database');
const SafetyDataService = require('../services/safety/safetyDataService');
const SafetyDataSyncService = require('../services/safetyDataSyncService');

class ZoneController {
  /**
   * Get dynamic safety & hazard zones with viewport bounding-box and category/severity filtering
   */
  static getDangerZones = asyncHandler(async (req, res) => {
    const showAll = req.query.all === 'true' || req.query.all === true;
    const { minLat, maxLat, minLng, maxLng, type, category, severity, status, verified, is_verified, country, source, limit, offset } = req.query;

    const zones = await SafetyDataService.getZones({
      minLat,
      maxLat,
      minLng,
      maxLng,
      category,
      type,
      severity,
      status,
      isVerified: is_verified !== undefined ? is_verified : verified,
      country,
      source,
      showAll,
      limit,
      offset
    });

    return res.status(200).json(new ApiResponse(200, zones, 'Safety zones retrieved successfully.'));
  });

  /**
   * Get single danger zone by ID
   */
  static getDangerZoneById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const zone = await SafetyDataService.getZoneById(id);
    if (!zone) {
      throw new ApiError(404, 'Safety zone not found.');
    }
    return res.status(200).json(new ApiResponse(200, zone, 'Safety zone details retrieved.'));
  });

  /**
   * Create new safety/danger zone (Admin/Police)
   */
  static createDangerZone = asyncHandler(async (req, res) => {
    const newZone = await SafetyDataService.createZone(req.body);
    return res.status(201).json(new ApiResponse(201, newZone, 'Safety zone registered successfully.'));
  });

  /**
   * Update existing danger zone (Admin/Police)
   */
  static updateDangerZone = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updated = await SafetyDataService.updateZone(id, req.body);
    if (!updated) {
      throw new ApiError(404, 'Safety zone not found.');
    }
    return res.status(200).json(new ApiResponse(200, updated, 'Safety zone updated successfully.'));
  });

  /**
   * Analyze safety score of a proposed travel route against active verified hazard perimeters
   */
  static analyzeRouteSafety = asyncHandler(async (req, res) => {
    const { routeCoordinates } = req.body;

    if (!Array.isArray(routeCoordinates) || routeCoordinates.length === 0) {
      throw new ApiError(400, 'routeCoordinates array is required for safety analysis.');
    }

    const analysis = await SafetyDataService.analyzeRouteSafety(routeCoordinates);
    return res.status(200).json(new ApiResponse(200, analysis, 'Route safety analysis completed.'));
  });

  /**
   * Delete danger zone (Admin/Police)
   */
  static deleteDangerZone = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
      await executeQuery('DELETE FROM danger_zones WHERE id = ?', [id]);
    } catch {
      inMemoryStore.danger_zones = inMemoryStore.danger_zones.filter(z => z.id !== parseInt(id, 10));
    }
    return res.status(200).json(new ApiResponse(200, { id: parseInt(id, 10) }, 'Safety zone removed successfully.'));
  });

  /**
   * Toggle danger zone active status (Admin/Police)
   */
  static toggleDangerZone = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
      await executeQuery(`UPDATE danger_zones SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?`, [id]);
      const updated = await executeQuery('SELECT * FROM danger_zones WHERE id = ?', [id]);
      return res.status(200).json(new ApiResponse(200, updated[0] || null, 'Safety zone status toggled.'));
    } catch {
      const z = inMemoryStore.danger_zones.find(item => item.id === parseInt(id, 10));
      if (z) {
        z.is_active = z.is_active === 1 || z.is_active === true ? 0 : 1;
        z.updated_at = new Date().toISOString();
      }
      return res.status(200).json(new ApiResponse(200, z || null, 'Safety zone status toggled.'));
    }
  });

  /**
   * Trigger safety data ingestion sync from external feeds (USGS, GDACS, Curated Feeds)
   */
  static syncDangerZones = asyncHandler(async (req, res) => {
    const result = await SafetyDataSyncService.syncAllSources();
    return res.status(200).json(
      new ApiResponse(200, result, 'Safety and hazard feed synchronization completed successfully.')
    );
  });
}

module.exports = ZoneController;
