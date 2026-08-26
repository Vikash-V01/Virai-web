(function(){
  "use strict";

  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (REDUCED) return;

  var hero = document.querySelector(".hero");
  var media = hero && hero.querySelector(".hero-media");
  var img = hero && hero.querySelector(".hero-img");
  if (!hero || !media || !img) return;

  var atmosphere = document.createElement("div");
  atmosphere.className = "hero-atmosphere";
  atmosphere.setAttribute("aria-hidden", "true");
  media.appendChild(atmosphere);

  var target = 0;
  var current = 0;
  var raf = 0;
  var ticking = false;

  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

  function measure(){
    var rect = hero.getBoundingClientRect();
    var h = Math.max(1, rect.height);
    target = clamp(-rect.top / h, 0, 1);
  }

  function render(){
    raf = 0;
    current += (target - current) * 0.09;

    var baseY = current * -12;
    var cloudX = current * 24;
    var cloudY = current * -28;

    img.style.transform = "translate3d(0," + baseY.toFixed(2) + "px,0) scale(1.07)";
    atmosphere.style.transform = "translate3d(" + cloudX.toFixed(2) + "px," + cloudY.toFixed(2) + "px,0)";

    if (Math.abs(target - current) > 0.001) raf = requestAnimationFrame(render);
    else { current = target; }
  }

  function onScroll(){
    measure();
    if (!raf) raf = requestAnimationFrame(render);
  }

  window.addEventListener("scroll", onScroll, { passive:true });
  window.addEventListener("resize", onScroll, { passive:true });
  window.addEventListener("orientationchange", onScroll, { passive:true });

  measure();
  current = target;
  render();
})();
