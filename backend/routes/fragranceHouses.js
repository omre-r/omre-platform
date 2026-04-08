const express = require('express');
const FragranceHouse = require('../models/FragranceHouse');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');

const router = express.Router();

// GET /api/houses  - public list of active houses
router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 12);
  const skip = (page - 1) * limit;

  const [houses, total] = await Promise.all([
    FragranceHouse.find({ isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('ownerId', 'name email'),
    FragranceHouse.countDocuments({ isActive: true }),
  ]);

  res.json({ houses, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/houses/:slug - single house by slug (public)
router.get('/:slug', async (req, res) => {
  const house = await FragranceHouse.findOne({
    slug: req.params.slug,
    isActive: true,
  }).populate('ownerId', 'name');

  if (!house) return res.status(404).json({ message: 'Fragrance house not found' });
  res.json(house);
});

// POST /api/houses - admin creates house directly
router.post('/', auth, requireRole('admin'), async (req, res) => {
  const { name, ownerId, description, logoUrl, bannerUrl, location, websiteUrl, instagramUrl } =
    req.body;

  if (!name || !ownerId) {
    return res.status(400).json({ message: 'Name and ownerId are required' });
  }

  const house = await FragranceHouse.create({
    name,
    ownerId,
    description,
    logoUrl,
    bannerUrl,
    location,
    websiteUrl,
    instagramUrl,
  });

  res.status(201).json(house);
});

// PATCH /api/houses/:id - brand owner (own house) or admin can update
router.patch('/:id', auth, requireRole('admin', 'brand_owner'), async (req, res) => {
  const house = await FragranceHouse.findById(req.params.id);
  if (!house) return res.status(404).json({ message: 'House not found' });

  if (
    req.user.role === 'brand_owner' &&
    house.ownerId.toString() !== req.user.userId
  ) {
    return res.status(403).json({ message: 'You do not own this house' });
  }

  const allowed = ['name', 'description', 'logoUrl', 'bannerUrl', 'location', 'websiteUrl', 'instagramUrl'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) house[field] = req.body[field];
  });

  await house.save();
  res.json(house);
});

// DELETE /api/houses/:id - admin soft-delete
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  const house = await FragranceHouse.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!house) return res.status(404).json({ message: 'House not found' });
  res.json({ message: 'House deactivated' });
});

module.exports = router;
