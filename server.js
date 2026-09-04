const express = require('express');
const path = require('path');
const crypto = require('crypto');
const store = require('./server/store');

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

const siteDir = path.join(__dirname, 'site');

// Security: Enable reverse-proxy trust for accurate IP resolution behind Cloud Run / Nginx
app.set('trust proxy', 1);

// Security: Disable X-Powered-By header
app.disable('x-powered-by');

// Parse JSON bodies with tight limit
app.use(express.json({ limit: '1mb' }));

// Security: Comprehensive defense-in-depth HTTP response headers & Content Security Policy
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self'; " +
    "frame-ancestors 'self' https://*.google.com https://*.run.app https://ai.studio; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );
  next();
});

// Helper to get client IP safely
function getClientIp(req) {
  return (req.ip || (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.connection.remoteAddress || 'unknown');
}

// In-memory sessions and rate-limiting stores
const sessions = new Map(); // token -> { username, expiresAt }
const loginAttempts = new Map(); // ip -> { count, lockedUntil }
const orderAttempts = new Map(); // ip -> [timestamps]
const couponAttempts = new Map(); // ip -> [timestamps]
const globalApiBuckets = new Map(); // ip -> [timestamps]

// Generic sliding-window rate limiter
function checkRateLimit(storeMap, ip, maxRequests, windowMs) {
  const now = Date.now();
  const timestamps = (storeMap.get(ip) || []).filter(t => (now - t) < windowMs);
  if (timestamps.length >= maxRequests) {
    storeMap.set(ip, timestamps);
    return false;
  }
  timestamps.push(now);
  storeMap.set(ip, timestamps);
  return true;
}

// Global API rate limiting middleware: max 120 calls per minute per IP
app.use('/api/', (req, res, next) => {
  const ip = getClientIp(req);
  if (!checkRateLimit(globalApiBuckets, ip, 120, 60000)) {
    return res.status(429).json({ success: false, error: 'Too many requests. Please slow down.' });
  }
  next();
});

// Periodic cleanup of rate limiting maps and expired sessions (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt <= now) sessions.delete(token);
  }
  for (const [ip, data] of loginAttempts.entries()) {
    if (data.lockedUntil <= now && data.count === 0) loginAttempts.delete(ip);
  }
  for (const [ip, ts] of orderAttempts.entries()) {
    const valid = ts.filter(t => now - t < 3600000);
    if (valid.length === 0) orderAttempts.delete(ip);
    else orderAttempts.set(ip, valid);
  }
  for (const [ip, ts] of couponAttempts.entries()) {
    const valid = ts.filter(t => now - t < 300000);
    if (valid.length === 0) couponAttempts.delete(ip);
    else couponAttempts.set(ip, valid);
  }
  for (const [ip, ts] of globalApiBuckets.entries()) {
    const valid = ts.filter(t => now - t < 60000);
    if (valid.length === 0) globalApiBuckets.delete(ip);
    else globalApiBuckets.set(ip, valid);
  }
}, 600000);

// Admin Authentication Middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Admin authentication required' });
  }

  const token = authHeader.slice(7).trim();
  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ success: false, error: 'Session expired or invalid. Please sign in again.' });
  }

  // Extend session on activity (up to 24 hours)
  session.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  req.admin = session;
  req.adminToken = token;
  next();
}

// -------------------------------------------------------------
// PUBLIC STOREFRONT APIS
// -------------------------------------------------------------

// Get public catalogue (always returns server's current products and prices)
app.get('/api/products', (req, res) => {
  try {
    const s = store.getStore();
    const publicProducts = s.products.map(p => ({
      id: p.id,
      name: p.name,
      sub: p.sub,
      landscape: p.landscape,
      type: p.type,
      family: p.family,
      price: p.price,
      size: p.size,
      burn: p.burn,
      dims: p.dims,
      weight: p.weight,
      notes: p.notes,
      shortScent: p.shortScent,
      longScent: p.longScent,
      story: p.story,
      img: p.img,
      art: p.art,
      featured: p.featured,
      status: p.status || 'in_stock'
    }));

    res.json({
      success: true,
      products: publicProducts,
      config: s.config
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not load products' });
  }
});

// Authoritative checkout calculation (cannot be forged)
app.post('/api/checkout/calculate', (req, res) => {
  const ip = getClientIp(req);
  if (!checkRateLimit(globalApiBuckets, ip, 45, 60000)) {
    return res.status(429).json({ valid: false, error: 'Too many calculation requests. Please wait a moment.' });
  }

  try {
    const { items, shipType, couponCode } = req.body;
    const calc = store.calculateOrder({ items, shipType, couponCode });
    res.json(calc);
  } catch (err) {
    res.status(400).json({ valid: false, error: err.message });
  }
});

// Authoritative coupon validation check (strictly rate-limited against brute-force enumeration)
app.post('/api/coupons/validate', (req, res) => {
  const ip = getClientIp(req);
  if (!checkRateLimit(couponAttempts, ip, 20, 300000)) {
    return res.status(429).json({ valid: false, error: 'Too many coupon check attempts. Please wait 5 minutes.' });
  }

  try {
    const { code, subtotal } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ valid: false, error: 'Please enter a coupon code' });
    }

    const s = store.getStore();
    const cleanCode = code.trim().toUpperCase().slice(0, 30);
    const coupon = (s.coupons || []).find(c => c.code.toUpperCase() === cleanCode);

    if (!coupon) {
      return res.json({ valid: false, error: 'Invalid coupon code' });
    }
    if (!coupon.active) {
      return res.json({ valid: false, error: 'This coupon is inactive' });
    }
    if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
      return res.json({ valid: false, error: 'This coupon has expired' });
    }
    if (coupon.minOrder && Number(subtotal) < coupon.minOrder) {
      return res.json({
        valid: false,
        error: `Requires a minimum order of ₹${coupon.minOrder.toLocaleString('en-IN')}`
      });
    }

    let estimatedDiscount = 0;
    if (subtotal && Number(subtotal) > 0) {
      if (coupon.type === 'percent') {
        const raw = Math.round(Number(subtotal) * (coupon.value / 100));
        estimatedDiscount = coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
      } else {
        estimatedDiscount = Math.min(Number(subtotal), Math.round(coupon.value));
      }
    }

    res.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      estimatedDiscount,
      description: coupon.description
    });
  } catch (err) {
    res.status(500).json({ valid: false, error: 'Coupon check failed' });
  }
});

// Authoritative Order Placement (server computes totals and stores order; rate-limited against DoS / spam)
app.post('/api/checkout/place-order', (req, res) => {
  const ip = getClientIp(req);
  if (!checkRateLimit(orderAttempts, ip, 12, 3600000)) {
    return res.status(429).json({ success: false, error: 'Maximum order placement limit reached for this hour. Please try again later.' });
  }

  try {
    const { items, shipType, couponCode, contact } = req.body;
    if (!contact || !contact.email || !contact.name || !contact.address) {
      return res.status(400).json({ success: false, error: 'Incomplete contact or shipping information' });
    }

    const order = store.placeOrder({ items, shipType, couponCode, contact });
    console.log(`[virai-security] Order placed successfully: ${order.id} | Total: ₹${order.total} | IP: ${ip.slice(0, 16)}`);
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// ADMIN AUTHENTICATION APIS
// -------------------------------------------------------------

// Admin login with brute-force prevention and timing-safe password verification
app.post('/api/admin/login', (req, res) => {
  const ip = getClientIp(req);
  const now = Date.now();

  const attempt = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  if (attempt.lockedUntil > now) {
    const waitSec = Math.ceil((attempt.lockedUntil - now) / 1000);
    return res.status(429).json({
      success: false,
      error: `Too many failed login attempts. Please wait ${waitSec} seconds.`
    });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password required' });
  }

  try {
    const s = store.getStore();
    const admin = s.admin;

    if (username !== admin.username || !store.verifyPassword(password, admin.salt, admin.hash)) {
      attempt.count += 1;
      if (attempt.count >= 5) {
        attempt.lockedUntil = now + 15 * 60 * 1000; // 15 minute lockout
      }
      loginAttempts.set(ip, attempt);
      console.warn(`[virai-security] Failed admin login attempt #${attempt.count} from IP ${ip.slice(0, 16)}`);
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    // Success: reset attempts
    loginAttempts.delete(ip);

    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, {
      username: admin.username,
      expiresAt: now + 24 * 60 * 60 * 1000
    });

    console.log(`[virai-security] Admin login authenticated for user "${admin.username}" from IP ${ip.slice(0, 16)}`);

    res.json({
      success: true,
      token,
      username: admin.username
    });
  } catch (err) {
    console.error('[virai-admin] Login error:', err);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
});

// Admin logout
app.post('/api/admin/logout', requireAdmin, (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.slice(7).trim();
  sessions.delete(token);
  res.json({ success: true, message: 'Logged out' });
});

// Check current admin session
app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({ success: true, username: req.admin.username });
});

// -------------------------------------------------------------
// PROTECTED ADMIN MANAGEMENT APIS
// -------------------------------------------------------------

// Dashboard metrics overview
app.get('/api/admin/overview', requireAdmin, (req, res) => {
  try {
    const s = store.getStore();
    const totalOrders = s.orders ? s.orders.length : 0;
    const totalRevenue = (s.orders || []).reduce((sum, o) => sum + (o.total || 0), 0);
    const activeCoupons = (s.coupons || []).filter(c => c.active).length;
    const totalProducts = (s.products || []).length;

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        totalRevenue,
        activeCoupons
      },
      recentOrders: (s.orders || []).slice(0, 5)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load metrics' });
  }
});

// List all products (admin view)
app.get('/api/admin/products', requireAdmin, (req, res) => {
  try {
    const s = store.getStore();
    res.json({ success: true, products: s.products });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// Create new product
app.post('/api/admin/products', requireAdmin, (req, res) => {
  try {
    const s = store.getStore();
    const p = req.body;

    if (!p.name || !p.price || Number(p.price) <= 0) {
      return res.status(400).json({ success: false, error: 'Product name and valid price are required' });
    }

    const id = p.id ? p.id.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') : p.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (s.products.some(existing => existing.id === id)) {
      return res.status(400).json({ success: false, error: `Product ID "${id}" already exists. Use a unique name or slug.` });
    }

    const newProduct = {
      id,
      name: store.sanitizeText(p.name, 100),
      sub: store.sanitizeText(p.sub || '', 120),
      landscape: p.landscape ? store.sanitizeText(p.landscape, 30) : null,
      type: store.sanitizeText(p.type || 'Candle', 40),
      family: Array.isArray(p.family) ? p.family.map(f => store.sanitizeText(f, 30)) : ['floral'],
      price: Math.round(Number(p.price)),
      size: store.sanitizeText(p.size || '240 g', 30),
      burn: store.sanitizeText(p.burn || '≈ 50 hours', 30),
      dims: store.sanitizeText(p.dims || '9 cm × 10 cm', 30),
      weight: store.sanitizeText(p.weight || '640 g', 30),
      notes: {
        top: Array.isArray(p.notes && p.notes.top) ? p.notes.top.map(n => store.sanitizeText(n, 40)) : [],
        heart: Array.isArray(p.notes && p.notes.heart) ? p.notes.heart.map(n => store.sanitizeText(n, 40)) : [],
        base: Array.isArray(p.notes && p.notes.base) ? p.notes.base.map(n => store.sanitizeText(n, 40)) : []
      },
      shortScent: store.sanitizeText(p.shortScent || '', 200),
      longScent: store.sanitizeText(p.longScent || '', 500),
      story: store.sanitizeText(p.story || '', 500),
      img: p.img || { a: 'img/1a.webp', b: 'img/1b.webp', c: 'img/1c.webp' },
      art: p.art || { bg: 'linear-gradient(160deg,#E7EAF1 0%,#56648C 100%)', glow: 'radial-gradient(circle at 68% 30%,#F2F1EA 0%,transparent 55%)' },
      featured: Boolean(p.featured),
      status: ['in_stock', 'low_stock', 'sold_out'].includes(p.status) ? p.status : 'in_stock',
      createdAt: new Date().toISOString()
    };

    s.products.unshift(newProduct);
    store.saveStore(s);

    res.json({ success: true, product: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update product (price, stock, details)
app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  try {
    const s = store.getStore();
    const id = req.params.id;
    const idx = s.products.findIndex(p => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const updates = req.body;
    const current = s.products[idx];

    // Safely apply allowed updates
    if (updates.price !== undefined) {
      const priceNum = Math.round(Number(updates.price));
      if (isNaN(priceNum) || priceNum <= 0) {
        return res.status(400).json({ success: false, error: 'Price must be a positive integer' });
      }
      current.price = priceNum;
    }
    if (updates.name !== undefined) current.name = store.sanitizeText(updates.name, 100);
    if (updates.sub !== undefined) current.sub = store.sanitizeText(updates.sub, 120);
    if (updates.landscape !== undefined) current.landscape = updates.landscape ? store.sanitizeText(updates.landscape, 30) : null;
    if (updates.type !== undefined) current.type = store.sanitizeText(updates.type, 40);
    if (updates.family !== undefined && Array.isArray(updates.family)) current.family = updates.family.map(f => store.sanitizeText(f, 30));
    if (updates.size !== undefined) current.size = store.sanitizeText(updates.size, 30);
    if (updates.burn !== undefined) current.burn = store.sanitizeText(updates.burn, 30);
    if (updates.dims !== undefined) current.dims = store.sanitizeText(updates.dims, 30);
    if (updates.weight !== undefined) current.weight = store.sanitizeText(updates.weight, 30);
    if (updates.notes !== undefined && typeof updates.notes === 'object') current.notes = updates.notes;
    if (updates.shortScent !== undefined) current.shortScent = store.sanitizeText(updates.shortScent, 200);
    if (updates.longScent !== undefined) current.longScent = store.sanitizeText(updates.longScent, 500);
    if (updates.story !== undefined) current.story = store.sanitizeText(updates.story, 500);
    if (updates.img !== undefined && typeof updates.img === 'object') current.img = updates.img;
    if (updates.featured !== undefined) current.featured = Boolean(updates.featured);
    if (updates.status !== undefined && ['in_stock', 'low_stock', 'sold_out'].includes(updates.status)) current.status = updates.status;

    current.updatedAt = new Date().toISOString();
    s.products[idx] = current;
    store.saveStore(s);

    res.json({ success: true, product: current });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete product
app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  try {
    const s = store.getStore();
    const id = req.params.id;
    const idx = s.products.findIndex(p => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    s.products.splice(idx, 1);
    store.saveStore(s);
    res.json({ success: true, message: 'Product removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// List all coupons
app.get('/api/admin/coupons', requireAdmin, (req, res) => {
  try {
    const s = store.getStore();
    res.json({ success: true, coupons: s.coupons || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch coupons' });
  }
});

// Create new coupon
app.post('/api/admin/coupons', requireAdmin, (req, res) => {
  try {
    const s = store.getStore();
    const c = req.body;

    if (!c.code || typeof c.code !== 'string') {
      return res.status(400).json({ success: false, error: 'Coupon code is required' });
    }

    const code = c.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (code.length < 3) {
      return res.status(400).json({ success: false, error: 'Coupon code must be at least 3 characters' });
    }

    s.coupons = s.coupons || [];
    if (s.coupons.some(existing => existing.code.toUpperCase() === code)) {
      return res.status(400).json({ success: false, error: `Coupon code "${code}" already exists` });
    }

    const val = Number(c.value);
    if (isNaN(val) || val <= 0) {
      return res.status(400).json({ success: false, error: 'Discount value must be greater than zero' });
    }

    if (c.type === 'percent' && val > 90) {
      return res.status(400).json({ success: false, error: 'Percentage discount cannot exceed 90%' });
    }

    const newCoupon = {
      code,
      type: c.type === 'flat' ? 'flat' : 'percent',
      value: val,
      minOrder: c.minOrder ? Math.max(0, Number(c.minOrder)) : 0,
      maxDiscount: c.maxDiscount ? Math.max(0, Number(c.maxDiscount)) : null,
      usageLimit: c.usageLimit ? Math.max(1, Number(c.usageLimit)) : null,
      timesUsed: 0,
      active: c.active !== false,
      description: (c.description || '').trim(),
      validUntil: c.validUntil || null,
      createdAt: new Date().toISOString()
    };

    s.coupons.unshift(newCoupon);
    store.saveStore(s);

    res.json({ success: true, coupon: newCoupon });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update coupon (toggle active, edit limits)
app.put('/api/admin/coupons/:code', requireAdmin, (req, res) => {
  try {
    const s = store.getStore();
    const code = req.params.code.toUpperCase();
    const idx = (s.coupons || []).findIndex(c => c.code.toUpperCase() === code);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Coupon not found' });
    }

    const updates = req.body;
    const current = s.coupons[idx];

    if (updates.active !== undefined) current.active = Boolean(updates.active);
    if (updates.value !== undefined) current.value = Number(updates.value);
    if (updates.type !== undefined) current.type = updates.type === 'flat' ? 'flat' : 'percent';
    if (updates.minOrder !== undefined) current.minOrder = Number(updates.minOrder);
    if (updates.maxDiscount !== undefined) current.maxDiscount = updates.maxDiscount ? Number(updates.maxDiscount) : null;
    if (updates.usageLimit !== undefined) current.usageLimit = updates.usageLimit ? Number(updates.usageLimit) : null;
    if (updates.description !== undefined) current.description = updates.description.trim();
    if (updates.validUntil !== undefined) current.validUntil = updates.validUntil || null;

    s.coupons[idx] = current;
    store.saveStore(s);

    res.json({ success: true, coupon: current });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete coupon
app.delete('/api/admin/coupons/:code', requireAdmin, (req, res) => {
  try {
    const s = store.getStore();
    const code = req.params.code.toUpperCase();
    const idx = (s.coupons || []).findIndex(c => c.code.toUpperCase() === code);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Coupon not found' });
    }

    s.coupons.splice(idx, 1);
    store.saveStore(s);
    res.json({ success: true, message: `Coupon "${code}" deleted` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// List verified orders
app.get('/api/admin/orders', requireAdmin, (req, res) => {
  try {
    const s = store.getStore();
    res.json({ success: true, orders: s.orders || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// Update order fulfillment status
app.put('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  try {
    const s = store.getStore();
    const id = req.params.id;
    const order = (s.orders || []).find(o => o.id === id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const { status } = req.body;
    if (!['Confirmed', 'Dispatched', 'Delivered', 'Cancelled'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();
    store.saveStore(s);

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get store settings
app.get('/api/admin/settings', requireAdmin, (req, res) => {
  try {
    const s = store.getStore();
    res.json({
      success: true,
      config: s.config,
      adminUsername: s.admin.username
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get settings' });
  }
});

// Update store settings (shipping thresholds, rates)
app.put('/api/admin/settings', requireAdmin, (req, res) => {
  try {
    const s = store.getStore();
    const { freeShipThreshold, shipping } = req.body;

    if (freeShipThreshold !== undefined) {
      s.config.freeShipThreshold = Math.max(0, Number(freeShipThreshold));
    }
    if (shipping) {
      s.config.shipping = {
        standard: Math.max(0, Number(shipping.standard || 99)),
        express: Math.max(0, Number(shipping.express || 350))
      };
    }

    store.saveStore(s);
    res.json({ success: true, config: s.config });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Change admin password (rate-limited and revokes stale sessions upon change)
app.post('/api/admin/change-password', requireAdmin, (req, res) => {
  const ip = getClientIp(req);
  if (!checkRateLimit(loginAttempts, ip, 5, 900000)) {
    return res.status(429).json({ success: false, error: 'Too many password change attempts. Please wait 15 minutes.' });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new password are required' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters long' });
    }

    const s = store.getStore();
    if (!store.verifyPassword(currentPassword, s.admin.salt, s.admin.hash)) {
      console.warn(`[virai-security] Incorrect current password attempt for admin from IP ${ip.slice(0, 16)}`);
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    const { salt, hash } = store.hashPassword(newPassword);
    s.admin.salt = salt;
    s.admin.hash = hash;
    store.saveStore(s);

    // Revoke all existing sessions to invalidate any compromised tokens
    sessions.clear();

    // Re-issue a fresh secure token for the current session
    const newToken = crypto.randomBytes(32).toString('hex');
    sessions.set(newToken, {
      username: s.admin.username,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    });

    console.log(`[virai-security] Admin password changed successfully. All previous sessions revoked. IP: ${ip.slice(0, 16)}`);

    res.json({
      success: true,
      message: 'Admin password updated successfully. All other sessions have been revoked.',
      newToken
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Direct route to Admin Dashboard (with dedicated framing defense)
app.get('/admin', (req, res) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.sendFile(path.join(siteDir, 'admin.html'));
});

// Serve static assets from site directory with html extension fallback
app.use(express.static(siteDir, {
  extensions: ['html'],
  index: 'index.html',
  dotfiles: 'ignore'
}));

// Explicit 404 for unmatched API endpoints
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

// Fallback to index.html for clean extension-less HTML routes only
app.use((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).send('Method Not Allowed');
  }

  // If requesting a missing static file with an extension, return 404 rather than misleading HTML
  const ext = path.extname(req.path);
  if (ext && ext !== '.html') {
    return res.status(404).type('text/plain').send('Not Found');
  }

  res.sendFile(path.join(siteDir, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`VIRAI server running securely at http://${HOST}:${PORT}`);
});
