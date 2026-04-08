const express = require('express');
const Product = require('../models/Product');
const FragranceHouse = require('../models/FragranceHouse');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');

const router = express.Router();

// GET /api/products - public, filterable
router.get('/', async (req, res) => {
  const filter = { isActive: true };
  if (req.query.houseId) filter.houseId = req.query.houseId;
  if (req.query.concentration) filter.concentration = req.query.concentration;
  if (req.query.featured === 'true') filter.featured = true;

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 24);
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('houseId', 'name slug logoUrl'),
    Product.countDocuments(filter),
  ]);

  res.json({ products, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/products/:id - single product (public)
router.get('/:id', async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isActive: true }).populate(
    'houseId',
    'name slug logoUrl description location'
  );
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

// POST /api/products - brand_owner creates product for their house
router.post('/', auth, requireRole('brand_owner'), async (req, res) => {
  const { name, description, notes, concentration, sizeML, price, stock, imageUrl, featured } =
    req.body;

  if (!name || !sizeML || price === undefined) {
    return res.status(400).json({ message: 'Name, sizeML, and price are required' });
  }

  if (!req.user.houseId) {
    return res.status(403).json({ message: 'You do not have an approved fragrance house yet' });
  }

  const product = await Product.create({
    houseId: req.user.houseId,
    name,
    description,
    notes,
    concentration,
    sizeML,
    price,
    stock: stock || 0,
    imageUrl,
    featured: !!featured,
  });

  const populated = await product.populate('houseId', 'name slug');
  res.status(201).json(populated);
});

// PATCH /api/products/:id - brand_owner (own products) or admin
router.patch('/:id', auth, requireRole('admin', 'brand_owner'), async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  if (
    req.user.role === 'brand_owner' &&
    product.houseId.toString() !== req.user.houseId?.toString()
  ) {
    return res.status(403).json({ message: 'You do not own this product' });
  }

  const allowed = ['name', 'description', 'notes', 'concentration', 'sizeML', 'price', 'stock', 'imageUrl', 'featured', 'isActive'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });

  await product.save();
  res.json(product);
});

// DELETE /api/products/:id - brand_owner soft-delete own product
router.delete('/:id', auth, requireRole('admin', 'brand_owner'), async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  if (
    req.user.role === 'brand_owner' &&
    product.houseId.toString() !== req.user.houseId?.toString()
  ) {
    return res.status(403).json({ message: 'You do not own this product' });
  }

  product.isActive = false;
  await product.save();
  res.json({ message: 'Product deactivated' });
});

module.exports = router;
