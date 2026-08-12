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
    const contactRows = await executeQuery(`SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY is_primary DESC, id ASC`, [userId]);
    const permRows = await executeQuery(`SELECT * FROM location_permissions WHERE user_id = ? LIMIT 1`, [userId]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user,
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
    const { full_name, phone, gender, nationality, passport_number, dob, blood_group, medical_conditions, allergies, emergency_notes } = req.body;

    await User.updateProfile(userId, { full_name, phone, gender, nationality, passport_number });

    if (dob) {
      await executeQuery(`UPDATE users SET dob = ? WHERE id = ?`, [dob, userId]);
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
