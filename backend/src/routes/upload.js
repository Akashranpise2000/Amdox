const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const { body, validationResult } = require('express-validator');
const Certificate = require('../models/Certificate');
const UploadLog = require('../models/UploadLog');
const { auth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Configure Multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  }
});

// @route   POST /api/upload/certificates
// @desc    Bulk upload certificates from Excel file
// @access  Private (Admin only)
router.post('/certificates', auth, requireRole('admin'), upload.single('file'), [
  body('file').custom((value, { req }) => {
    if (!req.file) {
      throw new Error('No file uploaded');
    }
    return true;
  })
], asyncHandler(async (req, res) => {
  try {
    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rows = xlsx.utils.sheet_to_json(worksheet);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    // Required columns
    const requiredColumns = ['Certificate ID', 'Student Name', 'Domain', 'Start Date', 'End Date'];
    const headers = Object.keys(rows[0]);
    
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      return res.status(400).json({ 
        error: `Missing required columns: ${missingColumns.join(', ')}` 
      });
    }

    // Validate and process rows
    const validCertificates = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because Excel is 1-indexed and first row is header

      const rowErrors = [];

      // Validate required fields
      if (!row['Certificate ID'] || typeof row['Certificate ID'] !== 'string') {
        rowErrors.push('Invalid or missing Certificate ID');
      }
      if (!row['Student Name'] || typeof row['Student Name'] !== 'string') {
        rowErrors.push('Invalid or missing Student Name');
      }
      if (!row['Domain'] || typeof row['Domain'] !== 'string') {
        rowErrors.push('Invalid or missing Domain');
      }
      if (!row['Start Date'] || !row['End Date']) {
        rowErrors.push('Missing Start Date or End Date');
      }

      if (rowErrors.length > 0) {
        errors.push({ row: rowNum, reason: rowErrors.join('; '), data: row });
        continue;
      }

      // Check for duplicates
      const existingCert = await Certificate.findOne({
        certificateId: row['Certificate ID'].toString().toUpperCase()
      });

      if (existingCert) {
        errors.push({ 
          row: rowNum, 
          reason: `Certificate ID ${row['Certificate ID']} already exists`,
          data: row 
        });
        continue;
      }

      validCertificates.push({
        certificateId: row['Certificate ID'].toString().toUpperCase().trim(),
        studentName: row['Student Name'].toString().trim(),
        domain: row['Domain'].toString().trim(),
        startDate: new Date(row['Start Date']),
        endDate: new Date(row['End Date']),
        uploadedBy: req.user._id,
        isActive: true
      });
    }

    // Insert valid certificates
    let successCount = 0;
    if (validCertificates.length > 0) {
      await Certificate.insertMany(validCertificates);
      successCount = validCertificates.length;
    }

    // Create upload log
    const uploadLog = new UploadLog({
      adminId: req.user._id,
      fileName: req.file.originalname,
      totalRows: rows.length,
      successRows: successCount,
      failedRows: errors.length,
      errors,
      certificateIds: validCertificates.map(c => c.certificateId)
    });

    await uploadLog.save();

    res.json({
      message: 'Upload completed',
      summary: {
        totalRows: rows.length,
        successRows: successCount,
        failedRows: errors.length
      },
      errors: errors.slice(0, 50), // Limit errors in response
      uploadLogId: uploadLog._id
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process Excel file' });
  }
}));

// @route   GET /api/upload/logs
// @desc    Get all upload logs (admin)
// @access  Private (Admin only)
router.get('/logs', auth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const logs = await UploadLog.find()
    .populate('adminId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await UploadLog.countDocuments();

  res.json({
    logs,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total
    }
  });
}));

// @route   GET /api/upload/logs/:id
// @desc    Get specific upload log details
// @access  Private (Admin only)
router.get('/logs/:id', auth, requireRole('admin'), asyncHandler(async (req, res) => {
  const log = await UploadLog.findById(req.params.id)
    .populate('adminId', 'name email');

  if (!log) {
    return res.status(404).json({ error: 'Upload log not found' });
  }

  res.json(log);
}));

module.exports = router;
