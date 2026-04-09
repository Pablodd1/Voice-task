const express = require('express');
const router = express.Router();
const { 
  initiateCall, 
  getCallLogs, 
  getCallById, 
  updateCallStatus,
  getCallStats,
  simulateCall
} = require('../controllers/callsController');
const { protect } = require('../middleware/authMiddleware');

// Protected routes
router.post('/', protect, initiateCall);
router.get('/', protect, getCallLogs);
router.get('/:id', protect, getCallById);
router.put('/:id/status', protect, updateCallStatus);
router.get('/stats/summary', protect, getCallStats);
router.post('/simulate', protect, simulateCall);

module.exports = router;