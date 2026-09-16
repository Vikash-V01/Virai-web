(function(){
  "use strict";
  var params = new URLSearchParams(location.search);
  var p = VIRAI.productById(params.get("id"));

  if(!p){
    document.title = "Object Not Found | VIRAI";
    var metaDesc404 = document.querySelector('meta[name="description"]');
    if(metaDesc404) metaDesc404.setAttribute("content", "The piece you are looking for is not here. Explore Ainthinai, Collection 01.");
    document.documentElement.style.setProperty("--tone", "#8B7F6C");
    var host = document.getElementById("main");
    if(host) host.innerHTML =
      '<section class="wrap center" style="padding:clamp(5rem,12vw,9rem) 0">' +
        '<p class="kicker">Ainthinai</p>' +
        '<h1 style="font-size:clamp(1.9rem,3.6vw,2.8rem)">This object is not here.</h1>' +
        '<p class="lede" style="margin:1.2rem auto 0">The piece you are looking for may have been renamed or retired. The collection, however, remains.</p>' +
        '<div style="margin-top:2.4rem;display:flex;gap:.8rem;justify-content:center;flex-wrap:wrap">' +
          '<a class="btn btn-solid" href="shop.html">Explore Our Collection</a>' +
          '<a class="btn btn-line" href="ainthinai.html">Explore Ainthinai</a>' +
        '</div>' +
      '</section>';
    var sticky = document.getElementById("stickyBuy");
    if(sticky && sticky.parentNode) sticky.parentNode.removeChild(sticky);
    viraiTrack("product_not_found", { requested:params.get("id") });
    return;
  }
  var land = p.landscape ? VIRAI.landscapes[p.landscape] : null;

  document.title = p.name + " | VIRAI — Ainthinai";
  var metaDesc = document.querySelector('meta[name="description"]');
  if(metaDesc) metaDesc.setAttribute("content", p.shortScent + " " + p.sub + ".");

  var GALLERY = (p.img && typeof p.img === "object") ? Object.keys(p.img).filter(function(k){ return !!p.img[k]; }) : ["a","b","c"];
  if(GALLERY.length === 0) GALLERY = ["a"];
  var curKey = GALLERY[0];
  var CONTAIN = "position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:3%";

  function mainImgHTML(key){
    return '<img' + window.viraiImgAttrs(p.img[key], null, key === "a") +
      ' alt="' + window.viraiPalt(p, key) + '"' +
      ' style="' + (key === "a" ? CONTAIN : CONTAIN) + '">';
  }
  function renderMain(){
    document.getElementById("pdpArt").innerHTML = mainImgHTML(curKey);
    Array.prototype.forEach.call(document.querySelectorAll(".pdp-thumbs .art"), function(el){
      el.classList.toggle("on", el.dataset.g === curKey);
    });
  }
  document.getElementById("pdpArt").style.background = "var(--paper)";

  var thumbsHost = document.getElementById("pdpThumbs");
  thumbsHost.innerHTML = GALLERY.map(function(key){
    return '<button class="art" data-g="'+key+'" aria-label="View image: '+window.viraiPalt(p,key)+'">'+
      '<img' + window.viraiImgAttrs(p.img[key], null, false) +
      ' alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:4%">'+
      '</button>';
  }).join("");
  thumbsHost.addEventListener("click", function(e){
    var b = e.target.closest("[data-g]");
    if(!b) return;
    curKey = b.dataset.g;
    renderMain();
  });
  renderMain();

  if(p.landscape){
    document.documentElement.style.setProperty("--tone", land.tone);
    document.querySelector(".pdp").style.setProperty("--tone", land.tone);
  }

  document.getElementById("crumbName").textContent = p.name;
  document.getElementById("pdpLand").innerHTML = p.landscape
    ? "Ainthinai \u00B7 " + land.name + " <b>\u00B7 " + land.emotion + "</b>"
    : "Ainthinai \u00B7 Collection 01";
  document.getElementById("pdpName").textContent = p.name;
  document.getElementById("pdpPrice").textContent = window.viraiFmt(p.price) + " \u00B7 " + p.size;
  document.getElementById("pdpScent").textContent = p.shortScent;
  document.getElementById("pdpStory").textContent = p.story;
  document.getElementById("pdpLong").textContent = p.longScent;

  var notesHost = document.getElementById("pdpNotes");
  var noteRows = [
    ["Top", p.notes.top.join(", ")],
    ["Heart", p.notes.heart.join(", ")],
    ["Base", p.notes.base.join(", ")]
  ];
  notesHost.innerHTML = noteRows.map(function(r,i){
    if(r[1].indexOf("\u2014") === 0 || r[1] === "\u2014") return "";
    return '<div class="note-row" style="animation-delay:'+(i*.18)+'s"><dt>'+r[0]+'</dt><dd>'+r[1]+'</dd></div>';
  }).join("");

  var specRows = [
    ["Format", p.type],
    ["Size", p.size],
    ["Burn time", p.burn],
    ["Dimensions", p.dims],
    ["Weight", p.weight],
    ["Wax", "Coconut\u2013soy blend"],
    ["Wick", "Cotton, lead-free"],
    ["Vessel", "Stoneware-toned, reusable"]
  ];

  function applyStatusUI(prod){
    var isPrebook = (prod.status === "prebooking");
    var isSoldOut = (prod.status === "out_of_stock" || prod.status === "sold_out");

    var prebookBanner = document.getElementById("pdpPrebookBanner");
    var atbActionText = document.getElementById("atbActionText");
    var atbBtn = document.getElementById("atbBtn");
    var sbAtb = document.getElementById("sbAtb");

    if(isPrebook){
      if(prebookBanner){
        prebookBanner.style.display = "block";
        var etaEl = document.getElementById("pdpPrebookEta");
        var noteEl = document.getElementById("pdpPrebookNote");
        if(etaEl && prod.prebookRelease) etaEl.textContent = prod.prebookRelease;
        if(noteEl && prod.prebookNote) noteEl.innerHTML = '<strong>Upcoming Batch:</strong> ' + prod.prebookNote;
      }
      if(atbActionText) atbActionText.textContent = "Pre-book Vessel";
      if(sbAtb) sbAtb.textContent = "Pre-book Vessel";
      if(atbBtn){ atbBtn.disabled = false; atbBtn.style.opacity = ""; atbBtn.style.cursor = ""; }
    } else if(isSoldOut){
      if(prebookBanner) prebookBanner.style.display = "none";
      if(atbBtn){
        atbBtn.disabled = true;
        atbBtn.innerHTML = "Currently Sold Out";
        atbBtn.style.opacity = ".55";
        atbBtn.style.cursor = "not-allowed";
      }
      if(sbAtb){
        sbAtb.disabled = true;
        sbAtb.textContent = "Sold Out";
        sbAtb.style.opacity = ".55";
        sbAtb.style.cursor = "not-allowed";
      }
    } else {
      if(prebookBanner) prebookBanner.style.display = "none";
      if(atbActionText) atbActionText.textContent = "Make It Yours";
      if(sbAtb) sbAtb.textContent = "Make It Yours";
      if(atbBtn){ atbBtn.disabled = false; atbBtn.style.opacity = ""; atbBtn.style.cursor = ""; }
    }

    var specs = specRows.slice();
    if(isPrebook){
      specs.unshift(["Availability", "Pre-booking Open (" + (prod.prebookRelease || "Scheduled Release") + ")"]);
    } else if(isSoldOut){
      specs.unshift(["Availability", "Currently Out of Stock"]);
    } else {
      specs.unshift(["Availability", "In Stock · Dispatches in 2 working days"]);
    }
    document.getElementById("specTable").innerHTML = specs.map(function(r){
      return "<tr><td>"+r[0]+"</td><td>"+r[1]+"</td></tr>";
    }).join("");
  }
  applyStatusUI(p);

  window.addEventListener("virai-catalogue-synced", function(){
    var fresh = VIRAI.productById(p.id);
    if(fresh){
      p = fresh;
      applyStatusUI(fresh);
      updateAtb();
    }
  });

  var qty = document.getElementById("qtyInput");
  document.getElementById("qMinus").addEventListener("click", function(){
    qty.value = Math.max(1, (parseInt(qty.value,10)||1) - 1); updateAtb();
  });
  document.getElementById("qPlus").addEventListener("click", function(){
    qty.value = Math.min(9, (parseInt(qty.value,10)||1) + 1); updateAtb();
  });
  qty.addEventListener("input", updateAtb);

  var wrapChk = document.getElementById("giftWrap");
  var msgBox = document.getElementById("giftMsgBox");
  wrapChk.addEventListener("change", function(){ msgBox.classList.toggle("open", wrapChk.checked); updateAtb(); });

  function options(){
    return { qty: Math.max(1, parseInt(qty.value,10)||1), giftWrap: wrapChk.checked, message: document.getElementById("giftMsg").value };
  }
  function unitPrice(){ return p.price + (wrapChk.checked ? 150 : 0); }
  function updateAtb(){
    var priceEl = document.getElementById("pdpPrice");
    if(priceEl){
      priceEl.textContent = window.viraiFmt(unitPrice() * options().qty) + " \u00B7 " + p.size;
    }
  }
  updateAtb();

  function handlePdpPurchase(){
    var opts = options();
    var res = window.viraiAddToBag(p.id, opts);
    var atbBtn = document.getElementById("atbBtn");
    var atbText = document.getElementById("atbActionText");
    var sbAtb = document.getElementById("sbAtb");
    var errorEl = document.getElementById("pdpError");

    if(res && res.success){
      if(errorEl) errorEl.hidden = true;
      if(atbText) atbText.innerHTML = "&#10003; In Your Bag";
      if(atbBtn){
        atbBtn.classList.add("is-in-bag");
        atbBtn.setAttribute("aria-label", p.name + " is now in your bag");
      }
      if(sbAtb){
        sbAtb.classList.add("is-in-bag");
        sbAtb.innerHTML = "&#10003; In Your Bag";
      }

      // Quietly reset button labels after 3.5 seconds
      setTimeout(function(){
        if(atbText) atbText.textContent = "Make It Yours";
        if(atbBtn){
          atbBtn.classList.remove("is-in-bag");
          atbBtn.setAttribute("aria-label", "Make " + p.name + " yours");
        }
        if(sbAtb){
          sbAtb.classList.remove("is-in-bag");
          sbAtb.textContent = "Make It Yours";
        }
      }, 3500);

      // Trigger the 3.5s bottom-right corner popup
      if(typeof window.viraiShowBagPopup === "function"){
        window.viraiShowBagPopup(p.name, p.id);
      }
    } else {
      if(errorEl) errorEl.hidden = false;
    }
  }

  document.getElementById("atbBtn").addEventListener("click", handlePdpPurchase);
  document.getElementById("sbAtb").addEventListener("click", handlePdpPurchase);

  var viewBagBtn = document.getElementById("pdpViewBagBtn");
  if(viewBagBtn){
    viewBagBtn.addEventListener("click", function(){
      viraiTrack("view_bag_clicked", { source: "pdp", product_id: p.id });
      if(typeof window.viraiOpenBag === "function") window.viraiOpenBag(viewBagBtn);
    });
  }

  var keepExploringBtn = document.getElementById("pdpKeepExploringBtn");
  if(keepExploringBtn){
    keepExploringBtn.addEventListener("click", function(){
      viraiTrack("keep_exploring_clicked", { source: "pdp", product_id: p.id });
      var confirmEl = document.getElementById("pdpConfirm");
      if(confirmEl) confirmEl.hidden = true;
      var atbText = document.getElementById("atbActionText");
      if(atbText) atbText.textContent = "Make It Yours";
      var atbBtn = document.getElementById("atbBtn");
      if(atbBtn){
        atbBtn.classList.remove("is-in-bag");
        atbBtn.setAttribute("aria-label", "Make " + p.name + " yours");
      }
      var sbAtb = document.getElementById("sbAtb");
      if(sbAtb){
        sbAtb.classList.remove("is-in-bag");
        sbAtb.textContent = "Make It Yours";
      }
    });
  }

  var retryBtn = document.getElementById("pdpRetryBtn");
  if(retryBtn){
    retryBtn.addEventListener("click", handlePdpPurchase);
  }

  document.getElementById("sbName").textContent = p.name;
  document.getElementById("sbPrice").textContent = window.viraiFmt(p.price);
  window.addEventListener("scroll", function(){
    var bar = document.getElementById("stickyBuy");
    bar.style.transform = (window.scrollY > 520 && window.innerWidth <= 880) ? "" : "translateY(110%)";
  }, { passive:true });
  document.getElementById("stickyBuy").style.transform = "translateY(110%)";

  // Curated companions: same landscape first, then shared fragrance family
  // and format. For sets (no landscape), the full-size landscapes lead.
  var related = VIRAI.products.filter(function(x){ return x.id !== p.id; }).map(function(x){
    var s = 0;
    if(p.landscape){
      if(x.landscape === p.landscape) s += 4;
      if(x.family.indexOf(p.family[0]) !== -1) s += 2;
      if(x.type === p.type) s += 2;
    } else {
      if(x.type === "Candle") s += 3;
      if(x.type === "Set") s -= 2;
    }
    if(x.featured) s += 1;
    return { x:x, s:s };
  }).sort(function(a,b){ return b.s - a.s; })
    .slice(0,4)
    .map(function(r){ return r.x; });
  document.getElementById("relatedGrid").innerHTML = related.map(window.viraiCard).join("");
  window.viraiReveal();

  viraiTrack("product_view", { product_id:p.id, price:p.price, landscape:p.landscape || null });

  var ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context":"https://schema.org",
    "@type":"Product",
    name:p.name,
    description:p.shortScent,
    brand:{ "@type":"Brand", name:"Virai" },
    offers:{
      "@type":"Offer",
      priceCurrency:"INR",
      price:String(p.price),
      availability:"https://schema.org/InStock"
    }
  });
  document.head.appendChild(ld);
})();
