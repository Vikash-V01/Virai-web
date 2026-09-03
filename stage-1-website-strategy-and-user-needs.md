# VIRAI — STAGE 1: WEBSITE STRATEGY & USER NEEDS

**Project:** Virai Website (Ainthinai launch)
**Stage:** 1 of the 15-phase design process
**Status:** APPROVED — all 10 governing decisions signed off (see Decision Log at end of document). Cleared to proceed to Stage 2 (Information Architecture).
**Labelling convention:** Every major claim is tagged **[FACT]** (from the approved brief), **[INFERENCE]** (logical conclusion from facts + category knowledge), **[ASSUMPTION]** (unvalidated belief requiring testing), or **[RECOMMENDATION]**.

---

## 0. STRATEGIC FRAME

**The governing idea:** Virai's website is a dual-layer system running on one domain:

| Layer | Job | Speed | Default? |
|---|---|---|---|
| **COMMERCE** | Shop → Product → Bag → Checkout | Fast, frictionless | Yes — commerce is always ≤2 clicks away |
| **EXPERIENCE** | Virai → Ainthinai → Landscape → Emotion → Fragrance → Product | Slow, immersive | No — invitation, never a gate |

**The north-star test for every page:** *Does this help someone understand Virai, choose a product, trust us, or take action?* If it does none of these four, it does not ship at MVP.

**Primary strategic bet [RECOMMENDATION]:** Ainthinai's emotion→landscape mapping is Virai's unfair advantage in fragrance e-commerce, because it solves the category's hardest problem — *choosing a scent you cannot smell* — through emotion instead of notes alone. The entire site should be architected so that emotional discovery feeds commerce, without ever blocking it.

---

## 1. PRIMARY CUSTOMER TYPES

Six segments. None are yet validated by primary research [INFERENCE unless noted]; they are built from the brief's stated gifting intents + standard luxury home-fragrance category behaviour.

### C1 — The Self-Purchaser (D2C)
- **Who:** Urban professional (~25–45), buys home fragrance for their own space; design-conscious.
- **Intent:** "I want something beautiful that smells incredible for my home."
- **Needs:** Scent clarity, size/burn time, price transparency, easy reorder.
- **Barrier:** Cannot smell online — the #1 category barrier [FACT of the medium].
- **Journey type:** J1 / J4 (see §4).

### C2 — The Emotional Gifter (Personal)
- **Who:** Buying for a partner, close friend, or family member for an occasion: anniversary, birthday, apology, long-distance separation, housewarming.
- **Intent:** "I want to say something specific — longing, love, waiting — with an object."
- **Needs:** Emotion→product mapping (this is exactly what Ainthinai offers), gift packaging, message card, delivery timing, price bands.
- **Barrier:** Fear of missing — "Will she like the scent?" Risk-reversal content matters more than romance copy.
- **Journey type:** J3.

### C3 — Wedding & Event Buyer
- **Who:** Couples, wedding planners, and family members organising Tamil/Indian weddings and events. Return-gift/thank-you-gift culture makes this a large, natural market [INFERENCE — culturally grounded, to be confirmed by Market Intelligence].
- **Intent:** "I need 100–500 elegant, meaningful favours that don't look like everyone else's."
- **Needs:** Quantity bands, customisation menu, lead times, samples, formal quote, invoicing.
- **Barrier:** No published process = enquiry abandonment. Decision unit involves multiple people over weeks.
- **Journey type:** J5.

### C4 — Corporate Gifting Buyer
- **Who:** HR leaders, founders, executive assistants buying festive (Diwali/Pongal) and client gifts. Procurement mindset.
- **Intent:** "I need premium, reliable, brand-safe gifts at volume, with invoices and on-time delivery."
- **Needs:** MOQ clarity, tiered pricing, branding/co-branding rules, GST invoice [ASSUMPTION: India-based sales — confirm], multi-address delivery, response-time SLA.
- **Barrier:** Being forced through a consumer funnel; unclear quote turnaround.
- **Journey type:** J5.

### C5 — The Heritage / Diaspora Connector *(validate early)*
- **Who:** Tamil diaspora and culturally curious buyers seeking contemporary Tamil expression — not stereotype.
- **Intent:** "This feels like my grandmother's jasmine and my design magazine at once."
- **Strategic value:** Highest differentiation potential; likely strong international word-of-mouth.
- **Status:** Pure **[ASSUMPTION]** — validate via geo-analytics, interviews, and Marketing's channel plan before investing content against it.

### C6 — The Design-Led Fragrance Collector
- **Who:** Already buys premium candles/home fragrance across brands; values craft, materials, notes pyramids.
- **Intent:** "Convince me this belongs next to the best."
- **Needs:** Notes detail, ingredients/materials honesty, maker story, performance specs.
- **Value:** Small segment, high influence — drives credibility and reviews [INFERENCE].

**Priority ranking [RECOMMENDATION]:**
1. **C2 + C1** — highest launch volume/revenue probability → optimise PDP and shop paths first.
2. **C3 + C4** — highest order value per transaction → must exist fully at MVP even if volume is low.
3. **C6** — credibility engine → serve through craft/spec content.
4. **C5** — differentiator → measure before building dedicated experiences.

---

## 2. CUSTOMER JOBS-TO-BE-DONE

| # | When… | I want to… | So I can… | Type | Served by |
|---|---|---|---|---|---|
| JTBD-1 | I need a gift for someone I love | Find an object that expresses a *specific* feeling | Stop defaulting to flowers or generic boxes | Emotional/Social | Find Your Virai, Ainthinai pages |
| JTBD-2 | I'm choosing a scent online | Read a scent description I can almost smell | Buy with confidence, not hope | Functional | PDP sensory block, notes reveal |
| JTBD-3 | I receive a Virai gift | Understand its meaning and story | Feel the giver chose thoughtfully | Emotional | Packaging insert, landscape page |
| JTBD-4 | I'm planning wedding favours | See quantities, customisation, lead times upfront | Shortlist Virai without ten phone calls | Functional | Weddings & Events page |
| JTBD-5 | I buy corporate gifts | Get a fast quote with clear terms | Look good to my company and clients | Functional/Social | Corporate page, enquiry SLA |
| JTBD-6 | I discover an unfamiliar brand | Understand what Virai is in under 10 seconds | Decide whether to keep exploring | Cognitive | Hero + "What is Virai" section |
| JTBD-7 | I loved my first candle | Reorder or explore a new landscape effortlessly | Keep the ritual alive | Functional | Repurchase paths, collection cross-links |
| JTBD-8 | I care about craft and materials | Verify what it's made of and how | Justify a premium price to myself | Rational | Craft & Materials, spec tables |
| JTBD-9 | I feel disconnected from my roots | Own a beautiful piece of Tamil sensory culture | Feel reconnected, elegantly | Emotional/Cultural | Our Story, Ainthinai world |
| JTBD-10 | My gift arrives late or wrong | Track, fix, or be compensated quickly | Trust the brand again | Functional | Post-purchase emails, Support |

---

## 3. TOP REASONS PEOPLE WILL VISIT THE WEBSITE

Ranked by expected frequency × commercial value [INFERENCE — validate channel mix with Marketing]:

| Rank | Reason | Primary persona | Landing need |
|---|---|---|---|
| 1 | Saw Virai on social / word-of-mouth → want to see & buy products | C1, C2 | Instant orientation + product entry |
| 2 | Need a gift soon (occasion pressure) | C2 | Fast gift path visible immediately |
| 3 | Researching wedding/event favours | C3 | B2B entry point, credible proof |
| 4 | Corporate/festive gifting research | C4 | B2B entry point, process clarity |
| 5 | "What is Virai?" curiosity after hearing about it | All | Sub-10-second comprehension |
| 6 | Repurchase / reorder | C1 | Frictionless return path |
| 7 | Content curiosity — Ainthinai / Tamil heritage (SEO/social) | C5, C6 | Story layer that links to product |
| 8 | Post-purchase support (tracking, care, returns) | Buyers | Clean utility footer |

**Implication [RECOMMENDATION]:** The homepage must serve shoppers AND the curious within the first screen — hero carries both CTAs ("Explore Ainthinai" / "Shop Fragrance") exactly as briefed, because reasons #1 and #5 arrive together constantly.

---

## 4. TOP PURCHASE JOURNEYS (OVERVIEW)

```
J1 DIRECT SHOP        Ad/Social → Home → Shop PLP ──────→ PDP → Bag → Checkout
J2 EMOTION-LED        Home → Ainthinai world → Landscape → Product → PDP → Bag → Checkout
J3 GIFT-ASSISTED      Gift hub → Find Your Virai (3 questions) → Recommendation + WHY → PDP (+gift options) → Bag → Checkout
J4 SCENT-BROWSE       Shop → Fragrance filter → PLP → PDP → Bag → Checkout
J5 BULK ENQUIRY       Gift → Weddings OR Corporate → Proof/process → Request a Quote → Sales follow-up (off-site conversion)
```

**Structural note [RECOMMENDATION]:** J1/J2/J3/J4 all converge on ONE PDP template and ONE checkout; only J5 exits to an enquiry flow. This keeps engineering surface small while serving all four user intents.

---

## 5. INFORMATION CUSTOMERS NEED BEFORE PURCHASING

Ordered by likelihood of blocking purchase. Owners per brief §29.

| Priority | Information needed | Why it blocks purchase | Owner | Launch status |
|---|---|---|---|---|
| P0 | What does it smell like? (notes, mood, intensity) | The core fragrance-e-com barrier [FACT] | Product Lab | REQUIRED |
| P0 | Size, burn time, dimensions, price | Value judgement | R&D / Finance | REQUIRED |
| P0 | Shipping cost, delivery time, returns policy | Risk removal | Finance / Supply Chain / Legal | REQUIRED |
| P0 | Is the packaging giftable as-is? (photo + description) | Gifting confidence | Packaging | REQUIRED |
| P0 | Wick/safety/first-burn care | Anxiety reduction, safety | R&D / Legal | REQUIRED |
| P1 | Ingredients/materials honesty | Premium justification (C6) | R&D / Brand Studio | REQUIRED where verified; omit otherwise |
| P1 | Gift options (message card, wrap, delivery date) | Completes gifting job | Ops / Finance | REQUIRED (delivery-date picker pending Ops feasibility) |
| P1 | B2B: MOQ, lead times, customisation, sample policy | Enquiry qualification | Supply Chain / Sales | REQUIRED |
| P2 | Reviews & ratings | Trust — impossible at day zero | Marketing | Phase 1.5 — only genuine ones post-launch |
| P2 | Certifications, sustainability claims | Segment-specific trust | Legal / R&D | Only if legally verified |

**Hard rule [RECOMMENDATION]:** No spec, claim, or number goes live without sign-off from its owning function (brief §11, §29). Unfilled slots are removed from the layout, not filled with placeholder poetry.

---

## 6. NAVIGATION REQUIREMENTS

### Proposed primary navigation [RECOMMENDATION]

```
SHOP   |   AINTHINAI   |   GIFT   |   DISCOVER            [Search] [Bag]
```

- **SHOP** → All Products · By Collection · By Fragrance · Gift Sets
- **AINTHINAI** → Collection 01 overview → Kurinji · Mullai · Marutham · Neithal · Palai
  - Labelled with subtext "Collection 01" so the naming architecture scales when Collections 02–05 arrive [RECOMMENDATION — implements the max-five-collections architecture from the start]
- **GIFT** → Find a Gift · Personal Gifting · Weddings & Events · Corporate Gifting
- **DISCOVER** → Our Story · Fragrance & Memory · Craft & Materials · Journal

### Decisions & rationale

| Decision | Recommendation | Rationale |
|---|---|---|
| "Collections" vs "Ainthinai" in nav | Use **AINTHINAI** directly | Teaches the collection name from day one; scalable later to COLLECTIONS > Ainthinai / [next] |
| Journal in top nav | Fold into Discover at launch | Reduces nav load; Journal has no standalone conversion job yet [INFERENCE] |
| Support location | Utility bar + footer only | Support intent never competes for prime nav real estate |
| Mobile pattern | Hamburger → full-screen editorial menu with pinned actions: **Shop All**, **Find a Gift**, Search, Bag | Commerce actions survive even inside the experience layer |
| Search | Visible icon at all breakpoints | High-intent users skip menus entirely |

### Dual-layer rule [RECOMMENDATION]
Every EXPERIENCE surface (landscape pages, story sections) must carry a persistent commerce exit — a visible product link, "Shop Kurinji" affordance, or bag access. Story never becomes a cul-de-sac.

---

## 7. D2C JOURNEY (DETAILED)

| Step | Screen | Key element | User state | Conversion risk | Design answer |
|---|---|---|---|---|---|
| 0 | Ad / social / referral | Consistent visual bridge | Curious | Message mismatch | Photography/copy continuity from campaigns [Marketing dependency] |
| 1 | Homepage | Hero: "Fragrance that lingers. Memories that remain." + Explore Ainthinai / Shop Fragrance | "Is this for me?" | Confusion >10s | Sub-10-second comprehension test pre-launch |
| 2 | Shop PLP | Max 3 filters (Collection / Fragrance / Type), price shown, emotion tagline per card | Scanning | Overchoice | Small catalogue needs curation, not filtering [INFERENCE] |
| 3 | Product cards | Image + name + landscape/emotion + scent direction + price | Narrowing | Insufficient info to click | Card must carry scent direction, not just name |
| 4 | PDP | Progressive storytelling: sensory description → emotion context → specs → gifting → trust | Evaluating | Scent uncertainty, spec doubt | Sequential reveal; sticky ADD TO BAG on mobile |
| 5 | Add to Bag | Tactile confirmation + cart drawer opens smoothly | Committed | Interruption annoyance | Drawer shows progress-to-checkout; no forced upsell walls |
| 6 | Cart drawer | Line items, gift option toggle, shipping threshold messaging (pending Finance) | Finalising | Hidden-cost fear | Show shipping expectation BEFORE checkout |
| 7 | Checkout | Guest-first, address → delivery → payment; totals explicit | Trust-testing | Account-wall abandonment | Guest checkout mandatory [FACT per §20] |
| 8 | Confirmation | Order summary + care note + one landscape story seed + review promise | Post-purchase glow | Dead end | Begin relationship here (brief §21) |

---

## 8. PERSONAL GIFTING JOURNEY

**Trigger occasions [INFERENCE]:** anniversary · birthday · apology/reconciliation · long-distance ("thinking of you") · housewarming · festive season.

```
Gift (nav) → Personal Gifting hub
   ├─→ FIND YOUR VIRAI quiz (fast path, ~45 seconds):
   │     Q1 What are you looking for?        For myself / For someone else
   │     Q2 What feeling fits?               Union / Waiting / Playful Conflict / Longing / Separation
   │     Q3 Preferred fragrance family?      [validated taxonomy from Product Lab]
   │     → Recommendation card WITH rationale:
   │       "You said 'waiting' — Mullai. Jasmine-laced, patient, tender."
   │       [View product]  [Start again]  [See all gifts]
   └─→ CURATED GIFT EDITS (skip-the-quiz path): by occasion · by recipient · by price band
         ↓
PDP with gifting module:
   • Gift wrap toggle (+price if applicable — Finance)
   • Handwritten-style message field (char limit set by print constraints — Packaging)
   • Delivery date selector (Phase 1 IF logistics allow — flag as open dependency)
   • Price-hidden packing slip option [ASSUMPTION feasible — confirm with Ops]
         ↓
Bag → Checkout → Confirmation emphasising "your gift will arrive…"
```

**Quiz principles [FACT per §9]:** optional, restartable, explains its reasoning, mobile-first, never a wall between user and catalogue.

---

## 9. WEDDING & EVENT GIFTING JOURNEY

**Reality of this buyer [INFERENCE]:** often a family member or planner researching months ahead; decisions made across multiple people; comparisons are visual (they've seen 10 favour vendors this week).

```
Gift → Weddings & Events
  1. IMMEDIATE REASSURANCE: "Favours worth keeping." + hero imagery of product in event-scale quantity
  2. WHAT YOU NEED TO KNOW (removes enquiry anxiety):
     • Typical order bands (e.g., 50 / 100 / 250+ — exact bands from Supply Chain)
     • Customisation menu (message cards, packaging, scale of personalisation — Packaging/Sales)
     • Lead-time table (order-by dates relative to event date)
     • Sample ordering path ("Try it first")
  3. SOCIAL PROOF PLACEHOLDER: launch with craft/process photography; add real weddings post-launch
  4. REQUEST A QUOTE form: event date · quantity band · city · budget band · notes
     → Auto-email with lookbook/brochure PDF
     → Human follow-up within stated SLA [Sales to confirm SLA before publishing]
  Secondary exits: WhatsApp / call link [common in Indian events B2B — INFERENCE, validate with Sales]
```

**Conversion definition:** qualified enquiry submitted → sales pipeline. Not checkout.

---

## 10. CORPORATE GIFTING JOURNEY

**Buyer mindset shift vs weddings:** procurement logic — reliability, invoicing, deadlines, brand safety. Tone: precise, calm, still unmistakably Virai.

```
Gift → Corporate Gifting
  1. POSITIONING: "Gifts that carry your regard — and ours." 
  2. CAPABILITY BLOCKS:
     • Volume tiers & indicative pricing bands (no hard prices pre-quote — Finance)
     • Customisation & co-branding rules (what Virai will/won't do — Brand Studio + Sales)
     • Multi-address fulfilment capability
     • GST invoice / procurement compliance [ASSUMPTION India-first — confirm]
     • Festive calendar readiness (Pongal, Diwali windows — a genuinely differentiated angle for a Tamil-rooted brand [RECOMMENDATION])
  3. PROCESS TRANSPARENCY: Enquire → Quote → Sample → Approve → Produce → Deliver (numbered, with timeframes once confirmed)
  4. REQUEST A QUOTE form: company · qty band · budget band · timeline · branding needs
     → Same CRM capture engine as weddings, different qualifying fields
```

**Rule [RECOMMENDATION]:** B2B users must NEVER pass through D2C checkout. Their journey terminates at a human handoff with a published response-time promise.

---

## 11. KEY CONVERSION POINTS

| # | Point | Desired action | Metric | Note |
|---|---|---|---|---|
| CV-1 | Homepage hero | Click Explore/Shop | Hero CTR | Primary A/B candidate (brief §25) |
| CV-2 | Ainthinai landscape pages | Click into product from story | Landscape→PDP rate | The experience-layer payoff metric |
| CV-3 | PLP product card | Click to PDP | PLP→PDP CTR | Card content experiment zone |
| CV-4 | PDP | Add to Bag | ATB rate | Single most important metric at launch |
| CV-5 | Find Your Virai completion | Accept recommendation | Quiz completion + rec→PDP | Guardrail: completion must not tank due to length |
| CV-6 | Cart drawer | Proceed to checkout | Drawer→Checkout rate | Shipping messaging lives here |
| CV-7 | Checkout | Complete purchase | Purchase conversion + abandonment | Guest-only friction audit monthly |
| CV-8 | B2B forms | Submit enquiry | Form starts/completions | Field-count minimisation |
| CV-9 | Confirmation/email | Review signup, second purchase | Repeat rate signals | Seeds Phase 2 loyalty case |
| CV-10 | Newsletter capture | Subscribe | Signup rate | Needs incentive approved by Finance |

**Funnel tracked end-to-end:** Landing → Discovery → Product view → Add to Bag → Checkout → Purchase (events per brief §24).

**Explicitly rejected at launch [RECOMMENDATION]:** exit-intent popups, countdown timers, discount-spin wheels — each trades short-term conversion for permanent premium-perception damage.

---

## 12. MAJOR UX RISKS (RANKED)

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | **The scent gap** — customers can't smell online; the core category barrier [FACT] | Critical | Evocative-but-precise copy standards; notes visualisation; honest intensity descriptors; Discovery Set as risk-reversal SKU [Product Lab to define] |
| R2 | **Experience swallows commerce** — immersive layers trap shoppers | High | Persistent commerce exits everywhere; scroll-depth caps on storytelling; both CTAs in hero |
| R3 | **Cultural comprehension load** — Kurinji/Mullai etc. are unknown words to most visitors | High | Always pair Tamil term + English emotion word; micro-glossary tooltips; never require learning before buying |
| R4 | **Animation vs mobile performance** — heavy motion on mid-range Android over 4G [ASSUMPTION: India-heavy traffic] | High | Motion budget: LCP < 2.5s target on mid-tier devices; `prefers-reduced-motion` honoured; animation complexity tiers desktop/mobile |
| R5 | **New-brand trust deficit** — premium prices, zero reputation | High | Real photography only; transparent policies; founder voice; zero fake scarcity; reviews added only when genuine |
| R6 | **Price-value doubt without social proof** | Medium | Spec transparency as substitute proof at launch; ethical review generation post-purchase |
| R7 | **B2B leakage into D2C funnel** | Medium | Distinct entries, distinct forms, distinct success metrics |
| R8 | **Content dependencies stall launch** | Medium | Owner matrix (§29); placeholder governance; content-complete gate before design freeze |
| R9 | **Architecture won't scale to 5 collections** | Medium | URL taxonomy `/collections/ainthinai/kurinji` designed day one; nav designed for future items |
| R10 | **Over-filtering a small catalogue** | Low | Cap at 3 filter dimensions until assortment grows materially |

---

## 13. FEATURES THAT SHOULD NOT BE BUILT INITIALLY

Each excluded for a named reason — not merely deferred out of caution:

| Feature | Why NOT now |
|---|---|
| Mandatory accounts | Directly violates brief §20; kills guest conversion |
| Loyalty points program | No repeat-purchase data yet to design against |
| Advanced AI fragrance quiz | Can't out-engineer an unvalidated taxonomy; v0 quiz first |
| AR / 3D candle viewer | Heavy build, weak evidence it converts in this category |
| Subscription boxes | Requires proven repurchase patterns first |
| Multi-language site | English-first until diaspora/international demand is measured |
| Multi-currency | Same trigger as above |
| Live-chat AI bot | Premature-brand-voice risk; email + form SLAs suffice |
| Full editorial Journal operation | One lightweight section inside Discover; content ops scale later |
| Wishlist / social sharing | Low intent evidence at launch traffic levels |
| Referral program | No customer base to refer from |
| Native mobile app | Mobile web must earn the install first |
| UGC pipelines / influencer storefronts | Marketing-led; adds platform complexity before demand exists |

---

## 14. MVP WEBSITE SCOPE

**Definition of done for launch: a visitor can understand Virai, find a product three different ways, buy it as a gift, request a bulk quote, and trust the brand — on a mid-range phone.**

### Pages/templates
1. Homepage
2. Shop All (PLP template)
3. Product Detail Page (single template)
4. Ainthinai collection index (the scroll-driven five-landscapes world)
5. Landscape pages ×5 (Kurinji/Mullai/Marutham/Neithal/Palai)
6. Our Story
7. Fragrance & Memory + Craft & Materials (lightweight Discover pages)
8. Gift hub (with Find Your Virai v0)
9. Weddings & Events
10. Corporate Gifting
11. Support set: Contact · FAQs · Shipping · Returns · Product Care
12. Search results
13. Cart drawer + Cart page fallback
14. Checkout (guest-first) + Order Confirmation
15. Transactional email set (confirmation, shipping, B2B enquiry ack)
16. Legal pages (Privacy, Terms, policies — Legal dependency)

### Features
- Filters: Collection / Fragrance family / Product type (three maximum)
- Find Your Virai v0: 3 questions, recommendation + explanation, restartable
- Cart drawer with gift toggle + shipping-threshold messaging (pending Finance thresholds)
- Gift message field at PDP/cart
- B2B enquiry forms (wedding + corporate variants) → CRM/email capture with auto-response
- Analytics event set exactly per brief §24
- SEO foundation: semantic HTML, Product/Organization/FAQ schema, collection-targeted metadata
- Animation system v1: page reveals, hero drift, sequential notes reveal, cart drawer, reduced-motion compliance
- Accessibility baseline: WCAG-AA contrast, keyboard paths, focus states, alt-text discipline, touch targets ≥44px

### Explicit non-goals at MVP
Everything listed in §13, plus any feature lacking a verified owner-input (per §29).

### MVP success criteria (learning goals, set as hypotheses)
- Homepage comprehension <10s in moderated tests (target: 8/10 participants)
- Quiz completion ≥60% of starts [ASSUMPTION threshold — replace with data post-launch]
- PDP ATB rate and checkout completion baselined at 30 days, then optimised
- B2B enquiries arriving qualified (date + quantity present)

---

## 15. PHASE 2 SCOPE (EVIDENCE-GATED ROADMAP)

Nothing here builds until its trigger condition fires:

| Candidate | Trigger condition |
|---|---|
| Advanced scent finder + Discovery Set upsell | Quiz data shows drop-off at fragrance-family question, or sample-SKU demand appears |
| Personalisation (engraved/messaged vessels) | Packaging confirms feasibility + corporate demand repeats |
| Loyalty / repurchase mechanics | 90-day repeat rate establishes a pattern worth rewarding |
| Bundles & gifting suites (curated sets) | Finance validates margin + basket data supports AOV lift |
| Interactive Ainthinai chapter (deeper scroll experience) | Landscape→PDP rates prove the format drives commerce |
| Regional language support (Tamil first) | Geo-analytics show meaningful Tamil Nadu/diaspora engagement |
| Multi-currency / international shipping expansion | International traffic + enquiries exceed a set threshold |
| Reviews platform integration | Post-purchase volume sufficient to seed honestly |
| Formal CRO experimentation program | Traffic reaches statistical usability (brief §25 discipline applies) |

---

## CLOSING ANALYSIS

### RECOMMENDATION

Build the **dual-layer architecture with commerce-first defaults**: every experience surface invites, none obstruct. Concentrate design effort on three assets: **(1)** the PDP — it carries the entire conversion burden; **(2)** the gift journeys — Virai is a gifting brand, so gifting is a first-class system, not a feature; **(3)** the Ainthinai world as the *differentiating discovery engine* that turns "which candle?" into "which feeling?" Launch the MVP exactly as scoped in §14; treat everything in §13 as protected scope boundaries; gate Phase 2 strictly behind the evidence triggers in §15.

### EVIDENCE

What we actually possess: the approved brief (brand facts, positioning, Ainthinai landscapes, objectives, guardrails) — these are the document's only **[FACT]** base. Everything about customer behaviour, channel mix, market composition, and device profiles is **[INFERENCE]** from luxury home-fragrance category norms, or **[ASSUMPTION]** flagged for validation. **No primary research exists yet** — this strategy is deliberately structured so that Stage 2 (IA/sitemap) remains valid even if some assumptions fail, while persona-level investments (especially C5 diaspora) wait for evidence.

### KEY ASSUMPTIONS

1. Market is India-first (incl. Tamil Nadu) with meaningful diaspora reach; pricing in INR; GST invoices required.
2. Traffic will be mobile-dominant, largely mid-range Android on variable networks.
3. D2C e-com is the primary launch channel; B2B (wedding/corporate) is high-value but lower-volume.
4. South Indian return-gift culture creates real wedding-favour demand for a premium, meaningful product.
5. Launch catalogue is small (roughly ≤15 SKUs — Product Lab to confirm), making curation more valuable than filtering.
6. Price positioning is premium-but-accessible enough for self-purchase alongside gifting (Finance to confirm bands).
7. Audience is primarily English-reading at launch.

### WHAT COULD MAKE THIS WRONG

- **Pricing lands differently than assumed** → journey emphasis shifts (promo-driven vs story-driven); homepage hierarchy changes.
- **B2B dominates early revenue** → corporate portal, tiered pricing display, and account management move from Phase 2 to Phase 1.
- **Product Lab's fragrance taxonomy differs from assumed families** → the quiz, filters, and PDP structures all change shape.
- **Legal restricts ingredient/claim language** → sensory copy standards and PDP modules need rework.
- **Launch markets skew heavily US/EU diaspora** → shipping trust content, currency, and delivery-date expectations jump in priority.
- **Ainthinai comprehension tests poorly** → landscape naming/pairing rules (R3) need stronger scaffolding before the experience layer gets investment.

### NEXT 3 ACTIONS

1. **Review & lock this strategy** — approve personas, priorities, nav proposal, MVP boundary. Everything downstream inherits from this document.
2. **Issue the dependency requests** (handoff prompts below): Product Lab (taxonomy, names, specs), Finance (pricing/shipping economics), Supply Chain (MOQ/lead times), Sales (B2B SLAs), Legal (policies/claims), Packaging (gift/unboxing details).
3. **Run light validation in parallel:** 5–8 target-customer conversations testing the six personas' reality + a competitor teardown of 4–6 premium fragrance/gifting sites (baseline their IA, PDP patterns, gifting flows). Feed findings into Stage 2 (Information Architecture → Sitemap).

### HANDOFF TO OTHER VIRAI CHATS

Ready-to-paste asks, mapped to brief §29 owners:

| Chat / Function | Ask them for | Needed for |
|---|---|---|
| **Product Lab** | Final SKU list; product names; validated fragrance taxonomy (families + note structures per scent); sizes; burn times; dimensions; intensity descriptors | §5 P0 content, quiz Q3, filters, PDP template |
| **Finance** | Price points/bands; shipping cost model; free-shipping threshold decision; bundle economics; newsletter incentive budget | Cart drawer messaging, gift edits, CV-10 |
| **Supply Chain** | MOQs; lead times (standard + bulk); availability constraints; multi-address fulfilment feasibility; hidden-price packing-slip feasibility | Weddings/Corporate pages, gift journey |
| **Sales & Growth** | B2B process + realistic quote SLA; customisation/co-branding menu; preferred contact channels (email vs WhatsApp); brochure asset status | §9/§10 enquiry engines |
| **Brand Studio** | Approved typography/colour tokens; photography shot list (hero, landscape, product, pack); tone-of-voice examples; cultural verification of any Tamil references used on-site | Stage 8 visual design; all copy standards |
| **Packaging** | Gift box details; message-card character limits; unboxing sequence; materials story | Gifting module, PDP gifting block |
| **R&D / Quality** | Care instructions; safety copy; verified performance claims | PDP spec table, Product Care page |
| **Marketing** | Channel mix forecast (validates visit reasons §3); launch campaign hooks; journal/content appetite | Homepage messaging, Discover roadmap |
| **Market Intelligence** | Competitor benchmark set; search-demand signals for fragrance/gifting terms; diaspora demand evidence | Validation of §1/§3 assumptions |
| **Legal** | Privacy/Terms/Returns drafts; claims review process | Launch checklist, §5 governance |

---

## DECISION LOG (APPROVED)

Reviewed decision-by-decision and approved by brand owner.

| # | Decision | Outcome |
|---|---|---|
| D1 | Dual-layer architecture, commerce-first defaults | APPROVED |
| D2 | Six customer segments; C2+C1 priority; B2B complete-at-MVP; C5 watch-only | APPROVED |
| D3 | Nav = SHOP / AINTHINAI / GIFT / DISCOVER; Journal inside Discover; Support in footer/utility | APPROVED |
| D4 | Nav label is "AINTHINAI" (sub-labelled Collection 01), not "Collections" | APPROVED |
| D5 | All D2C journeys converge on one PDP template + one checkout; B2B exits to enquiry only | APPROVED |
| D6 | Find Your Virai v0: 3 questions, optional, explains rationale; fragrance-family question blocked pending Product Lab taxonomy | APPROVED |
| D7 | MVP scope = 16 page templates + listed features; definition of done on mid-range phone | APPROVED |
| D8 | 13 excluded features confirmed out of launch scope | APPROVED |
| D9 | Phase 2 strictly evidence-gated per trigger table | APPROVED |
| D10 | Proceed on the 7 load-bearing assumptions while validation runs in parallel | APPROVED |

**Standing conditions carried forward:**
- No spec/claim publishes without owning-function sign-off (§29 governance).
- Quiz Q3 and any fragrance taxonomy remain blocked until Product Lab responds.
- Assumption validation (customer interviews + competitor teardown + geo/channel data) runs in parallel with Stage 2–4 work; material findings reopen the affected decisions.

---

*End of Stage 1. Per the master prompt: do not proceed to wireframes, IA finalisation, or visual design until this strategy is reviewed and approved.*
