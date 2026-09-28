const SosRequest = require('../models/SosRequest');
const EmergencyContact = require('../models/EmergencyContact');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');
const { broadcastSosAlert, broadcastSosStatusChange } = require('../socket/sosSocket');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

class SosController {
  static triggerSos = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {
      latitude,
      longitude,
      address,
      triggerType = 'one_tap',
      audioRecordingUrl,
      dangerZoneId,
      dangerType,
      severity,
      event: sosEvent
    } = req.body;

    const sos = await SosRequest.create({
      userId,
      triggerType,
      latitude,
      longitude,
      address: address || `Lat: ${latitude}, Lng: ${longitude}`,
      audioRecordingUrl,
      dangerZoneId,
      dangerType,
      severity
    });

    const touristName = req.user?.full_name || sos.tourist_name || 'Tourist User';
    const touristPhone = req.user?.phone || sos.tourist_phone || '+91 98765 43210';
    const touristEmail = req.user?.email || sos.tourist_email || '';
    const nationality = req.user?.nationality || sos.nationality || 'India';
    const bloodGroup = req.user?.blood_group || sos.blood_group || 'O+';
    const emergencyMedicalInfo = req.user?.emergency_medical_info || sos.emergency_medical_info || 'None reported';

    // Fetch Emergency Contacts to send SMS & Push
    let contacts = await EmergencyContact.findByUserId(userId);
    if (!Array.isArray(contacts)) contacts = [];

    // Also fetch fresh user to get latest emergency_contacts JSON array & phone
    let dbUser = req.user;
    if (userId) {
      try {
        const fresh = await User.findById(userId);
        if (fresh) dbUser = fresh;
      } catch (_) {}
    }

    // Merge contacts from users.emergency_contacts JSON array
    if (dbUser?.emergency_contacts) {
      let extraContacts = dbUser.emergency_contacts;
      if (typeof extraContacts === 'string') {
        try {
          extraContacts = JSON.parse(extraContacts);
        } catch (_) {
          extraContacts = [];
        }
      }
      if (Array.isArray(extraContacts)) {
        for (const ec of extraContacts) {
          const ph = ec.phone || ec.contact_phone;
          if (ph && !contacts.some(c => (c.contact_phone || c.phone) === ph)) {
            contacts.push({
              contact_name: ec.name || ec.contact_name || 'Emergency Contact',
              contact_phone: ph,
              relationship: ec.relationship || 'Family',
              is_primary: Boolean(ec.is_primary)
            });
          }
        }
      }
    }

    // Also include direct emergency contact from users table if configured
    const userEmergencyPhone = dbUser?.emergency_contact_phone;
    const userEmergencyName = dbUser?.emergency_contact_name || 'Emergency Contact';
    if (userEmergencyPhone) {
      const alreadyIncluded = contacts.some(c => (c.contact_phone || c.phone) === userEmergencyPhone);
      if (!alreadyIncluded) {
        contacts.unshift({
          contact_name: userEmergencyName,
          contact_phone: userEmergencyPhone,
          relationship: 'Primary Contact',
          is_primary: 1
        });
      }
    }

    if (contacts.length === 0 && touristPhone) {
      contacts = [
        {
          contact_name: touristName,
          contact_phone: touristPhone,
          relationship: 'Self'
        }
      ];
    }
    NotificationService.notifyEmergencyContacts(contacts, touristName, latitude, longitude, sos.sos_code, {
      userId,
      customerId: userId,
      userPhone: touristPhone,
      emergencyType: dangerType || triggerType || 'SOS Emergency',
      sosId: sos.id,
      address
    }).catch(() => {});
    NotificationService.notifyAdminsOfSos(touristName, latitude, longitude, sos.sos_code, address);

    const dangerInfoPrefix = dangerType ? `[⚠️ DANGER ZONE: ${dangerType} (${severity || 'HIGH'})] ` : '';

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
      dangerZoneId: dangerZoneId || null,
      dangerType: dangerType || null,
      severity: severity || null,
      event: sosEvent || 'SOS_TRIGGERED',
      status: 'active'
    });

    try {
      const { broadcastTouristActivity } = require('../socket/sosSocket');
      broadcastTouristActivity({
        id: sos.id || Date.now(),
        type: 'sos_alert',
        title: `🚨 ${dangerInfoPrefix}SOS Emergency Triggered (${sos.sos_code || 'ACTIVE'})`,
        description: `Tourist: ${touristName} (${touristPhone}) • Location: ${address || `Lat: ${latitude}, Lng: ${longitude}`}${dangerType ? ` • In Hazard Zone: ${dangerType}` : ''}`,
        touristName,
        touristPhone,
        details: {
          ...sos,
          touristName,
          touristPhone,
          nationality,
          bloodGroup,
          dangerZoneId,
          dangerType,
          severity
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
