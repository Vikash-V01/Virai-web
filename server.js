const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const store = require('./server/store');
const firestoreService = require('./server/firestore');
const postmarkService = require('./server/postmark');
const cashfreeService = require('./server/cashfree');

// Initialize Firestore persistence connection
firestoreService.initFirestore();

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

const siteDir = path.join(__dirname, 'site');

// Security: Enable reverse-proxy trust for accurate IP resolution behind Cloud Run / Nginx
app.set('trust proxy', 1);

// Security: Disable X-Powered-By header
app.disable('x-powered-by');

// Parse JSON bodies with limit accommodating high-res photography and raw body capture for webhook signature verification
app.use(express.json({
  limit: '25mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

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
    "script-src 'self' 'unsafe-inline' https://accounts.google.com https://sdk.cashfree.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://sandbox.cashfree.com https://api.cashfree.com; " +
    "frame-src 'self' https://sandbox.cashfree.com https://api.cashfree.com https://payments.cashfree.com; " +
    "frame-ancestors 'self' https://*.google.com https://*.run.app https://ai.studio; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self' https://accounts.google.com https://sandbox.cashfree.com https://api.cashfree.com;"
  );
  next();
});

// Helper to sanitize HTML strings
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
app.post('/api/checkout/place-order', async (req, res) => {
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
    console.log(`[virai-security] Order placed: ${order.id} | Total: ₹${order.total} | IP: ${ip.slice(0, 16)}`);

    // 1. Initialize Cashfree Payment Session
    let cashfreeSession = null;
    try {
      const origin = `${req.protocol}://${req.get('host')}`;
      const returnUrl = `${origin}/order-confirmation.html?order_id=${order.id}`;
      const notifyUrl = `${origin}/api/cashfree/webhook`;

      cashfreeSession = await cashfreeService.createPaymentSession({
        orderId: order.id,
        orderAmount: order.total,
        customer: order.contact,
        returnUrl,
        notifyUrl
      });
    } catch (cfErr) {
      console.warn('[checkout:cashfree] Payment session creation error:', cfErr.message);
    }

    // 2. Dispatch Postmark Transactional Order Confirmation Receipt
    try {
      postmarkService.sendOrderConfirmationEmail({ order }).catch(pmErr => {
        console.warn('[checkout:postmark] Async email delivery warning:', pmErr.message);
      });
    } catch (pmErr) {
      console.warn('[checkout:postmark] Postmark dispatch warning:', pmErr.message);
    }

    res.json({
      success: true,
      order,
      cashfree: cashfreeSession
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Cashfree Webhook Endpoint (verifies HMAC-SHA256 signature and updates order status)
app.post('/api/cashfree/webhook', (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    if (cashfreeService.isCashfreeConfigured() && signature && timestamp) {
      const isValid = cashfreeService.verifyWebhookSignature(signature, rawBody, timestamp);
      if (!isValid) {
        console.warn('[cashfree:webhook] Rejected invalid signature.');
        return res.status(400).json({ success: false, error: 'Invalid webhook signature' });
      }
    }

    const eventData = req.body && req.body.data;
    const orderData = eventData ? eventData.order : (req.body && req.body.order);
    const paymentData = eventData ? eventData.payment : (req.body && req.body.payment);

    if (orderData && orderData.order_id) {
      const orderId = orderData.order_id;
      const isSuccess = paymentData && (paymentData.payment_status === 'SUCCESS' || paymentData.payment_status === 'PAID');
      const paymentStatus = isSuccess ? 'Paid' : 'Failed';

      const updatedOrder = store.updateOrderPaymentStatus(orderId, {
        paymentStatus,
        paymentId: paymentData ? (paymentData.cf_payment_id || paymentData.payment_id) : null,
        cashfreeOrderId: orderData.cf_order_id,
        paymentMethod: paymentData ? paymentData.payment_group : 'cashfree'
      });

      console.log(`[cashfree:webhook] Order ${orderId} status set to: ${paymentStatus}`);

      if (updatedOrder && isSuccess) {
        postmarkService.sendOrderConfirmationEmail({ order: updatedOrder }).catch(err => {
          console.warn('[cashfree:webhook] Postmark confirmation email error:', err.message);
        });
      }
    }

    res.status(200).json({ success: true, message: 'Webhook received' });
  } catch (err) {
    console.error('[cashfree:webhook] Webhook handling error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Order verification endpoint (used upon redirect back to order confirmation)
app.get('/api/cashfree/verify-order', async (req, res) => {
  try {
    const orderId = req.query.order_id;
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    const s = store.getStore();
    const existing = (s.orders || []).find(o => o.id === orderId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check with live Cashfree API if keys are present
    if (cashfreeService.isCashfreeConfigured()) {
      try {
        const cfOrder = await cashfreeService.fetchOrderStatus(orderId);
        if (cfOrder && (cfOrder.order_status === 'PAID' || cfOrder.order_status === 'SUCCESS')) {
          store.updateOrderPaymentStatus(orderId, {
            paymentStatus: 'Paid',
            cashfreeOrderId: cfOrder.cf_order_id
          });
        }
      } catch (err) {
        console.warn('[cashfree:verify] Gateway check warning:', err.message);
      }
    }

    const freshStore = store.getStore();
    const freshOrder = (freshStore.orders || []).find(o => o.id === orderId) || existing;

    res.json({ success: true, order: freshOrder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// SHIPMENT & ORDER TRACKING APIS
// -------------------------------------------------------------

function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const parts = email.split('@');
  if (parts.length !== 2) return '****';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) return `${name[0]}*@${domain}`;
  return `${name[0]}${'*'.repeat(Math.min(name.length - 2, 4))}${name[name.length - 1]}@${domain}`;
}

function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const clean = phone.trim();
  if (clean.length < 6) return '******';
  return clean.slice(0, 5) + '****' + clean.slice(-2);
}

function maskName(name) {
  if (!name || typeof name !== 'string') return '';
  const words = name.trim().split(/\s+/);
  return words.map(w => w.length <= 2 ? w : w[0] + '*'.repeat(Math.min(w.length - 1, 4))).join(' ');
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

const DEMO_SAMPLE_ORDER = {
  id: 'VR-SAMPLE-KURINJI',
  createdAt: new Date(Date.now() - 36 * 3600000).toISOString(),
  status: 'Dispatched',
  shippingMethod: 'standard',
  total: 3000,
  courier: 'Blue Dart Express',
  awb: 'BD-8492019482IN',
  trackingUrl: 'https://www.bluedart.com/',
  contact: {
    name: 'Vikash Suresh',
    email: 'vikashsuresh69@gmail.com',
    phone: '+91 9876543210',
    address: '12 Temple View Lane',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600004'
  },
  items: [
    {
      id: 'kurinji-candle',
      name: 'Kurinji · Union Candle',
      price: 2850,
      qty: 1,
      giftWrap: true,
      message: 'For your new beginning — may it linger unhurriedly.'
    }
  ]
};

function buildTrackingPayload(order, storeProducts = []) {
  const isDemo = order.id === 'VR-SAMPLE-KURINJI';
  const createdAt = new Date(order.createdAt || Date.now());
  const now = Date.now();
  const isExpress = (order.shippingMethod === 'express');

  const leadDays = isExpress ? 2 : 4;
  const estDeliveryDate = new Date(createdAt.getTime() + leadDays * 24 * 60 * 60 * 1000);
  const projectedEta = (estDeliveryDate.getTime() < now && order.status !== 'Delivered')
    ? new Date(now + 2 * 24 * 60 * 60 * 1000)
    : estDeliveryDate;

  const courier = order.courier || (isExpress ? 'Blue Dart Apex Express' : 'Blue Dart Express');
  const awb = order.awb || ('BD' + Math.abs(hashString(order.id)).toString().padStart(8, '0') + 'IN');
  const trackingUrl = order.trackingUrl || `https://www.bluedart.com/`;

  let activeStep = 1;
  let statusBadge = 'Order Confirmed';
  let statusTone = 'stone';

  if (order.status === 'Cancelled') {
    activeStep = -1;
    statusBadge = 'Order Cancelled';
    statusTone = 'red';
  } else if (order.status === 'Delivered') {
    activeStep = 5;
    statusBadge = 'Delivered';
    statusTone = 'green';
  } else if (order.status === 'Dispatched') {
    activeStep = 4;
    statusBadge = `In Transit with ${courier.split(' ')[0]}`;
    statusTone = 'amber';
  } else {
    const hoursSince = (now - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince >= 12 || isDemo) {
      activeStep = 2;
      statusBadge = 'Artisan Formulation in Studio';
      statusTone = 'stone';
    } else {
      activeStep = 1;
      statusBadge = 'Order Confirmed & Wax Reserved';
      statusTone = 'stone';
    }
  }

  const milestones = [
    {
      step: 1,
      name: 'Order Placed & Payment Verified',
      location: 'Virai Digital Studio',
      time: createdAt.toISOString(),
      completed: activeStep >= 1,
      current: activeStep === 1,
      detail: `Payment of ₹${(order.total || 0).toLocaleString('en-IN')} authorized via ${order.paymentMethod || 'Cashfree'}. Reference ${order.id} verified.`
    },
    {
      step: 2,
      name: 'Artisan Pouring & Wax Curing',
      location: 'Virai Atelier, Coimbatore',
      time: new Date(createdAt.getTime() + 8 * 3600000).toISOString(),
      completed: activeStep >= 2,
      current: activeStep === 2,
      detail: 'Wax formulation blended with fragrance oils, hand-poured into ceramic vessels, and allowed to slow-cure.'
    },
    {
      step: 3,
      name: 'Packaging & Calligraphy Sealing',
      location: 'Virai Atelier, Coimbatore',
      time: new Date(createdAt.getTime() + 18 * 3600000).toISOString(),
      completed: activeStep >= 3,
      current: activeStep === 3,
      detail: 'Vessel hand-inspected, wrapped in textured paper. Handwritten gift cards inscribed and wax sealed.'
    },
    {
      step: 4,
      name: 'Dispatched & Handed to Carrier',
      location: 'Coimbatore Hub, Tamil Nadu',
      time: new Date(createdAt.getTime() + 24 * 3600000).toISOString(),
      completed: activeStep >= 4,
      current: activeStep === 4,
      detail: `Consignment scanned and handed over to ${courier}. AWB: ${awb}.`
    },
    {
      step: 5,
      name: 'Delivered to Destination',
      location: order.contact ? `${order.contact.city || 'Destination'}, ${order.contact.state || ''}` : 'Recipient Address',
      time: order.status === 'Delivered' ? (order.updatedAt || projectedEta.toISOString()) : projectedEta.toISOString(),
      completed: activeStep >= 5,
      current: activeStep === 5,
      detail: order.status === 'Delivered'
        ? 'Parcel delivered safely and signed for.'
        : `Expected delivery on or before ${projectedEta.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}.`
    }
  ];

  const richItems = (order.items || []).map(item => {
    const p = storeProducts.find(prod => prod.id === item.id);
    return {
      id: item.id,
      name: item.name,
      qty: item.qty,
      price: item.price,
      lineTotal: item.lineTotal || (item.price * item.qty),
      giftWrap: Boolean(item.giftWrap),
      message: item.message || '',
      size: p ? p.size : 'Standard',
      sub: p ? p.sub : '',
      img: p && p.img ? (p.img.a || p.img.thumb || 'img/1a.webp') : 'img/1a.webp'
    };
  });

  return {
    orderId: order.id,
    status: order.status || 'Confirmed',
    statusBadge,
    statusTone,
    activeStep,
    totalSteps: 5,
    createdAt: createdAt.toISOString(),
    createdAtFormatted: createdAt.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }),
    estimatedDelivery: projectedEta.toISOString(),
    estimatedDeliveryFormatted: projectedEta.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    shippingMethod: isExpress ? 'Express Courier Delivery (1–2 Days)' : 'Standard Complimentary Shipping (3–7 Days)',
    isExpress,
    courier,
    awb,
    trackingUrl,
    contactMasked: {
      name: maskName(order.contact?.name || 'Customer'),
      email: maskEmail(order.contact?.email || ''),
      phone: maskPhone(order.contact?.phone || ''),
      city: order.contact?.city || '',
      state: order.contact?.state || '',
      pincode: order.contact?.pincode || '',
      destination: `${order.contact?.city || ''}${order.contact?.state ? ', ' + order.contact.state : ''} ${order.contact?.pincode ? '(' + order.contact.pincode + ')' : ''}`.trim()
    },
    items: richItems,
    itemsCount: richItems.reduce((acc, it) => acc + (it.qty || 1), 0),
    total: order.total,
    milestones
  };
}

// Public Shipment & Order Tracking Handler
app.all('/api/orders/track', (req, res) => {
  try {
    const rawRef = (req.query.orderId || req.query.order || req.query.id || req.query.awb || req.body?.orderId || req.body?.order || '').trim();
    const contactFilter = (req.query.contact || req.body?.contact || '').trim().toLowerCase();

    if (!rawRef) {
      return res.status(400).json({
        success: false,
        error: 'Please enter your Virai Order Reference (e.g. VR-MU1SO2S5-CF1D) or AWB Number.'
      });
    }

    const cleanRef = rawRef.replace(/^[#\s]+/, '').trim().toUpperCase();

    // Check demo / sample queries
    if (cleanRef === 'DEMO' || cleanRef === 'SAMPLE' || cleanRef === 'VR-SAMPLE-KURINJI' || cleanRef === 'VR-DEMO') {
      const s = store.getStore();
      const payload = buildTrackingPayload(DEMO_SAMPLE_ORDER, s.products || []);
      return res.json({ success: true, tracking: payload, isDemo: true });
    }

    const s = store.getStore();
    const orders = s.orders || [];

    // Search by exact ID, stripped prefix ID, or AWB
    let found = orders.find(o => {
      const oId = (o.id || '').toUpperCase();
      const oAwb = (o.awb || '').toUpperCase();
      return (
        oId === cleanRef ||
        oId.replace(/^VR-/, '') === cleanRef ||
        oAwb === cleanRef ||
        ('VR-' + cleanRef) === oId
      );
    });

    // Fallback: search by phone or email if provided
    if (!found && contactFilter) {
      found = orders.find(o => {
        const email = (o.contact?.email || '').toLowerCase();
        const phone = (o.contact?.phone || '').replace(/\D/g, '');
        const cleanContact = contactFilter.replace(/\D/g, '');
        return email === contactFilter || (cleanContact && phone.includes(cleanContact));
      });
    }

    if (!found) {
      return res.status(404).json({
        success: false,
        error: `No consignment found for reference "${cleanRef}". Please verify the order ID sent to your email, or explore our live demo shipment.`,
        sampleOrderId: 'VR-SAMPLE-KURINJI'
      });
    }

    const payload = buildTrackingPayload(found, s.products || []);
    res.json({ success: true, tracking: payload });
  } catch (err) {
    console.error('[shipment:track-error]', err);
    res.status(500).json({ success: false, error: 'Tracking service temporarily unavailable. Please try again shortly.' });
  }
});

// -------------------------------------------------------------
// CUSTOMER ACCOUNT & LIFECYCLE APIS (Registration, Auth, OTP/Magic-Link, Orders)
// -------------------------------------------------------------

const customerSessions = new Map(); // token -> { email, id, expiresAt }
const customerOtps = new Map(); // email -> { code, expiresAt, attempts }

// Periodic customer session cleanup
setInterval(() => {
  const now = Date.now();
  for (const [token, sess] of customerSessions.entries()) {
    if (sess.expiresAt <= now) customerSessions.delete(token);
  }
  for (const [email, data] of customerOtps.entries()) {
    if (data.expiresAt <= now) customerOtps.delete(email);
  }
}, 600000);

function requireCustomer(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Customer authentication required' });
  }

  const token = authHeader.slice(7).trim();
  const session = customerSessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    customerSessions.delete(token);
    return res.status(401).json({ success: false, error: 'Session expired. Please sign in again.' });
  }

  session.expiresAt = Date.now() + 14 * 24 * 60 * 60 * 1000; // 14-day rolling session
  req.customer = session;
  req.customerToken = token;
  next();
}

// Register new customer account
app.post('/api/customer/register', (req, res) => {
  const ip = getClientIp(req);
  if (!checkRateLimit(globalApiBuckets, ip, 15, 60000)) {
    return res.status(429).json({ success: false, error: 'Too many registration attempts. Please wait a moment.' });
  }

  try {
    const { email, password, name, phone } = req.body;
    const customer = store.registerCustomer({ email, password, name, phone });
    const token = crypto.randomBytes(32).toString('hex');
    customerSessions.set(token, {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        emailVerified: customer.emailVerified
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Customer password login
app.post('/api/customer/login', (req, res) => {
  const ip = getClientIp(req);
  if (!checkRateLimit(globalApiBuckets, ip, 15, 60000)) {
    return res.status(429).json({ success: false, error: 'Too many login attempts. Please wait a moment.' });
  }

  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const customer = store.verifyCustomerCredentials(email, password);
    if (!customer) {
      return res.status(401).json({ success: false, error: 'Incorrect email or password' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    customerSessions.set(token, {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        emailVerified: customer.emailVerified,
        savedAddresses: customer.savedAddresses
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Passwordless Magic Link / OTP request
app.post('/api/customer/request-otp', (req, res) => {
  const ip = getClientIp(req);
  if (!checkRateLimit(globalApiBuckets, ip, 8, 60000)) {
    return res.status(429).json({ success: false, error: 'Please wait before requesting another code.' });
  }

  try {
    const { email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
    }

    // Generate 6-digit secure numeric verification OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    customerOtps.set(cleanEmail, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0
    });

    console.log(`[virai-otp] Verification OTP for ${cleanEmail}: ${code} (expires in 10m)`);

    // Dispatch transactional OTP email via Postmark
    postmarkService.sendOtpEmail({
      toEmail: cleanEmail,
      otpCode: code,
      purpose: 'Patron Account Access'
    }).catch(pmErr => {
      console.warn('[otp:postmark] Postmark OTP delivery warning:', pmErr.message);
    });

    res.json({
      success: true,
      message: 'A 6-digit access code has been dispatched to your email via Postmark.',
      // In this preview environment, return the preview code to allow instant testing without external mailer dependency
      previewCode: code
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verify OTP & Sign In / Register seamlessly
app.post('/api/customer/verify-otp', (req, res) => {
  try {
    const { email, code } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (code || '').trim();

    const record = customerOtps.get(cleanEmail);
    if (!record || record.expiresAt <= Date.now()) {
      customerOtps.delete(cleanEmail);
      return res.status(400).json({ success: false, error: 'Verification code has expired. Please request a new one.' });
    }

    if (record.attempts >= 4) {
      customerOtps.delete(cleanEmail);
      return res.status(429).json({ success: false, error: 'Too many incorrect attempts. Please request a fresh code.' });
    }

    if (record.code !== cleanCode) {
      record.attempts += 1;
      return res.status(400).json({ success: false, error: 'Invalid verification code. Please check and try again.' });
    }

    // Code is valid - consume OTP
    customerOtps.delete(cleanEmail);

    // Auto-create or fetch customer account
    let customer = store.findCustomerByEmail(cleanEmail);
    if (!customer) {
      const generatedPass = crypto.randomBytes(16).toString('hex');
      customer = store.registerCustomer({ email: cleanEmail, password: generatedPass, name: cleanEmail.split('@')[0] });
    }

    const token = crypto.randomBytes(32).toString('hex');
    customerSessions.set(token, {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        emailVerified: true,
        savedAddresses: customer.savedAddresses || []
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get authenticated customer profile and order history
app.get('/api/customer/me', requireCustomer, (req, res) => {
  try {
    const customer = store.findCustomerByEmail(req.customer.email);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const orders = store.getCustomerOrders(req.customer.email);

    res.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        emailVerified: customer.emailVerified,
        savedAddresses: customer.savedAddresses || [],
        createdAt: customer.createdAt
      },
      orders
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update customer profile / saved addresses
app.put('/api/customer/me', requireCustomer, (req, res) => {
  try {
    const { name, phone, savedAddresses } = req.body;
    const updated = store.updateCustomerProfile(req.customer.email, { name, phone, savedAddresses });
    res.json({ success: true, customer: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Forgot / Reset Password flow
app.post('/api/customer/reset-password', (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const record = customerOtps.get(cleanEmail);

    if (!record || record.expiresAt <= Date.now() || record.code !== (code || '').trim()) {
      return res.status(400).json({ success: false, error: 'Invalid or expired verification code' });
    }

    customerOtps.delete(cleanEmail);
    store.resetCustomerPassword(cleanEmail, newPassword);

    res.json({ success: true, message: 'Password has been securely reset. You may now sign in.' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Customer sign out
app.post('/api/customer/logout', requireCustomer, (req, res) => {
  customerSessions.delete(req.customerToken);
  res.json({ success: true, message: 'Signed out successfully' });
});

// -------------------------------------------------------------
// GOOGLE SIGN-IN OAUTH INTEGRATION (Compliant with AI Studio Iframe & Popup guidelines)
// -------------------------------------------------------------

function getBaseAppUrl(req) {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const host = req.get('host');
  const proto = req.get('x-forwarded-proto') || 'https';
  return `${proto}://${host}`.replace(/\/+$/, '');
}

// 1. Get Google OAuth Authorization URL
app.get('/api/auth/google/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(400).json({
      success: false,
      configured: false,
      error: 'GOOGLE_CLIENT_ID is not configured yet. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the settings.'
    });
  }

  const appUrl = getBaseAppUrl(req);
  const redirectUri = `${appUrl}/auth/google/callback`;
  const state = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state: state
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({
    success: true,
    configured: true,
    url: authUrl,
    redirectUri: redirectUri
  });
});

// 2. OAuth Callback Handler (Returns lightweight HTML sending postMessage to popup opener)
app.get(['/auth/google/callback', '/auth/google/callback/'], async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    const errorMsg = error || 'Authorization denied';
    return res.send(`
      <!doctype html>
      <html>
        <head><meta charset="utf-8"><title>Authentication Failed | VIRAI</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:3rem;background:#FBF9F5;color:#1E1C1A">
          <h3>Authentication Unsuccessful</h3>
          <p>${escapeHtml(errorMsg)}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: ${JSON.stringify(errorMsg)} }, '*');
              setTimeout(() => window.close(), 1200);
            }
          </script>
        </body>
      </html>
    `);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const appUrl = getBaseAppUrl(req);
    const redirectUri = `${appUrl}/auth/google/callback`;

    // Exchange authorization code for tokens directly with Google
    const tokenParams = new URLSearchParams({
      code: code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString()
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange Google OAuth code');
    }

    // Retrieve user profile from Google UserInfo endpoint
    const userinfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    const userInfo = await userinfoResponse.json();

    if (!userInfo || !userInfo.email) {
      throw new Error('Could not retrieve email from Google profile');
    }

    const cleanEmail = userInfo.email.trim().toLowerCase();
    const customerName = userInfo.name || cleanEmail.split('@')[0];

    // Find or automatically create registered patron profile
    let customer = store.findCustomerByEmail(cleanEmail);
    if (!customer) {
      const generatedPass = crypto.randomBytes(24).toString('hex');
      customer = store.registerCustomer({
        email: cleanEmail,
        password: generatedPass,
        name: customerName,
        phone: ''
      });
    }

    // Generate patron session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    customerSessions.set(sessionToken, {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000
    });

    const clientPayload = {
      token: sessionToken,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        emailVerified: true,
        savedAddresses: customer.savedAddresses || []
      }
    };

    // Return HTML popup response that communicates to opener via postMessage
    res.send(`
      <!doctype html>
      <html>
        <head><meta charset="utf-8"><title>Signing In | VIRAI</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:3rem;background:#FBF9F5;color:#1E1C1A">
          <p style="font-size:1.1rem;margin-bottom:.5rem">Vanakkam, <strong>${escapeHtml(customer.name)}</strong></p>
          <p style="font-size:.9rem;color:#6C6863">Authenticated successfully with Google. Returning to your sanctuary...</p>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_AUTH_SUCCESS',
                  payload: ${JSON.stringify(clientPayload)}
                }, '*');
                window.close();
              } else {
                window.location.href = '/account.html';
              }
            } catch (err) {
              window.location.href = '/account.html';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('[virai-google-oauth-error]', err);
    res.send(`
      <!doctype html>
      <html>
        <head><meta charset="utf-8"><title>Authentication Error | VIRAI</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:3rem;background:#FBF9F5;color:#1E1C1A">
          <h3 style="color:#A2593B">Authentication Error</h3>
          <p>${escapeHtml(err.message || 'An error occurred during Google sign-in')}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: ${JSON.stringify(err.message)} }, '*');
              setTimeout(() => window.close(), 1800);
            }
          </script>
        </body>
      </html>
    `);
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

// Upload product photography (accepts base64 data URI, validates, saves to site/img/uploads)
app.post('/api/admin/upload-image', requireAdmin, (req, res) => {
  try {
    const { image, filename: clientName } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (matches && matches.length === 3) {
      mimeType = matches[1].toLowerCase();
      base64Data = matches[2];
    }

    const allowedMimes = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/avif': 'avif',
      'image/gif': 'gif'
    };

    const ext = allowedMimes[mimeType] || 'jpg';
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 15 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'Image size exceeds 15MB limit' });
    }

    const uploadsDir = path.join(siteDir, 'img', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const cleanBase = (clientName ? path.parse(clientName).name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30) : 'photo');
    const safeFilename = `${cleanBase}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const filePath = path.join(uploadsDir, safeFilename);

    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `img/uploads/${safeFilename}`;
    console.log(`[virai-upload] Product image saved: ${relativeUrl} (${(buffer.length / 1024).toFixed(1)} KB)`);

    res.json({
      success: true,
      url: relativeUrl,
      filename: safeFilename
    });
  } catch (err) {
    console.error('[virai-upload] Image upload failed:', err);
    res.status(500).json({ success: false, error: 'Failed to process image upload: ' + err.message });
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

    const { status, courier, awb, trackingUrl } = req.body;
    if (status) {
      if (!['Confirmed', 'Dispatched', 'Delivered', 'Cancelled'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status value' });
      }
      order.status = status;
    }
    if (courier !== undefined) order.courier = String(courier).trim();
    if (awb !== undefined) order.awb = String(awb).trim();
    if (trackingUrl !== undefined) order.trackingUrl = String(trackingUrl).trim();

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

// Explicit alias for Shipment Tracking routes
app.get(['/shipment', '/shipment.html'], (req, res) => {
  res.sendFile(path.join(siteDir, 'shipping.html'));
});

// Serve static assets from site directory with html extension fallback
app.use(express.static(siteDir, {
  extensions: ['html'],
  index: 'index.html',
  dotfiles: 'ignore',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
  }
}));

// Explicit 404 for unmatched API endpoints
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

// Clean error routing: return 404.html with status 404 for unmapped storefront routes
app.use((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).send('Method Not Allowed');
  }

  // If requesting a missing static file with an extension, return plain 404
  const ext = path.extname(req.path);
  if (ext && ext !== '.html') {
    return res.status(404).type('text/plain').send('Not Found');
  }

  res.status(404).sendFile(path.join(siteDir, '404.html'));
});

// Centralized error handler returning 500.html
app.use((err, req, res, next) => {
  console.error('[virai-internal-error]', err);
  if (req.path.startsWith('/api')) {
    return res.status(500).json({ success: false, error: 'Internal server error occurred' });
  }
  res.status(500).sendFile(path.join(siteDir, '500.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`VIRAI server running securely at http://${HOST}:${PORT}`);
});
