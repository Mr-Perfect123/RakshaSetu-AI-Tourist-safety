const User = require('../models/User');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { executeQuery } = require('../config/database');

class TouristController {
  /**
   * Get Current Tourist Full Profile
   */
  static getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'Tourist user profile not found.');

    const healthRows = await executeQuery(`SELECT * FROM tourist_health WHERE user_id = ? LIMIT 1`, [userId]);
    const docRows = await executeQuery(`SELECT * FROM tourist_documents WHERE user_id = ? ORDER BY id DESC LIMIT 1`, [userId]);
    let contactRows = await executeQuery(`SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY is_primary DESC, id ASC`, [userId]);
    const permRows = await executeQuery(`SELECT * FROM location_permissions WHERE user_id = ? LIMIT 1`, [userId]);

    // If emergency_contacts table is empty, fallback to users.emergency_contacts JSON array or primary fields
    if (!contactRows || contactRows.length === 0) {
      if (user.emergency_contacts) {
        let parsed = user.emergency_contacts;
        if (typeof parsed === 'string') {
          try { parsed = JSON.parse(parsed); } catch (_) { parsed = []; }
        }
        if (Array.isArray(parsed) && parsed.length > 0) {
          contactRows = parsed.map((c, i) => ({
            id: c.id || i + 1,
            user_id: userId,
            contact_name: c.name || c.contact_name || 'Emergency Contact',
            contact_phone: c.phone || c.contact_phone,
            relationship: c.relationship || 'Family',
            is_primary: c.is_primary ? 1 : 0
          }));
        }
      }
      if ((!contactRows || contactRows.length === 0) && user.emergency_contact_phone) {
        contactRows = [{
          id: 1,
          user_id: userId,
          contact_name: user.emergency_contact_name || 'Emergency Contact',
          contact_phone: user.emergency_contact_phone,
          relationship: 'Primary Contact',
          is_primary: 1
        }];
      }
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          nationality: user.nationality,
          passport_number: user.passport_number,
          emergency_contact_name: user.emergency_contact_name || (contactRows[0]?.contact_name) || null,
          emergency_contact_phone: user.emergency_contact_phone || (contactRows[0]?.contact_phone) || null,
          health: healthRows[0] || null,
          identity_document: docRows[0] || null,
          emergency_contacts: contactRows || [],
          location_permission: permRows[0] || null
        },
        'Tourist profile details fetched successfully.'
      )
    );
  });

  /**
   * Update Tourist Profile Details
   */
  static updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {
      full_name,
      phone,
      gender,
      nationality,
      passport_number,
      dob,
      blood_group,
      medical_conditions,
      allergies,
      emergency_notes,
      preferred_language,
      emergency_contact_phone,
      emergency_contact_name
    } = req.body;

    await User.updateProfile(userId, {
      full_name,
      phone,
      gender,
      nationality,
      passport_number,
      emergency_contact_phone,
      emergency_contact_name
    });

    // Keep emergency_contacts table & users.emergency_contacts JSON synchronized with primary contact
    if (emergency_contact_phone) {
      const existingContacts = await executeQuery(
        `SELECT id FROM emergency_contacts WHERE user_id = ? AND is_primary = TRUE LIMIT 1`,
        [userId]
      );
      if (existingContacts && existingContacts.length > 0) {
        await executeQuery(
          `UPDATE emergency_contacts SET contact_phone = ?, contact_name = ? WHERE id = ?`,
          [emergency_contact_phone, emergency_contact_name || 'Emergency Contact', existingContacts[0].id]
        );
      } else {
        await executeQuery(
          `INSERT INTO emergency_contacts (user_id, contact_name, contact_phone, relationship, is_primary) VALUES (?, ?, ?, 'Primary Contact', TRUE)`,
          [userId, emergency_contact_name || 'Emergency Contact', emergency_contact_phone]
        );
      }

      // Synchronize back into users.emergency_contacts JSON array
      try {
        const allContacts = await executeQuery(`SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY is_primary DESC, id ASC`, [userId]);
        const contactsArray = (allContacts || []).map(c => ({
          id: c.id,
          name: c.contact_name,
          phone: c.contact_phone,
          relationship: c.relationship,
          is_primary: Boolean(c.is_primary)
        }));
        await executeQuery(`UPDATE users SET emergency_contacts = ? WHERE id = ?`, [JSON.stringify(contactsArray), userId]);
      } catch (err) {
        console.warn('[TouristController] Warning updating emergency_contacts JSON:', err.message);
      }
    }

    if (dob) {
      await executeQuery(`UPDATE users SET dob = ? WHERE id = ?`, [dob, userId]);
    }

    if (preferred_language) {
      await executeQuery(
        `INSERT INTO tourists (user_id, preferred_language)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE preferred_language = VALUES(preferred_language)`,
        [userId, preferred_language]
      );
    }

    if (blood_group || medical_conditions || allergies || emergency_notes) {
      await executeQuery(
        `INSERT INTO tourist_health (user_id, blood_group, medical_conditions, allergies, emergency_notes)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE blood_group = VALUES(blood_group), medical_conditions = VALUES(medical_conditions), allergies = VALUES(allergies), emergency_notes = VALUES(emergency_notes)`,
        [userId, blood_group || 'Prefer not to disclose', medical_conditions || null, allergies || null, emergency_notes || null]
      );
    }

    const updatedUser = await User.findById(userId);
    return res.status(200).json(new ApiResponse(200, updatedUser, 'Profile updated successfully.'));
  });

  /**
   * Upload Profile Photo
   */
  static uploadPhoto = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    if (!req.file) throw new ApiError(400, 'Photo image file is required.');

    const profile_image_path = `/uploads/profiles/${req.file.filename}`;
    await executeQuery(`UPDATE users SET profile_image = ?, profile_image_path = ? WHERE id = ?`, [profile_image_path, profile_image_path, userId]);

    return res.status(200).json(
      new ApiResponse(200, { profile_image_path }, 'Tourist photo uploaded successfully.')
    );
  });

  /**
   * Upload Government ID Proof Document
   */
  static uploadIdProof = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id_type, id_number } = req.body;
    if (!req.file) throw new ApiError(400, 'Government ID proof document file is required.');

    const document_path = `/uploads/documents/${req.file.filename}`;
    await executeQuery(
      `UPDATE users SET id_type = ?, id_number = ?, id_proof_url = ?, id_verification_status = 'pending' WHERE id = ?`,
      [id_type || 'Government ID', id_number || 'REG-99', document_path, userId]
    );

    await executeQuery(
      `INSERT INTO tourist_documents (user_id, id_type, id_number, document_path, verification_status) VALUES (?, ?, ?, ?, 'pending')`,
      [userId, id_type || 'Government ID', id_number || 'REG-99', document_path]
    );

    return res.status(200).json(
      new ApiResponse(200, { document_path, id_verification_status: 'pending' }, 'Government ID proof uploaded successfully.')
    );
  });

  /**
   * Get Tourist Verification Checklist Status
   */
  static getVerificationStatus = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const docRows = await executeQuery(`SELECT verification_status FROM tourist_documents WHERE user_id = ? ORDER BY id DESC LIMIT 1`, [userId]);
    const contactRows = await executeQuery(`SELECT id FROM emergency_contacts WHERE user_id = ? LIMIT 1`, [userId]);
    const permRows = await executeQuery(`SELECT location_sharing_active FROM location_permissions WHERE user_id = ? LIMIT 1`, [userId]);

    const status = {
      email_verified: Boolean(user?.email_verified),
      phone_verified: Boolean(user?.phone_verified),
      photo_added: Boolean(user?.profile_image_path || user?.profile_image),
      id_submitted: Boolean(user?.id_proof_url || (docRows && docRows.length > 0)),
      id_verified: docRows[0]?.verification_status === 'approved' || user?.id_verification_status === 'approved',
      id_status: docRows[0]?.verification_status || user?.id_verification_status || 'pending',
      emergency_contact_added: Boolean(contactRows && contactRows.length > 0),
      location_permission_granted: Boolean(permRows[0]?.location_sharing_active),
      is_fully_verified: Boolean(user?.email_verified && user?.phone_verified)
    };

    return res.status(200).json(new ApiResponse(200, status, 'Tourist verification status fetched.'));
  });
}

module.exports = TouristController;
