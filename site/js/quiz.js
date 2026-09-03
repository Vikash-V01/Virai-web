(function(){
  "use strict";
  var stage = document.getElementById("stage");
  var backBtn = document.getElementById("backBtn");
  var restartBtn = document.getElementById("restartBtn");
  var bars = ["p1","p2","p3"].map(function(id){ return document.getElementById(id); });
  var step = -1;
  var answers = {};
  var started = false;

  var Q_INTENT = [
    { v:"self",   h:"For myself",       s:"A ritual for my own space" },
    { v:"gift",   h:"For someone else", s:"A gift carrying a message" }
  ];
  var Q_FEELING = Object.keys(VIRAI.landscapes).map(function(k){
    var l = VIRAI.landscapes[k];
    return { v:k, h:l.name + " \u00B7 " + l.emotion, s:l.line };
  });
  var Q_FAMILY = VIRAI.families.map(function(f){
    var desc = { floral:"Petals, jasmine, bloom", woody:"Woods, amber, smoke", earthy:"Rain, soil, grain", fresh:"Salt, mist, air" }[f];
    return { v:f, h:VIRAI.familyLabels[f], s:desc };
  });

  function progress(){
    bars.forEach(function(b,i){ b.classList.toggle("on", i <= step); });
  }

  function markStart(){
    if(!started){ started = true; viraiTrack("quiz_start", {}); }
  }

  function renderQuestion(){
    backBtn.hidden = step === 0;
    restartBtn.hidden = true;
    var q;
    if(step === 0) q = { t:"Who is this for?", opts:Q_INTENT, key:"intent" };
    else if(step === 1) q = { t:"What feeling is closest?", opts:Q_FEELING, key:"feeling" };
    else q = { t:"And which scents draw you?", opts:Q_FAMILY, key:"family" };
    stage.innerHTML =
      '<h2 class="q-title reveal in">'+q.t+'</h2>' +
      '<div class="opt-list">' +
        q.opts.map(function(o){
          return '<button class="opt" data-v="'+o.v+'"><span class="opt-h">'+o.h+'</span><br><span class="opt-s">'+o.s+'</span></button>';
        }).join("") +
      '</div>';
    Array.prototype.forEach.call(stage.querySelectorAll(".opt"), function(b){
      b.addEventListener("click", function(){
        markStart();
        answers[q.key] = b.dataset.v;
        step += 1;
        if(step < 3){ progress(); renderQuestion(); } else { result(); }
      });
    });
  }

  function score(){
    return VIRAI.products.map(function(p){
      var s = 0;
      if(p.landscape === answers.feeling) s += 4;
      if(p.family.indexOf(answers.family) !== -1) s += 2;
      if(answers.intent === "gift"){
        if(p.type === "Set") s += 2;
        if(p.type === "Candle") s += 1;
        if(p.type === "Travel Candle") s -= 1;
      } else {
        if(p.type === "Travel Candle") s -= 2;
        if(p.type === "Candle") s += 1;
      }
      return { p:p, s:s };
    }).sort(function(a,b){ return b.s - a.s; });
  }

  function result(){
    progress();
    backBtn.hidden = true;
    restartBtn.hidden = false;
    var ranked = score();
    var top = ranked[0].p;
    var alt = ranked.find(function(r){ return r.p.id !== top.id && r.s > 0; });
    alt = alt ? alt.p : null;
    var L = top.landscape ? VIRAI.landscapes[top.landscape] : null;

    var why;
    if(L){
      why = "You chose " + L.name.toLowerCase() + " \u2014 " + L.emotion.toLowerCase() +
            ". In Ainthinai that feeling lives in this landscape, and its fragrance follows it: " +
            top.shortScent.charAt(0).toLowerCase() + top.shortScent.slice(1);
    } else {
      why = "Your answers point across several landscapes at once \u2014 the set lets you find your own.";
    }

    stage.innerHTML =
      '<article class="result-card reveal in">' +
        '<div class="art result-art">' + (window.viraiPimg ? window.viraiPimg(top,"a") : '') + '</div>' +
        '<div class="result-body">' +
          '<p class="kicker">Your landscape</p>' +
          '<h2 style="font-size:clamp(1.6rem,3vw,2.2rem)">'+top.name+'</h2>' +
          '<p style="margin-top:.3rem;color:var(--mineral);font-size:.9rem">'+window.viraiFmt(top.price)+' \u00B7 '+top.size+'</p>' +
          '<div class="rationale" style="--tone:'+(L?L.tone:"#8B7F6C")+'">'+why+'</div>' +
          '<div style="display:flex;gap:.8rem;flex-wrap:wrap">' +
            '<button class="btn btn-solid" data-add="'+top.id+'">Add to Bag</button>' +
            '<a class="btn btn-line" href="product.html?id='+top.id+'">View Product</a>' +
            (alt ? '<a class="btn btn-ghost" href="product.html?id='+alt.id+'">Also consider: '+alt.name.split("\u00B7")[0].trim()+'</a>' : '') +
          '</div>' +
          '<p class="small" style="margin-top:1.6rem">Not quite? Start again — there is no wrong answer here.</p>' +
        '</div>' +
      '</article>';

    Array.prototype.forEach.call(stage.querySelectorAll("[data-add]"), function(b){
      b.addEventListener("click", function(){ window.viraiAddToBag(b.dataset.add, {}); });
    });
    viraiTrack("quiz_complete", {
      intent:answers.intent, feeling:answers.feeling, family:answers.family,
      recommended:top.id
    });
  }

  backBtn.addEventListener("click", function(){
    step -= 1;
    if(step < 0){ step = 0; }
    progress(); renderQuestion();
  });
  restartBtn.addEventListener("click", function(){
    answers = {}; step = 0;
    started = false;
    renderQuestion(); progress();
    viraiTrack("quiz_restart", {});
  });

  step = 0;
  progress();
  renderQuestion();
})();
