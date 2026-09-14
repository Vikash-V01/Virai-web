(function(){
  "use strict";
  var CART_KEY = "virai_cart_v1";
  var ORDER_KEY = "virai_last_order";

  function store(key, val){
    try{
      if(arguments.length === 2){ localStorage.setItem(key, JSON.stringify(val)); return val; }
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  }

  function fmt(n){ return window.viraiFmt ? window.viraiFmt(n) : "₹" + Number(n).toLocaleString("en-IN"); }
  function esc(s){
    return String(s == null ? "" : s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  if(document.body.dataset.page === "confirmation"){
    renderConfirmation();
    return;
  }

  var cart = store(CART_KEY) || { items:[] };
  if(cart.items.length === 0){ location.replace("shop.html"); return; }

  if(window.viraiTrack) viraiTrack("checkout_start", { items:cart.items.length });

  var state = {
    ship: "standard",
    couponCode: "",
    lastCalc: null
  };

  // Render initial items line breakdown
  var linesHost = document.getElementById("sumLines");
  linesHost.innerHTML = cart.items.map(function(i){
    var p = (window.VIRAI && window.VIRAI.productById) ? VIRAI.productById(i.id) : null;
    var name = p ? p.name : i.id;
    var price = p ? p.price : (i.price || 0);
    return '<div class="sum-line">' +
      '<div class="sum-art">'+(window.viraiPimg && p ? window.viraiPimg(p,"a") : '')+'</div>' +
      '<div class="sum-info"><div class="n">'+esc(name)+'</div>' +
      '<div class="m">Qty '+i.qty+(i.giftWrap?' \u00B7 gift wrap'+(i.message?' \u00B7 \u201C'+esc(i.message)+'\u201D':''):'')+'</div></div>' +
      '<span class="price" style="white-space:nowrap">'+fmt((price+(i.giftWrap?150:0))*i.qty)+'</span>' +
      '</div>';
  }).join("");

  var couponInput = document.getElementById("couponInput");
  var btnApplyCoupon = document.getElementById("btnApplyCoupon");
  var couponFeedback = document.getElementById("couponFeedback");
  var rowDiscount = document.getElementById("rowDiscount");
  var tDiscount = document.getElementById("tDiscount");
  var tCouponLabel = document.getElementById("tCouponLabel");
  var tSub = document.getElementById("tSub");
  var tShip = document.getElementById("tShip");
  var tShipLabel = document.getElementById("tShipLabel");
  var tGrand = document.getElementById("tGrand");
  var stdPrice = document.getElementById("stdPrice");

  // Server-authoritative calculation
  function recalcWithServer(){
    fetch("/api/checkout/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.items,
        shipType: state.ship,
        couponCode: state.couponCode || null
      })
    })
    .then(function(res){ return res.json(); })
    .then(function(data){
      if(!data || !data.valid){
        if(couponFeedback && state.couponCode){
          couponFeedback.style.display = "block";
          couponFeedback.innerHTML = '<span style="color:#A2593B">'+esc(data.error || "Calculation failed")+'</span>';
          state.couponCode = "";
        }
        return;
      }

      state.lastCalc = data;
      tSub.textContent = fmt(data.subtotal);
      tShip.textContent = data.shippingCost === 0 ? "Complimentary" : fmt(data.shippingCost);
      tGrand.textContent = fmt(data.grandTotal);
      tShipLabel.textContent = data.shippingMethod === "express" ? "Express delivery" : "Standard delivery";
      if(stdPrice){
        stdPrice.textContent = (data.shippingCost === 0 && state.ship === "standard") ? "Free" : fmt(99);
      }

      if(data.discount > 0 && data.appliedCoupon){
        rowDiscount.style.display = "flex";
        tCouponLabel.textContent = data.appliedCoupon.code;
        tDiscount.textContent = "-" + fmt(data.discount);
        couponFeedback.style.display = "block";
        couponFeedback.innerHTML = '<span style="color:#2D5A3F;display:inline-flex;align-items:center;gap:.4rem">&#10003; ' +
          esc(data.appliedCoupon.description || (data.appliedCoupon.code + ' applied')) +
          ' <button type="button" id="btnRemoveCoupon" style="background:none;border:none;color:#A2593B;text-decoration:underline;cursor:pointer;padding:0 .2rem;font-size:.82rem">Remove</button></span>';

        var rmBtn = document.getElementById("btnRemoveCoupon");
        if(rmBtn){
          rmBtn.onclick = function(){
            state.couponCode = "";
            if(couponInput) couponInput.value = "";
            recalcWithServer();
          };
        }
      } else {
        rowDiscount.style.display = "none";
        if(data.couponError){
          couponFeedback.style.display = "block";
          couponFeedback.innerHTML = '<span style="color:#A2593B">&#9888; ' + esc(data.couponError) + '</span>';
        } else if(!state.couponCode){
          couponFeedback.style.display = "none";
          couponFeedback.innerHTML = "";
        }
      }
    })
    .catch(function(err){
      console.error("[virai] Server calc failed:", err);
    });
  }

  // Handle shipping method radio buttons
  Array.prototype.forEach.call(document.querySelectorAll("input[name=ship]"), function(r){
    r.addEventListener("change", function(){
      state.ship = r.value;
      recalcWithServer();
    });
  });

  // Handle coupon apply
  if(btnApplyCoupon && couponInput){
    btnApplyCoupon.addEventListener("click", function(){
      var code = couponInput.value.trim();
      if(!code){
        couponFeedback.style.display = "block";
        couponFeedback.innerHTML = '<span style="color:#A2593B">Please enter a promo code</span>';
        return;
      }
      state.couponCode = code;
      btnApplyCoupon.textContent = "Checking...";
      btnApplyCoupon.disabled = true;
      recalcWithServer();
      setTimeout(function(){
        btnApplyCoupon.textContent = "Apply";
        btnApplyCoupon.disabled = false;
      }, 400);
    });

    couponInput.addEventListener("keydown", function(e){
      if(e.key === "Enter"){
        e.preventDefault();
        btnApplyCoupon.click();
      }
    });
  }

  // Initial calculation from server
  recalcWithServer();

  var payNote = document.getElementById("payNote");
  if(payNote){
    payNote.textContent = "Authoritative secure order placement. Prices, shipping thresholds and discounts are verified server-side.";
  }

  // -------------------------------------------------------------
  // IN-PAGE TERMS & CONDITIONS POPUP MODAL (Without redirecting)
  // -------------------------------------------------------------
  var termsModal = document.getElementById("termsModal");
  var linkTermsPopup = document.getElementById("linkTermsPopup");
  var linkPrivacyPopup = document.getElementById("linkPrivacyPopup");
  var btnCloseTermsModal = document.getElementById("btnCloseTermsModal");
  var btnDismissTerms = document.getElementById("btnDismissTerms");
  var btnAcceptTermsModal = document.getElementById("btnAcceptTermsModal");
  var chkAgreeTerms = document.getElementById("chkAgreeTerms");
  var termsCheckRow = document.getElementById("termsCheckRow");
  var termsErrorFeedback = document.getElementById("termsErrorFeedback");
  var tabBtnTerms = document.getElementById("tabBtnTerms");
  var tabBtnPrivacy = document.getElementById("tabBtnPrivacy");
  var viewTermsContent = document.getElementById("viewTermsContent");
  var viewPrivacyContent = document.getElementById("viewPrivacyContent");
  var termsModalTitle = document.getElementById("termsModalTitle");
  var termsModalKicker = document.getElementById("termsModalKicker");

  function openLegalModal(view) {
    if (!termsModal) return;
    switchLegalTab(view === "privacy" ? "privacy" : "terms");
    termsModal.style.display = "flex";
    termsModal.offsetHeight; // force reflow for smooth transition
    termsModal.classList.add("open");
    termsModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLegalModal() {
    if (!termsModal) return;
    termsModal.classList.remove("open");
    termsModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    setTimeout(function() {
      if (!termsModal.classList.contains("open")) {
        termsModal.style.display = "none";
      }
    }, 300);
  }

  function switchLegalTab(tab) {
    if (tab === "privacy") {
      if (viewTermsContent) viewTermsContent.style.display = "none";
      if (viewPrivacyContent) viewPrivacyContent.style.display = "block";
      if (tabBtnTerms) {
        tabBtnTerms.style.background = "transparent";
        tabBtnTerms.style.color = "var(--ink)";
        tabBtnTerms.style.border = "1px solid var(--line)";
      }
      if (tabBtnPrivacy) {
        tabBtnPrivacy.style.background = "var(--ink)";
        tabBtnPrivacy.style.color = "var(--rice)";
        tabBtnPrivacy.style.border = "1px solid var(--ink)";
      }
      if (termsModalTitle) termsModalTitle.textContent = "Privacy & Data Rights";
      if (termsModalKicker) termsModalKicker.textContent = "VIRAI · DPDP ACT 2023";
    } else {
      if (viewTermsContent) viewTermsContent.style.display = "block";
      if (viewPrivacyContent) viewPrivacyContent.style.display = "none";
      if (tabBtnTerms) {
        tabBtnTerms.style.background = "var(--ink)";
        tabBtnTerms.style.color = "var(--rice)";
        tabBtnTerms.style.border = "1px solid var(--ink)";
      }
      if (tabBtnPrivacy) {
        tabBtnPrivacy.style.background = "transparent";
        tabBtnPrivacy.style.color = "var(--ink)";
        tabBtnPrivacy.style.border = "1px solid var(--line)";
      }
      if (termsModalTitle) termsModalTitle.textContent = "Terms and Conditions";
      if (termsModalKicker) termsModalKicker.textContent = "VIRAI · LEGAL AGREEMENT";
    }
  }

  if (linkTermsPopup) {
    linkTermsPopup.addEventListener("click", function(e) {
      e.preventDefault();
      openLegalModal("terms");
    });
  }

  if (linkPrivacyPopup) {
    linkPrivacyPopup.addEventListener("click", function(e) {
      e.preventDefault();
      openLegalModal("privacy");
    });
  }

  if (tabBtnTerms) {
    tabBtnTerms.addEventListener("click", function() { switchLegalTab("terms"); });
  }
  if (tabBtnPrivacy) {
    tabBtnPrivacy.addEventListener("click", function() { switchLegalTab("privacy"); });
  }

  if (btnCloseTermsModal) btnCloseTermsModal.addEventListener("click", closeLegalModal);
  if (btnDismissTerms) btnDismissTerms.addEventListener("click", closeLegalModal);

  if (btnAcceptTermsModal) {
    btnAcceptTermsModal.addEventListener("click", function() {
      if (chkAgreeTerms) {
        chkAgreeTerms.checked = true;
        if (termsErrorFeedback) termsErrorFeedback.style.display = "none";
        if (termsCheckRow) termsCheckRow.classList.remove("terms-row-highlight");
      }
      closeLegalModal();
    });
  }

  if (termsModal) {
    termsModal.addEventListener("click", function(e) {
      if (e.target === termsModal) closeLegalModal();
    });
  }

  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && termsModal && termsModal.classList.contains("open")) {
      closeLegalModal();
    }
  });

  if (chkAgreeTerms) {
    chkAgreeTerms.addEventListener("change", function() {
      if (chkAgreeTerms.checked) {
        if (termsErrorFeedback) termsErrorFeedback.style.display = "none";
        if (termsCheckRow) termsCheckRow.classList.remove("terms-row-highlight");
      }
    });
  }

  // Handle checkout form submission
  var form = document.getElementById("coForm");
  if(form){
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var firstInvalid = null;

      // Validate required text and selection fields
      Array.prototype.forEach.call(this.querySelectorAll("input[required], textarea[required], select[required]"), function(el){
        if(el.type === "checkbox") return; // Handled explicitly below
        var v = el.value ? el.value.trim() : "";
        var ok = v.length > 0;
        if(ok && el.type === "email") ok = /.+@.+\..+/.test(v);
        if(ok && el.id === "f-pin") ok = /^\d{6}$/.test(v);
        if(ok && el.id === "f-phone") ok = /^(\+91)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, ""));
        el.style.borderColor = ok ? "" : "#A2593B";
        if(ok) el.removeAttribute("aria-invalid");
        else el.setAttribute("aria-invalid","true");
        if(!ok && !firstInvalid) firstInvalid = el;
      });

      // Validate terms agreement checkbox
      if(chkAgreeTerms && !chkAgreeTerms.checked){
        if(termsErrorFeedback) termsErrorFeedback.style.display = "block";
        if(termsCheckRow) termsCheckRow.classList.add("terms-row-highlight");
        if(!firstInvalid) firstInvalid = chkAgreeTerms;
      } else {
        if(termsErrorFeedback) termsErrorFeedback.style.display = "none";
        if(termsCheckRow) termsCheckRow.classList.remove("terms-row-highlight");
      }

      if(firstInvalid){
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      var submitBtn = document.getElementById("btnPlaceOrder") || form.querySelector("button[type=submit]");
      if(submitBtn){
        submitBtn.disabled = true;
        submitBtn.textContent = "Confirming order...";
      }

      var contactPayload = {
        name: document.getElementById("f-name").value,
        email: document.getElementById("f-email").value,
        phone: document.getElementById("f-phone") ? document.getElementById("f-phone").value : "",
        address: document.getElementById("f-address").value,
        city: document.getElementById("f-city").value,
        state: document.getElementById("f-state") ? document.getElementById("f-state").value : "",
        pincode: document.getElementById("f-pin").value,
        orderNotes: document.getElementById("f-notes") ? document.getElementById("f-notes").value.trim() : "",
        reviewOptIn: !!(document.getElementById("chkReviewInvite") && document.getElementById("chkReviewInvite").checked)
      };

      fetch("/api/checkout/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.items,
          shipType: state.ship,
          couponCode: state.couponCode || null,
          contact: contactPayload
        })
      })
      .then(function(res){ return res.json(); })
      .then(function(data){
        if(!data || !data.success || !data.order){
          throw new Error((data && data.error) || "Could not complete order");
        }
        store(ORDER_KEY, data.order);
        try{ localStorage.removeItem(CART_KEY); }catch(err){}

        // If Cashfree live session is available, trigger Cashfree checkout
        if(data.cashfree && data.cashfree.paymentSessionId && !data.cashfree.simulated && window.Cashfree){
          try{
            var cashfree = window.Cashfree({
              mode: (data.cashfree.environment === "PRODUCTION") ? "production" : "sandbox"
            });
            cashfree.checkout({
              paymentSessionId: data.cashfree.paymentSessionId,
              redirectTarget: "_self"
            });
            return;
          } catch(cfInitErr) {
            console.warn("[checkout:cashfree] SDK redirect fallback:", cfInitErr);
          }
        }

        // Fallback or direct confirmation redirect with order ID
        location.href = "confirmation.html?order_id=" + encodeURIComponent(data.order.id);
      })
      .catch(function(err){
        if(submitBtn){
          submitBtn.disabled = false;
          submitBtn.textContent = "Place Order";
        }
        alert("Order submission error: " + err.message);
      });
    });
  }

  function renderConfirmation(){
    var urlParams = new URLSearchParams(location.search);
    var queryOrderId = urlParams.get("order_id");

    function renderOrderDetails(o){
      if(!o) return;
      if(!o.tracked && window.viraiTrack){
        o.tracked = true;
        store(ORDER_KEY, o);
        viraiTrack("purchase", {
          order_id: o.id,
          value: o.total,
          items: o.items.length,
          shipping_method: o.shippingMethod
        });
      }

      var ordNo = document.getElementById("ordNo");
      if(ordNo) ordNo.textContent = o.id;

      var confEmail = document.getElementById("confEmail");
      if(confEmail) confEmail.textContent = o.contact.email;

      var lines = o.items.map(function(i){
        var p = (window.VIRAI && window.VIRAI.productById) ? VIRAI.productById(i.id) : null;
        var name = p ? p.name : i.name || i.id;
        return '<div class="sum-line">' +
          '<div class="sum-art">'+(window.viraiPimg && p ? window.viraiPimg(p,"a") : '')+'</div>' +
          '<div class="sum-info"><div class="n">'+esc(name)+'</div><div class="m">Qty '+i.qty+'</div></div>' +
          '<span class="price" style="white-space:nowrap">'+fmt((i.price || (p?p.price:0))*i.qty)+'</span></div>';
      }).join("");

      var confLines = document.getElementById("confLines");
      if(confLines) confLines.innerHTML = lines;

      var totalsHTML = '<div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>'+fmt(o.subtotal)+'</span></div>';
      if(o.discount && o.discount > 0){
        totalsHTML += '<div style="display:flex;justify-content:space-between;color:var(--kurinji-dark,#3a4b73)"><span>Discount ('+esc(o.couponCode || 'Promo')+')</span><span>-'+fmt(o.discount)+'</span></div>';
      }
      var shipMethodTitle = o.shippingMethod ? (o.shippingMethod.charAt(0).toUpperCase() + o.shippingMethod.slice(1)) : "Standard";
      totalsHTML += '<div style="display:flex;justify-content:space-between"><span>'+shipMethodTitle+' delivery</span><span>'+(o.shippingCost===0?"Complimentary":fmt(o.shippingCost))+'</span></div>' +
        '<div class="grand"><span>Total</span><span>'+fmt(o.total)+'</span></div>';

      var confTotals = document.getElementById("confTotals");
      if(confTotals) confTotals.innerHTML = totalsHTML;

      var a = o.contact;
      var confAddr = document.getElementById("confAddr");
      if(confAddr && a){
        confAddr.innerHTML = esc(a.name)+"<br>"+esc(a.address)+"<br>"+esc(a.city)+" "+esc(a.pincode)+"<br>"+(a.phone ? esc(a.phone) : "");
      }
    }

    var initialOrder = store(ORDER_KEY);

    if(queryOrderId){
      fetch("/api/cashfree/verify-order?order_id=" + encodeURIComponent(queryOrderId))
        .then(function(res){ return res.json(); })
        .then(function(data){
          if(data && data.success && data.order){
            store(ORDER_KEY, data.order);
            renderOrderDetails(data.order);
          } else if(initialOrder){
            renderOrderDetails(initialOrder);
          }
        })
        .catch(function(){
          if(initialOrder) renderOrderDetails(initialOrder);
        });
    } else if(initialOrder){
      renderOrderDetails(initialOrder);
    } else {
      location.replace("index.html");
    }
  }
})();
