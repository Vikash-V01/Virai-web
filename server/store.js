const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORE_PATH = path.join(__dirname, '..', 'data', 'store.json');

// Mutex lock for atomic synchronous file write operations
let writeLock = false;

function getStore() {
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[virai-store] Error reading store.json:', err);
    throw new Error('Database read failed');
  }
}

function saveStore(data) {
  const tmpPath = `${STORE_PATH}.tmp.${Date.now()}.${crypto.randomBytes(4).toString('hex')}`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, STORE_PATH);
  } catch (err) {
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch (_) {}
    }
    throw err;
  }
}

function hashPassword(password, salt) {
  if (!salt) salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, storedHash) {
  try {
    const calculatedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(calculatedHash), Buffer.from(storedHash));
  } catch (_) {
    return false;
  }
}

// Strip unsafe tags from user-provided text
function sanitizeText(str, maxLength = 250) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // remove non-printable ASCII
    .trim()
    .slice(0, maxLength);
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
const PHONE_REGEX = /^[+]?[0-9\s\-()]{7,20}$/;

function validateContact(contact) {
  if (!contact || typeof contact !== 'object') {
    return { valid: false, error: 'Contact details are required' };
  }

  const name = sanitizeText(contact.name, 80);
  if (!name || name.length < 2) {
    return { valid: false, error: 'Please enter a valid recipient name (minimum 2 characters)' };
  }

  const email = (contact.email || '').trim().toLowerCase().slice(0, 100);
  if (!email || !EMAIL_REGEX.test(email)) {
    return { valid: false, error: 'Please enter a valid email address for order confirmation' };
  }

  const phone = (contact.phone || '').trim().slice(0, 20);
  if (phone && !PHONE_REGEX.test(phone)) {
    return { valid: false, error: 'Please enter a valid phone number (e.g. +91 98765 43210)' };
  }

  const address = sanitizeText(contact.address, 250);
  if (!address || address.length < 5) {
    return { valid: false, error: 'Please enter a complete delivery address (minimum 5 characters)' };
  }

  const city = sanitizeText(contact.city, 60);
  if (!city || city.length < 2) {
    return { valid: false, error: 'Please enter delivery city' };
  }

  const state = sanitizeText(contact.state, 60);
  const pincode = sanitizeText(contact.pincode, 10);
  if (!pincode || pincode.length < 3) {
    return { valid: false, error: 'Please enter a valid PIN or postal code' };
  }

  return {
    valid: true,
    contact: {
      name,
      email,
      phone,
      address,
      city,
      state,
      pincode
    }
  };
}

// Server-authoritative order calculation
function calculateOrder({ items, shipType = 'standard', couponCode = null }) {
  const store = getStore();
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, error: 'Shopping bag is empty' };
  }

  if (items.length > 50) {
    return { valid: false, error: 'Shopping bag exceeds maximum allowed item count (50)' };
  }

  let subtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    if (!item || !item.id || typeof item.id !== 'string') continue;
    const prod = store.products.find(p => p.id === item.id);
    if (!prod) {
      return { valid: false, error: `Product "${sanitizeText(item.id, 40)}" is unavailable or discontinued` };
    }

    const qty = Math.max(1, Math.min(99, parseInt(item.qty, 10) || 1));
    const giftWrap = Boolean(item.giftWrap);
    const wrapCostPerUnit = giftWrap ? 150 : 0;
    const linePrice = prod.price * qty;
    const lineWrapCost = wrapCostPerUnit * qty;

    subtotal += (linePrice + lineWrapCost);
    verifiedItems.push({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      qty,
      giftWrap,
      wrapCost: lineWrapCost,
      lineTotal: linePrice + lineWrapCost,
      message: sanitizeText(item.message || '', 180)
    });
  }

  if (verifiedItems.length === 0) {
    return { valid: false, error: 'No valid products in order' };
  }

  // Authoritative coupon evaluation
  let discount = 0;
  let appliedCoupon = null;
  let couponError = null;

  if (couponCode && typeof couponCode === 'string') {
    const cleanCode = couponCode.trim().toUpperCase().slice(0, 30);
    const coupon = (store.coupons || []).find(c => c.code.toUpperCase() === cleanCode);

    if (!coupon) {
      couponError = 'Invalid promo code';
    } else if (!coupon.active) {
      couponError = 'This coupon code is no longer active';
    } else if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
      couponError = 'This coupon code has expired';
    } else if (coupon.minOrder && subtotal < coupon.minOrder) {
      couponError = `Coupon requires a minimum order of ₹${coupon.minOrder.toLocaleString('en-IN')}`;
    } else if (coupon.usageLimit && (coupon.timesUsed || 0) >= coupon.usageLimit) {
      couponError = 'This coupon has reached its maximum usage limit';
    } else {
      if (coupon.type === 'percent') {
        const rawDisc = Math.round(subtotal * (coupon.value / 100));
        discount = coupon.maxDiscount ? Math.min(rawDisc, coupon.maxDiscount) : rawDisc;
      } else {
        discount = Math.min(subtotal, Math.round(coupon.value));
      }
      appliedCoupon = {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description
      };
    }
  }

  // Authoritative shipping calculation
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const freeShipThreshold = store.config.freeShipThreshold || 3000;
  let shippingCost = 0;
  const isExpress = (shipType === 'express');

  if (isExpress) {
    shippingCost = (store.config.shipping && store.config.shipping.express) || 350;
  } else {
    if (discountedSubtotal >= freeShipThreshold) {
      shippingCost = 0;
    } else {
      shippingCost = (store.config.shipping && store.config.shipping.standard) || 99;
    }
  }

  const grandTotal = discountedSubtotal + shippingCost;

  return {
    valid: true,
    subtotal,
    discount,
    discountedSubtotal,
    appliedCoupon,
    couponError,
    shippingMethod: isExpress ? 'express' : 'standard',
    shippingCost,
    freeShipThreshold,
    grandTotal,
    items: verifiedItems
  };
}

function placeOrder({ items, shipType, couponCode, contact }) {
  // Validate contact thoroughly before processing
  const contactVal = validateContact(contact);
  if (!contactVal.valid) {
    throw new Error(contactVal.error);
  }

  const calc = calculateOrder({ items, shipType, couponCode });
  if (!calc.valid) {
    throw new Error(calc.error || 'Order calculation failed');
  }

  const store = getStore();

  // If coupon applied, increment timesUsed
  if (calc.appliedCoupon) {
    const cIdx = (store.coupons || []).findIndex(c => c.code.toUpperCase() === calc.appliedCoupon.code.toUpperCase());
    if (cIdx !== -1) {
      store.coupons[cIdx].timesUsed = (store.coupons[cIdx].timesUsed || 0) + 1;
    }
  }

  const orderId = `VR-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  const order = {
    id: orderId,
    items: calc.items,
    subtotal: calc.subtotal,
    discount: calc.discount,
    couponCode: calc.appliedCoupon ? calc.appliedCoupon.code : null,
    shippingMethod: calc.shippingMethod,
    shippingCost: calc.shippingCost,
    total: calc.grandTotal,
    contact: contactVal.contact,
    status: 'Confirmed',
    createdAt: new Date().toISOString()
  };

  store.orders = store.orders || [];
  store.orders.unshift(order);

  // Cap stored orders to 1,000 to prevent unbounded file growth
  if (store.orders.length > 1000) {
    store.orders = store.orders.slice(0, 1000);
  }

  saveStore(store);

  return order;
}

module.exports = {
  getStore,
  saveStore,
  hashPassword,
  verifyPassword,
  calculateOrder,
  placeOrder,
  validateContact,
  sanitizeText
};
