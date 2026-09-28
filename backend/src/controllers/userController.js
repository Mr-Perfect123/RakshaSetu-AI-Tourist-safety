const EmergencyContact = require('../models/EmergencyContact');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const textBeeService = require('../services/textBeeService');

class UserController {
  /**
   * Get all emergency contacts for the authenticated user
   */
  static getEmergencyContacts = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    let contacts = await EmergencyContact.findByUserId(userId);
    if (!contacts || contacts.length === 0) {
      if (req.user?.emergency_contacts) {
        let parsed = req.user.emergency_contacts;
        if (typeof parsed === 'string') {
          try { parsed = JSON.parse(parsed); } catch (_) { parsed = []; }
        }
        if (Array.isArray(parsed) && parsed.length > 0) {
          contacts = parsed.map((c, idx) => ({
            id: c.id || idx + 1,
            user_id: userId,
            contact_name: c.name || c.contact_name || 'Emergency Contact',
            contact_phone: c.phone || c.contact_phone,
            relationship: c.relationship || 'Family',
            is_primary: c.is_primary ? 1 : 0
          }));
        }
      }
      if ((!contacts || contacts.length === 0) && req.user?.emergency_contact_phone) {
        contacts = [{
          id: 1,
          user_id: userId,
          contact_name: req.user.emergency_contact_name || 'Emergency Contact',
          contact_phone: req.user.emergency_contact_phone,
          relationship: 'Primary Contact',
          is_primary: 1
        }];
      }
    }
    return res.status(200).json(
      new ApiResponse(200, contacts || [], 'Emergency contacts retrieved successfully.')
    );
  });

  /**
   * Add a new emergency contact for the authenticated user
   */
  static addEmergencyContact = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { executeQuery } = require('../config/database');
    const contactName = req.body.contactName || req.body.contact_name || req.body.name;
    let contactPhone = req.body.contactPhone || req.body.contact_phone || req.body.phone;
    const relationship = req.body.relationship || 'Family';
    const email = req.body.email || null;
    const isPrimary = Boolean(req.body.isPrimary || req.body.is_primary);

    if (!contactName || !contactPhone) {
      throw new ApiError(400, 'Contact name and contact phone number are required.');
    }

    // Normalize phone number if possible
    try {
      const norm = textBeeService.normalizeToE164(contactPhone);
      if (norm.valid) {
        contactPhone = norm.formattedNumber;
      }
    } catch (_) {}

    const created = await EmergencyContact.create({
      userId,
      contactName,
      contactPhone,
      relationship,
      email,
      isPrimary
    });

    // Synchronize full contact list to users table emergency_contacts JSON array and primary fields
    try {
      const allContacts = await EmergencyContact.findByUserId(userId);
      const contactsArray = (allContacts || []).map(c => ({
        id: c.id,
        name: c.contact_name,
        phone: c.contact_phone,
        relationship: c.relationship,
        is_primary: Boolean(c.is_primary)
      }));

      const primary = contactsArray.find(c => c.is_primary) || contactsArray[0] || { name: contactName, phone: contactPhone };

      await executeQuery(
        `UPDATE users SET emergency_contacts = ?, emergency_contact_phone = ?, emergency_contact_name = ? WHERE id = ?`,
        [JSON.stringify(contactsArray), primary.phone, primary.name, userId]
      );
    } catch (err) {
      console.warn('[UserController] Warning syncing emergency_contacts array:', err.message);
    }

    return res.status(201).json(
      new ApiResponse(201, created, 'Emergency contact created successfully.')
    );
  });

  /**
   * Delete an emergency contact
   */
  static deleteEmergencyContact = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const contactId = req.params.id;
    const { executeQuery } = require('../config/database');

    if (!contactId) {
      throw new ApiError(400, 'Contact ID is required.');
    }

    await EmergencyContact.delete(contactId, userId);

    // Synchronize remaining contacts back into users table
    try {
      const allContacts = await EmergencyContact.findByUserId(userId);
      const contactsArray = (allContacts || []).map(c => ({
        id: c.id,
        name: c.contact_name,
        phone: c.contact_phone,
        relationship: c.relationship,
        is_primary: Boolean(c.is_primary)
      }));

      const primary = contactsArray.find(c => c.is_primary) || contactsArray[0] || null;

      await executeQuery(
        `UPDATE users SET emergency_contacts = ?, emergency_contact_phone = ?, emergency_contact_name = ? WHERE id = ?`,
        [
          contactsArray.length > 0 ? JSON.stringify(contactsArray) : null,
          primary ? primary.phone : null,
          primary ? primary.name : null,
          userId
        ]
      );
    } catch (err) {
      console.warn('[UserController] Warning updating emergency_contacts array on delete:', err.message);
    }

    return res.status(200).json(
      new ApiResponse(200, { id: contactId }, 'Emergency contact deleted successfully.')
    );
  });
}

module.exports = UserController;
