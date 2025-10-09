// routes/portScan.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const portScanController = require('../controllers/portScanController');

const router = express.Router();

// Run nmap scan and correlate with NVD + hardcoded DB
router.get('/scan', protect, portScanController.scanAndCorrelate);

// Optional: run scan only (no correlation)
//router.get('/scan-only', protect, portScanController.scanOnly);

// Optional: correlate given services (frontend can send services array)
router.post('/correlate', protect, portScanController.correlateServices);

module.exports = router;
