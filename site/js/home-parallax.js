(function(){
  'use strict';
  if(!document.body || document.body.dataset.page !== 'home') return;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced) return;

  var hero = document.querySelector('.hero');
  var media = document.querySelector('.hero-media');
  var img = document.querySelector('#heroImg');
  var content = document.querySelector('.hero-content');
  if(!hero || !media || !img || !content) return;

  var raf = 0;
  var ticking = false;
  var lastY = -1;

  function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }

  function render(){
    ticking = false;
    var rect = hero.getBoundingClientRect();
    var h = hero.offsetHeight || window.innerHeight;
    var progress = clamp(-rect.top / h, 0, 1);

    /* Natural depth: the photograph moves more slowly than the page. */
    var mediaY = progress * 9;
    var imageY = progress * 5;
    var contentY = progress * -2.5;
    var scale = 1.07 + progress * 0.025;

    media.style.transform = 'translate3d(0,' + mediaY.toFixed(2) + '%,0)';
    img.style.transform = 'translate3d(0,' + imageY.toFixed(2) + '%,0) scale(' + scale.toFixed(4) + ')';
    content.style.transform = 'translate3d(0,' + contentY.toFixed(2) + '%,0)';
  }

  function request(){
    if(ticking) return;
    ticking = true;
    raf = window.requestAnimationFrame(render);
  }

  function onScroll(){
    var y = window.scrollY || window.pageYOffset || 0;
    if(Math.abs(y-lastY) < 1) return;
    lastY = y;
    request();
  }

  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', request, {passive:true});
  window.addEventListener('load', request, {once:true});
  request();
})();
