const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const sosRoutes = require('./sosRoutes');
const incidentRoutes = require('./incidentRoutes');
const aiRoutes = require('./aiRoutes');
const adminRoutes = require('./adminRoutes');
const locationRoutes = require('./locationRoutes');
const touristRoutes = require('./touristRoutes');
const supportRoutes = require('./supportRoutes');
const cabinRoutes = require('./cabinRoutes');
const paymentRoutes = require('./paymentRoutes');
const vehicleRoutes = require('./vehicleRoutes');
const foodRoutes = require('./foodRoutes');
const placeRoutes = require('./placeRoutes');
const zoneRoutes = require('./zoneRoutes');
const alertRoutes = require('./alertRoutes');
const travelRoutes = require('./travelRoutes');

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
router.use('/location', locationRoutes);
router.use('/locations', locationRoutes);
router.use('/tourist', touristRoutes);
router.use('/support', supportRoutes);
router.use('/cabins', cabinRoutes);
router.use('/payments', paymentRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/food', foodRoutes);
router.use('/places', placeRoutes);
router.use('/zones', zoneRoutes);
router.use('/alerts', alertRoutes);
router.use('/travel', travelRoutes);

module.exports = router;
