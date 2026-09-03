(function(){
  "use strict";
  if(typeof VIRAI === "undefined") return;

  var doc = document;
  var root = doc.documentElement;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MOTION = !reduced && typeof IntersectionObserver !== "undefined";
  if(MOTION){ root.classList.add("wx-motion"); }

  function $(s,c){ return (c||doc).querySelector(s); }
  function $all(s,c){ return Array.prototype.slice.call((c||doc).querySelectorAll(s)); }
  function track(ev,payload){
    if(window.viraiTrack) window.viraiTrack(ev,payload||{});
  }
  function clamp01(n){ return n < 0 ? 0 : (n > 1 ? 1 : n); }

  var VESSELS = {
    kurinji:"deep blue vessel", mullai:"forest green vessel", marutham:"terracotta vessel",
    neithal:"coastal blue vessel", palai:"warm sand-toned vessel"
  };

  function chipHTML(p){
    var L = VIRAI.landscapes[p.landscape];
    var attrsA = window.viraiImgAttrs ? window.viraiImgAttrs(p.img.a,"(max-width:880px) 30vw, 340px",false) : ' src="'+p.img.a+'" loading="lazy" decoding="async"';
    var attrsB = window.viraiImgAttrs ? window.viraiImgAttrs(p.img.c,"(max-width:880px) 30vw, 340px",false) : ' src="'+p.img.c+'" loading="lazy" decoding="async"';
    var altA = p.name + " unlit, in a " + (VESSELS[p.landscape] || "stoneware vessel");
    return '' +
    '<article class="wx-chip" style="--tone:' + L.tone + '">' +
      '<a class="chip-ph" href="product.html?id=' + p.id + '" aria-label="View ' + p.name + '">' +
        '<img' + attrsA + ' alt="' + altA + '">' +
        '<img' + attrsB + ' class="ph-b" alt="" aria-hidden="true">' +
        '<span class="wx-wick" aria-hidden="true" style="--wick-x:50%;--wick-y:29%"></span>' +
        '<span class="wx-pool" aria-hidden="true"></span>' +
      '</a>' +
      '<div class="chip-info">' +
        '<p class="chip-land">' + L.name + " \u00B7 " + L.emotion + '</p>' +
        '<h3 class="chip-name">' + p.name + '</h3>' +
        '<p class="chip-sub">' + p.sub + '</p>' +
        '<div class="chip-row">' +
          '<span class="price">' + window.viraiFmt(p.price) + '</span>' +
          '<span class="chip-actions">' +
            '<button class="pcard-add" data-add="' + p.id + '">Add to Bag</button>' +
            '<a class="chip-view" href="product.html?id=' + p.id + '">View</a>' +
          '</span>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  var scenes = [];
  function initScenes(){
    $all(".wx-scene").forEach(function(sec){
      var s = {
        el:sec,
        obj:$(".s-obj",sec),
        p:-1,
        lit:false,
        viewed:false
      };
      var pid = s.obj ? s.obj.getAttribute("data-obj") : null;
      if(pid && window.viraiImgAttrs){
        s.obj.innerHTML = chipHTML(VIRAI.productById(pid));
      }
      scenes.push(s);
    });
  }

  var hero = null, finale = null, vh = 0;
  function measure(){
    vh = window.innerHeight || 800;
  }

  function sceneProgress(sec){
    var r = sec.getBoundingClientRect();
    var track = r.height - vh;
    if(track <= 0) return r.top < 0 ? 1 : 0;
    return clamp01(-r.top / track);
  }

  function lightRitual(s){
    if(s.lit || !MOTION) return;
    s.lit = true;
    s.obj.classList.add("is-wick");
    setTimeout(function(){ s.obj.classList.add("is-lit"); }, 1400);
  }

  function frame(){
    var i, s, p, r;
    for(i = 0; i < scenes.length; i++){
      s = scenes[i];
      r = s.el.getBoundingClientRect();
      if(r.bottom < -vh * 0.2 || r.top > vh * 1.2){
        if(s.el.classList.contains("is-active")) s.el.classList.remove("is-active");
        continue;
      }
      p = sceneProgress(s.el);
      s.el.classList.add("is-active");
      if(Math.abs(p - s.p) > 0.001){
        s.p = p;
        s.el.style.setProperty("--p", p.toFixed(4));
      }
      if(!s.entered && p > 0.025){
        s.entered = true;
        if(s.obj) s.obj.classList.add("is-in");
        var cap = $(".s-cap",s.el);
        if(cap) cap.classList.add("is-in");
      }
      if(p > 0.3) lightRitual(s);
      if(!s.viewed && p > 0.12){
        s.viewed = true;
        track("landscape_view",{ landscape:s.el.getAttribute("data-land"), source:"home_world" });
      }
    }
    if(hero){
      var hy = window.scrollY || window.pageYOffset || 0;
      if(hy < vh * 1.25){
        hero.el.style.setProperty("--hp", clamp01(hy / Math.max(vh,1)).toFixed(4));
        if(!hero.past && hy > vh * 0.85){ hero.past = true; doc.body.classList.add("wx-past"); }
      } else if(!hero.past){
        hero.past = true; doc.body.classList.add("wx-past");
      }
    }
    if(finale){
      var fr = finale.getBoundingClientRect();
      if(fr.bottom > 0 && fr.top < vh){
        var fp = clamp01((vh - fr.top) / (vh + fr.height));
        finale.style.setProperty("--p", fp.toFixed(4));
      }
    }
    ticking = false;
  }

  var ticking = false;
  function onScroll(){
    if(ticking || doc.hidden) return;
    ticking = true;
    requestAnimationFrame(frame);
  }

  function initMotion(){
    var h = $(".wx-hero");
    hero = h ? { el:h, past:false } : null;
    finale = $(".wx-finale");
    measure();
    window.addEventListener("scroll", onScroll, { passive:true });
    window.addEventListener("resize", function(){ measure(); onScroll(); });
    frame();
  }

  function initStaticLit(){
    $all(".s-obj").forEach(function(o){
      o.classList.add("is-in","is-wick","is-lit");
      var cap = o.parentElement && o.parentElement.querySelector(".s-cap");
      if(cap) cap.classList.add("is-in");
    });
  }

  function initSettles(){
    var els = $all(".wx-settle");
    if(!MOTION){ els.forEach(function(e){ e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); }
      });
    },{ threshold:0.22 });
    els.forEach(function(e){ io.observe(e); });
    var objSec = $("#objects");
    if(objSec){
      var oio = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting){ track("collection_view",{ collection:"ainthinai-featured", source:"home_world" }); oio.disconnect(); }
        });
      },{ threshold:0.3 });
      oio.observe(objSec);
    }
  }

  var quiz = null;
  function initQuiz(){
    var form = $("[data-quiz]");
    if(!form) return;
    quiz = { state:{ who:null, feeling:null, family:null }, started:false, done:false };
    var steps = $all(".q-step",form);
    var bars = $all("[data-bar]",form);
    var result = $("[data-result]",form);

    function showStep(n){
      steps.forEach(function(st){
        st.hidden = parseInt(st.getAttribute("data-step"),10) !== n;
      });
      bars.forEach(function(b){
        b.classList.toggle("on", parseInt(b.getAttribute("data-bar"),10) <= n);
      });
      var active = steps.filter(function(st){ return !st.hidden; })[0];
      if(active){
        var firstBtn = $("button",active);
        if(firstBtn) firstBtn.focus({ preventScroll:true });
      }
    }

    function familyLandscape(fam){
      for(var i = 0; i < VIRAI.products.length; i++){
        var p = VIRAI.products[i];
        if(p.type === "Candle" && p.landscape && p.family.indexOf(fam) !== -1) return p;
      }
      return null;
    }

    function recommend(){
      var order = ["kurinji","mullai","marutham","neithal","palai"];
      var best = null, bestScore = -1;
      order.forEach(function(k){
        var p = VIRAI.productById(k + "-candle");
        if(!p) return;
        var score = 0;
        if(VIRAI.landscapes[k].emotion === quiz.state.feeling) score += 2;
        if(p.family.indexOf(quiz.state.family) !== -1) score += 1;
        if(score > bestScore){ bestScore = score; best = p; }
      });
      return best;
    }

    function renderResult(){
      var p = recommend();
      if(!p) return;
      var L = VIRAI.landscapes[p.landscape];
      var famMatch = p.family.indexOf(quiz.state.family) !== -1;
      var alt = familyLandscape(quiz.state.family);
      var why = "You said <em>" + quiz.state.feeling.toLowerCase() + "</em> â€” " + L.name + ". " + L.line;
      if(famMatch){
        why += " Its " + quiz.state.family + " heart agrees with the direction you chose.";
      } else if(alt && alt.landscape !== p.landscape){
        why += " If the " + quiz.state.family + " note matters most, " + VIRAI.landscapes[alt.landscape].name + " is its purest expression.";
      }
      if(quiz.state.who === "other"){
        why += " Chosen as a gift, it ships ready to give â€” add wrapping and a hand-written note on the product page.";
      }
      var attrsA = window.viraiImgAttrs ? window.viraiImgAttrs(p.img.a,"(max-width:640px) 88vw, 300px",false) : ' src="'+p.img.a+'" loading="lazy" decoding="async"';
      var attrsB = window.viraiImgAttrs ? window.viraiImgAttrs(p.img.c,"(max-width:640px) 88vw, 300px",false) : ' src="'+p.img.c+'" loading="lazy" decoding="async"';
      result.innerHTML = '' +
        '<div class="qr-in">' +
          '<div class="qr-art">' +
            '<img' + attrsA + ' alt="' + p.name + ' unlit">' +
            '<img' + attrsB + ' class="ph-b" alt="" aria-hidden="true">' +
          '</div>' +
          '<div class="qr-body" style="--tone:' + L.tone + '">' +
            '<span class="chip-land">' + L.name + " \u00B7 " + L.emotion + '</span>' +
            '<h3 tabindex="-1">' + p.name + '</h3>' +
            '<p class="qr-price">' + window.viraiFmt(p.price) + " \u00B7 " + p.size + '</p>' +
            '<p class="qr-why">' + why + '</p>' +
            '<div class="qr-actions">' +
              '<a class="btn btn-solid" href="product.html?id=' + p.id + '">Explore Product</a>' +
              '<button class="btn btn-line" type="button" data-add="' + p.id + '">Add to Bag</button>' +
            '</div>' +
            '<button class="q-again" type="button" data-again>Start again</button>' +
          '</div>' +
        '</div>';
      result.hidden = false;
      steps.forEach(function(st){ st.hidden = true; });
      setTimeout(function(){ result.classList.add("is-lit"); }, 700);
      var h = $("h3",result);
      if(h) h.focus({ preventScroll:true });
      track("quiz_complete",{ product_id:p.id, feeling:quiz.state.feeling, family:quiz.state.family, who:quiz.state.who, source:"home_world" });
      quiz.done = true;
    }

    form.addEventListener("click", function(e){
      var btn = e.target.closest("[data-pick]");
      if(btn){
        if(!quiz.started){
          quiz.started = true;
          track("quiz_start",{ source:"home_world" });
        }
        quiz.state[btn.getAttribute("data-pick")] = btn.getAttribute("data-val");
        var step = parseInt(btn.closest(".q-step").getAttribute("data-step"),10);
        if(step < 3) showStep(step + 1);
        else renderResult();
        return;
      }
      if(e.target.closest("[data-again]")){
        quiz.state = { who:null, feeling:null, family:null };
        quiz.started = false; quiz.done = false;
        result.hidden = true;
        result.innerHTML = "";
        result.classList.remove("is-lit");
        showStep(1);
        track("quiz_restart",{ source:"home_world" });
      }
    });
  }

  function init(){
    initScenes();
    if(MOTION){
      initMotion();
    } else {
      initStaticLit();
    }
    initSettles();
    initQuiz();
  }

  if(doc.readyState === "loading"){
    doc.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

