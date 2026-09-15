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

    if (prod.status === 'out_of_stock' || prod.status === 'sold_out') {
      return { valid: false, error: `"${prod.name}" is currently sold out and unavailable.` };
    }

    const isPrebooking = (prod.status === 'prebooking');
    const prebookRelease = isPrebooking ? (prod.prebookRelease || prod.prebookingDate || 'Scheduled Studio Release') : '';
    const prebookNote = isPrebooking ? (prod.prebookNote || '') : '';

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
      message: sanitizeText(item.message || '', 180),
      isPrebooking,
      prebookRelease,
      prebookNote
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
    hasPrebooking: verifiedItems.some(it => it.isPrebooking),
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
    hasPrebooking: Boolean(calc.hasPrebooking),
    prebookingNotice: calc.hasPrebooking ? 'Includes slow-pour pre-booking allocation' : null,
    subtotal: calc.subtotal,
    discount: calc.discount,
    couponCode: calc.appliedCoupon ? calc.appliedCoupon.code : null,
    shippingMethod: calc.shippingMethod,
    shippingCost: calc.shippingCost,
    total: calc.grandTotal,
    contact: contactVal.contact,
    status: 'Confirmed',
    paymentMethod: 'cashfree',
    paymentStatus: 'Pending',
    createdAt: new Date().toISOString()
  };

  store.orders = store.orders || [];
  store.orders.unshift(order);

  // Cap stored orders to 1,000 to prevent unbounded file growth
  if (store.orders.length > 1000) {
    store.orders = store.orders.slice(0, 1000);
  }

  saveStore(store);

  // Asynchronously persist order to Firestore
  try {
    const firestore = require('./firestore');
    firestore.saveOrderToFirestore(order).catch(err => {
      console.warn('[store:firestore] Async Firestore order save warning:', err.message);
    });
  } catch (err) {
    console.warn('[store:firestore] Firestore module load warning:', err.message);
  }

  return order;
}

function updateOrderPaymentStatus(orderId, { paymentStatus, paymentId, cashfreeOrderId, paymentMethod }) {
  const s = getStore();
  s.orders = s.orders || [];
  const idx = s.orders.findIndex(o => o.id === orderId);
  if (idx === -1) return null;

  if (paymentStatus) s.orders[idx].paymentStatus = paymentStatus;
  if (paymentId) s.orders[idx].paymentId = paymentId;
  if (cashfreeOrderId) s.orders[idx].cashfreeOrderId = cashfreeOrderId;
  if (paymentMethod) s.orders[idx].paymentMethod = paymentMethod;
  if (paymentStatus === 'Paid') s.orders[idx].status = 'Confirmed';
  s.orders[idx].updatedAt = new Date().toISOString();

  saveStore(s);

  // Sync to Firestore
  try {
    const firestore = require('./firestore');
    firestore.updateOrderPaymentInFirestore(orderId, { paymentStatus, paymentId, paymentMethod }).catch(err => {
      console.warn('[store:firestore] Async Firestore payment status update warning:', err.message);
    });
  } catch (err) {
    console.warn('[store:firestore] Firestore module load warning:', err.message);
  }

  return s.orders[idx];
}

// -------------------------------------------------------------
// CUSTOMER ACCOUNT MANAGEMENT (DPDP-compliant, PBKDF2 hashed)
// -------------------------------------------------------------

function findCustomerByEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const cleanEmail = email.trim().toLowerCase();
  const s = getStore();
  s.customers = s.customers || [];
  return s.customers.find(c => c.email.toLowerCase() === cleanEmail) || null;
}

function registerCustomer({ email, password, name, phone }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    throw new Error('Please enter a valid email address');
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  const s = getStore();
  s.customers = s.customers || [];

  if (s.customers.some(c => c.email.toLowerCase() === cleanEmail)) {
    throw new Error('An account already exists with this email address. Please sign in.');
  }

  const { salt, hash } = hashPassword(password);
  const newCustomer = {
    id: `cust_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
    email: cleanEmail,
    name: sanitizeText(name || '', 60),
    phone: sanitizeText(phone || '', 20),
    salt,
    hash,
    emailVerified: true, // Auto-verified upon successful registration in this environment
    savedAddresses: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  s.customers.unshift(newCustomer);
  saveStore(s);

  // Asynchronously persist customer to Firestore
  try {
    const firestore = require('./firestore');
    firestore.saveCustomerToFirestore(newCustomer).catch(err => {
      console.warn('[store:firestore] Async Firestore customer save warning:', err.message);
    });
  } catch (err) {
    console.warn('[store:firestore] Firestore module load warning:', err.message);
  }

  return {
    id: newCustomer.id,
    email: newCustomer.email,
    name: newCustomer.name,
    phone: newCustomer.phone,
    emailVerified: newCustomer.emailVerified,
    createdAt: newCustomer.createdAt
  };
}

function verifyCustomerCredentials(email, password) {
  const customer = findCustomerByEmail(email);
  if (!customer) return null;
  if (!customer.salt || !customer.hash) return null;

  const valid = verifyPassword(password, customer.salt, customer.hash);
  if (!valid) return null;

  return {
    id: customer.id,
    email: customer.email,
    name: customer.name,
    phone: customer.phone,
    emailVerified: customer.emailVerified,
    savedAddresses: customer.savedAddresses || []
  };
}

function getCustomerOrders(email) {
  if (!email) return [];
  const cleanEmail = email.trim().toLowerCase();
  const s = getStore();
  return (s.orders || []).filter(o => o.contact && o.contact.email && o.contact.email.toLowerCase() === cleanEmail);
}

function updateCustomerProfile(email, { name, phone, savedAddresses }) {
  const s = getStore();
  s.customers = s.customers || [];
  const cleanEmail = email.trim().toLowerCase();
  const idx = s.customers.findIndex(c => c.email.toLowerCase() === cleanEmail);
  if (idx === -1) throw new Error('Account not found');

  if (name !== undefined) s.customers[idx].name = sanitizeText(name, 60);
  if (phone !== undefined) s.customers[idx].phone = sanitizeText(phone, 20);
  if (Array.isArray(savedAddresses)) {
    s.customers[idx].savedAddresses = savedAddresses.slice(0, 5).map(addr => ({
      name: sanitizeText(addr.name || '', 60),
      address: sanitizeText(addr.address || '', 200),
      city: sanitizeText(addr.city || '', 60),
      state: sanitizeText(addr.state || '', 60),
      pincode: sanitizeText(addr.pincode || '', 10),
      isDefault: Boolean(addr.isDefault)
    }));
  }

  s.customers[idx].updatedAt = new Date().toISOString();
  saveStore(s);
  return {
    id: s.customers[idx].id,
    email: s.customers[idx].email,
    name: s.customers[idx].name,
    phone: s.customers[idx].phone,
    savedAddresses: s.customers[idx].savedAddresses
  };
}

function resetCustomerPassword(email, newPassword) {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters');
  }
  const s = getStore();
  s.customers = s.customers || [];
  const cleanEmail = email.trim().toLowerCase();
  const idx = s.customers.findIndex(c => c.email.toLowerCase() === cleanEmail);
  if (idx === -1) throw new Error('Account not found');

  const { salt, hash } = hashPassword(newPassword);
  s.customers[idx].salt = salt;
  s.customers[idx].hash = hash;
  s.customers[idx].updatedAt = new Date().toISOString();
  saveStore(s);
  return true;
}

module.exports = {
  getStore,
  saveStore,
  hashPassword,
  verifyPassword,
  calculateOrder,
  placeOrder,
  updateOrderPaymentStatus,
  validateContact,
  sanitizeText,
  findCustomerByEmail,
  registerCustomer,
  verifyCustomerCredentials,
  getCustomerOrders,
  updateCustomerProfile,
  resetCustomerPassword
};
