/**
 * VIRAI - Modular Site Footer
 * 
 * Centralised, modular footer component for all storefront pages.
 * Modify the content, navigation links, newsletter text, or markup in this
 * single file to update the footer across the entire website.
 */

(function (window, document) {
  'use strict';

  // 1. FOOTER CONTENT CONFIGURATION
  // Edit this object to change columns, links, newsletter copy, or brand details.
  var VIRAI_FOOTER_CONFIG = {
    newsletter: {
      heading: 'Letters that linger',
      description: 'Occasional notes on fragrance, craft and the five landscapes. No noise.',
      placeholder: 'Email address',
      buttonText: 'Subscribe',
      successMessage: 'Welcome. Your first letter is on its way.'
    },
    columns: [
      {
        title: 'Shop',
        links: [
          { label: 'All Products', url: 'shop.html' },
          { label: 'Candles', url: 'shop.html?type=Candle' },
          { label: 'Sets', url: 'shop.html?type=Set' },
          { label: 'Discovery Set', url: 'product.html?id=discovery-set' }
        ]
      },
      {
        title: 'Collections',
        links: [
          { label: 'Ainthinai', url: 'ainthinai.html' },
          { label: 'Kurinji', url: 'landscape.html?id=kurinji' },
          { label: 'Mullai', url: 'landscape.html?id=mullai' },
          { label: 'Marutham', url: 'landscape.html?id=marutham' },
          { label: 'Neithal', url: 'landscape.html?id=neithal' },
          { label: 'Palai', url: 'landscape.html?id=palai' }
        ]
      },
      {
        title: 'Gift',
        links: [
          { label: 'Find Your Virai', url: 'find-your-virai.html' },
          { label: 'Personal Gifting', url: 'gift.html#personal' },
          { label: 'Weddings & Events', url: 'weddings.html' },
          { label: 'Corporate Gifting', url: 'corporate.html' }
        ]
      },
      {
        title: 'Care',
        links: [
          { label: 'Contact', url: 'contact.html' },
          { label: 'FAQs', url: 'faq.html' },
          { label: 'Shipping', url: 'shipping.html' },
          { label: 'Returns', url: 'returns.html' },
          { label: 'Product Care', url: 'care.html' }
        ]
      }
    ],
    base: {
      copyrightText: 'Virai - Luxury Gifting, Rooted in Fragrance',
      adminLink: {
        enabled: true,
        label: 'Admin Portal',
        url: 'admin.html'
      },
      tamilTagline: 'Virai - Lingering Impressions'
    }
  };

  // Helper to escape HTML if needed
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // 2. TEMPLATE GENERATION
  function getFooterHTML(options) {
    options = options || {};
    var variant = options.variant || 'full'; // 'full' or 'minimal'
    var cfg = options.config || VIRAI_FOOTER_CONFIG;
    var currentYear = new Date().getFullYear();

    var baseHtml = 
      '<div class="wrap foot-base">' +
        '<span>&copy; <span id="yr">' + currentYear + '</span> ' + esc(cfg.base.copyrightText) +
        (cfg.base.adminLink && cfg.base.adminLink.enabled
          ? ' · <a href="' + esc(cfg.base.adminLink.url) + '" style="color:var(--mineral);text-decoration:none">' + esc(cfg.base.adminLink.label) + '</a>'
          : '') +
        '</span>' +
        '<span class="foot-brand tamil">' + esc(cfg.base.tamilTagline) + '</span>' +
      '</div>';

    if (variant === 'minimal') {
      return baseHtml;
    }

    // Newsletter section HTML
    var news = cfg.newsletter;
    var newsHtml =
      '<div class="foot-news">' +
        '<h3>' + esc(news.heading) + '</h3>' +
        '<p>' + esc(news.description) + '</p>' +
        '<form data-form="newsletter" novalidate>' +
          '<input type="email" required placeholder="' + esc(news.placeholder) + '" aria-label="' + esc(news.placeholder) + '">' +
          '<button class="btn btn-line" type="submit" style="border-color:#57503F;color:var(--smoke)">' + esc(news.buttonText) + '</button>' +
        '</form>' +
      '</div>';

    // Navigation columns HTML
    var colsHtml = cfg.columns.map(function (col) {
      var linksHtml = col.links.map(function (lnk) {
        return '<a href="' + esc(lnk.url) + '">' + esc(lnk.label) + '</a>';
      }).join('');
      return '<div class="foot-col"><h4>' + esc(col.title) + '</h4>' + linksHtml + '</div>';
    }).join('');

    return (
      '<div class="wrap foot-grid">' +
        newsHtml +
        colsHtml +
      '</div>' +
      baseHtml
    );
  }

  // 3. ATTACH EVENT LISTENERS (Newsletter form, year sync, analytics)
  function attachFooterEvents(container) {
    if (!container) return;

    // Synchronize year
    var yr = container.querySelector('#yr');
    if (yr) {
      yr.textContent = new Date().getFullYear();
    }

    // Attach newsletter submission
    var forms = container.querySelectorAll('form[data-form="newsletter"]');
    forms.forEach(function (form) {
      if (form.__footerBound) return;
      form.__footerBound = true;

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = form.querySelector('input[type=email]');
        var email = input ? input.value.trim() : '';
        if (!email) return;

        var successMsg = VIRAI_FOOTER_CONFIG.newsletter.successMessage || 'Welcome. Your first letter is on its way.';
        form.innerHTML = '<p style="font-size:.88rem;padding:.4rem 0;color:var(--rice,#F7F5EE)">' + esc(successMsg) + '</p>';

        if (typeof window.track === 'function') {
          window.track('newsletter_signup', { emailDomain: email.split('@')[1] || '' });
        }
      });
    });
  }

  // 4. RENDER METHOD
  function renderFooter(target, options) {
    if (typeof target === 'string') {
      target = document.querySelector(target);
    }
    if (!target) return;

    var variant = (options && options.variant) || target.getAttribute('data-variant') || 'full';
    target.innerHTML = getFooterHTML({ variant: variant, config: options && options.config });
    attachFooterEvents(target);
  }

  // 5. AUTO-INITIALIZE MODULAR FOOTERS ACROSS THE PAGE
  function initModularFooters() {
    var targets = document.querySelectorAll('footer.site-foot, footer.wx-foot, site-footer, [data-modular-footer], #site-footer');
    targets.forEach(function (el) {
      // Avoid re-rendering if already populated by modular footer unless explicitly requested
      if (el.dataset.footerRendered === 'true') return;
      el.dataset.footerRendered = 'true';

      // Preserve existing custom classes (e.g. .wx-foot for world.html or .site-foot)
      if (!el.classList.contains('site-foot') && !el.classList.contains('wx-foot')) {
        el.classList.add('site-foot');
      }

      var variant = el.getAttribute('data-variant') || 'full';
      renderFooter(el, { variant: variant });
    });
  }

  // 6. REGISTER CUSTOM WEB COMPONENT: <site-footer>
  if (typeof window.customElements !== 'undefined' && typeof window.HTMLElement !== 'undefined' && !window.customElements.get('site-footer')) {
    class SiteFooterElement extends window.HTMLElement {
      connectedCallback() {
        var variant = this.getAttribute('variant') || 'full';
        this.classList.add('site-foot');
        this.style.display = 'block';
        this.innerHTML = getFooterHTML({ variant: variant });
        attachFooterEvents(this);
      }
    }
    window.customElements.define('site-footer', SiteFooterElement);
  }

  // 7. PUBLIC API ON WINDOW.VIRAI_FOOTER
  var VIRAI_FOOTER = {
    config: VIRAI_FOOTER_CONFIG,
    getHTML: getFooterHTML,
    render: renderFooter,
    init: initModularFooters,
    updateConfig: function (newConfig) {
      if (!newConfig) return;
      Object.assign(VIRAI_FOOTER_CONFIG, newConfig);
      initModularFooters();
    }
  };

  window.VIRAI_FOOTER = VIRAI_FOOTER;

  // Auto-mount as soon as DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModularFooters);
  } else {
    initModularFooters();
  }

})(window, document);
