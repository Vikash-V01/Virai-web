(function(){
  "use strict";
  var params = new URLSearchParams(location.search);
  var p = VIRAI.productById(params.get("id")) || VIRAI.productById("kurinji-candle");
  var land = p.landscape ? VIRAI.landscapes[p.landscape] : null;

  document.title = p.name + " | VIRAI — Ainthinai";
  var metaDesc = document.querySelector('meta[name="description"]');
  if(metaDesc) metaDesc.setAttribute("content", p.shortScent + " " + p.sub + ".");

  var GALLERY = ["a","b","c"];
  var curKey = "a";
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
  document.getElementById("specTable").innerHTML = specRows.map(function(r){
    return "<tr><td>"+r[0]+"</td><td>"+r[1]+"</td></tr>";
  }).join("");

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
    document.getElementById("atbPrice").textContent = window.viraiFmt(unitPrice() * options().qty);
  }
  updateAtb();

  document.getElementById("atbBtn").addEventListener("click", function(){ window.viraiAddToBag(p.id, options()); });
  document.getElementById("sbAtb").addEventListener("click", function(){ window.viraiAddToBag(p.id, options()); });

  document.getElementById("sbName").textContent = p.name;
  document.getElementById("sbPrice").textContent = window.viraiFmt(p.price);
  window.addEventListener("scroll", function(){
    var bar = document.getElementById("stickyBuy");
    bar.style.transform = (window.scrollY > 520 && window.innerWidth <= 880) ? "" : "translateY(110%)";
  }, { passive:true });
  document.getElementById("stickyBuy").style.transform = "translateY(110%)";

  var related = VIRAI.products.filter(function(x){
    return x.id !== p.id && ((x.landscape && x.landscape === p.landscape) || (!p.landscape));
  });
  if(related.length < 4){
    VIRAI.products.forEach(function(x){
      if(related.length >= 4) return;
      if(x.id !== p.id && related.indexOf(x) === -1 && x.type === "Set") related.push(x);
    });
  }
  related = related.slice(0,4);
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
