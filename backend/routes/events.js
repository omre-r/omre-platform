const express = require('express');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');

const router = express.Router();

// GET /api/events - public list of published events
router.get('/', async (req, res) => {
  const filter = { isPublished: true };
  if (req.query.upcoming === 'true') {
    filter.startDate = { $gte: new Date() };
  }

  const events = await Event.find(filter)
    .sort({ startDate: 1 })
    .populate('participatingHouses', 'name slug logoUrl');

  res.json(events);
});

// GET /api/events/all - admin sees all (published + drafts)
router.get('/all', auth, requireRole('admin'), async (req, res) => {
  const events = await Event.find()
    .sort({ startDate: 1 })
    .populate('participatingHouses', 'name slug logoUrl')
    .populate('createdBy', 'name');
  res.json(events);
});

// GET /api/events/:slug - single event by slug (public)
router.get('/:slug', async (req, res) => {
  const event = await Event.findOne({ slug: req.params.slug, isPublished: true }).populate(
    'participatingHouses',
    'name slug logoUrl description'
  );
  if (!event) return res.status(404).json({ message: 'Event not found' });
  res.json(event);
});

// POST /api/events - admin creates event
router.post('/', auth, requireRole('admin'), async (req, res) => {
  const {
    title,
    description,
    location,
    startDate,
    endDate,
    applicationDeadline,
    boothFee,
    boothSize,
    imageUrl,
    capacity,
  } = req.body;

  if (!title || !startDate || !endDate) {
    return res.status(400).json({ message: 'Title, start date, and end date are required' });
  }

  const event = await Event.create({
    title,
    description,
    location,
    startDate,
    endDate,
    applicationDeadline,
    boothFee,
    boothSize,
    imageUrl,
    capacity,
    createdBy: req.user.userId,
    isPublished: false,
  });

  res.status(201).json(event);
});

// PATCH /api/events/:id - admin updates event
router.patch('/:id', auth, requireRole('admin'), async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  const allowed = [
    'title', 'description', 'location', 'startDate', 'endDate',
    'applicationDeadline', 'boothFee', 'boothSize', 'imageUrl', 'capacity',
  ];
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) event[f] = req.body[f];
  });

  await event.save();
  res.json(event);
});

// PATCH /api/events/:id/publish - admin toggles publish
router.patch('/:id/publish', auth, requireRole('admin'), async (req, res) => {
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { isPublished: req.body.isPublished },
    { new: true }
  );
  if (!event) return res.status(404).json({ message: 'Event not found' });
  res.json(event);
});

// DELETE /api/events/:id - admin deletes event
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.json({ message: 'Event deleted' });
});

module.exports = router;
