(function(){
  "use strict";
  var grid = document.getElementById("grid");
  var emptyEl = document.getElementById("empty");
  var countLabel = document.getElementById("countLabel");
  var clearBtn = document.getElementById("clearBtn");
  var landChips = document.getElementById("landChips");
  var famSel = document.getElementById("famSel");
  var typeSel = document.getElementById("typeSel");

  var state = { collection:"", family:"", type:"" };

  function readURL(){
    var p = new URLSearchParams(location.search);
    state.collection = p.get("collection") || "";
    state.family = (p.get("family") || "").toLowerCase();
    state.type = p.get("type") || "";
  }

  function writeURL(){
    var p = new URLSearchParams();
    if(state.collection) p.set("collection", state.collection);
    if(state.family) p.set("family", state.family);
    if(state.type) p.set("type", state.type);
    var qs = p.toString();
    try{ history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "")); }catch(e){}
  }

  function buildControls(){
    var chips = ['<button class="chip" data-land="">All</button>'];
    VIRAI.landscapeList().forEach(function(l){
      chips.push('<button class="chip" data-land="'+l.key+'">'+l.name+'</button>');
    });
    landChips.innerHTML = chips.join("");

    var famOpts = ['<option value="">All Fragrances</option>'];
    VIRAI.families.forEach(function(f){
      famOpts.push('<option value="'+f+'">'+VIRAI.familyLabels[f]+'</option>');
    });
    famSel.innerHTML = famOpts.join("");

    var typeOpts = ['<option value="">All Formats</option>'];
    ["Candle","Travel Candle","Set"].forEach(function(t){
      typeOpts.push('<option value="'+t+'">'+t+"s</option>");
    });
    typeSel.innerHTML = typeOpts.join("");

    landChips.addEventListener("click", function(e){
      var b = e.target.closest("[data-land]");
      if(!b) return;
      state.collection = b.dataset.land;
      writeURL(); apply(); viraiTrack("fragrance_filter", { dimension:"collection", value:state.collection });
    });
    famSel.addEventListener("change", function(){
      state.family = famSel.value;
      writeURL(); apply();
      if(state.family) viraiTrack("fragrance_filter", { dimension:"family", value:state.family });
    });
    typeSel.addEventListener("change", function(){
      state.type = typeSel.value;
      writeURL(); apply();
      if(state.type) viraiTrack("fragrance_filter", { dimension:"format", value:state.type });
    });
    clearBtn.addEventListener("click", function(){
      state = { collection:"", family:"", type:"" };
      writeURL(); apply();
    });
  }

  function apply(){
    var list = VIRAI.products.filter(function(p){
      if(state.collection && p.landscape !== state.collection) return false;
      if(state.family && p.family.indexOf(state.family) === -1) return false;
      if(state.type && p.type !== state.type) return false;
      return true;
    });

    Array.prototype.forEach.call(landChips.children, function(c){
      c.classList.toggle("on", c.dataset.land === state.collection);
    });
    famSel.value = state.family;
    typeSel.value = state.type;
    famSel.dispatchEvent(new CustomEvent("vr-sync"));
    typeSel.dispatchEvent(new CustomEvent("vr-sync"));

    var active = !!(state.collection || state.family || state.type);
    clearBtn.hidden = !active;

    countLabel.textContent = list.length + (list.length === 1 ? " object" : " objects");
    grid.innerHTML = list.map(window.viraiCard).join("");
    emptyEl.hidden = list.length > 0;
    window.viraiReveal();
  }

  buildControls();
  readURL();
  apply();
  window.addEventListener("virai-catalogue-synced", function(){
    apply();
  });
})();
