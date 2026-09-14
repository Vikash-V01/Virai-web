const { initializeApp, getApps, getApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, orderBy, limit } = require('firebase/firestore');
const path = require('path');
const fs = require('fs');

let dbInstance = null;
let isConfigured = false;

function initFirestore() {
  if (dbInstance) return dbInstance;

  try {
    let firebaseConfig = null;
    const configPath = path.join(__dirname, '..', 'firebase-applet-config.json');

    if (fs.existsSync(configPath)) {
      try {
        firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (e) {
        console.warn('[Firestore] Could not parse firebase-applet-config.json:', e.message);
      }
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || (firebaseConfig && firebaseConfig.projectId);
    const apiKey = process.env.FIREBASE_API_KEY || (firebaseConfig && firebaseConfig.apiKey);
    const databaseId = process.env.FIRESTORE_DATABASE_ID || (firebaseConfig && firebaseConfig.firestoreDatabaseId) || undefined;

    if (!projectId || !apiKey) {
      console.warn('[Firestore] Project ID or API Key not available; running in local storage fallback mode.');
      return null;
    }

    const app = getApps().length > 0 ? getApp() : initializeApp({
      projectId,
      apiKey,
      appId: firebaseConfig ? firebaseConfig.appId : undefined,
      authDomain: firebaseConfig ? firebaseConfig.authDomain : undefined
    });

    dbInstance = getFirestore(app, databaseId);
    isConfigured = true;
    console.log(`[Firestore] Initialized successfully with databaseId: ${databaseId || '(default)'}`);
    return dbInstance;
  } catch (err) {
    console.error('[Firestore] Initialization error:', err.message);
    return null;
  }
}

// -------------------------------------------------------------
// FIRESTORE OPERATIONS
// -------------------------------------------------------------

async function saveOrderToFirestore(order) {
  const db = initFirestore();
  if (!db || !order || !order.id) return false;

  try {
    const orderDocRef = doc(db, 'orders', order.id);
    const payload = {
      id: order.id,
      items: (order.items || []).map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        qty: i.qty,
        giftWrap: !!i.giftWrap,
        wrapCost: i.wrapCost || 0,
        lineTotal: i.lineTotal || 0,
        message: i.message || ''
      })),
      subtotal: order.subtotal || 0,
      discount: order.discount || 0,
      shippingCost: order.shippingCost || 0,
      total: order.total || 0,
      shippingMethod: order.shippingMethod || 'standard',
      couponCode: order.couponCode || null,
      status: order.status || 'Confirmed',
      paymentMethod: order.paymentMethod || 'cashfree',
      paymentStatus: order.paymentStatus || 'Pending',
      cashfreeOrderId: order.cashfreeOrderId || null,
      contact: {
        name: order.contact ? order.contact.name : '',
        email: order.contact ? order.contact.email : '',
        phone: order.contact ? order.contact.phone : '',
        address: order.contact ? order.contact.address : '',
        city: order.contact ? order.contact.city : '',
        state: order.contact ? order.contact.state : '',
        pincode: order.contact ? order.contact.pincode : ''
      },
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(orderDocRef, payload);
    console.log(`[Firestore] Persisted order ${order.id} to Firestore.`);
    return true;
  } catch (err) {
    console.error(`[Firestore] Error saving order ${order.id}:`, err.message);
    return false;
  }
}

async function updateOrderPaymentInFirestore(orderId, { paymentStatus, paymentId, paymentMethod }) {
  const db = initFirestore();
  if (!db || !orderId) return false;

  try {
    const orderDocRef = doc(db, 'orders', orderId);
    await updateDoc(orderDocRef, {
      paymentStatus: paymentStatus || 'Paid',
      paymentId: paymentId || null,
      paymentMethod: paymentMethod || 'cashfree',
      updatedAt: new Date().toISOString()
    });
    console.log(`[Firestore] Updated order ${orderId} payment status to ${paymentStatus}.`);
    return true;
  } catch (err) {
    console.error(`[Firestore] Error updating order payment for ${orderId}:`, err.message);
    return false;
  }
}

async function getOrderFromFirestore(orderId) {
  const db = initFirestore();
  if (!db || !orderId) return null;

  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const snap = await getDoc(orderDocRef);
    if (!snap.exists()) return null;
    return snap.data();
  } catch (err) {
    console.error(`[Firestore] Error fetching order ${orderId}:`, err.message);
    return null;
  }
}

async function saveCustomerToFirestore(customer) {
  const db = initFirestore();
  if (!db || !customer || !customer.email) return false;

  try {
    const cleanEmail = customer.email.toLowerCase().trim();
    // Encode email safely for doc ID or use customer.id
    const docId = customer.id || cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
    const custDocRef = doc(db, 'customers', docId);

    const payload = {
      id: customer.id,
      email: cleanEmail,
      name: customer.name || '',
      phone: customer.phone || '',
      salt: customer.salt || '',
      hash: customer.hash || '',
      savedAddresses: customer.savedAddresses || [],
      createdAt: customer.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(custDocRef, payload, { merge: true });
    console.log(`[Firestore] Persisted customer ${cleanEmail} to Firestore.`);
    return true;
  } catch (err) {
    console.error(`[Firestore] Error saving customer ${customer.email}:`, err.message);
    return false;
  }
}

async function saveReviewToFirestore(review) {
  const db = initFirestore();
  if (!db || !review || !review.id) return false;

  try {
    const reviewDocRef = doc(db, 'reviews', review.id);
    await setDoc(reviewDocRef, {
      id: review.id,
      productId: review.productId,
      name: review.name,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt || new Date().toISOString()
    });
    console.log(`[Firestore] Persisted review ${review.id} to Firestore.`);
    return true;
  } catch (err) {
    console.error(`[Firestore] Error saving review ${review.id}:`, err.message);
    return false;
  }
}

module.exports = {
  initFirestore,
  saveOrderToFirestore,
  updateOrderPaymentInFirestore,
  getOrderFromFirestore,
  saveCustomerToFirestore,
  saveReviewToFirestore
};
