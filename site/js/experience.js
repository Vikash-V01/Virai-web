/* ============================================================
   VIRAI EXPERIENCE LAYER — sensory motion
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

    /* ============================================================
       HOME — TRUE 7-LAYER KURINJI PARALLAX
       ============================================================ */
    (function initHeroLayers(){
      var hero = $(".hero-layered");
      if(!hero) return;
      var scene = $(".hero-layer-scene", hero);
      if(!scene) return;

      var layers = [
        {el:$(".hero-layer-sky",scene), speed:0.04, x:0.10, scale:0.012},
        {el:$(".hero-layer-clouds",scene), speed:0.15, x:0.80, scale:0.020},
        {el:$(".hero-layer-mountains-far",scene), speed:0.24, x:0.42, scale:0.026},
        {el:$(".hero-layer-mist",scene), speed:0.38, x:-0.32, scale:0.034},
        {el:$(".hero-layer-mountains-mid",scene), speed:0.53, x:0.22, scale:0.043},
        {el:$(".hero-layer-mountains-near",scene), speed:0.70, x:-0.16, scale:0.056},
        {el:$(".hero-layer-foreground",scene), speed:0.90, x:0.34, scale:0.072}
      ].filter(function(l){ return l.el; });

      if(!layers.length) return;
      var ticking = false, raf = 0;
      var lastProgress = 0;
      var currentProgress = 0;

      function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }
      function easeOut(t){ return 1 - Math.pow(1-t,3); }
      function targetProgress(){
        var rect = hero.getBoundingClientRect();
        var range = Math.max(hero.offsetHeight * 0.95, window.innerHeight * 0.9, 1);
        return clamp((-rect.top) / range, 0, 1);
      }
      function render(){
        ticking = false;
        var target = targetProgress();
        currentProgress += (target - currentProgress) * 0.12;
        if(Math.abs(target-currentProgress) < 0.0005) currentProgress = target;
        var p = easeOut(currentProgress);
        var mobile = window.innerWidth < 881;
        var strength = mobile ? 0.58 : 1;

        layers.forEach(function(l){
          var travelY = p * l.speed * (mobile ? 16 : 32) * strength;
          var travelX = p * l.x * (mobile ? 1.9 : 3.8) * strength;
          var scale = 1.04 + l.scale * p * strength;
          l.el.style.transform = "translate3d("+travelX.toFixed(3)+"vw,"+(-travelY).toFixed(3)+"vh,0) scale("+scale.toFixed(4)+")";
        });

        if(Math.abs(currentProgress-lastProgress)>0.0005){
          lastProgress = currentProgress;
          raf = window.requestAnimationFrame(render);
        }
      }
      function request(){
        if(ticking) return;
        ticking = true;
        raf = window.requestAnimationFrame(render);
      }
      window.addEventListener("scroll", request, {passive:true});
      window.addEventListener("resize", request, {passive:true});
      window.addEventListener("orientationchange", request, {passive:true});
      window.addEventListener("load", request, {once:true});
      request();
      document.addEventListener("visibilitychange",function(){
        if(document.hidden && raf){ window.cancelAnimationFrame(raf); raf=0; ticking=false; }
        else if(!document.hidden) request();
      });
    })();

    /* ============================================================
       SCROLL-LIT KURINJI SCENE
       ============================================================ */
    var candleScene = $(".virai-candle-scene");
    if(candleScene){
      var unlit = $(".scene-unlit",candleScene);
      var lit = $(".scene-lit",candleScene);
      var glow = $(".scene-candle-glow",candleScene);
      var candleTicking = false;
      var candleRaf = 0;
      function sceneProgress(){
        var rect = candleScene.getBoundingClientRect();
        var viewH = Math.max(window.innerHeight || doc.documentElement.clientHeight,1);
        var sceneH = Math.max(candleScene.offsetHeight || viewH,1);
        var start = viewH * 0.80;
        var end = -sceneH * 0.20;
        return clamp((start - rect.top) / Math.max(start - end,1),0,1);
      }
      function renderCandle(){
        candleTicking = false;
        var p = sceneProgress();
        var litProgress = clamp((p - 0.18) / 0.52,0,1);
        if(unlit) unlit.style.opacity = (1-litProgress).toFixed(3);
        if(lit) lit.style.opacity = litProgress.toFixed(3);
        if(glow) glow.style.opacity = (litProgress * 0.95).toFixed(3);
      }
      function requestCandleRender(){ if(candleTicking) return; candleTicking = true; candleRaf = window.requestAnimationFrame(renderCandle); }
      window.addEventListener("scroll",requestCandleRender,{passive:true});
      window.addEventListener("resize",requestCandleRender,{passive:true});
      window.addEventListener("orientationchange",requestCandleRender,{passive:true});
      window.addEventListener("load",requestCandleRender,{once:true});
      requestCandleRender();
      document.addEventListener("visibilitychange",function(){
        if(document.hidden && candleRaf){ window.cancelAnimationFrame(candleRaf); candleRaf=0; candleTicking=false; }
        else if(!document.hidden) requestCandleRender();
      });
    }
  }
})();
