/**
 * VIRAI — "FIND YOUR VIRAI" FRAGRANCE DISCOVERY QUIZ
 * 
 * Architecture: Reusable Product Recommendation Engine
 * Separated Modules:
 *  A. QUIZ QUESTIONS
 *  B. ANSWER SCORING
 *  C. PRODUCT PROFILES
 *  D. RECOMMENDATION ENGINE
 *  E. RESULT PRESENTATION
 *  F. ANALYTICS
 */

(function(){
  "use strict";

  /* ============================================================
     F. ANALYTICS
     ============================================================ */
  var Analytics = {
    track: function(eventName, payload) {
      var data = Object.assign({ event: eventName, ts: Date.now() }, payload || {});
      if (typeof window.viraiTrack === "function") {
        window.viraiTrack(eventName, payload || {});
      } else {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(data);
        try { console.debug("[virai-quiz]", eventName, payload); } catch(e){}
      }
    },
    quizStarted: function() {
      this.track("quiz_started");
    },
    questionAnswered: function(questionId, answerId) {
      this.track("quiz_question_answered", {
        question_id: questionId,
        answer_id: answerId
      });
    },
    quizCompleted: function(recommendedProductId, scoreSummary) {
      this.track("quiz_completed", {
        recommended_product_id: recommendedProductId,
        score_summary: scoreSummary
      });
    },
    resultViewed: function(recommendedProductId) {
      this.track("quiz_result_viewed", {
        recommended_product_id: recommendedProductId
      });
    },
    productClicked: function(productId) {
      this.track("quiz_product_clicked", {
        product_id: productId
      });
    },
    addToCartClicked: function(productId) {
      this.track("quiz_add_to_cart", {
        product_id: productId
      });
    },
    quizRestarted: function() {
      this.track("quiz_restarted");
    }
  };

  /* ============================================================
     A. QUIZ QUESTIONS & B. ANSWER SCORING
     ============================================================ */
  var QUIZ_QUESTIONS = [
    {
      id: "q1",
      step: "01 / 05",
      question: "What kind of moment are you drawn to?",
      answers: [
        {
          id: "q1_a",
          text: "A beginning that feels full of possibility.",
          primary_profile: "kurinji",
          score_weight: 1,
          scoring: { kurinji: 1 }
        },
        {
          id: "q1_b",
          text: "A quiet moment worth waiting for.",
          primary_profile: "mullai",
          score_weight: 1,
          scoring: { mullai: 1 }
        },
        {
          id: "q1_c",
          text: "A little tension between two people who know each other too well.",
          primary_profile: "marutham",
          score_weight: 1,
          scoring: { marutham: 1 }
        },
        {
          id: "q1_d",
          text: "A memory of someone or somewhere far away.",
          primary_profile: "neithal",
          score_weight: 1,
          scoring: { neithal: 1 }
        },
        {
          id: "q1_e",
          text: "A moment of letting go and moving forward.",
          primary_profile: "palai",
          score_weight: 1,
          scoring: { palai: 1 }
        }
      ]
    },
    {
      id: "q2",
      step: "02 / 05",
      question: "If this candle were lighting a room, what would you want the room to feel like?",
      answers: [
        {
          id: "q2_a",
          text: "Warm, intimate and alive.",
          primary_profile: "kurinji",
          score_weight: 1,
          scoring: { kurinji: 1 }
        },
        {
          id: "q2_b",
          text: "Quiet, comforting and unhurried.",
          primary_profile: "mullai",
          score_weight: 1,
          scoring: { mullai: 1 }
        },
        {
          id: "q2_c",
          text: "Playful, expressive and a little unpredictable.",
          primary_profile: "marutham",
          score_weight: 1,
          scoring: { marutham: 1 }
        },
        {
          id: "q2_d",
          text: "Dreamy, distant and nostalgic.",
          primary_profile: "neithal",
          score_weight: 1,
          scoring: { neithal: 1 }
        },
        {
          id: "q2_e",
          text: "Still, contemplative and deeply personal.",
          primary_profile: "palai",
          score_weight: 1,
          scoring: { palai: 1 }
        }
      ]
    },
    {
      id: "q3",
      step: "03 / 05",
      question: "What are you really looking for today?",
      answers: [
        {
          id: "q3_a",
          text: "Something to celebrate together.",
          primary_profile: "kurinji",
          score_weight: 1,
          scoring: { kurinji: 1 }
        },
        {
          id: "q3_b",
          text: "Something that makes staying in feel beautiful.",
          primary_profile: "mullai",
          score_weight: 1,
          scoring: { mullai: 1 }
        },
        {
          id: "q3_c",
          text: "Something for a relationship that has a little spark.",
          primary_profile: "marutham",
          score_weight: 1,
          scoring: { marutham: 1 }
        },
        {
          id: "q3_d",
          text: "Something that brings someone to mind.",
          primary_profile: "neithal",
          score_weight: 1,
          scoring: { neithal: 1 }
        },
        {
          id: "q3_e",
          text: "Something to mark a change.",
          primary_profile: "palai",
          score_weight: 1,
          scoring: { palai: 1 }
        }
      ]
    },
    {
      id: "q4",
      step: "04 / 05",
      question: "Which feeling feels most familiar?",
      answers: [
        {
          id: "q4_a",
          text: "Togetherness",
          primary_profile: "kurinji",
          score_weight: 1,
          scoring: { kurinji: 1 }
        },
        {
          id: "q4_b",
          text: "Anticipation",
          primary_profile: "mullai",
          score_weight: 1,
          scoring: { mullai: 1 }
        },
        {
          id: "q4_c",
          text: "Chemistry",
          primary_profile: "marutham",
          score_weight: 1,
          scoring: { marutham: 1 }
        },
        {
          id: "q4_d",
          text: "Nostalgia",
          primary_profile: "neithal",
          score_weight: 1,
          scoring: { neithal: 1 }
        },
        {
          id: "q4_e",
          text: "Distance",
          primary_profile: "palai",
          score_weight: 1,
          scoring: { palai: 1 }
        }
      ]
    },
    {
      id: "q5",
      step: "05 / 05",
      question: "Choose the scene you'd rather step into.",
      answers: [
        {
          id: "q5_a",
          text: "Two people finally finding their way to each other.",
          primary_profile: "kurinji",
          score_weight: 1,
          scoring: { kurinji: 1 }
        },
        {
          id: "q5_b",
          text: "A quiet evening where nothing needs to happen yet.",
          primary_profile: "mullai",
          score_weight: 1,
          scoring: { mullai: 1 }
        },
        {
          id: "q5_c",
          text: "Two people laughing after an argument they both know wasn't really an argument.",
          primary_profile: "marutham",
          score_weight: 1,
          scoring: { marutham: 1 }
        },
        {
          id: "q5_d",
          text: "The last light of evening, with someone on your mind.",
          primary_profile: "neithal",
          score_weight: 1,
          scoring: { neithal: 1 }
        },
        {
          id: "q5_e",
          text: "A long road behind you, and somewhere new ahead.",
          primary_profile: "palai",
          score_weight: 1,
          scoring: { palai: 1 }
        }
      ]
    }
  ];

  /* ============================================================
     C. PRODUCT PROFILES (COLLECTION AGNOSTIC)
     ============================================================ */
  var PRODUCT_PROFILES = [
    {
      id: "kurinji-candle",
      key: "kurinji",
      collection: "ainthinai",
      name: "Kurinji",
      tamil: "குறிஞ்சி",
      fullName: "Kurinji · Union Candle",
      emotionalTerritory: "union",
      territoryLabel: "Union",
      title: "For moments that bring people closer.",
      description: "A fragrance for togetherness, intimacy and beginnings worth celebrating.",
      productUrl: "product.html?id=kurinji-candle",
      image: "img/1a.webp",
      imageAlt: "Virai Kurinji candle in handcrafted deep blue ceramic vessel",
      price: 2850,
      size: "240 g · ≈ 50 hours burn"
    },
    {
      id: "mullai-candle",
      key: "mullai",
      collection: "ainthinai",
      name: "Mullai",
      tamil: "முல்லை",
      fullName: "Mullai · Waiting Candle",
      emotionalTerritory: "waiting",
      territoryLabel: "Waiting",
      title: "For moments worth waiting for.",
      description: "A fragrance for quiet evenings, comfort and the beauty of unhurried moments.",
      productUrl: "product.html?id=mullai-candle",
      image: "img/2a.webp",
      imageAlt: "Virai Mullai candle in handcrafted forest green ceramic vessel",
      price: 2850,
      size: "240 g · ≈ 50 hours burn"
    },
    {
      id: "marutham-candle",
      key: "marutham",
      collection: "ainthinai",
      name: "Marutham",
      tamil: "மருதம்",
      fullName: "Marutham · Playful Conflict Candle",
      emotionalTerritory: "playful_conflict",
      territoryLabel: "Playful Conflict",
      title: "For the spark between two people.",
      description: "A fragrance for chemistry, playfulness and the beautiful tension of being known.",
      productUrl: "product.html?id=marutham-candle",
      image: "img/3a.webp",
      imageAlt: "Virai Marutham candle in handcrafted terracotta ceramic vessel",
      price: 2850,
      size: "240 g · ≈ 50 hours burn"
    },
    {
      id: "neithal-candle",
      key: "neithal",
      collection: "ainthinai",
      name: "Neithal",
      tamil: "நெய்தல்",
      fullName: "Neithal · Longing Candle",
      emotionalTerritory: "longing",
      territoryLabel: "Longing",
      title: "For the moments that linger.",
      description: "A fragrance shaped around longing, memory and the quiet distance between people.",
      productUrl: "product.html?id=neithal-candle",
      image: "img/4a.webp",
      imageAlt: "Virai Neithal candle in handcrafted coastal blue ceramic vessel",
      price: 2850,
      size: "240 g · ≈ 50 hours burn"
    },
    {
      id: "palai-candle",
      key: "palai",
      collection: "ainthinai",
      name: "Palai",
      tamil: "பாலை",
      fullName: "Palai · Separation Candle",
      emotionalTerritory: "separation",
      territoryLabel: "Separation",
      title: "For moments of change.",
      description: "A fragrance for solitude, transition and the quiet courage of moving forward.",
      productUrl: "product.html?id=palai-candle",
      image: "img/5a.webp",
      imageAlt: "Virai Palai candle in handcrafted warm sand-toned ceramic vessel",
      price: 2850,
      size: "240 g · ≈ 50 hours burn"
    }
  ];

  /* Helper to enrich profile with authoritative live catalogue data */
  function getEnrichedProduct(profile) {
    var copy = Object.assign({}, profile);
    if (window.VIRAI && typeof window.VIRAI.productById === "function") {
      var liveProd = window.VIRAI.productById(profile.id);
      if (liveProd) {
        copy.liveProd = liveProd;
        copy.price = liveProd.price || copy.price;
        copy.status = liveProd.status || "";
        if (liveProd.notes) {
          copy.notes = liveProd.notes;
        }
      }
    }
    return copy;
  }

  /* ============================================================
     D. RECOMMENDATION ENGINE
     ============================================================ */
  function recommendProducts(customerSelections, productCatalogue) {
    var scores = {};
    productCatalogue.forEach(function(p){
      scores[p.key] = 0;
    });

    customerSelections.forEach(function(selection){
      if(selection && selection.scoring){
        Object.keys(selection.scoring).forEach(function(key){
          scores[key] = (scores[key] || 0) + (selection.scoring[key] || 0);
        });
      }
    });

    var topKey = productCatalogue[0].key;
    var topScore = -1;

    productCatalogue.forEach(function(p){
      var score = scores[p.key] || 0;
      if(score > topScore){
        topScore = score;
        topKey = p.key;
      } else if(score === topScore && score > 0){
        // Deterministic tie-breaker: check answer from Q5 (last question)
        var q5Sel = customerSelections[4];
        if(q5Sel && q5Sel.scoring && q5Sel.scoring[p.key]){
          topKey = p.key;
        } else {
          // Secondary tie-breaker: check answer from Q1
          var q1Sel = customerSelections[0];
          if(q1Sel && q1Sel.scoring && q1Sel.scoring[p.key]){
            topKey = p.key;
          }
        }
      }
    });

    var primaryProfile = productCatalogue.find(function(p){
      return p.key === topKey;
    }) || productCatalogue[0];

    return {
      primary: getEnrichedProduct(primaryProfile),
      scores: scores,
      topKey: topKey
    };
  }

  /* ============================================================
     E. RESULT PRESENTATION & VIEW CONTROLLER
     ============================================================ */
  var state = {
    view: "intro", // "intro" | "question" | "result"
    currentStep: 0, // 0 to 4
    selections: [null, null, null, null, null]
  };

  var appContainer = document.getElementById("quizApp");
  if (!appContainer) return;

  function render() {
    if (state.view === "intro") {
      renderIntro();
    } else if (state.view === "question") {
      renderQuestion();
    } else if (state.view === "result") {
      renderResult();
    }
  }

  /* 1. Entry Section */
  function renderIntro() {
    appContainer.innerHTML = 
      '<section class="quiz-entry" aria-labelledby="quiz-entry-title">' +
        '<span class="quiz-entry-eyebrow">FIND YOUR VIRAI</span>' +
        '<h1 id="quiz-entry-title" class="quiz-entry-h">Some fragrances find you.<br>Others feel like they already know you.</h1>' +
        '<p class="quiz-entry-p">Answer five simple questions and discover the fragrance that fits your moment.</p>' +
        '<div class="quiz-entry-action">' +
          '<button type="button" class="btn btn-solid" id="quizBeginBtn">BEGIN</button>' +
        '</div>' +
      '</section>';

    var beginBtn = document.getElementById("quizBeginBtn");
    if (beginBtn) {
      beginBtn.addEventListener("click", function(){
        state.view = "question";
        state.currentStep = 0;
        Analytics.quizStarted();
        render();
        window.scrollTo({ top: appContainer.offsetTop - 60, behavior: "smooth" });
      });
    }
  }

  /* 2. Question Steps (01/05 through 05/05) */
  function renderQuestion() {
    var qIndex = state.currentStep;
    var q = QUIZ_QUESTIONS[qIndex];
    var selectedAnswer = state.selections[qIndex];
    var isLast = qIndex === QUIZ_QUESTIONS.length - 1;
    var progressPercent = Math.round(((qIndex + 1) / QUIZ_QUESTIONS.length) * 100);

    var optionsHtml = q.answers.map(function(ans, i){
      var isChecked = selectedAnswer && selectedAnswer.id === ans.id;
      return (
        '<button type="button" class="quiz-opt-btn' + (isChecked ? ' is-selected' : '') + '" ' +
          'role="radio" ' +
          'aria-checked="' + (isChecked ? 'true' : 'false') + '" ' +
          'data-answer-index="' + i + '">' +
          '<span class="quiz-opt-indicator" aria-hidden="true">' +
            '<span class="quiz-opt-dot"></span>' +
          '</span>' +
          '<span class="quiz-opt-text">' + ans.text + '</span>' +
        '</button>'
      );
    }).join("");

    appContainer.innerHTML = 
      '<section class="quiz-step-view" aria-labelledby="q-title-' + q.id + '">' +
        '<div class="quiz-step-top">' +
          '<span class="quiz-step-count">' + q.step + '</span>' +
        '</div>' +
        '<div class="quiz-progress-track" aria-hidden="true">' +
          '<div class="quiz-progress-fill" style="width:' + progressPercent + '%"></div>' +
        '</div>' +
        '<h2 id="q-title-' + q.id + '" class="quiz-q-title">' + q.question + '</h2>' +
        '<div class="quiz-options" role="radiogroup" aria-label="' + q.question + '">' +
          optionsHtml +
        '</div>' +
        '<div class="quiz-nav-row">' +
          (qIndex > 0 ? 
            '<button type="button" class="quiz-nav-back" id="quizBackBtn">← Back</button>' : 
            '<span></span>') +
          '<button type="button" class="btn btn-solid quiz-nav-continue" id="quizContinueBtn" ' + 
            (!selectedAnswer ? 'disabled' : '') + '>' +
            (isLast ? 'DISCOVER MY VIRAI' : 'CONTINUE') +
          '</button>' +
        '</div>' +
      '</section>';

    // Bind Answer Selection
    var optionBtns = appContainer.querySelectorAll(".quiz-opt-btn");
    optionBtns.forEach(function(btn){
      btn.addEventListener("click", function(){
        var ansIndex = parseInt(btn.getAttribute("data-answer-index"), 10);
        var chosen = q.answers[ansIndex];
        state.selections[qIndex] = chosen;
        Analytics.questionAnswered(q.id, chosen.id);

        // Update UI state
        optionBtns.forEach(function(b){
          b.classList.remove("is-selected");
          b.setAttribute("aria-checked", "false");
        });
        btn.classList.add("is-selected");
        btn.setAttribute("aria-checked", "true");

        var continueBtn = document.getElementById("quizContinueBtn");
        if (continueBtn) {
          continueBtn.disabled = false;
        }
      });
    });

    // Keyboard support for arrow keys within radiogroup
    var optionBtnArray = Array.prototype.slice.call(optionBtns);
    optionBtnArray.forEach(function(btn, idx){
      btn.addEventListener("keydown", function(e){
        var nextIdx = -1;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          nextIdx = (idx + 1) % optionBtnArray.length;
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          nextIdx = (idx - 1 + optionBtnArray.length) % optionBtnArray.length;
        }
        if (nextIdx !== -1) {
          optionBtnArray[nextIdx].focus();
          optionBtnArray[nextIdx].click();
        }
      });
    });

    // Back Button
    var backBtn = document.getElementById("quizBackBtn");
    if (backBtn) {
      backBtn.addEventListener("click", function(){
        if (state.currentStep > 0) {
          state.currentStep--;
          render();
          window.scrollTo({ top: appContainer.offsetTop - 60, behavior: "smooth" });
        }
      });
    }

    // Continue / Discover Button
    var continueBtn = document.getElementById("quizContinueBtn");
    if (continueBtn) {
      continueBtn.addEventListener("click", function(){
        if (!state.selections[qIndex]) return;

        if (isLast) {
          // Calculate result
          state.view = "result";
          var recommendation = recommendProducts(state.selections, PRODUCT_PROFILES);
          Analytics.quizCompleted(recommendation.primary.id, recommendation.scores);
          render();
          window.scrollTo({ top: appContainer.offsetTop - 60, behavior: "smooth" });
        } else {
          state.currentStep++;
          render();
          window.scrollTo({ top: appContainer.offsetTop - 60, behavior: "smooth" });
        }
      });
    }
  }

  /* 3. Result Section */
  function renderResult() {
    var rec = recommendProducts(state.selections, PRODUCT_PROFILES);
    var product = rec.primary;
    Analytics.resultViewed(product.id);

    var fmtPrice = (window.VIRAI && typeof window.VIRAI.fmt === "function") ?
      window.VIRAI.fmt(product.price) :
      ("₹" + new Intl.NumberFormat("en-IN").format(product.price));

    var isPrebook = product.status === "prebooking";
    var actionLabel = isPrebook ? "Pre-book · " + fmtPrice : "Add to Bag · " + fmtPrice;

    // Notes Breakdown from product data
    var notesHtml = "";
    if (product.notes) {
      var topNotes = (product.notes.top || []).join(" · ");
      var heartNotes = (product.notes.heart || []).join(" · ");
      var baseNotes = (product.notes.base || []).join(" · ");

      notesHtml = 
        '<div class="quiz-notes-title">Fragrance Notes</div>' +
        '<div class="quiz-notes-tiers">' +
          (topNotes ? '<div class="quiz-note-tier"><strong>Top</strong> ' + topNotes + '</div>' : '') +
          (heartNotes ? '<div class="quiz-note-tier"><strong>Heart</strong> ' + heartNotes + '</div>' : '') +
          (baseNotes ? '<div class="quiz-note-tier"><strong>Base</strong> ' + baseNotes + '</div>' : '') +
        '</div>';
    }

    appContainer.innerHTML = 
      '<article class="quiz-result" aria-labelledby="result-product-name">' +
        '<header class="quiz-result-header">' +
          '<span class="quiz-result-eyebrow">YOUR VIRAI</span>' +
          '<div class="quiz-result-name-row">' +
            '<h2 id="result-product-name" class="quiz-result-name">' + product.name + '</h2>' +
            (product.tamil ? '<span class="quiz-result-tamil" aria-hidden="true">' + product.tamil + '</span>' : '') +
          '</div>' +
          '<div class="quiz-result-line">' + product.title + '</div>' +
          '<p class="quiz-result-desc">' + product.description + '</p>' +
        '</header>' +

        '<div class="quiz-result-showcase">' +
          '<div class="quiz-result-img-col">' +
            '<img src="' + product.image + '" alt="' + product.imageAlt + '" loading="eager" width="600" height="600">' +
          '</div>' +
          '<div class="quiz-result-details">' +
            notesHtml +
            '<div class="quiz-specs-row">' +
              '<span><strong>' + fmtPrice + '</strong></span>' +
              '<span>' + product.size + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<footer class="quiz-result-footer">' +
          '<div class="quiz-result-actions">' +
            '<button type="button" class="btn btn-solid" id="quizAddToBagBtn">' + actionLabel + '</button>' +
            '<a href="' + product.productUrl + '" class="btn btn-line" id="quizViewProdBtn">View Fragrance</a>' +
          '</div>' +
          '<div class="quiz-explore-alt">' +
            '<div class="quiz-explore-alt-left">' +
              '<span>Not quite you?</span>' +
              '<a href="shop.html" class="link-u" id="quizExploreAllLink">Explore All Fragrances</a>' +
            '</div>' +
            '<button type="button" class="quiz-restart-btn link-u" id="quizRestartBtn">Start Again</button>' +
          '</div>' +
        '</footer>' +
      '</article>';

    // Bind Result Actions
    var addToBagBtn = document.getElementById("quizAddToBagBtn");
    if (addToBagBtn) {
      addToBagBtn.addEventListener("click", function(){
        Analytics.addToCartClicked(product.id);
        if (typeof window.viraiAddToBag === "function") {
          window.viraiAddToBag(product.id);
        } else {
          window.location.href = product.productUrl;
        }
      });
    }

    var viewProdBtn = document.getElementById("quizViewProdBtn");
    if (viewProdBtn) {
      viewProdBtn.addEventListener("click", function(){
        Analytics.productClicked(product.id);
      });
    }

    var exploreLink = document.getElementById("quizExploreAllLink");
    if (exploreLink) {
      exploreLink.addEventListener("click", function(){
        Analytics.track("quiz_explore_all_clicked");
      });
    }

    var restartBtn = document.getElementById("quizRestartBtn");
    if (restartBtn) {
      restartBtn.addEventListener("click", function(){
        state.view = "intro";
        state.currentStep = 0;
        state.selections = [null, null, null, null, null];
        Analytics.quizRestarted();
        render();
        window.scrollTo({ top: appContainer.offsetTop - 60, behavior: "smooth" });
      });
    }
  }

  // Initial Boot
  render();

})();
