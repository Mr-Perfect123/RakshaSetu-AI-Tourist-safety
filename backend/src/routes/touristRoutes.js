const express = require('express');
const router = express.Router();
const TouristController = require('../controllers/touristController');
const { authenticateJWT } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/profile', authenticateJWT, TouristController.getProfile);
router.put('/profile', authenticateJWT, TouristController.updateProfile);
router.post('/photo', authenticateJWT, upload.single('profile_image'), TouristController.uploadPhoto);
router.post('/id-proof', authenticateJWT, upload.single('id_proof'), TouristController.uploadIdProof);
router.get('/verification-status', authenticateJWT, TouristController.getVerificationStatus);

module.exports = router;
