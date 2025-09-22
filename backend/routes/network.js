const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const networkController = require('../controllers/networkController');

/**
 * @route   GET /api/network/devices
 * @desc    Scans the local network and returns a list of discovered devices.
 * @access  Private
 */
router.get('/devices', protect, networkController.discoverDevices);

/**
 * @route   POST /api/network/trust
 * @desc    Adds a device's MAC address to the trusted list.
 * @access  Private
 */
router.post('/trust', protect, networkController.trustDevice);

module.exports = router;