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

  function fmt(n){ return window.viraiFmt(n); }

  if(document.body.dataset.page === "confirmation"){
    renderConfirmation();
    return;
  }

  var cart = store(CART_KEY) || { items:[] };
  if(cart.items.length === 0){ location.replace("shop.html"); return; }

  viraiTrack("checkout_start", { items:cart.items.length });

  var state = { ship:"standard" };
  var sub = cart.items.reduce(function(n,i){
    var p = VIRAI.productById(i.id); return p ? n + p.price*i.qty + (i.giftWrap?150*i.qty:0) : n;
  },0);

  var linesHost = document.getElementById("sumLines");
  linesHost.innerHTML = cart.items.map(function(i){
    var p = VIRAI.productById(i.id);
    if(!p) return "";
    return '<div class="sum-line">' +
      '<div class="sum-art">'+(window.viraiPimg ? window.viraiPimg(p,"a") : '')+'</div>' +
      '<div class="sum-info"><div class="n">'+p.name+'</div>' +
      '<div class="m">Qty '+i.qty+(i.giftWrap?' \u00B7 gift wrap'+(i.message?' \u00B7 \u201C'+i.message+'\u201D':''):'')+'</div></div>' +
      '<span class="price" style="white-space:nowrap">'+fmt((p.price+(i.giftWrap?150:0))*i.qty)+'</span>' +
      '</div>';
  }).join("");

  function shipCost(){
    var base = VIRAI.shipping[state.ship];
    if(state.ship === "standard" && sub >= VIRAI.freeShipThreshold) return 0;
    return base;
  }
  function gstNote(){ return "Included in listed prices"; }

  function updateTotals(){
    var sc = shipCost();
    document.getElementById("tSub").textContent = fmt(sub);
    document.getElementById("tShip").textContent = sc === 0 ? "Complimentary" : fmt(sc);
    document.getElementById("tGrand").textContent = fmt(sub + sc);
    document.getElementById("tShipLabel").textContent = state.ship === "express" ? "Express delivery" : "Standard delivery";
    document.getElementById("stdPrice").textContent = (state.ship === "standard" && sub >= VIRAI.freeShipThreshold) ? "Free" : fmt(VIRAI.shipping.standard);
  }

  Array.prototype.forEach.call(document.querySelectorAll("input[name=ship]"), function(r){
    r.addEventListener("change", function(){ state.ship = r.value; updateTotals(); });
  });
  updateTotals();

  document.getElementById("payNote").textContent = "Prototype checkout — no payment is processed. Payment gateway integration (UPI / cards / netbanking) connects here before launch.";

  document.getElementById("coForm").addEventListener("submit", function(e){
    e.preventDefault();
    var firstInvalid = null;
    Array.prototype.forEach.call(this.querySelectorAll("[required]"), function(el){
      var ok = el.value && el.value.trim().length > 0;
      if(ok && el.type === "email") ok = /.+@.+\..+/.test(el.value);
      el.style.borderColor = ok ? "" : "#A2593B";
      if(!ok && !firstInvalid) firstInvalid = el;
    });
    if(firstInvalid){ firstInvalid.focus(); return; }

    var orderNo = "VIRAI-" + String(Math.floor(100000 + Math.random()*900000));
    var order = {
      id: orderNo,
      placedAt: new Date().toISOString(),
      items: cart.items,
      subtotal: sub,
      shippingCost: shipCost(),
      total: sub + shipCost(),
      shippingMethod: state.ship,
      contact: {
        name: document.getElementById("f-name").value,
        email: document.getElementById("f-email").value,
        phone: document.getElementById("f-phone").value,
        address: document.getElementById("f-address").value,
        city: document.getElementById("f-city").value,
        pincode: document.getElementById("f-pin").value
      }
    };
    store(ORDER_KEY, order);
    try{ localStorage.removeItem(CART_KEY); }catch(err){}
    location.href = "confirmation.html";
  });

  function renderConfirmation(){
    var o = store(ORDER_KEY);
    if(!o){ location.replace("index.html"); return; }
    viraiTrack("purchase", {
      order_id:o.id, value:o.total, items:o.items.length,
      shipping_method:o.shippingMethod
    });
    document.getElementById("ordNo").textContent = o.id;
    document.getElementById("confEmail").textContent = o.contact.email;

    var lines = o.items.map(function(i){
      var p = VIRAI.productById(i.id);
      if(!p) return "";
      return '<div class="sum-line">' +
        '<div class="sum-art">'+(window.viraiPimg ? window.viraiPimg(p,"a") : '')+'</div>' +
        '<div class="sum-info"><div class="n">'+p.name+'</div><div class="m">Qty '+i.qty+'</div></div>' +
        '<span class="price" style="white-space:nowrap">'+fmt(p.price*i.qty)+'</span></div>';
    }).join("");
    document.getElementById("confLines").innerHTML = lines;
    document.getElementById("confTotals").innerHTML =
      '<div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>'+fmt(o.subtotal)+'</span></div>' +
      '<div style="display:flex;justify-content:space-between"><span>'+o.shippingMethod.charAt(0).toUpperCase()+o.shippingMethod.slice(1)+' delivery</span><span>'+(o.shippingCost===0?"Complimentary":fmt(o.shippingCost))+'</span></div>' +
      '<div class="grand"><span>Total</span><span>'+fmt(o.total)+'</span></div>';

    var a = o.contact;
    document.getElementById("confAddr").innerHTML =
      a.name+"<br>"+a.address+"<br>"+a.city+" "+a.pincode+"<br>"+(a.phone||"");
  }
})();
