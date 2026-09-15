(function(){
  "use strict";

  var trackForm = document.getElementById("trackForm");
  var trackInput = document.getElementById("trackInput");
  var trackBtn = document.getElementById("trackBtn");
  var trackError = document.getElementById("trackError");
  var trackLoader = document.getElementById("trackLoader");
  var trackResults = document.getElementById("trackResults");

  function escapeHtml(str){
    if(!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showLoading(show){
    if(trackLoader) trackLoader.style.display = show ? "block" : "none";
    if(trackBtn){
      trackBtn.disabled = show;
      trackBtn.textContent = show ? "Locating Parcel…" : "Track Parcel";
    }
  }

  function showError(msg){
    if(trackError){
      if(msg){
        trackError.innerHTML = '<div style="background:#FEE2E2;border:1px solid #FCA5A5;color:#991B1B;padding:.85rem 1.1rem;border-radius:4px;font-size:.86rem;margin-top:.8rem;line-height:1.5">' + escapeHtml(msg) + '</div>';
        trackError.style.display = "block";
      } else {
        trackError.innerHTML = "";
        trackError.style.display = "none";
      }
    }
  }

  function copyTrackingLink(orderId){
    var url = window.location.origin + window.location.pathname + "?order=" + encodeURIComponent(orderId) + "#track";
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(function(){
        if(typeof window.viraiToast === "function"){
          window.viraiToast("Consignment tracking link copied to clipboard");
        } else {
          alert("Tracking link copied: " + url);
        }
      });
    } else if(typeof window.viraiToast === "function"){
      window.viraiToast("Link: " + url);
    }
  }

  function renderTrackingResult(data){
    if(!trackResults) return;
    var t = data.tracking;
    if(!t) return;

    var toneClass = "status-" + (t.statusTone || "stone");

    // Compute progress width
    var progressPct = 0;
    if(t.activeStep > 0 && t.totalSteps > 1){
      progressPct = Math.min(100, Math.max(0, ((t.activeStep - 1) / (t.totalSteps - 1)) * 100));
    }

    // Build Stepper nodes
    var stepNames = [
      "Confirmed",
      "Studio Poured",
      "Dispatched",
      "In Transit",
      "Delivered"
    ];

    var stepperHtml = '<div class="track-stepper">';
    stepperHtml += '<div class="track-stepper-progress" style="width:' + progressPct + '%"></div>';

    stepNames.forEach(function(name, idx){
      var stepNum = idx + 1;
      var isCompleted = (t.activeStep > stepNum) || (t.status === "Delivered");
      var isCurrent = (t.activeStep === stepNum && t.status !== "Delivered");
      var nodeClass = isCompleted ? "completed" : (isCurrent ? "current" : "");

      var mark = isCompleted ? "&#10003;" : stepNum;
      stepperHtml +=
        '<div class="track-step-node ' + nodeClass + '">' +
          '<div class="track-node-circle">' + mark + '</div>' +
          '<span class="track-node-label">' + name + '</span>' +
        '</div>';
    });
    stepperHtml += '</div>';

    // Build Items List
    var itemsHtml = "";
    (t.items || []).forEach(function(item){
      itemsHtml +=
        '<div class="track-item-row">' +
          '<img src="' + escapeHtml(item.img) + '" alt="' + escapeHtml(item.name) + '" class="track-item-img">' +
          '<div class="track-item-details">' +
            '<div class="track-item-name">' + escapeHtml(item.name) + ' &times; ' + item.qty + '</div>' +
            '<div class="track-item-meta">' + escapeHtml(item.size || "Standard") + (item.sub ? " &middot; " + escapeHtml(item.sub) : "") + '</div>' +
            (item.giftWrap ? '<span class="track-item-badge">&#9998; Gift Wrapped with Calligraphy Note</span>' : '') +
          '</div>' +
        '</div>';
    });

    // Build Milestones Timeline
    var timelineHtml = "";
    (t.milestones || []).forEach(function(m){
      var mClass = m.completed ? "completed" : (m.current ? "current" : "");
      var timeFormatted = m.time ? new Date(m.time).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Scheduled";

      timelineHtml +=
        '<li class="track-log-item ' + mClass + '">' +
          '<div class="track-log-top">' +
            '<span class="track-log-title">' + escapeHtml(m.name) + '</span>' +
            '<span class="track-log-time">' + timeFormatted + '</span>' +
          '</div>' +
          '<div class="track-log-detail">' + escapeHtml(m.detail) + '</div>' +
          '<div class="track-log-loc">&#9679; ' + escapeHtml(m.location) + '</div>' +
        '</li>';
    });

    trackResults.innerHTML =
      '<div class="track-result-wrap">' +
        '<div class="track-status-head">' +
          '<div>' +
            '<div style="display:flex;align-items:center;gap:.6rem;flex-wrap:wrap;margin-bottom:.4rem">' +
              '<span class="track-status-badge ' + toneClass + '">' +
                '<span class="track-status-dot"></span>' +
                escapeHtml(t.statusBadge) +
              '</span>' +
              '<span style="font-size:.85rem;color:var(--mineral);font-family:monospace">Ref: ' + escapeHtml(t.orderId) + '</span>' +
            '</div>' +
            '<h3 style="font-family:var(--serif);font-size:1.6rem;margin:0;color:var(--ink)">Consignment ' + escapeHtml(t.orderId) + '</h3>' +
            '<p class="small muted" style="margin-top:.2rem">Placed on ' + escapeHtml(t.createdAtFormatted) + ' &middot; ' + t.itemsCount + ' object' + (t.itemsCount > 1 ? 's' : '') + '</p>' +
          '</div>' +
          '<div style="display:flex;gap:.5rem">' +
            '<button type="button" class="btn btn-line btn-sm" id="btnCopyLink">&#128279; Share Status</button>' +
            '<button type="button" class="btn btn-ghost btn-sm" onclick="window.print()">&#128424; Print</button>' +
          '</div>' +
        '</div>' +

        '<div class="track-eta-banner">' +
          '<div>' +
            '<div class="track-eta-title">Estimated Arrival at Destination</div>' +
            '<div class="track-eta-value">' + escapeHtml(t.estimatedDeliveryFormatted) + '</div>' +
          '</div>' +
          '<div style="text-align:right">' +
            '<span style="display:inline-block;font-size:.78rem;background:#ECE9E2;padding:.3rem .7rem;border-radius:3px;color:var(--ink);font-weight:500">' +
              escapeHtml(t.shippingMethod) +
            '</span>' +
          '</div>' +
        '</div>' +

        stepperHtml +

        '<div class="track-cards-grid">' +
          '<div class="track-info-card">' +
            '<h4>Courier &amp; Consignment</h4>' +
            '<div class="track-info-list">' +
              '<div class="track-info-row"><span class="track-info-label">Carrier</span><span class="track-info-val">' + escapeHtml(t.courier) + '</span></div>' +
              '<div class="track-info-row"><span class="track-info-label">Consignment AWB</span><span class="track-info-val" style="font-family:monospace">' + escapeHtml(t.awb) + '</span></div>' +
              '<div class="track-info-row"><span class="track-info-label">Service Tier</span><span class="track-info-val">' + (t.isExpress ? 'Air Express' : 'Surface Priority') + '</span></div>' +
              '<div style="margin-top:.6rem;padding-top:.6rem;border-top:1px solid var(--line-soft)">' +
                '<a href="' + escapeHtml(t.trackingUrl) + '" target="_blank" rel="noopener noreferrer" class="link-u" style="font-size:.82rem">Carrier Portal Lookup &rarr;</a>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="track-info-card">' +
            '<h4>Destination &amp; Recipient</h4>' +
            '<div class="track-info-list">' +
              '<div class="track-info-row"><span class="track-info-label">Recipient</span><span class="track-info-val">' + escapeHtml(t.contactMasked.name) + '</span></div>' +
              '<div class="track-info-row"><span class="track-info-label">Destination</span><span class="track-info-val">' + escapeHtml(t.contactMasked.destination) + '</span></div>' +
              '<div class="track-info-row"><span class="track-info-label">Contact</span><span class="track-info-val" style="font-family:monospace">' + escapeHtml(t.contactMasked.phone || t.contactMasked.email) + '</span></div>' +
              '<div style="margin-top:.6rem;padding-top:.6rem;border-top:1px solid var(--line-soft)">' +
                '<span class="small muted" style="font-size:.78rem">Protected per India DPDP Act guidelines</span>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="track-info-card">' +
            '<h4>Vessels in Parcel</h4>' +
            '<div class="track-items-list">' +
              itemsHtml +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="track-timeline-log">' +
          '<div class="track-log-header">' +
            '<h3>Transit Milestones &amp; Scans</h3>' +
            '<span class="small muted">Handcrafted in Coimbatore &middot; Dispatched nationwide</span>' +
          '</div>' +
          '<ul class="track-log-list">' +
            timelineHtml +
          '</ul>' +
        '</div>' +

        '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:1rem;margin-top:2rem;padding-top:1.4rem;border-top:1px solid var(--line)">' +
          '<span class="small muted">Need special delivery assistance or gate delivery notes?</span>' +
          '<div style="display:flex;gap:.8rem">' +
            '<a href="contact.html" class="btn btn-line btn-sm">Contact Atelier Concierge</a>' +
            '<button type="button" class="btn btn-ghost btn-sm" id="btnResetTrack">Track Another Consignment</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    trackResults.style.display = "block";

    // Bind share copy
    var copyBtn = document.getElementById("btnCopyLink");
    if(copyBtn){
      copyBtn.addEventListener("click", function(){
        copyTrackingLink(t.orderId);
      });
    }

    // Bind reset
    var resetBtn = document.getElementById("btnResetTrack");
    if(resetBtn){
      resetBtn.addEventListener("click", function(){
        trackResults.style.display = "none";
        trackResults.innerHTML = "";
        if(trackInput){
          trackInput.value = "";
          trackInput.focus();
        }
        if(window.history.replaceState){
          var cleanUrl = window.location.pathname;
          window.history.replaceState({}, "", cleanUrl);
        }
      });
    }

    // Smooth scroll down to result card
    var rect = trackResults.getBoundingClientRect();
    var offset = window.pageYOffset + rect.top - 90;
    window.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
  }

  async function performTracking(reference){
    if(!reference) return;
    showError("");
    showLoading(true);

    try {
      var res = await fetch("/api/orders/track?orderId=" + encodeURIComponent(reference));
      var data = await res.json();

      showLoading(false);

      if(data.success && data.tracking){
        renderTrackingResult(data);
        // Reflect in URL history
        if(window.history.replaceState){
          var newUrl = window.location.pathname + "?order=" + encodeURIComponent(data.tracking.orderId) + "#track";
          window.history.replaceState({}, "", newUrl);
        }
      } else {
        var errText = data.error || "Unable to locate consignment. Please verify the order reference.";
        showError(errText);
        if(trackResults) trackResults.style.display = "none";
      }
    } catch (err){
      showLoading(false);
      showError("Connection error while querying logistics database. Please check your connection and try again.");
    }
  }

  // Form submission
  if(trackForm){
    trackForm.addEventListener("submit", function(e){
      e.preventDefault();
      var ref = trackInput ? trackInput.value.trim() : "";
      if(!ref){
        showError("Please enter an Order Reference (e.g. VR-MU1SO2S5-CF1D) or AWB number.");
        if(trackInput) trackInput.focus();
        return;
      }
      performTracking(ref);
    });
  }

  // Click on sample chip buttons
  document.addEventListener("click", function(e){
    var chip = e.target.closest(".sample-chip");
    if(chip){
      e.preventDefault();
      var sampleRef = chip.getAttribute("data-sample");
      if(sampleRef && trackInput){
        trackInput.value = sampleRef;
        performTracking(sampleRef);
      }
    }
  });

  // Check URL parameters on initial page load
  var params = new URLSearchParams(window.location.search);
  var initialRef = params.get("order") || params.get("track") || params.get("id") || params.get("awb");
  if(initialRef){
    if(trackInput) trackInput.value = initialRef;
    performTracking(initialRef);
  }
})();
