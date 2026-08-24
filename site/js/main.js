(function(){
  "use strict";
  window.dataLayer = window.dataLayer || [];
  window.VIRAI_CTX = {};
  window.IMG_ERR = "if(!this.dataset.f){this.dataset.f=1;var m=this.getAttribute('data-master');if(m){this.srcset='';this.src=m;}else{this.style.opacity=0;}console.error('IMAGE LOAD FAILED: '+(m||this.getAttribute('src')))}else{this.style.opacity=0;console.error('IMAGE LOAD FAILED: '+(this.currentSrc||this.src))}";

  function $(s,c){ return (c||document).querySelector(s); }
  function $all(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); }

  var VESSELS = {
    kurinji:"deep blue vessel", mullai:"forest green vessel", marutham:"terracotta vessel",
    neithal:"coastal blue vessel", palai:"warm sand-toned vessel"
  };
  var PRODUCT_SIZES = "(max-width:520px) 45vw,(max-width:1020px) 30vw,300px";

  function palt(p, k){
    if(!p.img) return "";
    if(k === "a"){
      if(p.landscape) return p.name + " in a " + VESSELS[p.landscape];
      if(p.id === "discovery-set") return "Virai Ainthinai discovery set box, closed";
      return "Complete Ainthinai collection box";
    }
    if(k === "b"){
      if(p.id === "discovery-set") return "Ainthinai discovery set open, showing five mini candles";
      if(p.id === "complete-collection") return "Five Ainthinai vessels lined up in a row";
      return p.name + ", alternate angle";
    }
    if(p.id === "discovery-set") return "Ainthinai discovery set contents presented";
    if(p.id === "complete-collection") return "The complete Ainthinai collection, lit";
    return p.name + " lit with a warm flame";
  }

  function imgAttrs(src, sizes, eager){
    var meta = (VIRAI.IMG && VIRAI.IMG.meta[src]) || null;
    var dw = VIRAI.IMG && VIRAI.IMG.derived ? VIRAI.IMG.derived[src] : null;
    var attrs = ' src="' + src + '"';
    if(meta) attrs += ' width="' + meta.w + '" height="' + meta.h + '"';
    if(dw){
      var small = src.replace("img/", "img/w/").replace(/\.webp$/, "-" + dw + ".webp");
      attrs += ' srcset="' + small + " " + dw + "w, " + src + " " + ((meta && meta.w) || 1600) + 'w"';
      attrs += ' data-master="' + src + '"';
      if(sizes) attrs += ' sizes="' + sizes + '"';
    } else if(sizes){
      attrs += ' sizes="' + sizes + '"';
    }
    attrs += eager
      ? ' fetchpriority="high"'
      : ' loading="lazy"';
    attrs += ' decoding="async" onerror="' + IMG_ERR + '"';
    return attrs;
  }

  function vimg(src, alt, opts){
    opts = opts || {};
    return '<img' + imgAttrs(src, opts.sizes, opts.eager) +
      ' alt="' + alt + '"' +
      (opts.className ? ' class="' + opts.className + '"' : '') +
      (opts.style ? ' style="' + opts.style + '"' : '') +
      '>';
  }

  function pimg(p, k, opts){
    if(!p.img || !p.img[k]) return "";
    opts = opts || {};
    return '<span class="pimg">' +
      vimg(p.img[k], palt(p, k), { sizes:opts.sizes || PRODUCT_SIZES, eager:opts.eager }) +
      '</span>';
  }
  window.viraiVimg = vimg;
  window.viraiImgAttrs = imgAttrs;
  window.viraiPalt = palt;
  window.viraiPimg = pimg;

  function track(event, payload){
    var entry = Object.assign({ event:event, ts:Date.now() }, payload||{});
    window.dataLayer.push(entry);
    try{ console.debug("[virai]", event, payload||{}); }catch(e){}
  }
  window.viraiTrack = track;

  function fmt(n){
    return "\u20B9" + new Intl.NumberFormat("en-IN").format(Math.round(n));
  }
  window.viraiFmt = fmt;

  function store(key, val){
    try{
      if(arguments.length === 2){ localStorage.setItem(key, JSON.stringify(val)); return val; }
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  }

  var CART_KEY = "virai_cart_v1";
  function cart(){ return store(CART_KEY) || { items:[] }; }
  function saveCart(c){ store(CART_KEY, c); updateBadge(); renderDrawer(); }
  function cartCount(c){
    c = c || cart();
    return c.items.reduce(function(n,i){ return n + i.qty; }, 0);
  }
  function cartSubtotal(c){
    c = c || cart();
    return c.items.reduce(function(n,i){
      var p = VIRAI.productById(i.id);
      if(!p) return n;
      return n + p.price * i.qty + (i.giftWrap ? 150 * i.qty : 0);
    }, 0);
  }
  function addToBag(id, opts){
    opts = opts || {};
    var p = VIRAI.productById(id);
    if(!p) return;
    var c = cart();
    var key = id + "|" + (opts.giftWrap ? "g" : "") + "|" + (opts.message || "");
    var existing = null;
    c.items.forEach(function(i){ if((id+"|"+(i.giftWrap?"g":"")+"|"+(i.message||"")) === key) existing = i; });
    if(existing){ existing.qty += opts.qty || 1; }
    else{
      c.items.push({ id:id, qty:opts.qty||1, giftWrap:!!opts.giftWrap, message:(opts.message||"").slice(0,180) });
    }
    saveCart(c);
    track("add_to_bag", { product_id:id, price:p.price, gift_wrap:!!opts.giftWrap, qty:opts.qty||1 });
    toast(p.name.split("\u00B7")[0].trim() + " added to bag");
    openDrawer();
  }
  window.viraiAddToBag = addToBag;

  function setQty(index, delta){
    var c = cart();
    if(!c.items[index]) return;
    c.items[index].qty += delta;
    if(c.items[index].qty <= 0) c.items.splice(index,1);
    saveCart(c);
  }
  function removeItem(index){
    var c = cart();
    c.items.splice(index,1);
    saveCart(c);
  }

  function artDiv(p, cls){
    return '<div class="art '+(cls||'')+'"><div class="art-in" style="background:'+p.art.bg+'"><div style="position:absolute;inset:0;background:'+p.art.glow+'"></div></div></div>';
  }
  window.viraiArt = artDiv;

  function landLabel(p){
    if(!p.landscape) return "Collection 01 · Ainthinai";
    var l = VIRAI.landscapes[p.landscape];
    return l.name + " \u00B7 " + l.emotion;
  }
  window.viraiLandLabel = landLabel;

  function pimgAlt(p){
    if(!p.img || !p.img.b) return "";
    return '<span class="pimg alt">' +
      vimg(p.img.b, "", { sizes:PRODUCT_SIZES }) +
      '</span>';
  }
  window.viraiPimgAlt = pimgAlt;

  function cardHTML(p){
    return '' +
    '<article class="pcard">' +
      '<a href="product.html?id='+p.id+'" class="pcard-media" aria-label="'+p.name+'">' + pimg(p,"a",{eager:true}) + pimgAlt(p) + '</a>' +
      '<div class="pcard-body">' +
        '<span class="pcard-land">'+landLabel(p)+'</span>' +
        '<h3 class="pcard-name"><a href="product.html?id='+p.id+'">'+p.name+'</a></h3>' +
        '<span class="pcard-scent">'+p.shortScent+'</span>' +
        '<div class="pcard-foot">' +
          '<span class="price">'+fmt(p.price)+'</span>' +
          '<button class="pcard-add" data-add="'+p.id+'">Add to Bag</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }
  window.viraiCard = cardHTML;

  var badgeEl = null;
  function updateBadge(){
    $all(".bag-count").forEach(function(el){ el.textContent = cartCount(); });
  }

  var drawer, overlay;
  function ensureDrawer(){
    if(drawer) return;
    overlay = document.createElement("div");
    overlay.className = "drawer-overlay";
    drawer = document.createElement("aside");
    drawer.className = "drawer";
    drawer.setAttribute("aria-label","Shopping bag");
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    overlay.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", function(e){ if(e.key === "Escape") closeDrawer(); });
    renderDrawer();
  }

  function renderDrawer(){
    ensureDrawer();
    var c = cart();
    var sub = cartSubtotal(c);
    var threshold = VIRAI.freeShipThreshold;
    var pct = Math.min(100, Math.round(sub / threshold * 100));
    var remaining = threshold - sub;
    var shipMsg = sub === 0
      ? "Complimentary standard shipping over " + fmt(threshold)
      : (remaining > 0 ? ("Add " + fmt(remaining) + " more for complimentary standard shipping") : "Your order ships complimentary");

    var lines = "";
    if(c.items.length === 0){
      lines = '<div class="drawer-empty"><p>Your bag is empty.</p><p style="margin-top:.6rem;font-size:.85rem">Every Virai object begins with a feeling.</p><a class="btn btn-line" style="margin-top:1.4rem" href="shop.html">Shop Fragrance</a></div>';
    } else {
      c.items.forEach(function(item, idx){
        var p = VIRAI.productById(item.id);
        if(!p) return;
        lines += '<div class="d-line">' +
          '<a href="product.html?id='+p.id+'" class="d-art" aria-label="'+p.name+'">'+pimg(p,"a")+'</a>' +
          '<div class="d-info">' +
            '<div class="n">'+p.name+'</div>' +
            '<div class="m">'+p.size+' \u00B7 '+fmt(p.price)+'</div>' +
            (item.giftWrap ? '<div class="d-gift-tag">Gift wrap'+(item.message ? " \u00B7 note enclosed" : "")+'</div>' : '') +
            '<div class="d-ctrl">' +
              '<span class="d-qty"><button data-dq="-1" data-i="'+idx+'" aria-label="Decrease">\u2212</button><span>'+item.qty+'</span><button data-dq="1" data-i="'+idx+'" aria-label="Increase">+</button></span>' +
              '<button class="d-remove" data-rm="'+idx+'">Remove</button>' +
            '</div>' +
          '</div></div>';
      });
    }

    drawer.innerHTML =
      '<div class="drawer-head"><h3>Your Bag <span class="muted">('+cartCount()+')</span></h3><button class="drawer-x" aria-label="Close bag">\u00D7</button></div>' +
      '<div class="drawer-ship">'+shipMsg+'<div class="bar"><i style="width:'+pct+'%"></i></div></div>' +
      '<div class="drawer-body">'+lines+'</div>' +
      '<div class="drawer-foot">' +
        '<div class="d-total"><span>Subtotal</span><span>'+fmt(sub)+'</span></div>' +
        '<a class="btn btn-solid'+(c.items.length===0?" disabled":"")+'" href="checkout.html">Proceed to Checkout</a>' +
        '<p class="d-sub">Shipping calculated at checkout \u00B7 Gift options available</p>' +
      '</div>';

    $all(".drawer-x", drawer).forEach(function(b){ b.addEventListener("click", closeDrawer); });
    $all("[data-dq]", drawer).forEach(function(b){
      b.addEventListener("click", function(){ setQty(parseInt(b.dataset.i,10), parseInt(b.dataset.dq,10)); });
    });
    $all("[data-rm]", drawer).forEach(function(b){
      b.addEventListener("click", function(){ removeItem(parseInt(b.dataset.rm,10)); });
    });
  }

  function openDrawer(){ ensureDrawer(); renderDrawer(); overlay.classList.add("open"); drawer.classList.add("open"); document.body.style.overflow = "hidden"; }
  function closeDrawer(){ if(!drawer) return; overlay.classList.remove("open"); drawer.classList.remove("open"); document.body.style.overflow = ""; }
  window.viraiOpenBag = openDrawer;

  var toastTimer = null;
  function toast(msg){
    var el = $(".toast");
    if(!el){
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role","status");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(function(){ el.classList.add("show"); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ el.classList.remove("show"); }, 2600);
  }

  function initReveals(){
    $all(".reveal:not(.in),.note-row:not(.in)").forEach(function(el){ el.classList.add("in"); });
  }
  window.viraiReveal = initReveals;

  function initChrome(){
    var proto = $("#proto");
    if(proto){
      try{ if(sessionStorage.getItem("virai_proto_ok")) proto.hidden = true; }catch(e){}
      $("button", proto).addEventListener("click", function(){
        proto.hidden = true;
        try{ sessionStorage.setItem("virai_proto_ok","1"); }catch(e){}
      });
    }

    var yr = $("#yr"); if(yr) yr.textContent = new Date().getFullYear();
    updateBadge();

    var burger = $(".burger");
    var mmenu = $("#mmenu");
    if(burger && mmenu){
      burger.addEventListener("click", function(){
        var open = mmenu.classList.toggle("open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
        document.body.style.overflow = open ? "hidden" : "";
      });
      $all("a", mmenu).forEach(function(a){
        a.addEventListener("click", function(){
          mmenu.classList.remove("open");
          burger.setAttribute("aria-expanded","false");
          document.body.style.overflow = "";
        });
      });
    }

    $all(".acc-head").forEach(function(h){
      h.addEventListener("click", function(){
        var acc = h.parentElement;
        var body = $(".acc-body", acc);
        var isOpen = acc.hasAttribute("data-open");
        if(isOpen){ acc.removeAttribute("data-open"); body.style.maxHeight = "0px"; }
        else{
          acc.setAttribute("data-open","");
          body.style.maxHeight = body.scrollHeight + "px";
        }
      });
    });

    document.addEventListener("click", function(e){
      var add = e.target.closest("[data-add]");
      if(add){ e.preventDefault(); addToBag(add.dataset.add, {}); return; }
      var bagBtn = e.target.closest("[data-open-bag]");
      if(bagBtn){ e.preventDefault(); openDrawer(); }
    });

    $all("form[data-form='newsletter']").forEach(function(f){
      f.addEventListener("submit", function(e){
        e.preventDefault();
        var email = $("input[type=email]", f).value.trim();
        if(!email) return;
        f.innerHTML = '<p style="font-size:.88rem;padding:.4rem 0">Welcome. Your first letter is on its way.</p>';
        track("newsletter_signup", {});
      });
    });

    var page = document.body.dataset.page || "info";
    track("page_view", { page:page });
  }

  function initDataRenders(){
    $all("[data-products]").forEach(function(host){
      var kind = host.dataset.products;
      var limit = parseInt(host.dataset.limit || "0", 10);
      var list = VIRAI.products.slice();
      if(kind === "featured") list = list.filter(function(p){ return p.featured; });
      if(kind === "sets") list = list.filter(function(p){ return p.type === "Set"; });
      if(host.dataset.landscape) list = list.filter(function(p){ return p.landscape === host.dataset.landscape; });
      if(limit) list = list.slice(0, limit);
      host.innerHTML = list.map(cardHTML).join("");
    });
    initReveals();
  }

  function initHeroMotion(){
    var media = $(".hero-media img");
    var head = $(".site-head");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(!media && !head) return;
    var ticking = false;
    window.addEventListener("scroll", function(){
      if(ticking) return;
      ticking = true;
      requestAnimationFrame(function(){
        var y = window.scrollY;
        if(head){
          if(y > 28) head.classList.add("scrolled");
          else if(y < 10) head.classList.remove("scrolled");
        }
        if(media && !reduced && y < window.innerHeight * 1.2){
          media.style.transform = "translateY(" + (y * 0.12).toFixed(1) + "px) scale(1.08)";
        }
        ticking = false;
      });
    }, { passive:true });
  }

  function initLandSwitcher(){
    var root = document.getElementById("landSwitcher");
    if(!root) return;
    var order = ["kurinji","mullai","marutham","neithal","palai"];
    var layers = $all(".ls-img", root);
    var active = 0;
    var current = "kurinji";
    var nav = $(".ls-nav", root);

    order.forEach(function(k, i){
      var L = VIRAI.landscapes[k];
      var b = document.createElement("button");
      b.className = "ls-nav-btn" + (i === 0 ? " on" : "");
      b.dataset.land = k;
      b.innerHTML = '<span class="n">' + L.num + '</span>' + L.name;
      b.addEventListener("click", function(){ select(k); });
      nav.appendChild(b);
    });

    var NUM = { kurinji:"11", mullai:"12", marutham:"13", neithal:"14", palai:"15" };
    function layerFor(key){
      var L = VIRAI.landscapes[key];
      var pic = layers[active === 0 ? 1 : 0];
      var img = $("img", pic);
      var src = $("source", pic);
      if(src) src.srcset = L.atmo.m;
      var n = NUM[key];
      img.setAttribute("data-master", "img/" + n + ".webp");
      img.srcset = "img/w/" + n + "-1400.webp 1400w, img/" + n + ".webp 1672w";
      img.sizes = "(max-width:880px) 92vw,58vw";
      img.src = L.atmo.d;
      img.alt = L.atmo.alt;
      img.removeAttribute("aria-hidden");
      return pic;
    }

    function select(k){
      if(k === current) return;
      var L = VIRAI.landscapes[k];
      var incoming = layerFor(k);
      layers[active].classList.remove("on");
      incoming.classList.add("on");
      active = active === 0 ? 1 : 0;
      current = k;
      root.style.setProperty("--tone", L.tone);
      $(".ls-n", root).textContent = L.num;
      $(".ls-tam", root).textContent = L.tamil;
      $(".ls-name", root).textContent = L.name;
      $(".ls-emo", root).textContent = L.emotion;
      $(".ls-line", root).textContent = L.line;
      var ex = $(".ls-explore", root);
      ex.href = "landscape.html?id=" + k;
      ex.textContent = "Explore " + L.name;
      $all(".ls-nav-btn", nav).forEach(function(b){
        var on = b.dataset.land === k;
        b.classList.toggle("on", on);
        if(on) b.setAttribute("aria-current","true"); else b.removeAttribute("aria-current");
      });
      viraiTrack("landscape_switch", { landscape:k });
    }

    window.addEventListener("load", function(){
      order.forEach(function(k){
        if(k === current) return;
        var L = VIRAI.landscapes[k];
        var i = new Image();
        i.src = L.atmo.d;
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function(){
    try{ initChrome(); }catch(e){ console.error("[virai] initChrome failed:", e); }
    try{ initDataRenders(); }catch(e){ console.error("[virai] initDataRenders failed:", e); }
    try{ initReveals(); }catch(e){ console.error("[virai] initReveals failed:", e); }
    try{ initHeroMotion(); }catch(e){ console.error("[virai] initHeroMotion failed:", e); }
    try{ initLandSwitcher(); }catch(e){ console.error("[virai] initLandSwitcher failed:", e); }
  });
})();
