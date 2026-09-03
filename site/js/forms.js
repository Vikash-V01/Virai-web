(function(){
  "use strict";
  var EVENT_MAP = {
    wedding:"wedding_enquiry",
    corporate:"corporate_enquiry",
    contact:"support_contact"
  };

  function successHTML(kind){
    var title = kind === "corporate" ? "Enquiry received." : kind === "wedding" ? "Enquiry received." : "Message received.";
    return '<div class="form-success">' +
      '<h3>'+title+'</h3>' +
      '<p style="color:var(--ink-soft);max-width:44ch;margin-inline:auto">Thank you. Our gifting team responds within two business days. In this prototype, nothing has been transmitted — connect this form to your CRM or email service before launch.</p>' +
      '</div>';
  }

  document.addEventListener("submit", function(e){
    var f = e.target.closest("form[data-form]");
    if(!f) return;
    if(f.dataset.form === "newsletter") return;
    e.preventDefault();

    var valid = true;
    var firstInvalid = null;
    Array.prototype.forEach.call(f.querySelectorAll("[required]"), function(el){
      var ok = el.value && el.value.trim().length > 0;
      if(ok && el.type === "email") ok = /.+@.+\..+/.test(el.value);
      el.style.borderColor = ok ? "" : "#A2593B";
      if(!ok){ valid = false; if(!firstInvalid) firstInvalid = el; }
    });
    if(!valid){
      if(firstInvalid) firstInvalid.focus();
      return;
    }

    viraiTrack(EVENT_MAP[f.dataset.form] || "form_submit", {
      form:f.dataset.form,
      qty_band:(f.querySelector("[name=qty_band]")||{}).value || null
    });

    var shell = document.createElement("div");
    shell.innerHTML = successHTML(f.dataset.form);
    f.style.display = "none";
    f.parentElement.insertBefore(shell.firstChild, f);
  });
})();
