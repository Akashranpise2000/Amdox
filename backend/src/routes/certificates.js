const express = require('express');
const PDFDocument = require('pdfkit');
const Certificate = require('../models/Certificate');
const { auth, requireRole, optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// @route   GET /api/certificates/search/:id
// @desc    Search certificate by ID (public)
// @access  Public
router.get('/search/:id', optionalAuth, asyncHandler(async (req, res) => {
  const certificate = await Certificate.findOne({
    certificateId: req.params.id.toUpperCase(),
    isActive: true
  });

  if (!certificate) {
    return res.status(404).json({ error: 'Certificate not found' });
  }

  res.json({ certificate });
}));

// @route   GET /api/certificates/:id/pdf
// @desc    Generate and download certificate PDF
// @access  Public
router.get('/:id/pdf', optionalAuth, asyncHandler(async (req, res) => {
  const certificate = await Certificate.findById(req.params.id);

  if (!certificate || !certificate.isActive) {
    return res.status(404).json({ error: 'Certificate not found' });
  }

  // Create PDF
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=certificate_${certificate.certificateId}.pdf`);

  // Pipe to response
  doc.pipe(res);

  // Certificate design
  // Border
  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
     .lineWidth(3)
     .stroke('#1e40af');

  doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
     .lineWidth(1)
     .stroke('#3b82f6');

  // Header
  doc.fontSize(36)
     .fillColor('#1e40af')
     .text('CERTIFICATE', 0, 80, { align: 'center' });

  doc.fontSize(18)
     .fillColor('#4b5563')
     .text('OF INTERNSHIP COMPLETION', 0, 125, { align: 'center' });

  // Decorative line
  doc.moveTo(200, 160)
     .lineTo(doc.page.width - 200, 160)
     .lineWidth(2)
     .stroke('#3b82f6');

  // Body text
  doc.fontSize(14)
     .fillColor('#374151')
     .text('This is to certify that', 0, 190, { align: 'center' });

  doc.fontSize(28)
     .fillColor('#1e40af')
     .text(certificate.studentName, 0, 220, { align: 'center' });

  doc.fontSize(14)
     .fillColor('#374151')
     .text('has successfully completed an internship in', 0, 270, { align: 'center' });

  doc.fontSize(22)
     .fillColor('#1e40af')
     .text(certificate.domain.toUpperCase(), 0, 295, { align: 'center' });

  // Duration
  const startDate = new Date(certificate.startDate).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });
  const endDate = new Date(certificate.endDate).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });

  doc.fontSize(12)
     .fillColor('#6b7280')
     .text(`From: ${startDate}  To: ${endDate}`, 0, 350, { align: 'center' });

  // Certificate ID
  doc.fontSize(10)
     .fillColor('#9ca3af')
     .text(`Certificate ID: ${certificate.certificateId}`, 50, doc.page.height - 80);

  // Date
  doc.text(`Date: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  })}`, doc.page.width - 200, doc.page.height - 80);

  // Finalize
  doc.end();
}));

// @route   GET /api/certificates
// @desc    Get all certificates (admin)
// @access  Private (Admin only)
router.get('/', auth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;

  const query = {};
  
  if (search) {
    query.$or = [
      { certificateId: { $regex: search, $options: 'i' } },
      { studentName: { $regex: search, $options: 'i' } },
      { domain: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const certificates = await Certificate.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Certificate.countDocuments(query);

  res.json({
    certificates,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total
    }
  });
}));

// @route   DELETE /api/certificates/:id
// @desc    Soft delete a certificate (admin)
// @access  Private (Admin only)
router.delete('/:id', auth, requireRole('admin'), asyncHandler(async (req, res) => {
  const certificate = await Certificate.findById(req.params.id);

  if (!certificate) {
    return res.status(404).json({ error: 'Certificate not found' });
  }

  certificate.isActive = false;
  await certificate.save();

  res.json({ message: 'Certificate deleted successfully' });
}));

module.exports = router;
