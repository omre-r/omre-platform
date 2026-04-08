const express = require('express');
const EventApplication = require('../models/EventApplication');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');

const router = express.Router();

// GET /api/event-applications - admin sees all
router.get('/', auth, requireRole('admin'), async (req, res) => {
  const filter = {};
  if (req.query.eventId) filter.eventId = req.query.eventId;
  if (req.query.status) filter.status = req.query.status;

  const applications = await EventApplication.find(filter)
    .sort({ createdAt: -1 })
    .populate('houseId', 'name slug logoUrl')
    .populate('eventId', 'title startDate')
    .populate('applicantId', 'name email');

  res.json(applications);
});

// GET /api/event-applications/mine - brand owner sees their own
router.get('/mine', auth, requireRole('brand_owner'), async (req, res) => {
  const applications = await EventApplication.find({ houseId: req.user.houseId })
    .sort({ createdAt: -1 })
    .populate('eventId', 'title startDate location imageUrl');

  res.json(applications);
});

// POST /api/event-applications - brand owner applies to event
router.post('/', auth, requireRole('brand_owner'), async (req, res) => {
  const { eventId, message } = req.body;

  if (!eventId) {
    return res.status(400).json({ message: 'eventId is required' });
  }

  if (!req.user.houseId) {
    return res.status(403).json({ message: 'You do not have an approved fragrance house' });
  }

  const event = await Event.findOne({ _id: eventId, isPublished: true });
  if (!event) return res.status(404).json({ message: 'Event not found' });

  if (event.applicationDeadline && new Date() > event.applicationDeadline) {
    return res.status(400).json({ message: 'Application deadline has passed' });
  }

  const application = await EventApplication.create({
    eventId,
    houseId: req.user.houseId,
    applicantId: req.user.userId,
    message: message || '',
  });

  res.status(201).json(application);
});

// PATCH /api/event-applications/:id/review - admin approves or rejects
router.patch('/:id/review', auth, requireRole('admin'), async (req, res) => {
  const { status } = req.body;

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be accepted or rejected' });
  }

  const application = await EventApplication.findById(req.params.id);
  if (!application) return res.status(404).json({ message: 'Application not found' });

  application.status = status;
  await application.save();

  // If accepted, add house to event's participating houses
  if (status === 'accepted') {
    await Event.findByIdAndUpdate(application.eventId, {
      $addToSet: { participatingHouses: application.houseId },
    });
  }

  // If rejected after acceptance, remove from participating houses
  if (status === 'rejected') {
    await Event.findByIdAndUpdate(application.eventId, {
      $pull: { participatingHouses: application.houseId },
    });
  }

  res.json(application);
});

module.exports = router;
