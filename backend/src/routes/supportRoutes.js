const express = require('express');
const router = express.Router();
const SupportController = require('../controllers/supportController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

router.post('/tickets', authenticateJWT, SupportController.createTicket);
router.get('/tickets/my', authenticateJWT, SupportController.getUserTickets);
router.get('/tickets', authenticateJWT, authorizeRoles('Admin', 'Police', 'Hospital'), SupportController.getAllTickets);
router.patch('/tickets/:id/status', authenticateJWT, authorizeRoles('Admin', 'Police'), SupportController.updateTicketStatus);

module.exports = router;
