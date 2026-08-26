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
    target.dataset.vrDrift="1"; opts=opts||{}; target.classList.add("vr-alive");
    target.style.setProperty("--vr-dur",(opts.dur||rand(46,66)).toFixed(1)+"s");
    target.style.setProperty("--vr-delay",(-rand(0,30)).toFixed(1)+"s");
    target.style.setProperty("--vr-from",opts.from||"1.05");
    target.style.setProperty("--vr-dx",(opts.dx!=null?opts.dx:rand(.8,1.6)).toFixed(2)+"vw");
    target.style.setProperty("--vr-dy",(opts.dy!=null?opts.dy:rand(-1.2,-.4)).toFixed(2)+"vh");
  }
  function atmo(host,kind){
    if(!host||$(".vr-atmo",host))return;
    var d=el("div","vr-atmo vr-atmo--"+kind); d.setAttribute("aria-hidden","true");
    d.innerHTML='<i class="a"></i><i class="b"></i>'; host.appendChild(d);
  }
  function dress(media){
    if($(".vr-flamehost",media))return;
    var f=el("div","vr-flamehost"); f.setAttribute("aria-hidden","true");
    f.innerHTML='<span class="vr-flame"></span><span class="vr-pool"></span><span class="vr-wisp wa"></span><span class="vr-wisp wb"></span>'; media.appendChild(f);
  }
  function lightRitual(targets,opts){
    opts=opts||{};
    if(typeof IntersectionObserver==="undefined"){targets.forEach(function(m){m.classList.add("vr-canlit","vr-lit");dress(m)});return;}
    var io=new IntersectionObserver(function(entries){
      var batch=entries.filter(function(e){return e.isIntersecting}); if(!batch.length)return;
      batch.sort(function(a,b){return a.target.getBoundingClientRect().top-b.target.getBoundingClientRect().top});
      batch.forEach(function(e,i){io.unobserve(e.target);var m=e.target;m.classList.add("vr-canlit");dress(m);setTimeout(function(){m.classList.add("vr-lit")},(opts.baseDelay||240)+Math.min(i,4)*(opts.step||780))});
    },{threshold:opts.threshold||.45,rootMargin:"0px 0px -6% 0px"});
    targets.forEach(function(m){io.observe(m)});
  }
  lightRitual($all(".pcard-media").concat($all(".result-art")));
  var stageHost=$("#stage");
  if(stageHost&&typeof MutationObserver!=="undefined")new MutationObserver(function(){
    var fresh=$all(".result-art",stageHost).filter(function(m){return !m.dataset.vrWatched});
    fresh.forEach(function(m){m.dataset.vrWatched="1"}); if(fresh.length)lightRitual(fresh,{threshold:.3,baseDelay:520});
  }).observe(stageHost,{childList:true,subtree:true});
  var pdpArt=$("#pdpArt");
  if(pdpArt){
    lightRitual([pdpArt],{threshold:.25,baseDelay:420});
    if(typeof MutationObserver!=="undefined")new MutationObserver(function(){
      pdpArt.classList.remove("vr-canlit","vr-lit");dress(pdpArt);requestAnimationFrame(function(){pdpArt.classList.add("vr-canlit","vr-lit")});
    }).observe(pdpArt,{childList:true});
  }
  var lineIO=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add("vr-lines-in");lineIO.unobserve(e.target)}})},{threshold:.5}):null;
  function unfoldLines(node){
    if(node.dataset.vrLines)return; node.dataset.vrLines="1"; var text=node.textContent.trim();
    var parts=text.match(/[^.!?…]+[.!?…]+["'\u2019\u201D)]*\s*|[^.!?…]+$/g)||[text]; node.textContent="";
    parts.forEach(function(sentence,i){var outer=el("span","vr-line"),inner=el("span");inner.textContent=sentence.trim();inner.style.setProperty("--li",i);outer.appendChild(inner);node.appendChild(outer);node.appendChild(doc.createTextNode(" "))});
    node.classList.add("vr-lines-ready");if(lineIO)lineIO.observe(node);else node.classList.add("vr-lines-in");
  }
  var page=doc.body.dataset.page||"info";
  if(page==="home"){
    var heroMedia=$(".hero-media");if(heroMedia)atmo(heroMedia,"dawn");
    var houseLede=$(".intro-grid .lede");if(houseLede)unfoldLines(houseLede);
    var stage=$(".ls-stage");
    if(stage){drift(stage,{dur:52,dx:1.1,dy:-.5,from:"1.01"});atmo(stage,"kurinji");}
    var wb=$(".world-banner .wb-link");if(wb){var pic=$("picture",wb);if(pic)drift(pic,{dur:60,dx:1.2,dy:-.5,from:"1.02"});atmo(wb,"dusk");}

    /* ============================================================
       HOME — STRONG 7-LAYER KURINJI PARALLAX
       ============================================================ */
    (function initHeroLayers(){
      var hero=$(".hero-layered"),scene=hero&&$(".hero-layer-scene",hero);
      if(!hero||!scene)return;
      var layers=[
        {el:$(".hero-layer-sky",scene),speed:.025,x:0,scale:1.075},
        {el:$(".hero-layer-clouds",scene),speed:.18,x:.42,scale:1.085},
        {el:$(".hero-layer-mountains-far",scene),speed:.31,x:.22,scale:1.095},
        {el:$(".hero-layer-mist",scene),speed:.46,x:-.18,scale:1.105},
        {el:$(".hero-layer-mountains-mid",scene),speed:.63,x:.13,scale:1.115},
        {el:$(".hero-layer-mountains-near",scene),speed:.82,x:-.10,scale:1.125},
        {el:$(".hero-layer-foreground",scene),speed:1.0,x:.20,scale:1.14}
      ].filter(function(l){return l.el});
      if(!layers.length)return;
      var raf=0;
      function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
      function render(){
        raf=0;
        var pageTop=window.scrollY||window.pageYOffset||0;
        var rect=hero.getBoundingClientRect();
        var heroTop=pageTop+rect.top;
        var heroH=Math.max(hero.offsetHeight,window.innerHeight||1);
        var p=clamp((pageTop-heroTop)/heroH,0,1);
        var mobile=window.innerWidth<881;
        var yMax=mobile?190:340;
        var xMax=mobile?34:60;
        layers.forEach(function(l){
          var y=-(p*l.speed*yMax),x=p*l.x*xMax;
          var scale=l.scale+p*.045;
          l.el.style.transform="translate3d("+x.toFixed(2)+"px,"+y.toFixed(2)+"px,0) scale("+scale.toFixed(4)+")";
        });
      }
      function request(){if(!raf)raf=requestAnimationFrame(render)}
      window.addEventListener("scroll",request,{passive:true});
      window.addEventListener("resize",request,{passive:true});
      window.addEventListener("orientationchange",request,{passive:true});
      window.addEventListener("load",request,{once:true});
      request();setTimeout(request,150);setTimeout(request,600);
    })();

    /* Scroll-lit candle transition */
    var candleScene=$(".virai-candle-scene");
    if(candleScene){
      var unlit=$(".scene-unlit",candleScene),lit=$(".scene-lit",candleScene),glow=$(".scene-candle-glow",candleScene),tick=false;
      function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
      function renderCandle(){
        tick=false;
        var rect=candleScene.getBoundingClientRect(),vh=Math.max(innerHeight||doc.documentElement.clientHeight,1),sh=Math.max(candleScene.offsetHeight||vh,1);
        var p=clamp((vh*.80-rect.top)/Math.max(vh*.80+sh*.20,1),0,1),lp=clamp((p-.18)/.52,0,1);
        if(unlit)unlit.style.opacity=(1-lp).toFixed(3);if(lit)lit.style.opacity=lp.toFixed(3);if(glow)glow.style.opacity=(lp*.95).toFixed(3);
      }
      function reqC(){if(!tick){tick=true;requestAnimationFrame(renderCandle)}}
      window.addEventListener("scroll",reqC,{passive:true});window.addEventListener("resize",reqC,{passive:true});window.addEventListener("load",reqC,{once:true});reqC();
    }
  }
})();
