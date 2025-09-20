const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const hygieneController = require('../controllers/hygieneController');

const router = express.Router();

/**
 * @route   GET /api/hygiene/scan
 * @desc    Runs a file-system hygiene scan.
 * @access  Private (Requires JWT token)
 */
router.get('/scan', protect, hygieneController.runHygieneScan);

module.exports = router;