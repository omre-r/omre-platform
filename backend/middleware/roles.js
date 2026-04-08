/**
 * Middleware factory that restricts a route to specific roles.
 * Usage: router.post('/path', auth, requireRole('admin'), handler)
 *        router.patch('/path', auth, requireRole('admin', 'brand_owner'), handler)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }
  next();
};

module.exports = requireRole;
