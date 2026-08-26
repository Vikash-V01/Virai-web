/* VIRAI HOME PARALLAX */
(function(){
"use strict";
if(!window.VIRAI)return;
var d=document,r=d.documentElement;
if((window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)||!r.classList.contains("vr-motion"))return;
var $=function(s,c){return(c||d).querySelector(s)},hero=$(".hero-layered"),scene=hero&&$(".hero-layer-scene",hero);
if(!hero||!scene)return;
var ls=[
[".hero-layer-sky",.035,0,1.075],[".hero-layer-clouds",.16,.34,1.085],[".hero-layer-mountains-far",.28,.18,1.095],[".hero-layer-mist",.42,-.14,1.105],[".hero-layer-mountains-mid",.58,.10,1.115],[".hero-layer-mountains-near",.76,-.08,1.125],[".hero-layer-foreground",.98,.16,1.14]
].map(function(a){return{el:$(a[0],scene,y=0),y:a[1],x:a[2],s:a[3]}}).filter(function(a){return a.el});
var raf=0;
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function draw(){raf=0;var top=(window.scrollY||window.pageYOffset||0),rect=hero.getBoundingClientRect(),heroTop=top+rect.top,h=Math.max(hero.offsetHeight,innerHeight),p=clamp((top-heroTop)/h,0,1),m=innerWidth<881,Y=m?190:340,X=m?34:60;ls.forEach(function(l){var yy=-p*l.y*Y,xx=p*l.x*X;l.el.style.transform="translate3d("+xx.toFixed(1)+"px,"+yy.toFixed(1)+"px,0) scale("+(l.s+p*.045).toFixed(4)+")"})}
function req(){if(!raf)raf=requestAnimationFrame(draw)}
addEventListener("scroll",req,{passive:true});addEventListener("resize",req,{passive:true});addEventListener("load",req,{once:true});req();setTimeout(req,300)
})();
