const express = require('express');
const router = express.Router();
const { 
  getDashboardData, 
  getRecentActivity,
  getUpcomingCalls
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

// Protected routes
router.get('/', protect, getDashboardData);
router.get('/activity', protect, getRecentActivity);
router.get('/upcoming', protect, getUpcomingCalls);

module.exports = router;