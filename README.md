# VIRAI — Website Prototype

Full working prototype of the Virai website (Ainthinai launch), built to the approved Stage 1 strategy (`../stage-1-website-strategy-and-user-needs.md`).

## Run it

No build step, zero dependencies.

- **Simplest:** double-click `site/index.html` (works from `file://`)
- **Best:** serve it locally for full parity with production behaviour:
  ```
  npx serve site
  ```
  or use VS Code Live Server on `site/index.html`.

Fonts load from Google Fonts (Fraunces, Inter, Noto Serif Tamil); offline you get serif/sans fallbacks.

## Structure

```
virai/
  stage-1-website-strategy-and-user-needs.md   approved strategy + decision log
  site/
    index.html            homepage (8 sections per brief §7)
    shop.html             PLP — filters: landscape / fragrance family / format
    product.html          PDP template (?id=<product id>)
    ainthinai.html        collection world — sticky-stacking five landscapes
    landscape.html        landscape template (?id=kurinji|mullai|marutham|neithal|palai)
    gift.html             gift hub
    find-your-virai.html  quiz v0 — 3 questions, rationale shown
    weddings.html         wedding/event gifting + quote form
    corporate.html        corporate gifting + quote form
    story.html            Our Story
    fragrance-memory.html Fragrance & Memory editorial
    craft.html            Craft & Materials
    search.html           client-side search (feelings, flowers, notes)
    checkout.html         guest checkout + order summary (prototype)
    confirmation.html     post-purchase page (order recap + care ritual)
    faq.html / shipping.html / returns.html / care.html / contact.html
    css/virai.css         full design system
    js/data.js            catalogue + landscapes + config (single source of truth)
    js/main.js            cart drawer, reveals, nav, analytics stub, shared renderers
    js/shop.js | product.js | landscape.js | quiz.js | search.js | forms.js | checkout.js
```

## What works

- Full D2C journey: browse → filter → PDP → bag drawer → guest checkout → confirmation
- Cart persists via `localStorage`; free-shipping progress bar at ₹3,000 threshold
- Gift wrap (+₹150) and handwritten message captured per line item
- Quiz v0 with recommendation reasoning ("You said *waiting* — Mullai…")
- Ainthinai scroll experience with per-panel tracking
- B2B forms (wedding/corporate/contact) with validation + success states
- Analytics events pushed to `window.dataLayer` + console (see below)
- `prefers-reduced-motion`, keyboard focus states, skip link, semantic landmarks
- Product/Organization JSON-LD, unique meta titles/descriptions per page

## Analytics events wired

`page_view · product_view · collection_view · landscape_view · fragrance_filter · add_to_bag · checkout_start · purchase · quiz_start · quiz_complete · quiz_restart · search · newsletter_signup · wedding_enquiry · corporate_enquiry · support_contact`

Connect a tag manager/GA4 by reading `window.dataLayer`.

## PLACEHOLDER REGISTER — replace before launch

Everything below is invented for the prototype and must be replaced with function-owned truth:

| Item | Current state | Owner |
|---|---|---|
| Product names, scents, notes, sizes, burn times | Plausible inventions grounded in the five akam landscapes | Product Lab / R&D |
| All prices (₹1,150–₹12,500), gift-wrap ₹150 | Invented bands | Finance |
| Free-shipping threshold ₹3,000; shipping ₹99/₹350 | Invented | Finance / Supply Chain |
| MOQs, lead-time tables, quantity bands | Draft copy | Supply Chain |
| Quote-response SLA "two business days" | Unverified claim | Sales & Growth |
| Returns/shipping/care policies | Draft copy, marked on-page | Legal / R&D |
| Contact emails (`@virai.example`) | Placeholders | Marketing |
| Fragrance families (Floral/Woody/Earthy/Fresh) | Assumed taxonomy | Product Lab |
| Brand narrative (story.html), founding details | Deliberately claim-free draft | Brand Studio |
| Forms/cart/checkout | Local-only; connect CRM, ESP, payment gateway, order system | Tech |

## Approved image library — integrated

The full VIRAI asset system lives in `site/img/` and is wired per the master spec:

- **Products 1a–10c** → cards, PDP gallery (primary eager, alternates lazy, click-to-switch thumbs), cart drawer, quiz result, checkout/confirmation lines
- **Landscapes 11–15** → Ainthinai panels + landscape heroes; dedicated `*_1242x2208` mobile crops served via `<picture>` (no CSS-cropping of desktop masters)
- **Home hero 16/17** → LCP image, `fetchpriority="high"`, never lazy-loaded
- **18–20** craft editorial → homepage band + Craft page · **21/22** → Weddings/Corporate heroes · **23–26** → Story/Gift/Memory/House-intro slots · **27–31** → Craft "Up close" macro grid
- **virai-logo.webp** → official wordmark in all headers + favicon (font-rendered logo removed)
- Every `<img>` carries width/height (no layout shift), `decoding="async"`, lazy below fold, meaningful non-stuffed alt text; CSS gradient art remains only as silent fallback if a file is ever missing

Open flags: card/panel derivatives are generated in `site/img/w/` (720w products, 1400w landscapes, 1200w editorial, 900w macros) via `tools/make-derivatives.js` and served through `srcset` on all JS-rendered product imagery, the homepage hero, landscape panels and strip cards; static editorial images still serve masters only. No OG/social-share asset in library (16 recommended). Library is WebP-only — acceptable for all modern browsers.

## Image rendering rules (correction pass)

- Product imagery always renders **contained** (`object-fit:contain`) inside stable aspect-ratio boxes with paper backing — vessels, rims and labels are never cropped or zoom-cropped, regardless of source aspect
- Product cards load **eagerly**; nothing ever unmounts an image (no IO-based unload, no virtualization, no `content-visibility`); reveal animations are entry-only and never reversed
- All JS-rendered imgs carry true width/height from `VIRAI.IMG.meta` (zero layout shift)

The dismissible dark ribbon on every page flags prototype status to reviewers.

## Design decisions honoured

From the approved strategy: dual-layer architecture (commerce ≤2 clicks anywhere), nav = SHOP/AINTHINAI/GIFT/DISCOVER, one PDP template + guest-first checkout, quiz optional with exits everywhere, B2B never touches D2C checkout, no excluded features (accounts, loyalty, AR, etc.) built, animation serves guide/explain/emotion/confirm only.
"# virai-web" 
