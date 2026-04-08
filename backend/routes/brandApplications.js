const express = require('express');
const jwt = require('jsonwebtoken');
const BrandApplication = require('../models/BrandApplication');
const FragranceHouse = require('../models/FragranceHouse');
const User = require('../models/User');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');

const router = express.Router();

// GET /api/applications - admin sees all
router.get('/', auth, requireRole('admin'), async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const applications = await BrandApplication.find(filter)
    .sort({ createdAt: -1 })
    .populate('applicantId', 'name email')
    .populate('reviewedBy', 'name');

  res.json(applications);
});

// GET /api/applications/mine - brand_owner sees their own
router.get('/mine', auth, requireRole('brand_owner'), async (req, res) => {
  const applications = await BrandApplication.find({ applicantId: req.user.userId }).sort({
    createdAt: -1,
  });
  res.json(applications);
});

// POST /api/applications - brand_owner submits application
router.post('/', auth, requireRole('brand_owner'), async (req, res) => {
  const { proposedHouseName, description, logoUrl, bannerUrl, location, instagramUrl, websiteUrl } =
    req.body;

  if (!proposedHouseName || !description) {
    return res.status(400).json({ message: 'House name and description are required' });
  }

  // Only one active application per user
  const existing = await BrandApplication.findOne({
    applicantId: req.user.userId,
    status: 'pending',
  });
  if (existing) {
    return res.status(409).json({ message: 'You already have a pending application' });
  }

  const application = await BrandApplication.create({
    applicantId: req.user.userId,
    proposedHouseName,
    description,
    logoUrl,
    bannerUrl,
    location,
    instagramUrl,
    websiteUrl,
  });

  res.status(201).json(application);
});

// PATCH /api/applications/:id/review - admin approves or rejects
router.patch('/:id/review', auth, requireRole('admin'), async (req, res) => {
  const { status, adminNote } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be approved or rejected' });
  }

  const application = await BrandApplication.findById(req.params.id).populate('applicantId');
  if (!application) return res.status(404).json({ message: 'Application not found' });
  if (application.status !== 'pending') {
    return res.status(409).json({ message: 'Application has already been reviewed' });
  }

  application.status = status;
  application.adminNote = adminNote || '';
  application.reviewedBy = req.user.userId;
  application.reviewedAt = new Date();
  await application.save();

  if (status === 'approved') {
    // Create the fragrance house
    const house = await FragranceHouse.create({
      name: application.proposedHouseName,
      ownerId: application.applicantId._id,
      description: application.description,
      logoUrl: application.logoUrl,
      bannerUrl: application.bannerUrl,
      location: application.location,
      websiteUrl: application.websiteUrl,
      instagramUrl: application.instagramUrl,
    });

    // Link house to the user
    await User.findByIdAndUpdate(application.applicantId._id, { houseId: house._id });

    return res.json({ application, house });
  }

  res.json({ application });
});

module.exports = router;
