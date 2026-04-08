const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');
const BrandOrder = require('../models/BrandOrder');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');

const router = express.Router();

// POST /api/orders/checkout
// Body: { items: [{ productId, quantity }], shippingAddress: {...} }
router.post('/checkout', auth, async (req, res) => {
  const { items, shippingAddress } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  const { fullName, line1, city, postalCode, country } = shippingAddress || {};
  if (!fullName || !line1 || !city || !postalCode || !country) {
    return res.status(400).json({ message: 'Shipping address is incomplete' });
  }

  // Validate every item and fetch live prices
  const validatedItems = [];
  const stockUpdates = [];

  for (const item of items) {
    if (!item.productId || !item.quantity || item.quantity < 1) {
      return res.status(400).json({ message: 'Invalid item in cart' });
    }

    const product = await Product.findOne({ _id: item.productId, isActive: true }).populate(
      'houseId',
      'name _id'
    );
    if (!product) {
      return res.status(400).json({ message: `Product ${item.productId} not found or inactive` });
    }
    if (product.stock < item.quantity) {
      return res.status(409).json({
        message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
      });
    }

    validatedItems.push({
      productId: product._id,
      houseId: product.houseId._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      imageUrl: product.imageUrl,
    });

    stockUpdates.push({ id: product._id, qty: item.quantity });
  }

  // Group items by house
  const byHouse = {};
  for (const item of validatedItems) {
    const key = item.houseId.toString();
    if (!byHouse[key]) byHouse[key] = [];
    byHouse[key].push(item);
  }

  const subtotal = validatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Create parent order
  const order = await Order.create({
    customerId: req.user.userId,
    items: validatedItems,
    shippingAddress,
    subtotal,
    total: subtotal,
    paymentStatus: 'paid',
    status: 'pending',
  });

  // Create brand sub-orders
  const brandOrderIds = [];
  for (const [houseId, houseItems] of Object.entries(byHouse)) {
    const houseSub = houseItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const brandOrder = await BrandOrder.create({
      orderId: order._id,
      houseId,
      customerId: req.user.userId,
      items: houseItems.map(({ productId, name, price, quantity, imageUrl }) => ({
        productId,
        name,
        price,
        quantity,
        imageUrl,
      })),
      subtotal: houseSub,
      status: 'pending',
    });
    brandOrderIds.push(brandOrder._id);
  }

  // Link brand orders to parent
  order.brandOrders = brandOrderIds;
  await order.save();

  // Deduct stock (best-effort without transactions on M0)
  for (const { id, qty } of stockUpdates) {
    await Product.findByIdAndUpdate(id, { $inc: { stock: -qty } });
  }

  res.status(201).json({ orderId: order._id, order });
});

// GET /api/orders/mine - customer's own orders
router.get('/mine', auth, async (req, res) => {
  const orders = await Order.find({ customerId: req.user.userId })
    .sort({ createdAt: -1 })
    .populate('brandOrders');
  res.json(orders);
});

// GET /api/orders/brand - brand owner sees their brand orders
router.get('/brand', auth, requireRole('brand_owner'), async (req, res) => {
  if (!req.user.houseId) {
    return res.status(403).json({ message: 'No approved house associated with your account' });
  }

  const brandOrders = await BrandOrder.find({ houseId: req.user.houseId })
    .sort({ createdAt: -1 })
    .populate('customerId', 'name email')
    .populate('orderId', 'createdAt shippingAddress');

  res.json(brandOrders);
});

// GET /api/orders/brand/:id - single brand order
router.get('/brand/:id', auth, requireRole('brand_owner'), async (req, res) => {
  const brandOrder = await BrandOrder.findById(req.params.id)
    .populate('customerId', 'name email')
    .populate('orderId', 'shippingAddress createdAt total')
    .populate('houseId', 'name');

  if (!brandOrder) return res.status(404).json({ message: 'Order not found' });

  if (brandOrder.houseId._id.toString() !== req.user.houseId?.toString()) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  res.json(brandOrder);
});

// PATCH /api/orders/brand/:id/status - brand owner updates their sub-order status
router.patch('/brand/:id/status', auth, requireRole('brand_owner'), async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'confirmed', 'preparing', 'fulfilled', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const brandOrder = await BrandOrder.findById(req.params.id);
  if (!brandOrder) return res.status(404).json({ message: 'Order not found' });

  if (brandOrder.houseId.toString() !== req.user.houseId?.toString()) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  brandOrder.status = status;
  await brandOrder.save();
  res.json(brandOrder);
});

// GET /api/orders - admin sees all parent orders
router.get('/', auth, requireRole('admin'), async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'name email')
      .populate({
        path: 'brandOrders',
        populate: { path: 'houseId', select: 'name' },
      }),
    Order.countDocuments(),
  ]);

  res.json({ orders, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/orders/:id - customer sees own, admin sees any
router.get('/:id', auth, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customerId', 'name email')
    .populate({
      path: 'brandOrders',
      populate: { path: 'houseId', select: 'name slug logoUrl' },
    });

  if (!order) return res.status(404).json({ message: 'Order not found' });

  if (
    req.user.role !== 'admin' &&
    order.customerId._id.toString() !== req.user.userId
  ) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  res.json(order);
});

// PATCH /api/orders/:id/status - admin updates parent order status
router.patch('/:id/status', auth, requireRole('admin'), async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'confirmed', 'preparing', 'fulfilled', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
});

module.exports = router;
