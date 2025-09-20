const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const scanController = require('../controllers/scanController');

const router = express.Router();

// Get all processes with system information
router.get('/processes', protect, scanController.getProcesses);

// Get only system information (optional standalone endpoint)
router.get('/system-info', protect, scanController.getSystemInfo);

// Trust a process
router.post('/trust-process', protect, scanController.trustProcess);

// Kill a process
router.post('/kill-process', protect, scanController.killProcess);

module.exports = router;