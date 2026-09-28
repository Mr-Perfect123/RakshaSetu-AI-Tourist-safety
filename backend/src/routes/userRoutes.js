const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticateJWT } = require('../middleware/auth');

// Emergency Contacts Routes for Authenticated Users
router.get('/emergency-contacts', authenticateJWT, UserController.getEmergencyContacts);
router.post('/emergency-contacts', authenticateJWT, UserController.addEmergencyContact);
router.delete('/emergency-contacts/:id', authenticateJWT, UserController.deleteEmergencyContact);

module.exports = router;
