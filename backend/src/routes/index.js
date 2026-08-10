const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const sosRoutes = require('./sosRoutes');
const incidentRoutes = require('./incidentRoutes');
const aiRoutes = require('./aiRoutes');
const adminRoutes = require('./adminRoutes');
const locationRoutes = require('./locationRoutes');

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'RakshaSetu Emergency Protection Engine',
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/sos', sosRoutes);
router.use('/incidents', incidentRoutes);
router.use('/ai', aiRoutes);
router.use('/admin', adminRoutes);
router.use('/locations', locationRoutes);

module.exports = router;
