const express = require('express');
const router = express.Router();
const { 
  createClaim, 
  getClaims, 
  getClaimById, 
  updateClaim, 
  deleteClaim,
  uploadClaims,
  getClaimStats
} = require('../controllers/claimsController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /vnd.openxmlformats-officedocument.spreadsheetml.sheet|text\/csv/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Excel or CSV files only!');
    }
  }
}).array('files', 5); // Allow up to 5 files

// Public routes (for testing)
router.get('/test', (req, res) => {
  res.json({ message: 'Claims route is working' });
});

// Protected routes
router.post('/', protect, createClaim);
router.get('/', protect, getClaims);
router.get('/:id', protect, getClaimById);
router.put('/:id', protect, updateClaim);
router.delete('/:id', protect, deleteClaim);
router.post('/upload', protect, uploadClaims);
router.get('/stats/summary', protect, getClaimStats);

module.exports = router;