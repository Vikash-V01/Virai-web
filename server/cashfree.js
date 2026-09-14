const { Cashfree, CFEnvironment } = require('cashfree-pg');
const crypto = require('crypto');

let cashfreeInstance = null;

function getCashfreeClient() {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    return null;
  }

  if (!cashfreeInstance) {
    const env = (process.env.CASHFREE_ENV || '').toUpperCase() === 'PRODUCTION'
      ? CFEnvironment.PRODUCTION
      : CFEnvironment.SANDBOX;

    try {
      cashfreeInstance = new Cashfree(env, appId, secretKey);
      cashfreeInstance.XApiVersion = '2023-08-01';
      console.log(`[Cashfree] Initialized in ${env === CFEnvironment.PRODUCTION ? 'PRODUCTION' : 'SANDBOX'} mode.`);
    } catch (err) {
      console.error('[Cashfree] Initialization error:', err.message);
      return null;
    }
  }

  return cashfreeInstance;
}

function isCashfreeConfigured() {
  return Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
}

/**
 * Create a Cashfree payment session for an order
 */
async function createPaymentSession({ orderId, orderAmount, customer, returnUrl, notifyUrl }) {
  const cf = getCashfreeClient();

  const cleanPhone = (customer.phone || '9999999999').replace(/[^0-9]/g, '').slice(-10);
  const customerId = customer.id || `cust_${crypto.randomBytes(4).toString('hex')}`;
  const customerName = (customer.name || 'Patron').slice(0, 50);
  const customerEmail = customer.email;

  // If live keys are not yet configured in environment variables, provide seamless sandbox/demo mode
  if (!cf) {
    console.log(`[Cashfree:Simulated] Order ${orderId} for ₹${orderAmount} initiated without live API keys.`);
    const mockSessionId = `session_sim_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    return {
      success: true,
      simulated: true,
      paymentSessionId: mockSessionId,
      orderId: orderId,
      cfOrderId: `cf_sim_${orderId}`,
      environment: 'SIMULATED',
      message: 'Cashfree credentials not provided in environment; using simulated checkout flow.'
    };
  }

  try {
    const orderRequest = {
      order_id: orderId,
      order_amount: Number(orderAmount),
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: cleanPhone || '9876543210'
      },
      order_meta: {
        return_url: returnUrl || `https://virai.in/order-confirmation.html?order_id=${orderId}`,
        notify_url: notifyUrl || `https://virai.in/api/cashfree/webhook`
      },
      order_note: 'VIRAI Handcrafted Botanical Fragrance Order'
    };

    const response = await cf.PGCreateOrder(orderRequest);
    const data = response && response.data ? response.data : response;

    console.log(`[Cashfree] Created payment session for ${orderId}:`, data.payment_session_id);

    return {
      success: true,
      simulated: false,
      paymentSessionId: data.payment_session_id,
      orderId: data.order_id,
      cfOrderId: data.cf_order_id,
      orderStatus: data.order_status,
      environment: (process.env.CASHFREE_ENV || '').toUpperCase() === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX'
    };
  } catch (err) {
    console.error(`[Cashfree] Error creating payment order ${orderId}:`, err.response ? err.response.data : err.message);
    throw new Error(err.response && err.response.data && err.response.data.message
      ? err.response.data.message
      : (err.message || 'Cashfree gateway error'));
  }
}

/**
 * Verify webhook signature sent by Cashfree
 */
function verifyWebhookSignature(signature, rawBody, timestamp) {
  const cf = getCashfreeClient();
  if (!cf) {
    // If not configured, can't verify cryptographic signature
    return false;
  }

  try {
    return cf.PGVerifyWebhookSignature(signature, rawBody, timestamp);
  } catch (err) {
    console.error('[Cashfree] Webhook signature verification failure:', err.message);
    return false;
  }
}

/**
 * Fetch authoritative order status from Cashfree
 */
async function fetchOrderStatus(orderId) {
  const cf = getCashfreeClient();
  if (!cf) return null;

  try {
    const res = await cf.PGFetchOrder(orderId);
    return res && res.data ? res.data : res;
  } catch (err) {
    console.error(`[Cashfree] Error fetching order ${orderId}:`, err.message);
    return null;
  }
}

module.exports = {
  isCashfreeConfigured,
  createPaymentSession,
  verifyWebhookSignature,
  fetchOrderStatus
};
