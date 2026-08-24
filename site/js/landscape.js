var POEMS = {
  kurinji:"For beginnings. For the hand taken without hesitation.",
  mullai:"For patience. For the door left unlocked, the light left on.",
  marutham:"For the storm that ends in laughter.",
  neithal:"For the miles between two people who are not apart.",
  palai:"For absence, endured beautifully."
};

(function(){
  "use strict";
  var sections = Array.prototype.slice.call(document.querySelectorAll(".stack > section"));

  function markInView(){
    var mid = window.innerHeight * 0.45;
    sections.forEach(function(s){
      var r = s.getBoundingClientRect();
      if(r.top <= mid && r.bottom >= mid){
        s.classList.add("in");
        if(s.dataset.land && !s.dataset.tracked){
          s.dataset.tracked = "1";
          viraiTrack("landscape_view", { landscape:s.dataset.land });
        }
      }
    });
  }
  window.addEventListener("scroll", markInView, { passive:true });
  markInView();

  if(document.body.dataset.page === "collection"){
    viraiTrack("collection_view", { collection:"ainthinai" });
  }

  if(document.body.dataset.page === "landscape"){
    var params = new URLSearchParams(location.search);
    var key = params.get("id") || "kurinji";
    var L = VIRAI.landscapes[key];
    if(!L){ location.replace("landscape.html?id=kurinji"); return; }
    document.title = L.name + " \u00B7 " + L.emotion + " | VIRAI \u2014 Ainthinai";

    var hero = document.getElementById("landHero");
    var media = document.getElementById("lhMedia");
    if(L.atmo){
      media.innerHTML =
        '<picture>'+
          (L.atmo.m ? '<source media="(max-width:880px)" srcset="'+L.atmo.m+'" width="1242" height="2208">' : '')+
          '<img src="'+L.atmo.d+'" alt="'+L.atmo.alt+'" width="1672" height="941" decoding="async" onerror="this.parentElement.style.display=\'none\'">'+
        '</picture><div class="scrim-b"></div>';
      hero.classList.add("has-media");
    } else {
      hero.style.background = "linear-gradient(170deg,"+L.tint+" 0%,#F5F1E8 90%)";
    }
    hero.querySelector(".lh-num").textContent = "Landscape " + L.num + " / 05 \u00B7 Ainthinai";
    document.getElementById("lhTam").textContent = L.tamil;
    document.getElementById("lhName").textContent = L.name;
    document.getElementById("lhEmo").textContent = L.emotion;
    document.getElementById("lhLine").textContent = L.line;
    document.getElementById("lhPoem").textContent = POEMS[key] || "";
    document.documentElement.style.setProperty("--tone", L.tone);

    var grid = document.getElementById("landGrid");
    var list = VIRAI.products.filter(function(p){ return p.landscape === key; });
    var html = list.map(window.viraiCard).join("");
    if(list.length > 0 && list.length < 4){
      var sets = VIRAI.products.filter(function(p){ return p.type === "Set"; }).slice(0, 4 - list.length);
      html += sets.map(window.viraiCard).join("");
    }
    grid.innerHTML = html;

    var order = ["kurinji","mullai","marutham","neithal","palai"];
    var idx = order.indexOf(key);
    var nextKey = order[(idx + 1) % order.length];
    var nextL = VIRAI.landscapes[nextKey];
    var nl = document.getElementById("nextLand");
    nl.href = "landscape.html?id=" + nextKey;
    nl.querySelector(".nl-name").textContent = nextL.name;
    nl.querySelector(".tam").textContent = nextL.tamil;
    nl.querySelector(".nl-emo").textContent = nextL.emotion;

    viraiTrack("collection_view", { collection:"ainthinai", landscape:key });
    window.viraiReveal();
  }
})();
