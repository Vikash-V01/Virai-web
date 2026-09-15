(function(){
  "use strict";

  var stage = document.getElementById("stage");
  var backBtn = document.getElementById("backBtn");
  var restartBtn = document.getElementById("restartBtn");
  var quizFill = document.getElementById("quizFill");
  var stepLabel = document.getElementById("stepLabel");
  var stepPercent = document.getElementById("stepPercent");
  var quizIntro = document.getElementById("quizIntro");
  var progressBar = document.getElementById("progressBar");

  var step = 0;
  var answers = [];
  var started = false;

  // Researched Fragrance Consultation Dimensions
  // Notice: Strict rule — NO internal collection names (Kurinji, Mullai, Marutham, Neithal, Palai) in question or option copy!
  var QUESTIONS = [
    {
      id: "setting",
      category: "The Setting",
      title: "Where will this fragrance live and breathe?",
      sub: "Every scent creates an unspoken architecture within a room.",
      options: [
        {
          id: "dawn_desk",
          tag: "Dawn Clarity",
          h: "A quiet morning sanctuary or creative desk",
          s: "Crisp early light, uncluttered thoughts, and cool air greeting the waking day.",
          target: "kurinji",
          weight: 4,
          label: "a morning sanctuary or creative desk"
        },
        {
          id: "dusk_bedroom",
          tag: "Dusk Calm",
          h: "An evening retreat or bedside reading corner",
          s: "Soft lamplight, turning pages, and unwinding gently as twilight settles into night.",
          target: "mullai",
          weight: 4,
          label: "an evening retreat for quiet reading and unwinding"
        },
        {
          id: "living_table",
          tag: "Warm Gathering",
          h: "A lively dining table or sunlit living space",
          s: "Shared meals, warm conversation, laughter, and open doors welcoming loved ones.",
          target: "marutham",
          weight: 4,
          label: "a shared, sun-drenched space of warmth and conversation"
        },
        {
          id: "balcony_breeze",
          tag: "Reflective Horizon",
          h: "A contemplative study or balcony catching the wind",
          s: "Vast open skies, reflective stillness, and music drifting softly through twilight.",
          target: "neithal",
          weight: 4,
          label: "a contemplative study open to the evening wind"
        },
        {
          id: "solitary_focus",
          tag: "Grounded Stillness",
          h: "An intimate solitary sanctuary or late-night focus space",
          s: "Deep concentration, grounded stillness, and warm amber light in absolute quiet.",
          target: "palai",
          weight: 4,
          label: "an intimate sanctuary of quiet focus and late-night stillness"
        }
      ]
    },
    {
      id: "atmosphere",
      category: "The Atmosphere",
      title: "Which moment in nature instinctively grounds you?",
      sub: "In classical poetics, natural weather and terrain hold the architecture of human memory.",
      options: [
        {
          id: "mountain_mist",
          tag: "Cool Mist & High Blooms",
          h: "Mountain mist over high, dew-kissed slopes",
          s: "Cool alpine breeze carrying wild lavender, distant pine needles, and waking honeyed blossoms.",
          target: "kurinji",
          weight: 4,
          label: "high mountain slopes kissed by cool morning mist"
        },
        {
          id: "woodland_rain",
          tag: "Forest Jasmine & Dew",
          h: "Dense green woodland after an evening drizzle",
          s: "Crushed foliage, evening shadows, and night-blooming jasmine releasing its nectar into cool air.",
          target: "mullai",
          weight: 4,
          label: "green woodlands releasing night jasmine into post-rain air"
        },
        {
          id: "first_monsoon",
          tag: "Petrichor & River Earth",
          h: "First monsoon shower awakening fertile river earth",
          s: "The electric thrill of petrichor on warm clay, sweet river reeds, and water meadows after storm.",
          target: "marutham",
          weight: 4,
          label: "first rain breaking over warm river-country earth"
        },
        {
          id: "ocean_dusk",
          tag: "Ocean Salt & Driftwood",
          h: "The grey-blue coastline under a twilight sky",
          s: "Sea-salt spray against weathered rocks, cool tide mist, and driftwood resting on wet sands.",
          target: "neithal",
          weight: 4,
          label: "a salt-swept coastline stretching out into twilight mist"
        },
        {
          id: "arid_noon",
          tag: "Smoked Wood & Sunlit Resin",
          h: "Sun-baked wilderness and ancient resinous timber",
          s: "Golden noon heat on dry grass, smoked cedarwood, desert myrrh, and warm stillness that lingers.",
          target: "palai",
          weight: 4,
          label: "sun-baked timber and ancient resinous earth"
        }
      ]
    },
    {
      id: "olfactive",
      category: "Olfactory Texture",
      title: "Which fragrance texture do you crave in the air?",
      sub: "Fragrance is felt as weight, temperature, and physical presence against the senses.",
      options: [
        {
          id: "luminous_honey",
          tag: "Luminous & Airy",
          h: "Luminous, airy, and gently honeyed",
          s: "Weightless wild mountain florals, crisp herbal lavender, and a golden touch of raw forest honey.",
          target: "kurinji",
          weight: 4,
          label: "luminous mountain air and sweet wild honey"
        },
        {
          id: "verdant_night",
          tag: "Verdant & Nocturnal",
          h: "Creamy, green, and soothingly nocturnal",
          s: "Crushed stems, wet evening dew, and heady night jasmine anchored by comforting blond woods.",
          target: "mullai",
          weight: 4,
          label: "verdant crushed stems and creamy night-blooming jasmine"
        },
        {
          id: "earth_ozone",
          tag: "Moist Loam & Petrichor",
          h: "Moist, petrichor-rich, and grounding",
          s: "Freshly rained-on red soil, vibrant ozone, water reeds, and sweet tender cedar.",
          target: "marutham",
          weight: 4,
          label: "warm petrichor, moist river loam, and electric ozone"
        },
        {
          id: "saline_marine",
          tag: "Saline & Mineral",
          h: "Saline, mineral, and aquatic-crisp",
          s: "Grey ocean salt, sea foam, pale aquatic lilies, and clean driftwood mist.",
          target: "neithal",
          weight: 4,
          label: "crisp sea-salt minerals, pale water lily, and driftwood"
        },
        {
          id: "smoked_amber",
          tag: "Smoky & Resinous",
          h: "Smoky, dry, and deeply resinous",
          s: "Sun-cured amber, warm myrrh, toasted spices, and rich earthy vetiver roots.",
          target: "palai",
          weight: 4,
          label: "smoked cedar, desert myrrh, and warm sun-cured amber"
        }
      ]
    },
    {
      id: "intention",
      category: "Emotional Intention",
      title: "What unspoken feeling should this vessel carry?",
      sub: "In Virai, fragrance is an emotional transmission — spoken without words.",
      options: [
        {
          id: "union",
          tag: "Union & Dawns",
          h: "A fresh beginning, devotion, and the tenderness of union",
          s: "The quiet wonder of two lives meeting, or stepping into a new chapter with an open heart.",
          target: "kurinji",
          weight: 5,
          label: "the tenderness of union and fresh beginnings"
        },
        {
          id: "waiting",
          tag: "Faithfulness & Calm",
          h: "Quiet patience, reassurance, and peaceful expectation",
          s: "Faithfulness held without anxiety — trusting that what is cherished is always held close.",
          target: "mullai",
          weight: 5,
          label: "patient faithfulness and gentle calm"
        },
        {
          id: "reconciliation",
          tag: "Lively Affection",
          h: "Lively affection, everyday passion, and sweet reconciliation",
          s: "Love in its honest, living rhythm — the laughter and warmth that follows a storm of words.",
          target: "marutham",
          weight: 5,
          label: "lively affection and warm reconciliation"
        },
        {
          id: "longing",
          tag: "Tender Longing",
          h: "Tender nostalgia, poetic longing, and distance bridged",
          s: "Missing someone specific across time or geography, holding their presence gently in memory.",
          target: "neithal",
          weight: 5,
          label: "poetic longing and holding distant memory close"
        },
        {
          id: "fortitude",
          tag: "Dignified Fortitude",
          h: "Dignity in absence, inner stillness, and solitary endurance",
          s: "Grounded self-reliance and grace during demanding passages, standing firm in quiet strength.",
          target: "palai",
          weight: 5,
          label: "dignified fortitude and quiet inner stillness"
        },
        {
          id: "discovery",
          tag: "Curious Explorer",
          h: "Curiosity across all five feelings and landscapes",
          s: "An open heart desiring to travel through the entire emotional spectrum — from mountain dawn to salt coast.",
          target: "discovery",
          weight: 6,
          label: "an exploratory journey across the whole spectrum of feeling"
        }
      ]
    }
  ];

  function updateProgress(){
    if(step < QUESTIONS.length){
      if(progressBar) progressBar.style.display = "";
      var pct = Math.round(((step + 1) / QUESTIONS.length) * 100);
      if(quizFill) quizFill.style.width = pct + "%";
      if(stepLabel) stepLabel.textContent = "Step " + (step + 1) + " of " + QUESTIONS.length + " · " + QUESTIONS[step].category;
      if(stepPercent) stepPercent.textContent = pct + "%";
      if(quizIntro) quizIntro.style.display = "";
    } else {
      if(progressBar) progressBar.style.display = "none";
      if(quizIntro) quizIntro.style.display = "none";
    }
  }

  function markStart(){
    if(!started){
      started = true;
      if(typeof viraiTrack === "function") viraiTrack("quiz_start", {});
    }
  }

  function renderQuestion(){
    backBtn.hidden = (step === 0);
    restartBtn.hidden = (step === 0);
    updateProgress();

    var q = QUESTIONS[step];
    var html =
      '<div class="q-header reveal in">' +
        '<h2 class="q-title">' + q.title + '</h2>' +
        '<p class="q-sub">' + q.sub + '</p>' +
      '</div>' +
      '<div class="opt-list reveal in">';

    q.options.forEach(function(opt){
      html +=
        '<button type="button" class="opt" data-opt-id="' + opt.id + '" aria-label="' + opt.h + '">' +
          '<div class="opt-top">' +
            '<span class="opt-h">' + opt.h + '</span>' +
            '<span class="opt-tag">' + opt.tag + '</span>' +
          '</div>' +
          '<span class="opt-s">' + opt.s + '</span>' +
        '</button>';
    });

    html += '</div>';
    stage.innerHTML = html;

    var optButtons = stage.querySelectorAll(".opt");
    Array.prototype.forEach.call(optButtons, function(btn){
      btn.addEventListener("click", function(){
        markStart();
        var selectedId = btn.dataset.optId;
        var selectedOpt = q.options.find(function(o){ return o.id === selectedId; });
        answers[step] = selectedOpt;

        step += 1;
        if(step < QUESTIONS.length){
          renderQuestion();
          var shell = document.getElementById("quizShell");
          if(shell){
            var head = document.querySelector(".site-head");
            var off = head ? head.offsetHeight + 24 : 80;
            var pos = shell.getBoundingClientRect().top + window.pageYOffset - off;
            window.scrollTo({ top: Math.max(0, pos), behavior: "smooth" });
          }
        } else {
          renderResult();
        }
      });
    });
  }

  function calculateScores(){
    var scores = { kurinji: 0, mullai: 0, marutham: 0, neithal: 0, palai: 0 };
    var discoveryVotes = 0;

    answers.forEach(function(ans){
      if(!ans) return;
      if(ans.target === "discovery"){
        discoveryVotes += 1;
      } else if(scores[ans.target] !== undefined){
        scores[ans.target] += (ans.weight || 3);
      }
    });

    var sorted = Object.keys(scores).map(function(k){
      return { landscape: k, score: scores[k] };
    }).sort(function(a,b){ return b.score - a.score; });

    var topLandscape = sorted[0].landscape;
    var runnerUp = sorted[1] ? sorted[1].landscape : null;

    // If discovery was picked or scores are closely divided
    var isDiscovery = (discoveryVotes > 0) || (sorted[0].score - sorted[1].score <= 1);

    return {
      topLandscape: topLandscape,
      runnerUp: runnerUp,
      isDiscovery: isDiscovery,
      scores: scores
    };
  }

  function renderResult(){
    updateProgress();
    backBtn.hidden = true;
    restartBtn.hidden = false;

    var diagnosis = calculateScores();
    var L = VIRAI.landscapes[diagnosis.topLandscape];

    // Find the primary recommended product
    var primaryProd = null;
    var altProd = null;

    if(diagnosis.isDiscovery){
      primaryProd = VIRAI.products.find(function(p){ return p.id === "discovery-set"; });
      altProd = VIRAI.products.find(function(p){ return p.id === diagnosis.topLandscape + "-candle"; });
    } else {
      primaryProd = VIRAI.products.find(function(p){ return p.id === diagnosis.topLandscape + "-candle"; });
      // Suggest travel size or Discovery Set as alternative
      altProd = VIRAI.products.find(function(p){ return p.id === diagnosis.topLandscape + "-travel"; }) ||
                VIRAI.products.find(function(p){ return p.id === "discovery-set"; });
    }

    if(!primaryProd){
      primaryProd = VIRAI.products[0];
    }

    // Compose personalized rationale using answers
    var spaceAns = answers[0] ? answers[0].label : "your personal sanctuary";
    var atmoAns = answers[1] ? answers[1].label : "natural stillness";
    var scentAns = answers[2] ? answers[2].label : "considered olfactory notes";
    var intentAns = answers[3] ? answers[3].label : "an unspoken ritual";

    var rationaleText = "";
    if(diagnosis.isDiscovery){
      rationaleText =
        "Your instincts gravitate across multiple emotional terrains — desiring " + scentAns +
        " while seeking " + intentAns + ". Rather than committing to a single room note, the " +
        "<strong>Ainthinai Discovery Set</strong> allows you to journey through all five classical Tamil landscapes, " +
        "beginning with <strong>" + L.name + " (" + L.tamil + ")</strong> as your primary emotional anchor.";
    } else {
      rationaleText =
        "Chosen for <strong>" + spaceAns + "</strong>, where your senses instinctively seek <strong>" + atmoAns + "</strong>. " +
        "This vessel satisfies your craving for <strong>" + scentAns + "</strong>, while holding <strong>" + intentAns + "</strong>. " +
        "In Sangam poetics, this exact union of time, place, and inner feeling lives in <strong>" + L.name + " (" + L.tamil + ")</strong>.";
    }

    // Format Notes
    var notesHtml = "";
    if(primaryProd.notes && primaryProd.notes.top && primaryProd.notes.top[0] !== "—"){
      notesHtml =
        '<div class="result-notes-grid">' +
          '<div class="r-note-col">' +
            '<h4>Top Notes</h4>' +
            '<p>' + primaryProd.notes.top.join(" · ") + '</p>' +
          '</div>' +
          '<div class="r-note-col">' +
            '<h4>Heart Notes</h4>' +
            '<p>' + primaryProd.notes.heart.join(" · ") + '</p>' +
          '</div>' +
          '<div class="r-note-col">' +
            '<h4>Base Notes</h4>' +
            '<p>' + primaryProd.notes.base.join(" · ") + '</p>' +
          '</div>' +
        '</div>';
    }

    var imgHtml = (window.viraiPimg ? window.viraiPimg(primaryProd, "a") : '');

    stage.innerHTML =
      '<article class="result-card reveal in" style="--tone:' + (L ? L.tone : '#56648C') + '">' +
        '<div class="result-art">' + imgHtml + '</div>' +
        '<div class="result-body">' +
          '<div class="result-header">' +
            '<div>' +
              '<p class="result-meta">Your Scent Prescription · ' + (L ? L.name.toUpperCase() : 'AINTHINAI') + '</p>' +
              '<h2 class="result-title">' + primaryProd.name + '</h2>' +
              '<p class="result-subline">' + window.viraiFmt(primaryProd.price) + ' · ' + primaryProd.size + ' · ' + (primaryProd.burn || '') + '</p>' +
            '</div>' +
            (L ? '<div class="result-tam-badge" title="' + L.name + '">' + L.tamil + '</div>' : '') +
          '</div>' +

          '<div class="rationale">' +
            '<p style="margin:0">' + rationaleText + '</p>' +
          '</div>' +

          notesHtml +

          '<div class="result-actions">' +
            '<button type="button" class="btn btn-solid" data-add-result="' + primaryProd.id + '">Add to Bag</button>' +
            '<a class="btn btn-line" href="product.html?id=' + primaryProd.id + '">View Fragrance Details</a>' +
            '<button type="button" class="btn btn-ghost" id="shareProfileBtn">Share Prescription</button>' +
          '</div>' +

          (altProd ?
            '<div class="result-alt-box">' +
              '<div>' +
                '<span style="font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--mineral)">Also Resonant with your Profile:</span>' +
                '<p style="font-family:var(--serif);font-size:1.05rem;margin-top:.2rem">' + altProd.name + ' · ' + window.viraiFmt(altProd.price) + '</p>' +
              '</div>' +
              '<a class="link-u" href="product.html?id=' + altProd.id + '">Explore Vessel →</a>' +
            '</div>'
          : '') +
        '</div>' +
      '</article>';

    // Bind Add to bag
    var addBtn = stage.querySelector("[data-add-result]");
    if(addBtn){
      addBtn.addEventListener("click", function(){
        if(typeof window.viraiAddToBag === "function"){
          window.viraiAddToBag(primaryProd.id, {});
        }
      });
    }

    // Bind Share / Copy
    var shareBtn = document.getElementById("shareProfileBtn");
    if(shareBtn){
      shareBtn.addEventListener("click", function(){
        var shareText = "My Virai Fragrance Prescription: " + primaryProd.name + " (" + (L ? L.name + " · " + L.emotion : "Ainthinai") + "). Discover yours at " + window.location.href;
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(shareText).then(function(){
            if(typeof window.viraiToast === "function"){
              window.viraiToast("Prescription copied to clipboard");
            } else {
              shareBtn.textContent = "Copied!";
              setTimeout(function(){ shareBtn.textContent = "Share Prescription"; }, 2000);
            }
          });
        } else if(typeof window.viraiToast === "function"){
          window.viraiToast(shareText);
        }
      });
    }

    // Track completion
    if(typeof viraiTrack === "function"){
      viraiTrack("quiz_complete", {
        recommended: primaryProd.id,
        landscape: diagnosis.topLandscape,
        isDiscovery: diagnosis.isDiscovery
      });
    }

    // Scroll to result nicely
    var shell = document.getElementById("quizShell");
    if(shell){
      var head = document.querySelector(".site-head");
      var off = head ? head.offsetHeight + 20 : 80;
      var pos = shell.getBoundingClientRect().top + window.pageYOffset - off;
      window.scrollTo({ top: Math.max(0, pos), behavior: "smooth" });
    }
  }

  // Navigation handlers
  backBtn.addEventListener("click", function(){
    if(step > 0){
      step -= 1;
      renderQuestion();
    }
  });

  restartBtn.addEventListener("click", function(){
    step = 0;
    answers = [];
    started = false;
    renderQuestion();
    if(typeof viraiTrack === "function") viraiTrack("quiz_restart", {});
  });

  // Init
  renderQuestion();
})();
