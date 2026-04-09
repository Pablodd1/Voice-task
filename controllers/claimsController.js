const Claim = require('../models/Claim');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'));
    }
  }
}).array('files', 5);

// Create a new claim
const createClaim = async (req, res) => {
  try {
    const { claimNumber, patientName, payerName, billedAmount, submissionDate } = req.body;

    if (!claimNumber || !patientName || !payerName) {
      return res.status(400).json({ error: 'Please provide claim number, patient name, and payer name' });
    }

    const claim = await Claim.create({
      userId: req.user.userId,
      claimNumber,
      patientName,
      payerName,
      billedAmount,
      submissionDate
    });

    res.status(201).json({ message: 'Claim created successfully', claim });
  } catch (error) {
    console.error('Create claim error:', error);
    res.status(500).json({ error: 'Server error creating claim' });
  }
};

// Get all claims for a user
const getClaims = async (req, res) => {
  try {
    const claims = await Claim.findByUserId(req.user.userId);
    res.json({ claims });
  } catch (error) {
    console.error('Get claims error:', error);
    res.status(500).json({ error: 'Server error fetching claims' });
  }
};

// Get a single claim by ID
const getClaimById = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    if (claim.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to access this claim' });
    }
    
    res.json({ claim });
  } catch (error) {
    console.error('Get claim by ID error:', error);
    res.status(500).json({ error: 'Server error fetching claim' });
  }
};

// Update a claim
const updateClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    if (claim.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this claim' });
    }
    
    const { claimNumber, patientName, payerName, billedAmount, status, denialReason, submissionDate, lastCalled, nextCallDate, callAttempts } = req.body;
    
    const updateData = {};
    if (claimNumber !== undefined) updateData.claimNumber = claimNumber;
    if (patientName !== undefined) updateData.patientName = patientName;
    if (payerName !== undefined) updateData.payerName = payerName;
    if (billedAmount !== undefined) updateData.billedAmount = billedAmount;
    if (status !== undefined) updateData.status = status;
    if (denialReason !== undefined) updateData.denialReason = denialReason;
    if (submissionDate !== undefined) updateData.submissionDate = submissionDate;
    if (lastCalled !== undefined) updateData.lastCalled = lastCalled;
    if (nextCallDate !== undefined) updateData.nextCallDate = nextCallDate;
    if (callAttempts !== undefined) updateData.callAttempts = callAttempts;
    
    const updated = await Claim.update(req.params.id, updateData);
    
    if (!updated) {
      return res.status(400).json({ error: 'Failed to update claim' });
    }
    
    const updatedClaim = await Claim.findById(req.params.id);
    
    res.json({ message: 'Claim updated successfully', claim: updatedClaim });
  } catch (error) {
    console.error('Update claim error:', error);
    res.status(500).json({ error: 'Server error updating claim' });
  }
};

// Delete a claim
const deleteClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    if (claim.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this claim' });
    }
    
    const deleted = await Claim.delete(req.params.id);
    
    if (!deleted) {
      return res.status(400).json({ error: 'Failed to delete claim' });
    }
    
    res.json({ message: 'Claim deleted successfully' });
  } catch (error) {
    console.error('Delete claim error:', error);
    res.status(500).json({ error: 'Server error deleting claim' });
  }
};

// Upload claims from Excel/CSV file
const uploadClaims = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }
      
      const results = [];
      const errors = [];
      
      for (const file of req.files) {
        try {
          const filePath = path.join(__dirname, '..', 'uploads', file.filename);
          
          let data;
          if (file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            data = XLSX.utils.sheet_to_json(worksheet);
          } else if (file.originalname.endsWith('.csv')) {
            const csvData = fs.readFileSync(filePath, 'utf8');
            // Simple CSV parsing - split by newlines and commas
            const lines = csvData.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            data = lines.slice(1).map(line => {
              const values = line.split(',');
              const obj = {};
              headers.forEach((h, i) => obj[h] = values[i]?.trim());
              return obj;
            });
          } else {
            errors.push({ file: file.originalname, error: 'Unsupported file format' });
            continue;
          }
          
          for (const row of data) {
            try {
              const claimData = {
                claimNumber: row.claimnumber || row.claim_number || row['claim #'] || row.ClaimNumber,
                patientName: row.patientname || row.patient_name || row['patient name'] || row.PatientName,
                payerName: row.payername || row.payer_name || row['payer name'] || row.PayerName,
                billedAmount: parseFloat(row.billedamount || row.billed_amount || row['billed amount'] || row.BilledAmount) || null,
                submissionDate: row.submissiondate || row.submission_date || row['submission date'] || row.SubmissionDate
              };
              
              if (!claimData.claimNumber || !claimData.patientName || !claimData.payerName) {
                errors.push({ file: file.originalname, row: 'Row', error: 'Missing required fields' });
                continue;
              }
              
              const claim = await Claim.create({
                userId: req.user.userId,
                ...claimData
              });
              
              results.push(claim);
            } catch (rowError) {
              errors.push({ file: file.originalname, row: 'Row', error: rowError.message });
            }
          }
          
          fs.unlinkSync(filePath);
        } catch (fileError) {
          errors.push({ file: file.originalname, error: fileError.message });
        }
      }
      
      res.json({
        message: `Processed ${req.files.length} file(s)`,
        resultsCount: results.length,
        errorsCount: errors.length,
        results: results.slice(0, 10),
        errors: errors.slice(0, 10)
      });
    });
  } catch (error) {
    console.error('Upload claims error:', error);
    res.status(500).json({ error: 'Server error uploading claims' });
  }
};

// Get claim statistics for dashboard
const getClaimStats = async (req, res) => {
  try {
    const stats = await Claim.getStats(req.user.userId);
    res.json({ stats });
  } catch (error) {
    console.error('Get claim stats error:', error);
    res.status(500).json({ error: 'Server error fetching claim statistics' });
  }
};

module.exports = {
  createClaim,
  getClaims,
  getClaimById,
  updateClaim,
  deleteClaim,
  uploadClaims,
  getClaimStats
};