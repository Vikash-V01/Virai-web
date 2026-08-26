/* VIRAI EXPERIENCE LAYER — robust motion */
(function(){
  "use strict";

  function start(){
    var doc=document;
    var reduced=window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(reduced) return;

    function $(s,c){return (c||doc).querySelector(s)}
    function clamp(n,a,b){return Math.max(a,Math.min(b,n))}

    var hero=$(".hero-layered");
    var scene=hero && $(".hero-layer-scene",hero);
    if(hero && scene){
      var layers=[
        [".hero-layer-sky",0.02,0.00,1.075],
        [".hero-layer-clouds",0.16,0.40,1.085],
        [".hero-layer-mountains-far",0.30,0.20,1.095],
        [".hero-layer-mist",0.46,-0.18,1.105],
        [".hero-layer-mountains-mid",0.64,0.12,1.115],
        [".hero-layer-mountains-near",0.84,-0.10,1.125],
        [".hero-layer-foreground",1.00,0.20,1.14]
      ].map(function(x){return {el:$(x[0],scene),speed:x[1],x:x[2],scale:x[3]}}).filter(function(x){return x.el});

      var raf=0;
      function render(){
        raf=0;
        var scroll=window.pageYOffset||document.documentElement.scrollTop||0;
        var top=hero.getBoundingClientRect().top+scroll;
        var height=Math.max(hero.offsetHeight,window.innerHeight||1);
        var p=clamp((scroll-top)/height,0,1);
        var mobile=window.innerWidth<881;
        var yMax=mobile?240:420;
        var xMax=mobile?45:80;
        layers.forEach(function(l){
          var y=-(p*l.speed*yMax);
          var x=p*l.x*xMax;
          var scale=l.scale+(p*0.055);
          l.el.style.transform="translate3d("+x.toFixed(2)+"px,"+y.toFixed(2)+"px,0) scale("+scale.toFixed(4)+")";
        });
      }
      function request(){if(!raf)raf=requestAnimationFrame(render)}
      window.addEventListener("scroll",request,{passive:true});
      window.addEventListener("resize",request,{passive:true});
      window.addEventListener("orientationchange",request,{passive:true});
      request();
    }

    var candle=$(".virai-candle-scene");
    if(candle){
      var unlit=$(".scene-unlit",candle),lit=$(".scene-lit",candle),glow=$(".scene-candle-glow",candle),raf2=0;
      function candleRender(){
        raf2=0;
        var r=candle.getBoundingClientRect(),vh=window.innerHeight||1,h=Math.max(candle.offsetHeight,vh);
        var p=clamp((vh*.8-r.top)/(vh*.8+h*.2),0,1);
        var lp=clamp((p-.18)/.52,0,1);
        if(unlit)unlit.style.opacity=(1-lp).toFixed(3);
        if(lit)lit.style.opacity=lp.toFixed(3);
        if(glow)glow.style.opacity=(lp*.95).toFixed(3);
      }
      function candleRequest(){if(!raf2)raf2=requestAnimationFrame(candleRender)}
      window.addEventListener("scroll",candleRequest,{passive:true});
      window.addEventListener("resize",candleRequest,{passive:true});
      candleRequest();
    }
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
