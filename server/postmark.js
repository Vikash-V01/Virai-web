const postmark = require('postmark');

let postmarkClient = null;

function getPostmarkClient() {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  if (!token) return null;

  if (!postmarkClient) {
    try {
      postmarkClient = new postmark.ServerClient(token);
    } catch (err) {
      console.error('[Postmark] Initialization error:', err.message);
      return null;
    }
  }
  return postmarkClient;
}

function getFromEmail() {
  return process.env.POSTMARK_FROM_EMAIL || 'orders@virai.in';
}

/**
 * Send order confirmation transactional email
 */
async function sendOrderConfirmationEmail({ order }) {
  if (!order || !order.contact || !order.contact.email) {
    return { success: false, error: 'Recipient email missing' };
  }

  const client = getPostmarkClient();
  const toEmail = order.contact.email;
  const recipientName = order.contact.name || 'Patron';
  const orderId = order.id;

  const itemsHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #E8E5DF;font-family:'Courier New',Courier,monospace;font-size:14px;color:#1C1917">
        <strong>${item.name}</strong> × ${item.qty}
        ${item.giftWrap ? '<br><span style="font-size:12px;color:#78716C;font-family:sans-serif">Includes Botanical Gifting Box (+₹' + item.wrapCost + ')</span>' : ''}
        ${item.message ? '<br><span style="font-size:12px;color:#A2593B;font-family:sans-serif;font-style:italic">&ldquo;' + item.message + '&rdquo;</span>' : ''}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #E8E5DF;text-align:right;font-family:sans-serif;font-size:14px;color:#1C1917">
        ₹${(item.lineTotal || (item.price * item.qty)).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>VIRAI · Order Confirmation ${orderId}</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F3EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1C1917">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F5F3EF;padding:40px 15px">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#FCFBF9;border:1px solid #E8E5DF;border-radius:4px;overflow:hidden">
          
          <!-- Header -->
          <tr>
            <td style="padding:32px 36px;border-bottom:1px solid #E8E5DF;background-color:#F5F3EF;text-align:center">
              <span style="font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#78716C;display:block;margin-bottom:6px">Botanical Fragrances · Tamil Nadu</span>
              <h1 style="margin:0;font-size:26px;font-weight:400;letter-spacing:0.08em;font-family:Georgia,serif;color:#1C1917">V I R A I</h1>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:32px 36px 20px">
              <span style="display:inline-block;padding:4px 10px;background-color:#EFECE6;border-radius:2px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#57534E;margin-bottom:16px">Order Confirmed · ${orderId}</span>
              <h2 style="margin:0 0 12px;font-size:20px;font-weight:400;font-family:Georgia,serif;color:#1C1917">Vanakkam, ${recipientName}</h2>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#57534E">
                Your order is confirmed. Each candle in your parcel is now being queued in our studio curing rack. We dispatch small batches within 2 to 4 business days.
              </p>
            </td>
          </tr>

          <!-- Line Items Table -->
          <tr>
            <td style="padding:10px 36px">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                ${itemsHtml}
              </table>
            </td>
          </tr>

          <!-- Summary Breakdown -->
          <tr>
            <td style="padding:10px 36px 24px">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:13px;line-height:1.8;color:#57534E">
                <tr>
                  <td>Subtotal</td>
                  <td align="right">₹${(order.subtotal || 0).toLocaleString('en-IN')}</td>
                </tr>
                ${order.discount ? `
                <tr>
                  <td style="color:#A2593B">Promotion (${order.couponCode || 'Code'})</td>
                  <td align="right" style="color:#A2593B">-₹${order.discount.toLocaleString('en-IN')}</td>
                </tr>` : ''}
                <tr>
                  <td>Shipping (${order.shippingMethod === 'express' ? 'Express Dispatch' : 'Standard Delivery'})</td>
                  <td align="right">${order.shippingCost === 0 ? 'Complimentary' : '₹' + order.shippingCost}</td>
                </tr>
                <tr>
                  <td style="padding-top:10px;border-top:1px solid #1C1917;font-weight:bold;font-size:16px;color:#1C1917">Total Paid</td>
                  <td align="right" style="padding-top:10px;border-top:1px solid #1C1917;font-weight:bold;font-size:16px;color:#1C1917">₹${(order.total || 0).toLocaleString('en-IN')}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery Address -->
          <tr>
            <td style="padding:20px 36px;background-color:#F8F6F2;border-top:1px solid #E8E5DF;font-size:13px;line-height:1.6;color:#57534E">
              <strong style="color:#1C1917;text-transform:uppercase;letter-spacing:0.1em;font-size:11px;display:block;margin-bottom:6px">Shipping Destination</strong>
              ${order.contact.name}<br>
              ${order.contact.address}<br>
              ${order.contact.city}${order.contact.state ? ', ' + order.contact.state : ''} - ${order.contact.pincode}<br>
              Phone: ${order.contact.phone || 'On file'}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 36px;text-align:center;border-top:1px solid #E8E5DF;font-size:12px;color:#78716C;line-height:1.6">
              Need to alter notes or ask questions about botanical notes? Write to us directly at <a href="mailto:care@virai.in" style="color:#1C1917;text-decoration:underline">care@virai.in</a>.<br>
              VIRAI · Hand-Poured Sensory Heritage · Tamil Nadu, India
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textBody = `
VIRAI · Order Confirmed [${orderId}]

Vanakkam, ${recipientName},

Your order has been confirmed and queued in our studio curing rack.
Order ID: ${orderId}
Total: ₹${(order.total || 0).toLocaleString('en-IN')}

Shipping to:
${order.contact.name}
${order.contact.address}
${order.contact.city} - ${order.contact.pincode}

Questions? Contact care@virai.in
  `.trim();

  if (!client) {
    console.log(`[Postmark:Simulation] Email to ${toEmail} (Order ${orderId}): Token not configured in env. HTML length: ${htmlBody.length} bytes.`);
    return {
      success: true,
      simulated: true,
      message: 'Postmark token not configured; email preview recorded successfully.',
      to: toEmail
    };
  }

  try {
    const result = await client.sendEmail({
      From: getFromEmail(),
      To: toEmail,
      Subject: `VIRAI · Order Confirmed [${orderId}]`,
      HtmlBody: htmlBody,
      TextBody: textBody,
      MessageStream: 'outbound'
    });
    console.log(`[Postmark] Order confirmation email dispatched to ${toEmail} (MessageID: ${result.MessageID})`);
    return { success: true, messageId: result.MessageID, to: toEmail };
  } catch (err) {
    console.error(`[Postmark] Failed sending order confirmation to ${toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send one-time passcode (OTP) for authentication
 */
async function sendOtpEmail({ toEmail, otpCode, purpose = 'Patron Sign-in' }) {
  if (!toEmail || !otpCode) {
    return { success: false, error: 'Recipient or OTP missing' };
  }

  const client = getPostmarkClient();
  const subject = `Your VIRAI verification code: ${otpCode}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#F5F3EF;padding:30px 15px;font-family:Georgia,serif;color:#1C1917">
  <div style="max-width:480px;margin:0 auto;background:#FCFBF9;border:1px solid #E8E5DF;border-radius:4px;padding:32px 30px;text-align:center">
    <div style="font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#78716C;margin-bottom:8px">VIRAI SENSORY HOUSE</div>
    <h2 style="font-weight:400;margin:0 0 16px;font-size:22px">One-Time Sign-In Passcode</h2>
    <p style="font-size:14px;color:#57534E;line-height:1.5;margin-bottom:24px">
      Use the following single-use verification code to complete your ${purpose}:
    </p>
    <div style="display:inline-block;padding:14px 28px;background:#1C1917;color:#FCFBF9;letter-spacing:0.3em;font-size:28px;font-family:'Courier New',Courier,monospace;font-weight:bold;border-radius:3px">
      ${otpCode}
    </div>
    <p style="font-size:12px;color:#78716C;margin-top:24px;line-height:1.5">
      This passcode expires in 10 minutes. If you did not request this verification, you can safely disregard this email.
    </p>
  </div>
</body>
</html>
  `;

  if (!client) {
    console.log(`[Postmark:Simulation] OTP email to ${toEmail}: Code is [${otpCode}]`);
    return { success: true, simulated: true, otpCode };
  }

  try {
    const result = await client.sendEmail({
      From: getFromEmail(),
      To: toEmail,
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: `Your VIRAI verification code is: ${otpCode}. Valid for 10 minutes.`,
      MessageStream: 'outbound'
    });
    console.log(`[Postmark] OTP email sent to ${toEmail} (ID: ${result.MessageID})`);
    return { success: true, messageId: result.MessageID };
  } catch (err) {
    console.error(`[Postmark] OTP email error to ${toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendOrderConfirmationEmail,
  sendOtpEmail
};
