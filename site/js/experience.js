/* ============================================================
   VIRAI EXPERIENCE LAYER — sensory motion
   ============================================================ */
(function(){
  "use strict";
  if(!window.VIRAI) return;
  var doc=document, root=doc.documentElement;
  var reduced=window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduced || !root.classList.contains("vr-motion")) return;
  function $(s,c){return(c||doc).querySelector(s)}
  function $all(s,c){return Array.prototype.slice.call((c||doc).querySelectorAll(s))}
  function el(tag,cls){var n=doc.createElement(tag);if(cls)n.className=cls;return n}
  function rand(min,max){return min+Math.random()*(max-min)}
  function drift(target,opts){if(!target||target.dataset.vrDrift)return;target.dataset.vrDrift="1";opts=opts||{};target.classList.add("vr-alive");target.style.setProperty("--vr-dur",(opts.dur||rand(46,66)).toFixed(1)+"s");target.style.setProperty("--vr-delay",(-rand(0,30)).toFixed(1)+"s");target.style.setProperty("--vr-from",opts.from||"1.05");target.style.setProperty("--vr-dx",(opts.dx!=null?opts.dx:rand(.8,1.6)).toFixed(2)+"vw");target.style.setProperty("--vr-dy",(opts.dy!=null?opts.dy:rand(-1.2,-.4)).toFixed(2)+"vh")}
  function driftWrap(container,opts){if(!container||container.dataset.vrDrift)return null;var pic=$("picture",container)||container.firstElementChild;if(!pic)return null;var host=el("div","vr-drift-host");container.insertBefore(host,pic);host.appendChild(pic);container.dataset.vrDrift="1";drift(host,opts);return host}
  function atmo(host,kind){if(!host||$(".vr-atmo",host))return;var d=el("div","vr-atmo vr-atmo--"+kind);d.setAttribute("aria-hidden","true");d.innerHTML='<i class="a"></i><i class="b"></i>';host.appendChild(d)}
  function dress(media){if($(".vr-flamehost",media))return;var f=el("div","vr-flamehost");f.setAttribute("aria-hidden","true");f.innerHTML='<span class="vr-flame"></span><span class="vr-pool"></span><span class="vr-wisp wa"></span><span class="vr-wisp wb"></span>';media.appendChild(f)}
  function lightRitual(targets,opts){opts=opts||{};if(typeof IntersectionObserver==="undefined"){targets.forEach(function(m){m.classList.add("vr-canlit","vr-lit");dress(m)});return}var io=new IntersectionObserver(function(entries){var batch=entries.filter(function(e){return e.isIntersecting});if(!batch.length)return;batch.sort(function(a,b){return a.target.getBoundingClientRect().top-b.target.getBoundingClientRect().top});batch.forEach(function(e,i){io.unobserve(e.target);var m=e.target;m.classList.add("vr-canlit");setTimeout(function(){m.classList.add("vr-lit")},(opts.baseDelay||240)+Math.min(i,4)*(opts.step||780))})},{threshold:opts.threshold||.45,rootMargin:"0px 0px -6% 0px"});targets.forEach(function(m){io.observe(m)})}
  lightRitual($all(".pcard-media").concat($all(".result-art")));
  var stageHost=$("#stage");if(stageHost&&typeof MutationObserver!=="undefined")new MutationObserver(function(){var fresh=$all(".result-art",stageHost).filter(function(m){return !m.dataset.vrWatched});fresh.forEach(function(m){m.dataset.vrWatched="1"});if(fresh.length)lightRitual(fresh,{threshold:.3,baseDelay:520})}).observe(stageHost,{childList:true,subtree:true});
  var pdpArt=$("#pdpArt");if(pdpArt){lightRitual([pdpArt],{threshold:.25,baseDelay:420});if(typeof MutationObserver!=="undefined")new MutationObserver(function(){pdpArt.classList.remove("vr-canlit","vr-lit");dress(pdpArt);requestAnimationFrame(function(){pdpArt.classList.add("vr-canlit","vr-lit")})}).observe(pdpArt,{childList:true})}
  var lineIO=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add("vr-lines-in");lineIO.unobserve(e.target)}})},{threshold:.5}):null;
  function unfoldLines(node){if(node.dataset.vrLines)return;node.dataset.vrLines="1";var text=node.textContent.trim();var parts=text.match(/[^.!?…]+[.!?…]+["'\u2019\u201D)]*\s*|[^.!?…]+$/g)||[text];node.textContent="";parts.forEach(function(sentence,i){var outer=el("span","vr-line"),inner=el("span");inner.textContent=sentence.trim();inner.style.setProperty("--li",i);outer.appendChild(inner);node.appendChild(outer);node.appendChild(doc.createTextNode(" "))});node.classList.add("vr-lines-ready");if(lineIO)lineIO.observe(node);else node.classList.add("vr-lines-in")}

  var page=doc.body.dataset.page||"info";
  if(page==="home"){
    var houseLede=$(".intro-grid .lede");if(houseLede)unfoldLines(houseLede);
    var stage=$(".ls-stage");if(stage){drift(stage,{dur:52,dx:1.1,dy:-.5,from:"1.01"});atmo(stage,"kurinji");var switcher=$("#landSwitcher");if(switcher)switcher.addEventListener("click",function(e){var b=e.target.closest("[data-land]");if(!b)return;var oldA=$(".vr-atmo",stage);if(oldA)oldA.className="vr-atmo vr-atmo--"+b.dataset.land})}
    var wb=$(".world-banner .wb-link");if(wb){drift($("picture",wb),{dur:60,dx:1.2,dy:-.5,from:"1.02"});atmo(wb,"dusk")}

    /* ========================================================
       HOME HERO — SEVEN-LAYER KURINJI PARALLAX
       The photograph is now a true depth stack. Each layer has a
       different travel rate. Nothing is moved horizontally by the
       page layout itself; only compositor transforms are updated.
       ======================================================== */
    var hero=$(".hero-layered"), scene=$(".hero-layer-scene",hero);
    if(hero&&scene){
      var layers=[
        [".hero-layer-sky",0.02,0.15,0.00],
        [".hero-layer-clouds",0.12,0.65,0.08],
        [".hero-layer-mountains-far",0.08,0.38,0.025],
        [".hero-layer-mist",0.15,0.50,0.06],
        [".hero-layer-mountains-mid",0.22,0.62,0.04],
        [".hero-layer-mountains-near",0.32,0.82,0.06],
        [".hero-layer-foreground",0.44,1.00,0.10]
      ].map(function(cfg){return {el:$(cfg[0],scene),y:cfg[1],x:cfg[2],s:cfg[3]}}).filter(function(x){return !!x.el});
      var heroBusy=false,heroRaf=0;
      function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
      function renderHero(){
        heroBusy=false;
        var r=hero.getBoundingClientRect(),h=Math.max(hero.offsetHeight||window.innerHeight,1),mobile=window.innerWidth<881;
        var p=clamp(-r.top/h,0,1);
        var scrollTravel=mobile?34:54;
        var xTravel=mobile?20:34;
        layers.forEach(function(item){
          var y=item.y*scrollTravel, x=item.x*xTravel, scale=1.035+item.s*p*(mobile?.020:.035);
          item.el.style.transform="translate3d(calc(-50% + "+(x*p).toFixed(2)+"px),calc(-50% + "+(y*p).toFixed(2)+"px),0) scale("+scale.toFixed(4)+")";
        });
      }
      function requestHero(){if(heroBusy)return;heroBusy=true;heroRaf=window.requestAnimationFrame(renderHero)}
      window.addEventListener("scroll",requestHero,{passive:true});
      window.addEventListener("resize",requestHero,{passive:true});
      window.addEventListener("orientationchange",requestHero,{passive:true});
      window.addEventListener("load",requestHero,{once:true});
      requestHero();
      document.addEventListener("visibilitychange",function(){if(document.hidden&&heroRaf){window.cancelAnimationFrame(heroRaf);heroRaf=0;heroBusy=false}else if(!document.hidden)requestHero()});
    }

    /* ========================================================
       SCROLL-LIT KURINJI SCENE
       ======================================================== */
    var candleScene=$(".virai-candle-scene");
    if(candleScene){
      var unlit=$(".scene-unlit",candleScene),lit=$(".scene-lit",candleScene),glow=$(".scene-candle-glow",candleScene),candleBusy=false,candleRaf=0;
      function sceneProgress(){var r=candleScene.getBoundingClientRect(),vh=Math.max(window.innerHeight||doc.documentElement.clientHeight,1),sh=Math.max(candleScene.offsetHeight||vh,1),start=vh*.80,end=-sh*.20;return clamp((start-r.top)/Math.max(start-end,1),0,1)}
      function renderCandle(){candleBusy=false;var p=sceneProgress(),lp=clamp((p-.18)/.52,0,1);if(unlit)unlit.style.opacity=(1-lp).toFixed(3);if(lit)lit.style.opacity=lp.toFixed(3);if(glow)glow.style.opacity=(lp*.95).toFixed(3)}
      function requestCandle(){if(candleBusy)return;candleBusy=true;candleRaf=window.requestAnimationFrame(renderCandle)}
      window.addEventListener("scroll",requestCandle,{passive:true});window.addEventListener("resize",requestCandle,{passive:true});window.addEventListener("orientationchange",requestCandle,{passive:true});window.addEventListener("load",requestCandle,{once:true});requestCandle();
      document.addEventListener("visibilitychange",function(){if(document.hidden&&candleRaf){window.cancelAnimationFrame(candleRaf);candleRaf=0;candleBusy=false}else if(!document.hidden)requestCandle()})
    }
  }
})();