(function(){
  "use strict";
  var input = document.getElementById("q");
  var grid = document.getElementById("grid");
  var emptyEl = document.getElementById("empty");
  var countEl = document.getElementById("resCount");
  var tracked = {};

  function haystack(p){
    var parts = [p.name, p.sub, p.shortScent, p.longScent, p.type];
    if(p.landscape){
      var l = VIRAI.landscapes[p.landscape];
      parts.push(l.name, l.emotion, l.tamil);
    }
    Object.keys(p.notes).forEach(function(k){ parts.push(p.notes[k].join(" ")); });
    return parts.join(" ").toLowerCase();
  }

  function run(){
    var q = input.value.trim().toLowerCase();
    if(q.length === 0){
      grid.innerHTML = ""; countEl.textContent = "";
      emptyEl.hidden = true;
      return;
    }
    if(!tracked[q]){ tracked[q] = 1; viraiTrack("search", { query:q }); }
    var words = q.split(/\s+/);
    var list = VIRAI.products.filter(function(p){
      var hay = haystack(p);
      return words.every(function(w){ return hay.indexOf(w) !== -1; });
    });
    grid.innerHTML = list.map(window.viraiCard).join("");
    countEl.textContent = list.length + (list.length === 1 ? " result" : " results");
    emptyEl.hidden = list.length > 0;
    window.viraiReveal();
  }

  input.addEventListener("input", run);
  var initial = new URLSearchParams(location.search).get("q");
  if(initial){ input.value = initial; run(); }
})();
