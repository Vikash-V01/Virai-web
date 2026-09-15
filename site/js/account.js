/**
 * VIRAI - Customer Account Portal Logic
 * Handles OTP authentication, magic access codes, password login,
 * order history fetching, and profile address synchronization.
 */

(function () {
  'use strict';

  var TOKEN_KEY = 'virai_customer_token';
  var pendingEmail = '';

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (_) {
      return null;
    }
  }

  function setToken(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (_) {}
  }

  function showAlert(msg, isError) {
    var el = document.getElementById('authAlert');
    if (!el) return;
    el.style.display = 'block';
    el.style.background = isError ? 'rgba(162, 89, 59, 0.12)' : 'rgba(85, 98, 75, 0.12)';
    el.style.color = isError ? 'var(--marutham)' : 'var(--mullai)';
    el.style.border = '1px solid ' + (isError ? 'var(--marutham)' : 'var(--mullai)');
    el.textContent = msg;
  }

  function clearAlert() {
    var el = document.getElementById('authAlert');
    if (el) el.style.display = 'none';
  }

  async function parseResponseJson(res) {
    var text = await res.text();
    try {
      return JSON.parse(text);
    } catch (_) {
      throw new Error(res.ok ? 'Unexpected response from server' : ('Server error (' + res.status + ')'));
    }
  }

  // Global tab switcher for auth options
  window.switchAuthTab = function (tab) {
    clearAlert();
    document.querySelectorAll('.auth-tab').forEach(function (t) { t.classList.remove('active'); });

    document.getElementById('formOtpReq').style.display = 'none';
    document.getElementById('formOtpVerify').style.display = 'none';
    document.getElementById('formLogin').style.display = 'none';
    document.getElementById('formRegister').style.display = 'none';

    if (tab === 'otp') {
      document.getElementById('tabOtp').classList.add('active');
      document.getElementById('formOtpReq').style.display = 'block';
    } else if (tab === 'login') {
      document.getElementById('tabLogin').classList.add('active');
      document.getElementById('formLogin').style.display = 'block';
    } else if (tab === 'register') {
      document.getElementById('tabRegister').classList.add('active');
      document.getElementById('formRegister').style.display = 'block';
    }
  };

  // 1. Request OTP Code
  window.handleRequestOtp = async function (e) {
    e.preventDefault();
    clearAlert();
    var emailInput = document.getElementById('otpEmail');
    var email = emailInput ? emailInput.value.trim() : '';
    if (!email) return;

    var btn = document.getElementById('btnReqOtp');
    if (btn) { btn.disabled = true; btn.textContent = 'Transmitting Code...'; }

    try {
      var res = await fetch('/api/customer/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });
      var data = await parseResponseJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch code');
      }

      pendingEmail = email;
      document.getElementById('formOtpReq').style.display = 'none';
      document.getElementById('formOtpVerify').style.display = 'block';
      document.getElementById('lblOtpDest').textContent = email;

      var noticeEl = document.getElementById('otpPreviewNotice');
      if (noticeEl && data.previewCode) {
        noticeEl.style.display = 'block';
        noticeEl.innerHTML = '<strong>Prototype Fast Access:</strong> Your preview access code is <strong>' + data.previewCode + '</strong>';
        var codeInp = document.getElementById('otpCode');
        if (codeInp) codeInp.value = data.previewCode;
      }
    } catch (err) {
      showAlert(err.message, true);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Send Access Code'; }
    }
  };

  window.resendOtp = function () {
    document.getElementById('formOtpVerify').style.display = 'none';
    document.getElementById('formOtpReq').style.display = 'block';
  };

  // 2. Verify OTP Code
  window.handleVerifyOtp = async function (e) {
    e.preventDefault();
    clearAlert();
    var codeInput = document.getElementById('otpCode');
    var code = codeInput ? codeInput.value.trim() : '';
    if (!code || !pendingEmail) return;

    var btn = document.getElementById('btnVerifyOtp');
    if (btn) { btn.disabled = true; btn.textContent = 'Verifying...'; }

    try {
      var res = await fetch('/api/customer/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, code: code })
      });
      var data = await parseResponseJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid code');
      }

      setToken(data.token);
      renderDashboard(data.customer, []);
      fetchCustomerProfile();
    } catch (err) {
      showAlert(err.message, true);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Verify & Enter'; }
    }
  };

  // 3. Password Login
  window.handlePasswordLogin = async function (e) {
    e.preventDefault();
    clearAlert();
    var email = (document.getElementById('loginEmail') || {}).value || '';
    var pass = (document.getElementById('loginPass') || {}).value || '';
    if (!email || !pass) return;

    var btn = document.getElementById('btnLogin');
    if (btn) { btn.disabled = true; btn.textContent = 'Signing In...'; }

    try {
      var res = await fetch('/api/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: pass })
      });
      var data = await parseResponseJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed');
      }

      setToken(data.token);
      renderDashboard(data.customer, []);
      fetchCustomerProfile();
    } catch (err) {
      showAlert(err.message, true);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }
    }
  };

  // 4. Registration
  window.handleRegister = async function (e) {
    e.preventDefault();
    clearAlert();
    var name = (document.getElementById('regName') || {}).value || '';
    var email = (document.getElementById('regEmail') || {}).value || '';
    var phone = (document.getElementById('regPhone') || {}).value || '';
    var pass = (document.getElementById('regPass') || {}).value || '';

    var btn = document.getElementById('btnRegister');
    if (btn) { btn.disabled = true; btn.textContent = 'Creating Account...'; }

    try {
      var res = await fetch('/api/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, phone: phone, password: pass })
      });
      var data = await parseResponseJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      setToken(data.token);
      renderDashboard(data.customer, []);
      fetchCustomerProfile();
    } catch (err) {
      showAlert(err.message, true);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Create Account'; }
    }
  };

  // Fetch full profile and orders using session token
  async function fetchCustomerProfile() {
    var token = getToken();
    if (!token) {
      showAuth();
      return;
    }

    try {
      var res = await fetch('/api/customer/me', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.status === 401) {
        setToken(null);
        showAuth();
        return;
      }
      var data = await res.json();
      if (data.success) {
        renderDashboard(data.customer, data.orders || []);
      }
    } catch (_) {
      // Offline / network fallback
    }
  }

  function showAuth() {
    var aSec = document.getElementById('authSection');
    var dSec = document.getElementById('dashSection');
    if (aSec) aSec.style.display = 'block';
    if (dSec) dSec.style.display = 'none';
  }

  function renderDashboard(customer, orders) {
    var aSec = document.getElementById('authSection');
    var dSec = document.getElementById('dashSection');
    if (aSec) aSec.style.display = 'none';
    if (dSec) dSec.style.display = 'block';

    var nameEl = document.getElementById('dashCustName');
    var emailEl = document.getElementById('dashCustEmail');
    if (nameEl) nameEl.textContent = customer.name || customer.email.split('@')[0];
    if (emailEl) emailEl.textContent = customer.email;

    var countEl = document.getElementById('countOrders');
    if (countEl) countEl.textContent = orders ? orders.length : 0;

    // Populate profile form inputs
    var pName = document.getElementById('profName');
    var pPhone = document.getElementById('profPhone');
    if (pName) pName.value = customer.name || '';
    if (pPhone) pPhone.value = customer.phone || '';

    if (customer.savedAddresses && customer.savedAddresses.length > 0) {
      var def = customer.savedAddresses[0];
      if (document.getElementById('addrStreet')) document.getElementById('addrStreet').value = def.address || '';
      if (document.getElementById('addrCity')) document.getElementById('addrCity').value = def.city || '';
      if (document.getElementById('addrState')) document.getElementById('addrState').value = def.state || '';
      if (document.getElementById('addrPin')) document.getElementById('addrPin').value = def.pincode || '';
    }

    // Render Orders
    var oContainer = document.getElementById('ordersListContainer');
    if (!oContainer) return;

    if (!orders || orders.length === 0) {
      oContainer.innerHTML = 
        '<div style="padding:2.5rem;text-align:center;background:var(--paper);border:1px solid var(--line);border-radius:4px">' +
          '<p class="serif" style="font-size:1.2rem;margin-bottom:.4rem">No consignments yet</p>' +
          '<p class="small muted" style="margin-bottom:1.4rem">When you place an order with ' + escapeHtml(customer.email) + ', it will appear here with live dispatch tracking.</p>' +
          '<a href="shop.html" class="btn btn-solid">Explore Fragrance Collection</a>' +
        '</div>';
      return;
    }

    var html = '';
    orders.forEach(function (ord) {
      var dateStr = ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
      var itemsSummary = (ord.items || []).map(function (it) {
        return escapeHtml(it.name) + ' &times; ' + it.qty;
      }).join(', ');

      html += 
        '<div class="order-card">' +
          '<div class="order-head">' +
            '<div>' +
              '<strong style="font-size:1.05rem">' + escapeHtml(ord.id) + '</strong>' +
              '<div class="small muted">' + dateStr + ' &middot; ' + escapeHtml(ord.shippingMethod || 'Standard') + ' Delivery</div>' +
            '</div>' +
            '<span class="badge-status badge-confirmed">' + escapeHtml(ord.status || 'Confirmed') + '</span>' +
          '</div>' +
          '<p style="font-size:.92rem;margin-bottom:.8rem"><strong>Objects:</strong> ' + itemsSummary + '</p>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line-soft);padding-top:.8rem;flex-wrap:wrap;gap:.6rem">' +
            '<span class="small muted">Delivering to: ' + escapeHtml(ord.contact ? (ord.contact.city + ', ' + ord.contact.state) : '') + '</span>' +
            '<div style="display:flex;align-items:center;gap:.8rem">' +
              '<a href="shipping.html?order=' + encodeURIComponent(ord.id) + '#track" class="btn btn-line btn-sm">Track Parcel &rarr;</a>' +
              '<strong style="font-size:1.05rem">₹' + (ord.total || 0).toLocaleString('en-IN') + '</strong>' +
            '</div>' +
          '</div>' +
        '</div>';
    });

    oContainer.innerHTML = html;
  }

  window.switchDashboardTab = function (tab) {
    var pOrders = document.getElementById('panelOrders');
    var pProfile = document.getElementById('panelProfile');
    var bOrders = document.getElementById('btnViewOrders');
    var bProfile = document.getElementById('btnViewProfile');

    if (tab === 'orders') {
      if (pOrders) pOrders.style.display = 'block';
      if (pProfile) pProfile.style.display = 'none';
      if (bOrders) bOrders.classList.add('active');
      if (bProfile) bProfile.classList.remove('active');
    } else {
      if (pOrders) pOrders.style.display = 'none';
      if (pProfile) pProfile.style.display = 'block';
      if (bOrders) bOrders.classList.remove('active');
      if (bProfile) bProfile.classList.add('active');
    }
  };

  window.handleUpdateProfile = async function (e) {
    e.preventDefault();
    var token = getToken();
    if (!token) return;

    var name = (document.getElementById('profName') || {}).value || '';
    var phone = (document.getElementById('profPhone') || {}).value || '';
    var addrStreet = (document.getElementById('addrStreet') || {}).value || '';
    var addrCity = (document.getElementById('addrCity') || {}).value || '';
    var addrState = (document.getElementById('addrState') || {}).value || '';
    var addrPin = (document.getElementById('addrPin') || {}).value || '';

    var feedback = document.getElementById('profFeedback');
    if (feedback) { feedback.textContent = 'Saving...'; feedback.style.color = 'var(--mineral)'; }

    try {
      var savedAddresses = [];
      if (addrStreet) {
        savedAddresses.push({
          name: name,
          address: addrStreet,
          city: addrCity,
          state: addrState,
          pincode: addrPin,
          isDefault: true
        });
      }

      var res = await fetch('/api/customer/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ name: name, phone: phone, savedAddresses: savedAddresses })
      });
      var data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update');

      if (feedback) {
        feedback.textContent = 'Saved successfully.';
        feedback.style.color = 'var(--mullai)';
        setTimeout(function () { feedback.textContent = ''; }, 3000);
      }
    } catch (err) {
      if (feedback) {
        feedback.textContent = err.message;
        feedback.style.color = 'var(--marutham)';
      }
    }
  };

  window.handleLogout = async function () {
    var token = getToken();
    if (token) {
      try {
        await fetch('/api/customer/logout', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token }
        });
      } catch (_) {}
    }
    setToken(null);
    showAuth();
  };

  window.showForgotPassword = function () {
    var email = prompt('Enter your email address to receive a secure password reset code:');
    if (!email) return;
    fetch('/api/customer/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d.success) { alert(d.error || 'Failed to request reset'); return; }
      var code = prompt('Enter the 6-digit code sent to ' + email + (d.previewCode ? ' (Preview code: ' + d.previewCode + ')' : '') + ':');
      if (!code) return;
      var newPass = prompt('Enter your new password (minimum 8 characters):');
      if (!newPass) return;
      return fetch('/api/customer/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim(), newPassword: newPass })
      });
    })
    .then(function (r) { if (r) return r.json(); })
    .then(function (d) {
      if (d) {
        if (d.success) alert(d.message || 'Password updated successfully. You can now sign in.');
        else alert(d.error || 'Password reset failed');
      }
    })
    .catch(function (err) { alert(err.message); });
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Google Sign-In Flow (Compliant with AI Studio preview iframe & popup postMessage)
  window.handleGoogleSignIn = async function () {
    clearAlert();
    var btn = document.getElementById('btnGoogleLogin');
    var btnText = document.getElementById('btnGoogleText');
    if (btn) btn.disabled = true;
    if (btnText) btnText.textContent = 'Connecting to Google...';

    try {
      var res = await fetch('/api/auth/google/url');
      var data = await parseResponseJson(res);

      if (!res.ok || !data.success) {
        if (data.configured === false) {
          showAlert('Google Sign-In configuration required: Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the environment settings.', true);
          return;
        }
        throw new Error(data.error || 'Failed to initialize Google authentication');
      }

      var width = 560;
      var height = 650;
      var left = window.screenX + (window.outerWidth - width) / 2;
      var top = window.screenY + (window.outerHeight - height) / 2;

      var popup = window.open(
        data.url,
        'virai_google_oauth',
        'width=' + width + ',height=' + height + ',top=' + top + ',left=' + left + ',status=no,toolbar=no,menubar=no'
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        showAlert('Popup window was blocked by your browser. Please allow popups for this site to sign in with Google.', true);
        return;
      }

      // Fallback timer if user closes popup manually
      var checkPopupClosed = setInterval(function () {
        if (popup.closed) {
          clearInterval(checkPopupClosed);
          if (btn) btn.disabled = false;
          if (btnText) btnText.textContent = 'Continue with Google';
        }
      }, 1000);

    } catch (err) {
      showAlert(err.message, true);
      if (btn) btn.disabled = false;
      if (btnText) btnText.textContent = 'Continue with Google';
    }
  };

  // Cross-origin message listener from OAuth popup
  window.addEventListener('message', function (event) {
    // Validate origins (AI Studio preview domain or localhost)
    var origin = event.origin || '';
    if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.endsWith('.google.com')) {
      return;
    }

    if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
      var payload = event.data.payload;
      if (payload && payload.token) {
        setToken(payload.token);
        renderDashboard(payload.customer, []);
        fetchCustomerProfile();
      }
      var btn = document.getElementById('btnGoogleLogin');
      var btnText = document.getElementById('btnGoogleText');
      if (btn) btn.disabled = false;
      if (btnText) btnText.textContent = 'Continue with Google';
    } else if (event.data && event.data.type === 'GOOGLE_AUTH_ERROR') {
      showAlert(event.data.error || 'Google authentication could not be completed.', true);
      var btnFail = document.getElementById('btnGoogleLogin');
      var btnFailText = document.getElementById('btnGoogleText');
      if (btnFail) btnFail.disabled = false;
      if (btnFailText) btnFailText.textContent = 'Continue with Google';
    }
  });

  // On page load, verify session
  document.addEventListener('DOMContentLoaded', function () {
    var token = getToken();
    if (token) {
      fetchCustomerProfile();
    } else {
      showAuth();
    }
  });

})();
