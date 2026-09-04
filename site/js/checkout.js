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

  // Handle checkout form submission
  var form = document.getElementById("coForm");
  if(form){
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var firstInvalid = null;
      Array.prototype.forEach.call(this.querySelectorAll("[required]"), function(el){
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
      if(firstInvalid){ firstInvalid.focus(); return; }

      var submitBtn = form.querySelector("button[type=submit]");
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
        pincode: document.getElementById("f-pin").value
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
        location.href = "confirmation.html";
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
    var o = store(ORDER_KEY);
    if(!o){ location.replace("index.html"); return; }
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
})();
