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

  // Researched Scent Identity Profiles (Notice: Purely olfactory, material, and spatial — NO collection labeling)
  var SCENT_PROFILES = {
    amber_wood: {
      key: "amber_wood",
      landscapeMap: "palai",
      title: "The Smoked Cedarwood & Ancient Resin Formulation",
      family: "Warm Woody · Balsamic Resinous",
      intensity: "8.5 / 10 · Deep & Enveloping",
      radius: "300 – 500 sq ft (Medium to Grand Spaces)",
      circadian: "Dusk Transition & Late-Night Solitude",
      materials: "Somali Myrrh · Sun-Cured Cedar · Nilgiri Vetiver Root · Ambergris Accord",
      tone: "#8C4A32",
      archetype: "Grounded Solitude & Contemplative Stillness",
      notes: {
        top: ["Sun-Dried Bergamot Peel", "Toasted Cumin Seed", "Dry Pink Pepper"],
        heart: ["Resinous Somali Myrrh", "Smoked Cedar Timber", "Sun-Baked Earth"],
        base: ["Nilgiri Vetiver Root", "Golden Balsam Resin", "Charred Cistus Amber"]
      }
    },
    nocturnal_floral: {
      key: "nocturnal_floral",
      landscapeMap: "mullai",
      title: "The Night-Blooming Sambac Jasmine & Damp Woodland Formulation",
      family: "Nocturnal White Floral · Verdant Botanical",
      intensity: "7.8 / 10 · Creamy & Enveloping",
      radius: "250 – 400 sq ft (Bedrooms & Private Living Sanctuaries)",
      circadian: "Blue-Hour Dusk & Twilight Unwinding",
      materials: "Madurai Sambac Jasmine · Wet Foliage · Blond Sandalwood · Crushed Stems",
      tone: "#3A5A40",
      archetype: "Patient Reassurance & Restorative Calm",
      notes: {
        top: ["Green Crushed Stems", "Dew-Kissed Wild Herbs", "Morning Petits"],
        heart: ["Night-Blooming Madurai Jasmine", "Ylang Nectar", "Creamy White Petals"],
        base: ["Damp Forest Loam", "Soft Indian Sandalwood", "Clean Botanical Musks"]
      }
    },
    highland_herbal: {
      key: "highland_herbal",
      landscapeMap: "kurinji",
      title: "The High-Altitude Nilgiri Lavender & Wild Nectar Formulation",
      family: "Aromatic Herbal · Solar Nectarous",
      intensity: "7.2 / 10 · Luminous & Airy",
      radius: "200 – 350 sq ft (Morning Studies & Creative Workspaces)",
      circadian: "Early Dawn Awakening & Morning Focus",
      materials: "High-Altitude Nilgiri Lavender · Raw Forest Honey · Highland Pine · Crisp Mountain Air",
      tone: "#3D4E70",
      archetype: "Clarity, Renewal & Fresh Beginnings",
      notes: {
        top: ["Crisp Mountain Air Accord", "Nilgiri Highland Lavender", "Wild Mint Leaf"],
        heart: ["Alpine Pine Needles", "Sweet Wildflower Nectar", "White Clary Sage"],
        base: ["Raw Forest Honey", "Sheer Cedarwood", "Clean Amber Dew"]
      }
    },
    marine_saline: {
      key: "marine_saline",
      landscapeMap: "neithal",
      title: "The Mineral Saline & Ocean-Mist Driftwood Formulation",
      family: "Marine Aquatic · Saline Mineral",
      intensity: "6.8 / 10 · Weightless & Expansive",
      radius: "250 – 450 sq ft (Airy Balconies, Drawing Rooms & Libraries)",
      circadian: "Open Twilight & Reflective Evening Stillness",
      materials: "Bay of Bengal Sea Salt · Aquatic Water Lily · Weathered Driftwood · Coastal Ozone",
      tone: "#4E6E82",
      archetype: "Poetic Nostalgia & Expansive Horizon",
      notes: {
        top: ["Grey Sea-Salt Mist", "Coastal Morning Ozone", "Crushed Salt Crystals"],
        heart: ["Aquatic White Water Lily", "Dewy Marine Flora", "Sea-Spray Breeze"],
        base: ["Sun-Bleached Driftwood", "Warm Coastal Sands", "Pale Sheer Amber"]
      }
    },
    terrestrial_earth: {
      key: "terrestrial_earth",
      landscapeMap: "marutham",
      title: "The Red Clay Petrichor & Damp River Loam Formulation",
      family: "Terrestrial Mineral · Humid Petrichor",
      intensity: "8.0 / 10 · Vibrant & Grounding",
      radius: "300 – 500 sq ft (Dining Tables & Sun-Drenched Gathering Spaces)",
      circadian: "Midday Vitality & Evening Reconnection",
      materials: "First Monsoon Baked Clay · Sweet River Reeds · Humid Moss · Virgin Cedar",
      tone: "#8A5A36",
      archetype: "Vital Warmth & Everyday Affection",
      notes: {
        top: ["Electric Summer Ozone", "Sun-Warmed Raindrops", "Green Lotus Leaf"],
        heart: ["Baked Red Clay Petrichor", "Sweet River Reeds", "Humid Meadow Moss"],
        base: ["Damp River Silt", "Tender Cedarwood", "Earthy Wet Vetiver"]
      }
    },
    multi_spectrum: {
      key: "multi_spectrum",
      landscapeMap: "discovery",
      title: "The Complete Five-Portrait Olfactory Flight",
      family: "Curated Pan-Botanical Spectrum",
      intensity: "Adaptive · Five Distinct Densities",
      radius: "Versatile (Adaptive Across the Entire Home)",
      circadian: "Full Circadian Transition (Dawn to Midnight)",
      materials: "Archival Set of 5 Botanical Wax Formulations (Lavender, Jasmine, Clay, Sea Salt, Smoked Resin)",
      tone: "#23201B",
      archetype: "Curious Sensory Exploration Across All Dimensions",
      notes: {
        top: ["Highland Lavender & Sea Salt Mist"],
        heart: ["Madurai Jasmine & River Petrichor"],
        base: ["Sun-Baked Cedarwood & Somali Myrrh"]
      }
    }
  };

  // Researched 5-Step Olfactory Consultation Dimensions
  var QUESTIONS = [
    {
      id: "accord",
      stepNum: 1,
      category: "Botanical Accord",
      title: "Which aromatic botanical family instinctively draws your senses?",
      sub: "Fine home fragrance begins with the raw weight, temperature, and material composition of botanical extracts.",
      options: [
        {
          id: "smoked_resins",
          tag: "Warm Woody & Balsamic",
          h: "Smoky Woods, Ancient Myrrh & Sun-Cured Resin",
          s: "Dry Himalayan cedarwood, golden Somali myrrh, sun-baked earth, and rich vetiver root that build a grounded, meditative sanctuary.",
          profile: "amber_wood",
          weight: 4,
          label: "smoky cedarwood, ancient myrrh, and warm golden resins"
        },
        {
          id: "nocturnal_jasmine",
          tag: "Nocturnal White Floral",
          h: "Night-Blooming Sambac Jasmine & Crushed Green Foliage",
          s: "Freshly broken botanical stems, cool evening dew, and the intoxicating, creamy nectar of Madurai Sambac jasmine blooming at dusk.",
          profile: "nocturnal_floral",
          weight: 4,
          label: "night-blooming jasmine, crushed green stems, and cool evening dew"
        },
        {
          id: "alpine_lavender",
          tag: "Aromatic Herbal & Nectar",
          h: "High-Altitude Nilgiri Lavender, Wild Herbs & Forest Honey",
          s: "A crisp morning breeze sweeping over high mountain slopes, wild lavender blossoms, clean herbal air, and a delicate touch of raw honey.",
          profile: "highland_herbal",
          weight: 4,
          label: "highland lavender, wild herbal mist, and raw forest honey"
        },
        {
          id: "ocean_saline",
          tag: "Marine Saline & Timber",
          h: "Mineral Ocean Salt, Water Lily & Bleached Driftwood",
          s: "Sea-salt spray against weathered rocks, clean marine ozone, watery lilies, and dry driftwood resting on pale shoreline sands.",
          profile: "marine_saline",
          weight: 4,
          label: "mineral sea salt, cool ocean ozone, and weathered driftwood"
        },
        {
          id: "baked_petrichor",
          tag: "Terrestrial Clay & Loam",
          h: "First Monsoon Rain, Wet River Loam & Earthy Petrichor",
          s: "The electric thrill of raindrops hitting hot baked clay, sweet water reeds, humid river meadows, and rich red soil awakened after heat.",
          profile: "terrestrial_earth",
          weight: 4,
          label: "first monsoon petrichor, warm river loam, and wet clay"
        },
        {
          id: "multi_flight",
          tag: "Pan-Aromatic Flight",
          h: "A Curious Dialogue Across Multiple Botanical Terrains",
          s: "An inquisitive palette seeking to experience herbals, nocturnal florals, river earth, marine salt, and deep resins side by side.",
          profile: "multi_spectrum",
          weight: 5,
          label: "an exploratory flight across contrasting botanical families"
        }
      ]
    },
    {
      id: "diffusion",
      stepNum: 2,
      category: "Spatial Scale",
      title: "How should the scent inhabit your living space?",
      sub: "Spatial diffusion physics dictate whether a formulation creates a private contemplative whisper or transforms an expansive room.",
      options: [
        {
          id: "whisper",
          tag: "Intimate Whisper (100–200 sq ft)",
          h: "Subtle, close-range presence for personal contemplation",
          s: "A gentle personal aura designed for a bedside table, reading nook, or meditation altar without crowding the room air.",
          scale: "intimate",
          weight: 3,
          label: "an intimate, personal reading or bedside sanctuary (100–200 sq ft)"
        },
        {
          id: "ambient",
          tag: "Balanced Presence (250–400 sq ft)",
          h: "Enveloping, continuous warmth for bedrooms and studies",
          s: "A steady, balanced atmospheric sillage that softens corners, creates comfort, and fills a private room with unhurried poise.",
          scale: "ambient",
          weight: 3,
          label: "a balanced, comforting bedroom or private study setting (250–400 sq ft)"
        },
        {
          id: "expansive",
          tag: "Radiant Throw (400–600+ sq ft)",
          h: "Expansive and welcoming for drawing rooms and open living",
          s: "A generous throw that effortlessly greets guests at the entryway, moving freely through open floor plans and high-ceilinged spaces.",
          scale: "expansive",
          weight: 3,
          label: "an expansive, open-plan drawing or dining room (400–600+ sq ft)"
        },
        {
          id: "lingering",
          tag: "Deep Base Persistence",
          h: "Slow-smoldering resonance that anchors the home for hours",
          s: "Heavy botanical base notes that settle gently into textiles, book paper, and timber, remaining warmly noticeable long after the flame is extinguished.",
          scale: "lingering",
          weight: 3,
          label: "a lingering, resonant presence that anchors the home for hours"
        }
      ]
    },
    {
      id: "circadian",
      stepNum: 3,
      category: "Circadian Rhythm",
      title: "At what hour of the day do you seek sensory anchoring?",
      sub: "Olfactory perception shifts as body temperature, ambient humidity, and natural light evolve across the circadian cycle.",
      options: [
        {
          id: "dawn",
          tag: "Solar Awakening (06:00 – 09:00)",
          h: "Early morning clarity, cool air, and beginning anew",
          s: "First light, parting curtains to the morning chill, mental focus, and clearing the slate for focused, uncluttered intention.",
          circadianId: "dawn",
          weight: 3,
          affinity: "highland_herbal",
          label: "early morning light and dawn clarity"
        },
        {
          id: "midday",
          tag: "High Daylight (11:00 – 15:00)",
          h: "Sunlit momentum, creative concentration, and vitality",
          s: "Bright solar energy, steady momentum at the creative desk, vibrant air, and keeping the mind alert and grounded.",
          circadianId: "midday",
          weight: 3,
          affinity: "terrestrial_earth",
          label: "sunlit midday momentum and creative focus"
        },
        {
          id: "dusk",
          tag: "The Blue Hour (17:30 – 20:00)",
          h: "The boundary between work and rest; opening windows to evening breezes",
          s: "Letting go of the day’s demands, welcoming someone home, turning on low floor lamps, and shifting into unhurried rest.",
          circadianId: "dusk",
          weight: 3,
          affinity: "nocturnal_floral",
          label: "the blue-hour transition from work to evening rest"
        },
        {
          id: "midnight",
          tag: "Late-Night Solitude (21:30 – Midnight+)",
          h: "Deep quiet, amber lamplight, and solitary introspection",
          s: "Late-night reading, contemplative stillness, notebook journaling, and settling deeply into silence before sleep.",
          circadianId: "midnight",
          weight: 3,
          affinity: "amber_wood",
          label: "deep late-night solitude under amber lamplight"
        }
      ]
    },
    {
      id: "psychology",
      stepNum: 4,
      category: "Olfactory Psychology",
      title: "What psychological state should this vessel cultivate in you?",
      sub: "Olfactory memory bypasses the cognitive brain, triggering direct physiological shifts in nervous system tone.",
      options: [
        {
          id: "fortitude",
          tag: "Grounded Fortitude & Resilience",
          h: "Inner stillness, self-reliance, and standing firm through transitions",
          s: "A steadying weight that calms restless thoughts, cultivating dignified grace and quiet endurance in demanding seasons.",
          target: "amber_wood",
          weight: 4,
          label: "grounded fortitude and quiet inner stillness"
        },
        {
          id: "soothing",
          tag: "Comfort & Restorative Calm",
          h: "Gentle reassurance, trusting the unfolding of time, and soothing anxiety",
          s: "Feeling tenderly held and safe, releasing nervous tension, and resting peacefully in the certainty of what is loved.",
          target: "nocturnal_floral",
          weight: 4,
          label: "gentle reassurance and deep restorative calm"
        },
        {
          id: "clarity",
          tag: "Renewal & Lucid Wonder",
          h: "Fresh perspectives, mental clarity, and welcoming new chapters",
          s: "Clearing stagnant mental fog, rediscovering pure wonder, and greeting life with an open, unburdened heart.",
          target: "highland_herbal",
          weight: 4,
          label: "lucid clarity and the freshness of new beginnings"
        },
        {
          id: "nostalgia",
          tag: "Poetic Memory & Distance Bridged",
          h: "Reflective longing, honoring memory, and gazing at wide horizons",
          s: "Holding absent loved ones close across geography, finding sweetness in tender memories, and looking out upon vast waters.",
          target: "marine_saline",
          weight: 4,
          label: "poetic longing and bridging distance through memory"
        },
        {
          id: "warmth",
          tag: "Vital Affection & Joyful Reunion",
          h: "Spirited warmth, celebratory reunions, and everyday passion",
          s: "Lively conversations around a table, laughter following misunderstandings, shared food, and the warmth of affectionate company.",
          target: "terrestrial_earth",
          weight: 4,
          label: "spirited warmth and joyful reconnection"
        }
      ]
    },
    {
      id: "ritual_format",
      stepNum: 5,
      category: "Vessel Ritual",
      title: "Which physical vessel format best fits your daily rhythm?",
      sub: "Choose the scale and cadence through which you wish to experience your prescribed formulation.",
      options: [
        {
          id: "full_size",
          tag: "The Atelier Pillar",
          h: "Full-Size 240g Atelier Vessel (≈ 50 Hours Burn Time)",
          s: "A permanent tactile anchor crafted from heavyweight ceramic, designed as the primary olfactory centerpiece for your home.",
          format: "Candle",
          weight: 2,
          label: "a full-size 240g heavyweight atelier vessel for daily domestic ritual"
        },
        {
          id: "travel",
          tag: "The Nomad Companion",
          h: "Travel 90g Compact Vessel (≈ 25 Hours Burn Time)",
          s: "A lightweight, secure tin vessel designed to bring familiar olfactory comfort to hotel suites, weekend retreats, and private desks.",
          format: "Travel Candle",
          weight: 2,
          label: "a 90g portable travel vessel to carry familiar comfort anywhere"
        },
        {
          id: "discovery",
          tag: "The Archival Library",
          h: "The Five-Vessel Discovery Flight Set",
          s: "Experience all five formulations side-by-side in miniature pours, rotating fragrances according to room, weather, and changing mood.",
          format: "Set",
          weight: 4,
          label: "the curated 5-vessel discovery flight to explore all botanical portraits"
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

  function calculatePrescription(){
    var scores = {
      amber_wood: 0,
      nocturnal_floral: 0,
      highland_herbal: 0,
      marine_saline: 0,
      terrestrial_earth: 0
    };

    var explicitDiscovery = false;

    // Q1 Accord
    var q1 = answers[0];
    if(q1){
      if(q1.profile === "multi_spectrum"){
        explicitDiscovery = true;
      } else if(scores[q1.profile] !== undefined){
        scores[q1.profile] += (q1.weight || 4);
      }
    }

    // Q3 Circadian Affinity
    var q3 = answers[2];
    if(q3 && q3.affinity && scores[q3.affinity] !== undefined){
      scores[q3.affinity] += (q3.weight || 3);
    }

    // Q4 Emotional target
    var q4 = answers[3];
    if(q4 && q4.target && scores[q4.target] !== undefined){
      scores[q4.target] += (q4.weight || 4);
    }

    // Q5 Ritual format
    var q5 = answers[4];
    var requestedFormat = (q5 && q5.format) ? q5.format : "Candle";
    if(q5 && q5.id === "discovery"){
      explicitDiscovery = true;
    }

    // Sort scores
    var sorted = Object.keys(scores).map(function(k){
      return { profile: k, score: scores[k] };
    }).sort(function(a,b){ return b.score - a.score; });

    var topProfileKey = sorted[0].profile;
    var runnerUpProfileKey = sorted[1] ? sorted[1].profile : null;

    var isDiscovery = explicitDiscovery || (sorted[0].score - sorted[1].score <= 1);
    var chosenProfile = SCENT_PROFILES[isDiscovery ? "multi_spectrum" : topProfileKey];
    var runnerUpProfile = SCENT_PROFILES[runnerUpProfileKey] || SCENT_PROFILES.amber_wood;

    return {
      profile: chosenProfile,
      runnerUp: runnerUpProfile,
      isDiscovery: isDiscovery,
      format: requestedFormat,
      scores: scores
    };
  }

  function renderResult(){
    updateProgress();
    backBtn.hidden = true;
    restartBtn.hidden = false;

    var diagnosis = calculatePrescription();
    var prof = diagnosis.profile;
    var landscapeKey = prof.landscapeMap;

    // Find primary prescribed product in catalogue
    var primaryProd = null;
    var altProd = null;

    if(diagnosis.isDiscovery){
      primaryProd = VIRAI.products.find(function(p){ return p.id === "discovery-set"; });
      altProd = VIRAI.products.find(function(p){ return p.id === diagnosis.runnerUp.landscapeMap + "-candle"; });
    } else if(diagnosis.format === "Travel Candle"){
      primaryProd = VIRAI.products.find(function(p){ return p.id === landscapeKey + "-travel"; });
      altProd = VIRAI.products.find(function(p){ return p.id === landscapeKey + "-candle"; });
    } else {
      primaryProd = VIRAI.products.find(function(p){ return p.id === landscapeKey + "-candle"; });
      altProd = VIRAI.products.find(function(p){ return p.id === landscapeKey + "-travel"; }) ||
                VIRAI.products.find(function(p){ return p.id === "discovery-set"; });
    }

    if(!primaryProd){
      primaryProd = VIRAI.products[0];
    }

    // Extract user choices for synthesis
    var accordText = answers[0] ? answers[0].label : "calibrated botanical essences";
    var scaleText = answers[1] ? answers[1].label : "your primary living space";
    var circadianText = answers[2] ? answers[2].label : "the quiet transition of evening";
    var intentText = answers[3] ? answers[3].label : "restorative contemplation";
    var formatText = answers[4] ? answers[4].label : "an atelier poured candle";

    // Formulator's Diagnostic Rationale
    var rationaleText = "";
    if(diagnosis.isDiscovery){
      rationaleText =
        "Your olfactory consultation reveals an exploratory sensory profile — desiring <strong>" + accordText + "</strong> " +
        "while seeking <strong>" + intentText + "</strong> across varying living cadences. Rather than confining your home " +
        "to a single aromatic chord, <strong>The Curated Five-Portrait Discovery Flight</strong> provides the full archival spectrum. " +
        "Formulated to transition effortlessly across your circadian day, from high-altitude morning lavender to nocturnal jasmine and deep evening cedarwood.";
    } else {
      rationaleText =
        "Prescribed specifically for <strong>" + scaleText + "</strong>, calibrated to activate during <strong>" + circadianText + "</strong>. " +
        "Your sensory instinct gravitated instinctively toward <strong>" + accordText + "</strong>, seeking to cultivate <strong>" + intentText + "</strong>. " +
        "Our formulation balances these botanical absolutes within a clean-burning soy and coconut wax matrix, allowing the delicate heart notes to unfold unhurriedly without sensory exhaustion.";
    }

    // Olfactory Notes Pyramid
    var notesHtml = "";
    var displayNotes = prof.notes;
    if(primaryProd.notes && primaryProd.notes.top && primaryProd.notes.top[0] !== "—"){
      displayNotes = primaryProd.notes;
    }

    notesHtml =
      '<div class="result-notes-grid">' +
        '<div class="r-note-col">' +
          '<h4>Top Accord (First 15 Mins)</h4>' +
          '<p>' + displayNotes.top.join(" · ") + '</p>' +
        '</div>' +
        '<div class="r-note-col">' +
          '<h4>Heart Accord (Core Bloom)</h4>' +
          '<p>' + displayNotes.heart.join(" · ") + '</p>' +
        '</div>' +
        '<div class="r-note-col">' +
          '<h4>Base Sillage (Enduring Hold)</h4>' +
          '<p>' + displayNotes.base.join(" · ") + '</p>' +
        '</div>' +
      '</div>';

    // Pre-booking Banner if prescribed product is prebooking
    var prebookBadgeHtml = "";
    if(primaryProd.status === "prebooking"){
      prebookBadgeHtml =
        '<div class="pdp-prebook-banner" style="margin:1.2rem 0;border-radius:3px">' +
          '<div class="prebook-head">' +
            '<span class="prebook-pill"><span class="prebook-dot"></span>Pre-booking Batch Release</span>' +
            '<span class="prebook-release-badge">&#128340; ' + (primaryProd.prebookRelease || "Late September Release") + '</span>' +
          '</div>' +
          '<p class="prebook-desc">' + (primaryProd.prebookNote || "Slow-curing batch in studio. Pre-booking reserves your vessel from this limited pour.") + '</p>' +
        '</div>';
    }

    var imgHtml = (window.viraiPimg ? window.viraiPimg(primaryProd, "a") : '');

    stage.innerHTML =
      '<article class="result-card reveal in" style="--tone:' + prof.tone + '">' +
        '<div class="result-art">' + imgHtml + '</div>' +
        '<div class="result-body">' +
          '<div class="result-header">' +
            '<div>' +
              '<p class="result-meta">Olfactory Prescription · ' + prof.family + '</p>' +
              '<h2 class="result-title">' + prof.title + '</h2>' +
              '<p class="result-subline">Prescribed Vessel: <strong>' + primaryProd.name + '</strong> · ' + window.viraiFmt(primaryProd.price) + ' · ' + primaryProd.size + (primaryProd.burn ? ' · ' + primaryProd.burn : '') + '</p>' +
            '</div>' +
            '<div style="text-align:right">' +
              '<span class="status-pill in_stock" style="font-size:.7rem;letter-spacing:.08em">' + prof.archetype + '</span>' +
            '</div>' +
          '</div>' +

          prebookBadgeHtml +

          // Researched Diagnostic Matrix
          '<div class="diagnostic-matrix">' +
            '<div class="diagnostic-cell">' +
              '<span class="diagnostic-label">Olfactory Family</span>' +
              '<span class="diagnostic-val">' + prof.family + '</span>' +
            '</div>' +
            '<div class="diagnostic-cell">' +
              '<span class="diagnostic-label">Diffusion Throw</span>' +
              '<span class="diagnostic-val">' + prof.intensity + '</span>' +
            '</div>' +
            '<div class="diagnostic-cell">' +
              '<span class="diagnostic-label">Spatial Radius</span>' +
              '<span class="diagnostic-val">' + prof.radius + '</span>' +
            '</div>' +
            '<div class="diagnostic-cell">' +
              '<span class="diagnostic-label">Circadian Window</span>' +
              '<span class="diagnostic-val">' + prof.circadian + '</span>' +
            '</div>' +
          '</div>' +

          '<div class="rationale">' +
            '<p style="margin:0 0 .5rem;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--mineral);font-weight:600">Master Formulator\'s Prescription Synthesis</p>' +
            '<p style="margin:0;line-height:1.65">' + rationaleText + '</p>' +
          '</div>' +

          notesHtml +

          // Burn Ritual & Care Guide
          '<div class="burn-ritual-box">' +
            '<h4 class="burn-ritual-title">Atelier Burning Ritual &amp; Maintenance</h4>' +
            '<div class="burn-ritual-list">' +
              '<div class="burn-ritual-item">' +
                '<strong>Memory Melt Pool</strong>' +
                'On your first lighting, allow wax to melt fully to all edges (2–3 hours) to prevent tunnelling.' +
              '</div>' +
              '<div class="burn-ritual-item">' +
                '<strong>Cotton Wick Trim</strong>' +
                'Keep wick trimmed to 5mm before every lighting to preserve an unhurried, soot-free flame.' +
              '</div>' +
              '<div class="burn-ritual-item">' +
                '<strong>Clean Extinction</strong>' +
                'Use a metal snuffer or gently dip the wick into the molten pool to avoid smoke afterglow.' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="result-actions">' +
            '<button type="button" class="btn btn-solid" data-add-result="' + primaryProd.id + '">' + (primaryProd.status === "prebooking" ? "Pre-book Prescribed Vessel" : "Add Prescribed Vessel to Bag") + '</button>' +
            '<a class="btn btn-line" href="product.html?id=' + primaryProd.id + '">View Vessel Craft Profile</a>' +
            '<button type="button" class="btn btn-ghost" id="shareProfileBtn">Share Consultation Summary</button>' +
          '</div>' +

          (altProd ?
            '<div class="result-alt-box">' +
              '<div>' +
                '<span style="font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--mineral)">Recommended Ritual Companion:</span>' +
                '<p style="font-family:var(--serif);font-size:1.05rem;margin-top:.2rem">' + altProd.name + ' · ' + window.viraiFmt(altProd.price) + ' (' + altProd.size + ')</p>' +
              '</div>' +
              '<a class="link-u" href="product.html?id=' + altProd.id + '">Explore Companion →</a>' +
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
        var shareText = "VIRAI Olfactory Consultation Prescription:\n" +
          prof.title + " (" + prof.family + ")\n" +
          "Prescribed Vessel: " + primaryProd.name + " (" + primaryProd.size + ")\n" +
          "Diffusion Radius: " + prof.radius + "\n" +
          "Circadian Resonance: " + prof.circadian + "\n" +
          "Discover your formulation at " + window.location.href;

        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(shareText).then(function(){
            if(typeof window.viraiToast === "function"){
              window.viraiToast("Olfactory consultation prescription copied to clipboard");
            } else {
              shareBtn.textContent = "Copied to Clipboard";
              setTimeout(function(){ shareBtn.textContent = "Share Consultation Summary"; }, 2000);
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
        profile: prof.key,
        isDiscovery: diagnosis.isDiscovery
      });
    }

    // Scroll to result smoothly
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
