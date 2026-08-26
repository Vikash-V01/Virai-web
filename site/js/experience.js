/* ============================================================
   VIRAI EXPERIENCE LAYER — sensory motion
   Loaded by main.js only when motion is welcome. Everything
   here serves nature, fragrance, light, craft or emotion.
   Stillness is the default; movement is the exception.
   ============================================================ */
(function(){
  "use strict";
  if(!window.VIRAI) return;
  var doc = document;
  var root = doc.documentElement;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduced || !root.classList.contains("vr-motion")) return;

  function $(s,c){ return (c||doc).querySelector(s); }
  function $all(s,c){ return Array.prototype.slice.call((c||doc).querySelectorAll(s)); }
  function el(tag, cls){ var n = doc.createElement(tag); if(cls) n.className = cls; return n; }
  function rand(min,max){ return min + Math.random()*(max-min); }

  function drift(target, opts){
    if(!target || target.dataset.vrDrift) return;
    target.dataset.vrDrift = "1";
    opts = opts || {};
    target.classList.add("vr-alive");
    target.style.setProperty("--vr-dur", (opts.dur || rand(46,66)).toFixed(1) + "s");
    target.style.setProperty("--vr-delay", (-rand(0,30)).toFixed(1) + "s");
    target.style.setProperty("--vr-from", opts.from || "1.05");
    target.style.setProperty("--vr-dx", (opts.dx != null ? opts.dx : rand(0.8,1.6)).toFixed(2) + "vw");
    target.style.setProperty("--vr-dy", (opts.dy != null ? opts.dy : rand(-1.2,-0.4)).toFixed(2) + "vh");
  }
  function driftWrap(container, opts){
    if(!container || container.dataset.vrDrift) return null;
    var pic = $("picture", container) || container.firstElementChild;
    if(!pic) return null;
    var host = el("div","vr-drift-host");
    container.insertBefore(host, pic); host.appendChild(pic); container.dataset.vrDrift = "1";
    drift(host, opts); return host;
  }
  function atmo(host, kind){
    if(!host || $(".vr-atmo", host)) return;
    var d = el("div","vr-atmo vr-atmo--" + kind);
    d.setAttribute("aria-hidden","true"); d.innerHTML = '<i class="a"></i><i class="b"></i>'; host.appendChild(d);
  }
  function dress(media){
    if($(".vr-flamehost", media)) return;
    var f = el("div","vr-flamehost"); f.setAttribute("aria-hidden","true");
    f.innerHTML = '<span class="vr-flame"></span><span class="vr-pool"></span><span class="vr-wisp wa"></span><span class="vr-wisp wb"></span>'; media.appendChild(f);
  }
  function lightRitual(targets, opts){
    opts = opts || {};
    if(typeof IntersectionObserver === "undefined"){
      targets.forEach(function(m){ m.classList.add("vr-canlit","vr-lit"); dress(m); }); return;
    }
    var io = new IntersectionObserver(function(entries){
      var batch = entries.filter(function(e){ return e.isIntersecting; }); if(!batch.length) return;
      batch.sort(function(a,b){ return a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top; });
      batch.forEach(function(e,i){
        io.unobserve(e.target); var m = e.target; m.classList.add("vr-canlit"); dress(m);
        setTimeout(function(){ m.classList.add("vr-lit"); }, (opts.baseDelay || 240) + Math.min(i,4) * (opts.step || 780));
      });
    }, { threshold: opts.threshold || 0.45, rootMargin: "0px 0px -6% 0px" });
    targets.forEach(function(m){ io.observe(m); });
  }
  lightRitual($all(".pcard-media").concat($all(".result-art")));

  var stageHost = $("#stage");
  if(stageHost && typeof MutationObserver !== "undefined"){
    new MutationObserver(function(){
      var fresh = $all(".result-art", stageHost).filter(function(m){ return !m.dataset.vrWatched; });
      fresh.forEach(function(m){ m.dataset.vrWatched = "1"; });
      if(fresh.length) lightRitual(fresh, { threshold:0.3, baseDelay:520 });
    }).observe(stageHost, { childList:true, subtree:true });
  }

  var pdpArt = $("#pdpArt");
  if(pdpArt){
    lightRitual([pdpArt], { threshold:0.25, baseDelay:420 });
    if(typeof MutationObserver !== "undefined") new MutationObserver(function(){
      pdpArt.classList.remove("vr-canlit","vr-lit"); dress(pdpArt);
      requestAnimationFrame(function(){ pdpArt.classList.add("vr-canlit","vr-lit"); });
    }).observe(pdpArt, { childList:true });
  }

  var lineIO = typeof IntersectionObserver !== "undefined"
    ? new IntersectionObserver(function(entries){ entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("vr-lines-in"); lineIO.unobserve(e.target); } }); }, { threshold:0.5 }) : null;
  function unfoldLines(node){
    if(node.dataset.vrLines) return;
    node.dataset.vrLines = "1";
    var text = node.textContent.trim();
    var parts = text.match(/[^.!?…]+[.!?…]+["'\u2019\u201D)]*\s*|[^.!?…]+$/g) || [text];
    node.textContent = "";
    parts.forEach(function(sentence, i){
      var outer = el("span","vr-line"), inner = el("span"); inner.textContent = sentence.trim(); inner.style.setProperty("--li", i);
      outer.appendChild(inner); node.appendChild(outer); node.appendChild(doc.createTextNode(" "));
    });
    node.classList.add("vr-lines-ready"); if(lineIO) lineIO.observe(node); else node.classList.add("vr-lines-in");
  }

  var page = doc.body.dataset.page || "info";
  if(page === "home"){
    var heroMedia = $(".hero-media"); if(heroMedia) atmo(heroMedia, "dawn");
    var houseLede = $(".intro-grid .lede"); if(houseLede) unfoldLines(houseLede);
    var stage = $(".ls-stage");
    if(stage){
      drift(stage, { dur:52, dx:1.1, dy:-0.5, from:"1.01" }); atmo(stage, "kurinji");
      var switcher = $("#landSwitcher");
      if(switcher) switcher.addEventListener("click", function(e){
        var b = e.target.closest("[data-land]"); if(!b) return; var oldA = $(".vr-atmo", stage);
        if(oldA) oldA.className = "vr-atmo vr-atmo--" + b.dataset.land;
      });
    }
    var wb = $(".world-banner .wb-link");
    if(wb){ drift($("picture", wb), { dur:60, dx:1.2, dy:-0.5, from:"1.02" }); atmo(wb, "dusk"); }
  }
  if(page === "collection"){
    $all(".stack > section").forEach(function(sec, i){
      var kind = sec.dataset.land || "kurinji", bg = $(".panel-bg", sec);
      if(bg){ drift($("picture", bg), { dur:54 + i*6, dx:(i%2 ? -1.2 : 1.3), dy:-0.6, from:"1.03" }); atmo(bg, kind); }
    });
    var aintLede = $(".ainth-intro .lede"); if(aintLede) unfoldLines(ainthLede);
  }
  if(page === "landscape"){
    var params = new URLSearchParams(location.search), kind = params.get("id");
    if(!VIRAI.landscapes[kind]) kind = "kurinji";
    var lh = $("#lhMedia"); if(lh) { driftWrap(lh, { dur:56, dx:1.3, dy:-0.6, from:"1.03" }); atmo(lh, kind); }
  }

  doc.addEventListener("click", function(e){
    if(e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest("a[href]"); if(!a || !window.viraiVeilTone) return;
    var href = a.getAttribute("href") || "", m = href.match(/^landscape\.html\?id=([a-z]+)/), L = m && VIRAI.landscapes[m[1]];
    if(L) window.viraiVeilTone("linear-gradient(168deg," + L.tint + " 0%," + L.tone + "26 58%,#F5F1E8 100%)");
    else if(href.indexOf("ainthinai.html") === 0) window.viraiVeilTone("linear-gradient(170deg,#EFEBE1 0%,#E7E1D5 55%,#F5F1E8 100%)");
    else window.viraiVeilTone("");
  }, true);

  /* ============================================================
     HOME HERO — TRUE CLOUD PARALLAX

     The photograph stays grounded. A dedicated transparent cloud
     asset floats above it. Only this layer is transformed from
     scroll position. Hero copy is deliberately untouched.
     ============================================================ */
  if(page === "home"){
    var hero = $(".hero");
    var heroImg = $("#heroImg");
    var heroMediaNode = $(".hero-media", hero);
    var heroAtmo = $(".hero-media .vr-atmo", hero);

    if(hero && heroImg && heroMediaNode){
      hero.classList.add("vr-home-parallax");

      var cloudLayer = $(".vr-home-clouds", heroMediaNode);
      if(!cloudLayer){
        cloudLayer = el("div","vr-home-clouds");
        cloudLayer.setAttribute("aria-hidden","true");
        heroMediaNode.appendChild(cloudLayer);
      }

      /* Do not move the photograph, content or scrim on scroll. */
      heroImg.style.willChange = "auto";
      if(heroAtmo) heroAtmo.style.willChange = "transform";

      var ticking = false;
      var raf = 0;

      function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }

      function renderCloudParallax(){
        ticking = false;

        var rect = hero.getBoundingClientRect();
        var h = Math.max(hero.offsetHeight || window.innerHeight, 1);
        var mobile = window.innerWidth < 881;

        /* 0 at hero entry; 1 when the hero has completely crossed. */
        var p = clamp(-rect.top / h, 0, 1);

        /*
          The cloud movement is intentionally much slower than the page:
          desktop: 0 → +8vw and 0 → -3.2vh
          mobile:  0 → +4vw and 0 → -1.8vh

          Scale prevents transparent edges from ever becoming visible.
        */
        var cloudX = p * (mobile ? 4.0 : 8.0);
        var cloudY = p * (mobile ? -1.8 : -3.2);
        var cloudScale = 1.04 + p * (mobile ? 0.025 : 0.045);

        cloudLayer.style.transform =
          "translate3d(" + cloudX.toFixed(3) + "vw," +
          cloudY.toFixed(3) + "vh,0) scale(" + cloudScale.toFixed(4) + ")";

        /* A tiny independent mist drift adds depth without moving the image. */
        if(heroAtmo){
          var mistY = p * (mobile ? -0.6 : -1.0);
          heroAtmo.style.transform = "translate3d(0," + mistY.toFixed(3) + "vh,0)";
        }
      }

      function requestCloudRender(){
        if(ticking) return;
        ticking = true;
        raf = window.requestAnimationFrame(renderCloudParallax);
      }

      window.addEventListener("scroll", requestCloudRender, { passive:true });
      window.addEventListener("resize", requestCloudRender, { passive:true });
      window.addEventListener("orientationchange", requestCloudRender, { passive:true });
      window.addEventListener("load", requestCloudRender, { once:true });
      requestCloudRender();

      document.addEventListener("visibilitychange", function(){
        if(document.hidden && raf){
          window.cancelAnimationFrame(raf);
          raf = 0;
          ticking = false;
        }else if(!document.hidden){
          requestCloudRender();
        }
      });
    }
  }
})();
