const SosRequest = require('../models/SosRequest');
const EmergencyContact = require('../models/EmergencyContact');
const NotificationService = require('../services/notificationService');
const { broadcastSosAlert, broadcastSosStatusChange } = require('../socket/sosSocket');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

class SosController {
  static triggerSos = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { latitude, longitude, address, triggerType = 'one_tap', audioRecordingUrl } = req.body;

    const sos = await SosRequest.create({
      userId,
      triggerType,
      latitude,
      longitude,
      address: address || `Lat: ${latitude}, Lng: ${longitude}`,
      audioRecordingUrl
    });

    const touristName = req.user?.full_name || sos.tourist_name || 'Tourist User';
    const touristPhone = req.user?.phone || sos.tourist_phone || '+91 98765 43210';
    const touristEmail = req.user?.email || sos.tourist_email || '';
    const nationality = req.user?.nationality || sos.nationality || 'India';
    const bloodGroup = req.user?.blood_group || sos.blood_group || 'O+';
    const emergencyMedicalInfo = req.user?.emergency_medical_info || sos.emergency_medical_info || 'None reported';

    // Fetch Emergency Contacts to send SMS & Push
    const contacts = await EmergencyContact.findByUserId(userId);
    NotificationService.notifyEmergencyContacts(contacts, touristName, latitude, longitude, sos.sos_code);
    NotificationService.notifyAdminsOfSos(touristName, latitude, longitude, sos.sos_code, address);

    // Broadcast live alert to Admin, Police & Hospital WebSocket Dashboards
    broadcastSosAlert({
      ...sos,
      touristName,
      tourist_name: touristName,
      touristPhone,
      phone: touristPhone,
      tourist_phone: touristPhone,
      touristEmail,
      nationality,
      bloodGroup,
      emergencyMedicalInfo,
      address: address || sos.address || `Lat: ${latitude}, Lng: ${longitude}`,
      trigger_type: triggerType,
      status: 'active'
    });

    try {
      const { broadcastTouristActivity } = require('../socket/sosSocket');
      broadcastTouristActivity({
        id: sos.id || Date.now(),
        type: 'sos_alert',
        title: `🚨 SOS Emergency Triggered (${sos.sos_code || 'ACTIVE'})`,
        description: `Tourist: ${touristName} (${touristPhone}) • Location: ${address || `Lat: ${latitude}, Lng: ${longitude}`}`,
        touristName,
        touristPhone,
        details: {
          ...sos,
          touristName,
          touristPhone,
          nationality,
          bloodGroup
        }
      });
    } catch (err) {}

    return res.status(201).json(
      new ApiResponse(201, {
        ...sos,
        tourist_name: touristName,
        tourist_phone: touristPhone,
        nationality,
        emergency_medical_info: emergencyMedicalInfo,
        blood_group: bloodGroup
      }, '🚨 EMERGENCY SOS DISPATCHED SUCCESSFUL! First Responders & Emergency Contacts Notified.')
    );
  });

  static getActiveSos = asyncHandler(async (req, res) => {
    const activeRequests = await SosRequest.findActive();
    return res.status(200).json(new ApiResponse(200, activeRequests, 'Active emergency SOS requests retrieved.'));
  });

  static getUserSosHistory = asyncHandler(async (req, res) => {
    const history = await SosRequest.findByUserId(req.user.id);
    return res.status(200).json(new ApiResponse(200, history, 'User SOS emergency history retrieved.'));
  });

  static updateSosStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, assignedPoliceId, assignedHospitalId, resolutionNotes } = req.body;

    const sos = await SosRequest.findById(id);
    if (!sos) {
      throw new ApiError(404, 'SOS Request record not found.');
    }

    const updatedSos = await SosRequest.updateStatus(id, status, assignedPoliceId, assignedHospitalId, resolutionNotes);
    broadcastSosStatusChange(id, status, { resolutionNotes });

    return res.status(200).json(new ApiResponse(200, updatedSos, `SOS status updated to ${status}.`));
  });

  static cancelSos = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const sos = await SosRequest.findById(id);
    if (!sos) {
      throw new ApiError(404, 'SOS request not found.');
    }

    if (sos.user_id !== req.user.id && req.user.role !== 'Admin') {
      throw new ApiError(403, 'Unauthorized to cancel this SOS alert.');
    }

    const cancelledSos = await SosRequest.updateStatus(id, 'cancelled', null, null, 'Cancelled by user');
    broadcastSosStatusChange(id, 'cancelled');

    return res.status(200).json(new ApiResponse(200, cancelledSos, 'SOS alert successfully cancelled.'));
  });
}

module.exports = SosController;
