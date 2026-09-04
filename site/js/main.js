(function(){
  "use strict";
  window.dataLayer = window.dataLayer || [];
  window.VIRAI_CTX = {};

  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MOTION = !REDUCED;
  if(MOTION){ document.documentElement.classList.add("vr-motion"); }
  window.IMG_ERR = "if(!this.dataset.f){this.dataset.f=1;var m=this.getAttribute('data-master');if(m){this.srcset='';this.src=m;}else{this.style.opacity=0;}console.error('IMAGE LOAD FAILED: '+(m||this.getAttribute('src')))}else{this.style.opacity=0;console.error('IMAGE LOAD FAILED: '+(this.currentSrc||this.src))}";

  function $(s,c){ return (c||document).querySelector(s); }
  function $all(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); }

  // --- Keyboard focus guard: keeps Tab cycling inside an open overlay -----
  var trapEl = null;
  var trapReturn = null;
  function focusables(el){
    return $all('a[href],button:not([disabled]),input:not([type="hidden"]),select,textarea,[tabindex]:not([tabindex="-1"])', el)
      .filter(function(n){ return !!(n.offsetWidth || n.offsetHeight || n.getClientRects().length); });
  }
  function setTrap(el, returnTo){
    trapEl = el || null;
    if(el){ trapReturn = returnTo || null; }
  }
  function releaseTrap(){
    var back = trapReturn;
    trapEl = null; trapReturn = null;
    if(back && typeof back.focus === "function"){ try{ back.focus(); }catch(e){} }
  }
  document.addEventListener("keydown", function(e){
    if(e.key !== "Tab" || !trapEl) return;
    var f = focusables(trapEl);
    if(!f.length) return;
    var first = f[0], last = f[f.length - 1];
    var cur = document.activeElement;
    if(e.shiftKey && (!trapEl.contains(cur) || cur === first)){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && (cur === last || !trapEl.contains(cur))){ e.preventDefault(); first.focus(); }
  });

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
    var giftWrap = !!opts.giftWrap;
    var message = (opts.message || "").slice(0, 180);
    var qty = Math.max(1, parseInt(opts.qty, 10) || 1);

    var existing = null;
    c.items.forEach(function(i){
      if(i.id === id && !!i.giftWrap === giftWrap && (i.message || "") === message){
        existing = i;
      }
    });

    if(existing){
      existing.qty += qty;
    } else {
      c.items.push({ id: id, qty: qty, giftWrap: giftWrap, message: message });
    }
    saveCart(c);
    track("add_to_bag", { product_id: id, price: p.price, gift_wrap: giftWrap, qty: qty });
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

    // innerHTML replacement drops the focused node; park focus back inside.
    if(drawer.classList.contains("open") && !drawer.contains(document.activeElement)){
      var x = $(".drawer-x", drawer);
      if(x) x.focus();
    }
  }

  function openDrawer(opener){
    ensureDrawer(); renderDrawer();
    overlay.classList.add("open"); drawer.classList.add("open");
    document.body.style.overflow = "hidden";
    setTrap(drawer, opener || null);
    var x = $(".drawer-x", drawer);
    if(x) x.focus();
  }
  function closeDrawer(){
    if(!drawer) return;
    overlay.classList.remove("open"); drawer.classList.remove("open");
    document.body.style.overflow = "";
    if(trapEl === drawer) releaseTrap();
  }
  window.viraiOpenBag = openDrawer;

  // --- Tactile Add-to-Bag: a fragment of the object travels to the bag ---
  function bagTarget(){
    var bags = $all(".m-bag, .icon-btn[data-open-bag]").filter(function(b){
      return b.offsetParent !== null;
    });
    var el = bags[bags.length - 1] || $(".bag-count");
    return el || null;
  }
  function pulseBag(){
    $all(".bag-count").forEach(function(b){
      if(b.offsetParent === null) return;
      b.classList.remove("vr-pulse");
      void b.offsetWidth;
      b.classList.add("vr-pulse");
      setTimeout(function(){ b.classList.remove("vr-pulse"); }, 600);
    });
  }
  function flyToBag(srcImg){
    if(!MOTION || !srcImg || typeof srcImg.getBoundingClientRect !== "function") return;
    var dest = bagTarget();
    if(!dest) return;
    var s = srcImg.getBoundingClientRect();
    var d = dest.getBoundingClientRect();
    if(!s.width || !s.height) return;
    var fly = document.createElement("div");
    fly.className = "vr-fly";
    var size = Math.min(120, Math.max(64, s.width * 0.5));
    fly.style.width = size + "px";
    fly.style.height = size * 1.2 + "px";
    fly.style.left = (s.left + s.width / 2 - size / 2) + "px";
    fly.style.top = (s.top + s.height / 2 - size * 0.6) + "px";
    var img = document.createElement("img");
    img.src = srcImg.currentSrc || srcImg.src;
    img.alt = "";
    fly.appendChild(img);
    document.body.appendChild(fly);
    var dx = (d.left + d.width / 2) - (s.left + s.width / 2);
    var dy = (d.top + d.height / 2) - (s.top + s.height / 2);
    var anim = fly.animate([
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: "translate(" + (dx * 0.5) + "px," + (dy * 0.5 - 40) + "px) scale(.7)", opacity: 1, offset: 0.6 },
      { transform: "translate(" + dx + "px," + dy + "px) scale(.14)", opacity: 0 }
    ], { duration: 900, easing: "cubic-bezier(.22,.61,.21,1)", fill: "forwards" });
    var done = function(){ if(fly.parentNode) fly.parentNode.removeChild(fly); pulseBag(); };
    if(anim && anim.finished && anim.finished.then){ anim.finished.then(done).catch(done); }
    else{ setTimeout(done, 950); }
  }
  window.viraiFlyToBag = flyToBag;
  window.viraiPulseBag = pulseBag;

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

  // --- Coherent scroll-reveal engine ------------------------------------
  // Existing markup already carries .reveal / .reveal-d1..3 hooks. We also
  // auto-tag key editorial blocks so every page reads as one continuous
  // Virai story rather than sections that individually animate. Falls back
  // to instant visibility when motion is off or IntersectionObserver is
  // unavailable, and a safety pass reveals anything left hidden.
  var revealIO = null;

  function autoTag(){
    if(!MOTION) return;
    var main = $("#main") || document.body;

    // Stagger children of common group containers.
    var groups = $all(
      ".product-grid,.craft-grid,.gift-tiles,.fam-row,.landscape-strip,.value-grid," +
      ".confirm-next,.detail-grid,.steps,.notes,.pdp-thumbs", main
    );
    groups.forEach(function(g){
      Array.prototype.slice.call(g.children).forEach(function(child, i){
        if(child.classList.contains("reveal")) return;
        child.classList.add("reveal", "vr-soft", "vr-s" + Math.min(6, i + 1));
      });
    });

    // Standalone editorial blocks that lack an explicit reveal hook.
    var solo = $all(
      "section > .wrap > h2, .editorial > p, .pullquote, .editorial-fig," +
      " .gift-banner, .split > *, .contact-info .block, .step", main
    );
    solo.forEach(function(el){
      if(!el.classList.contains("reveal") && !el.closest(".hero")) el.classList.add("reveal", "vr-soft");
    });

    // Large media settles from a gentle over-scale.
    $all(".art, .intro-fig .art, .craft-item .art, .gift-banner .art, .world-banner picture", main)
      .forEach(function(el){ el.classList.add("vr-media-in"); });
  }

  function revealNow(el){ el.classList.add("in"); }

  function initReveals(){
    var targets = $all(".reveal:not(.in),.note-row:not(.in),.vr-media-in:not(.in),.pcard:not(.in)");
    if(!MOTION || typeof IntersectionObserver === "undefined"){
      targets.forEach(revealNow);
      return;
    }
    if(!revealIO){
      revealIO = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting){ revealNow(e.target); revealIO.unobserve(e.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    }
    var vh = window.innerHeight || 800;
    targets.forEach(function(el){
      var r = el.getBoundingClientRect();
      // Anything already on-screen at load reveals immediately (with its
      // CSS delay providing the stagger) so nothing pops in late.
      if(r.top < vh * 0.92 && r.bottom > 0){ revealNow(el); }
      else{ revealIO.observe(el); }
    });
  }

  // Safety net: never leave content stuck hidden if the observer misfires.
  function revealSafety(){
    $all(".reveal:not(.in),.vr-media-in:not(.in),.pcard:not(.in)").forEach(function(el){
      var r = el.getBoundingClientRect();
      if(r.top < (window.innerHeight || 800) * 1.1) revealNow(el);
    });
  }
  window.addEventListener("load", function(){ setTimeout(revealSafety, 400); });

  window.viraiReveal = function(){ autoTag(); initReveals(); };

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
      function closeMenu(){
        mmenu.classList.remove("open");
        burger.setAttribute("aria-expanded","false");
        document.body.style.overflow = "";
        if(trapEl === mmenu) releaseTrap();
      }
      burger.addEventListener("click", function(){
        var open = mmenu.classList.toggle("open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
        document.body.style.overflow = open ? "hidden" : "";
        if(open){
          setTrap(mmenu, burger);
          var firstF = focusables(mmenu)[0];
          if(firstF) firstF.focus();
        }
        else if(trapEl === mmenu){ releaseTrap(); }
      });
      var mmClose = $(".mm-close", mmenu);
      if(mmClose) mmClose.addEventListener("click", closeMenu);
      document.addEventListener("keydown", function(e){
        if(e.key === "Escape" && mmenu.classList.contains("open")) closeMenu();
      });
      $all("a", mmenu).forEach(function(a){
        a.addEventListener("click", closeMenu);
      });
    }

    $all(".acc-head").forEach(function(h){
      h.addEventListener("click", function(){
        var acc = h.parentElement;
        var body = $(".acc-body", acc);
        var isOpen = acc.hasAttribute("data-open");
        if(isOpen){
          // Re-materialise a pixel height first so "none" can animate to 0.
          if(getComputedStyle(body).maxHeight === "none"){
            body.style.maxHeight = body.scrollHeight + "px";
            void body.offsetHeight;
          }
          acc.removeAttribute("data-open");
          h.setAttribute("aria-expanded","false");
          body.style.maxHeight = "0px";
        }
        else{
          acc.setAttribute("data-open","");
          h.setAttribute("aria-expanded","true");
          body.style.maxHeight = body.scrollHeight + "px";
          // Once fully open, unclamp so window resizes never clip content.
          body.addEventListener("transitionend", function te(ev){
            if(ev.propertyName === "max-height"){
              body.removeEventListener("transitionend", te);
              if(acc.hasAttribute("data-open")) body.style.maxHeight = "none";
            }
          });
        }
      });
    });

    document.addEventListener("click", function(e){
      var add = e.target.closest("[data-add]");
      if(add){
        e.preventDefault();
        if(MOTION){
          add.classList.remove("vr-press"); void add.offsetWidth; add.classList.add("vr-press");
          var card = add.closest(".pcard");
          var srcImg = card ? $(".pcard-media img", card) : null;
          if(srcImg) flyToBag(srcImg);
        }
        addToBag(add.dataset.add, {});
        return;
      }
      var bagBtn = e.target.closest("[data-open-bag]");
      if(bagBtn){ e.preventDefault(); openDrawer(bagBtn); }
    });

    // Modular footer initialization (if loaded)
    if(window.VIRAI_FOOTER && typeof window.VIRAI_FOOTER.init === "function"){
      window.VIRAI_FOOTER.init();
    }

    $all("form[data-form='newsletter']").forEach(function(f){
      if(f.__newsletterBound) return;
      f.__newsletterBound = true;
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
    // Large landscape imagery on inner pages drifts gently as you scroll.
    var parallax = MOTION ? $all(".ph-media img, .land-hero-media img, .gift-banner .art img") : [];
    if(!media && !head && !parallax.length) return;
    var ticking = false;
    function frame(){
      var y = window.scrollY;
      if(head){
        if(y > 28) head.classList.add("scrolled");
        else if(y < 10) head.classList.remove("scrolled");
      }
      if(media && MOTION && y < window.innerHeight * 1.2){
        media.style.transform = "translateY(" + (y * 0.12).toFixed(1) + "px) scale(1.08)";
      }
      parallax.forEach(function(img){
        var host = img.closest(".ph-media, .land-hero-media, .art");
        if(!host) return;
        var r = host.getBoundingClientRect();
        if(r.bottom < -100 || r.top > (window.innerHeight || 800) + 100) return;
        var offset = (r.top / (window.innerHeight || 800)) * -26;
        img.style.transform = "translateY(" + offset.toFixed(1) + "px) scale(1.08)";
      });
      ticking = false;
    }
    window.addEventListener("scroll", function(){
      if(ticking) return;
      ticking = true;
      requestAnimationFrame(frame);
    }, { passive:true });
    frame();
  }

  // --- Page transitions: leave through a soft veil, arrive the same way ---
  function initPageTransitions(){
    var veil = document.createElement("div");
    veil.className = "vr-veil";
    document.body.appendChild(veil);
    // Experience layer may tint the veil toward the destination's air
    window.viraiVeilTone = function(bg){
      try{ veil.style.background = bg || ""; }catch(e){}
    };
    if(MOTION){
      // Entrance fade (CSS-driven, self-completing).
      requestAnimationFrame(function(){ veil.classList.add("vr-veil-enter"); });
    }
    // Reset on back/forward restore so a cached page isn't left veiled.
    window.addEventListener("pageshow", function(ev){
      document.documentElement.classList.remove("vr-leaving");
      if(ev.persisted){
        veil.style.background = "";
        veil.classList.remove("vr-veil-enter");
        if(MOTION) requestAnimationFrame(function(){ veil.classList.add("vr-veil-enter"); });
      }
    });
    if(!MOTION) return;

    document.addEventListener("click", function(e){
      if(e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest("a");
      if(!a) return;
      var href = a.getAttribute("href");
      if(!href || a.target === "_blank" || a.hasAttribute("download")) return;
      if(href.charAt(0) === "#" || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) return;
      if(a.dataset.openBag !== undefined) return;
      var url;
      try{ url = new URL(a.href, location.href); }catch(err){ return; }
      if(url.origin !== location.origin) return;
      // Same page (only hash/query change) — let the browser handle it.
      if(url.pathname === location.pathname && url.hash) return;
      e.preventDefault();
      document.documentElement.classList.add("vr-leaving");
      setTimeout(function(){ window.location.href = a.href; }, 460);
    });
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

  // Progressive-enhancement dropdowns: transforms native <select>
  // elements (both form fields and filter selects) into bespoke VIRAI
  // luxury dropdowns while keeping the native <select> as the accessible source of truth.
  function initViraiSelects(){
    $all("select.field, select.filter-select, select[data-vr-select]").forEach(function(sel){
      if(sel.dataset.vrEnhanced) return;
      sel.dataset.vrEnhanced = "1";

      var isField = sel.classList.contains("field") || !sel.classList.contains("filter-select");
      var wrap = document.createElement("div");
      wrap.className = "vr-sel " + (isField ? "vr-sel-field" : "vr-sel-inline");
      sel.parentNode.insertBefore(wrap, sel);
      wrap.appendChild(sel);

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "vr-sel-btn";
      btn.setAttribute("role", "combobox");
      btn.setAttribute("aria-haspopup", "listbox");
      btn.setAttribute("aria-expanded", "false");
      if(sel.id) btn.id = sel.id + "-trigger";
      if(sel.getAttribute("aria-label")) btn.setAttribute("aria-label", sel.getAttribute("aria-label"));
      if(sel.disabled) btn.disabled = true;

      var label = document.createElement("span");
      label.className = "vr-sel-label";
      btn.appendChild(label);

      btn.insertAdjacentHTML("beforeend",
        '<svg class="vr-sel-caret" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" fill="none"/></svg>');
      wrap.appendChild(btn);

      var panel = document.createElement("div");
      panel.className = "vr-sel-panel";
      panel.setAttribute("role", "listbox");
      panel.setAttribute("tabindex", "-1");
      wrap.appendChild(panel);

      var activeIndex = -1;
      var searchBuf = "";
      var searchTimer = null;

      function syncLabel(){
        var opt = sel.options[sel.selectedIndex];
        var text = opt ? opt.text : "";
        label.textContent = text;
        if(!opt || opt.value === "" || text === "Select…" || text === "Prefer to discuss"){
          label.classList.add("is-placeholder");
        } else {
          label.classList.remove("is-placeholder");
        }
      }

      function markSelected(){
        var opts = $all(".vr-sel-opt", panel);
        opts.forEach(function(item, i){
          var isSel = sel.options[i] && (sel.options[i].selected || sel.options[i].value === sel.value);
          item.setAttribute("aria-selected", isSel ? "true" : "false");
          if(isSel) activeIndex = i;
        });
      }

      function buildOptions(){
        panel.innerHTML = "";
        activeIndex = -1;
        Array.prototype.forEach.call(sel.options, function(o, idx){
          var item = document.createElement("button");
          item.type = "button";
          item.className = "vr-sel-opt";
          item.setAttribute("role", "option");
          item.setAttribute("data-index", idx);
          if(o.disabled) item.disabled = true;

          var textSpan = document.createElement("span");
          textSpan.className = "vr-sel-opt-text";
          textSpan.innerHTML = '<span class="vr-sel-opt-dot"></span><span>' + (o.text || "") + '</span>';
          item.appendChild(textSpan);

          item.insertAdjacentHTML("beforeend",
            '<svg class="vr-sel-opt-check" viewBox="0 0 12 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4.5 4.5 8 11 1"/></svg>');

          var isSel = (o.value === sel.value) || o.selected;
          item.setAttribute("aria-selected", isSel ? "true" : "false");
          if(isSel) activeIndex = idx;

          item.addEventListener("click", function(e){
            e.stopPropagation();
            if(o.disabled) return;
            sel.value = o.value;
            sel.selectedIndex = idx;
            sel.style.borderColor = "";
            btn.style.borderColor = "";
            btn.classList.remove("invalid");
            sel.dispatchEvent(new Event("change", { bubbles:true }));
            sel.dispatchEvent(new Event("input", { bubbles:true }));
            syncLabel();
            markSelected();
            close();
            btn.focus();
          });

          item.addEventListener("mouseenter", function(){
            highlightOption(idx, false);
          });

          panel.appendChild(item);
        });
      }

      function highlightOption(index, scrollIntoView){
        var items = $all(".vr-sel-opt", panel);
        items.forEach(function(it, i){
          if(i === index){
            it.classList.add("focused");
            activeIndex = i;
            if(scrollIntoView && typeof it.scrollIntoView === "function"){
              it.scrollIntoView({ block: "nearest" });
            }
          } else {
            it.classList.remove("focused");
          }
        });
      }

      function positionPanel(){
        var rect = wrap.getBoundingClientRect();
        var spaceBelow = window.innerHeight - rect.bottom;
        if(spaceBelow < 280 && rect.top > 280){
          panel.classList.add("panel-top");
        } else {
          panel.classList.remove("panel-top");
        }
      }

      function open(){
        // Close any other open dropdowns first
        $all(".vr-sel.open").forEach(function(other){
          if(other !== wrap) other.classList.remove("open");
        });
        positionPanel();
        wrap.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
        markSelected();
        if(activeIndex >= 0){
          highlightOption(activeIndex, true);
        } else if(sel.selectedIndex >= 0){
          highlightOption(sel.selectedIndex, true);
        }
      }

      function close(){
        wrap.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
        var items = $all(".vr-sel-opt", panel);
        items.forEach(function(it){ it.classList.remove("focused"); });
      }

      function toggle(){
        wrap.classList.contains("open") ? close() : open();
      }

      btn.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        toggle();
      });

      // Keyboard accessibility
      btn.addEventListener("keydown", function(e){
        var isOpen = wrap.classList.contains("open");
        var items = $all(".vr-sel-opt:not([disabled])", panel);
        var total = items.length;

        if(!isOpen){
          if(e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === " " || e.key === "Enter"){
            e.preventDefault();
            open();
            return;
          }
        } else {
          if(e.key === "Escape"){
            e.preventDefault();
            close();
            return;
          }
          if(e.key === "Tab"){
            close();
            return;
          }
          if(e.key === "ArrowDown"){
            e.preventDefault();
            var next = activeIndex + 1;
            if(next >= sel.options.length) next = 0;
            highlightOption(next, true);
            return;
          }
          if(e.key === "ArrowUp"){
            e.preventDefault();
            var prev = activeIndex - 1;
            if(prev < 0) prev = sel.options.length - 1;
            highlightOption(prev, true);
            return;
          }
          if(e.key === "Enter" || e.key === " "){
            e.preventDefault();
            var optItems = $all(".vr-sel-opt", panel);
            if(activeIndex >= 0 && optItems[activeIndex]){
              optItems[activeIndex].click();
            } else {
              close();
            }
            return;
          }
        }

        // Typeahead jump
        if(e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey){
          clearTimeout(searchTimer);
          searchBuf += e.key.toLowerCase();
          searchTimer = setTimeout(function(){ searchBuf = ""; }, 600);

          for(var i = 0; i < sel.options.length; i++){
            var t = (sel.options[i].text || "").toLowerCase();
            if(t.indexOf(searchBuf) === 0){
              if(!isOpen) open();
              highlightOption(i, true);
              break;
            }
          }
        }
      });

      // Mirror focus from native select to trigger button
      sel.addEventListener("focus", function(){
        btn.focus();
      });

      // Sync when external script updates the native select
      sel.addEventListener("change", function(){
        syncLabel();
        markSelected();
      });
      sel.addEventListener("vr-sync", function(){
        buildOptions();
        syncLabel();
        markSelected();
      });

      // Observe style/class changes on native select (e.g. forms.js marking invalid)
      if(window.MutationObserver){
        var observer = new MutationObserver(function(mutations){
          mutations.forEach(function(m){
            if(m.type === "attributes" && m.attributeName === "style"){
              if(sel.style.borderColor){
                btn.style.borderColor = sel.style.borderColor;
                if(sel.style.borderColor.indexOf("A2593B") !== -1){
                  btn.classList.add("invalid");
                }
              } else {
                btn.style.borderColor = "";
                btn.classList.remove("invalid");
              }
            } else if(m.type === "childList"){
              buildOptions();
              syncLabel();
              markSelected();
            }
          });
        });
        observer.observe(sel, { attributes:true, childList:true, subtree:true });
      }

      buildOptions();
      syncLabel();
    });
  }

  // Global listeners for dropdown dismissal & responsive repositions
  document.addEventListener("click", function(e){
    if(!e.target.closest(".vr-sel")){
      $all(".vr-sel.open").forEach(function(w){
        w.classList.remove("open");
        var b = w.querySelector(".vr-sel-btn");
        if(b) b.setAttribute("aria-expanded", "false");
      });
    }
  });

  document.addEventListener("keydown", function(e){
    if(e.key === "Escape"){
      $all(".vr-sel.open").forEach(function(w){
        w.classList.remove("open");
        var b = w.querySelector(".vr-sel-btn");
        if(b){
          b.setAttribute("aria-expanded", "false");
          b.focus();
        }
      });
    }
  });

  var initFilterSelects = initViraiSelects;
  if(window.VIRAI) window.VIRAI.initSelects = initViraiSelects;
  window.initViraiSelects = initViraiSelects;

  // The sensory experience layer is progressive: loaded only when
  // motion is welcome, and never required for content or commerce.
  function initExperience(){
    if(!MOTION) return;
    var s = document.createElement("script");
    s.src = "js/experience.js";
    s.onerror = function(){};
    document.head.appendChild(s);
  }

  function syncCatalogue(){
    if(!window.fetch) return;
    fetch("/api/products")
      .then(function(res){ return res.ok ? res.json() : null; })
      .then(function(data){
        if(data && Array.isArray(data.products) && window.VIRAI){
          window.VIRAI.products = data.products;
          if(data.config){
            if(data.config.freeShipThreshold) window.VIRAI.freeShipThreshold = data.config.freeShipThreshold;
            if(data.config.shipping) window.VIRAI.shipping = data.config.shipping;
          }
          try{ initDataRenders(); }catch(e){}
          window.dispatchEvent(new CustomEvent("virai-catalogue-synced", { detail: data }));
        }
      })
      .catch(function(){});
  }

  document.addEventListener("DOMContentLoaded", function(){
    try{ syncCatalogue(); }catch(e){}
    try{ initPageTransitions(); }catch(e){ console.error("[virai] initPageTransitions failed:", e); }
    try{ initChrome(); }catch(e){ console.error("[virai] initChrome failed:", e); }
    try{ initDataRenders(); }catch(e){ console.error("[virai] initDataRenders failed:", e); }
    try{ initFilterSelects(); }catch(e){ console.error("[virai] initFilterSelects failed:", e); }
    try{ autoTag(); }catch(e){ console.error("[virai] autoTag failed:", e); }
    try{ initReveals(); }catch(e){ console.error("[virai] initReveals failed:", e); }
    try{ initHeroMotion(); }catch(e){ console.error("[virai] initHeroMotion failed:", e); }
    try{ initLandSwitcher(); }catch(e){ console.error("[virai] initLandSwitcher failed:", e); }
    try{ initExperience(); }catch(e){ console.error("[virai] initExperience failed:", e); }
  });
})();
