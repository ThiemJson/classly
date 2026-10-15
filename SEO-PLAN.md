# SEO plan

Detailed task specs for the remaining work: SEO-HANDOFF.md.

Goal: bring students who search attendance questions to Classly, in the
languages the app already speaks. Progress is recorded in SEO-CHANGELOG.md.

Rules for every page:
- Answer the question in the first sentence; show a worked example.
- Use the app's maths (assets/calculator.js mirrors attendance_report_model.dart).
- Never state an institution's or country's rule without an official source;
  otherwise say "many schools" and tell the reader to check their own rules.
- No thin, near-duplicate pages: each page answers its own question.

## Phase 1 — Foundations (week 1)
- [x] robots.txt (in ThiemJson.github.io), sitemap.xml, canonical, JSON-LD
- [x] Page generator: tools/build_seo_pages.py + content/<lang>/
- [x] Tools hub with links between tools
- [x] FAQ written into the HTML
- [x] Campaign links to Google Play (utm_campaign = page id + language)
- [x] Automated SEO checks: links, hreflang, sitemap, JSON-LD and metadata
- [ ] App Store campaign links: set APP_STORE_PROVIDER_TOKEN in the generator
- [x] SEO-CHANGELOG.md
- [ ] Bing Webmaster Tools (import from Search Console)

## Phase 2 — Tools (weeks 1–3)
- [x] Attendance calculator · bunk calculator · 75% (vi: 80%) table · recovery
- [x] Subject-wise and overall attendance calculator across all 8 languages
- [x] Semester planner by weeks × classes per week − holidays across all 8 languages
- [x] Periods/hours (tiết) calculator across all 8 languages
- [x] Exam countdown across all 8 languages
- [ ] Credit hours → study hours per week (en/es/pt/tr/fr/id/hi complete; Vietnamese pending a current, generally applicable Ministry source)
- [ ] Trial: CGPA → percentage, GPA calculator (only after phase 2 tools get impressions)
Check search volume (Keyword Planner / Ahrefs free tools) before building each one.

## Phase 3 — Languages (weeks 2–4)
- [x] en, vi, hi, id
- [x] es: four tools and hub generated and checked
- [x] pt-BR: four tools and hub generated and checked
- [x] tr: four tools and hub generated and checked
- [x] fr: four tools and hub generated and checked
- [ ] Native review for hi, id, es, pt, tr, fr

Terms come from `lib/l10n/app_<lang>.arb` in the app repo; slugs use the local search phrase.

## Phase 4 — Answer-first articles (weeks 3–8, ~10 a week)
- [x] Generator support for articles, localized blog hubs and structured data
- [x] First 10 English articles
- [x] Expanded multi-step FAQ answers into screenshot-based guides
- [x] First 10 Vietnamese answer-first articles
Topics: attendance rules (sourced), calculating and recovering attendance,
timetables and study planning, how-to for the app (from the FAQ). After the first
10, pick topics from Search Console → Performance → Queries. Translate an article
only once the original gets impressions.

## Phase 5 — Weekly tuning (from week 3)
Search Console → Performance → Pages: position 5–20 with CTR under 2% →
rewrite title and description (put the answer or number in the title) → log it
in SEO-CHANGELOG.md → compare after 14 days.

## Phase 6 — Product-led SEO and conversion (Doz benchmark)
- [ ] Preserve existing demand: redirect `/attendmate-website/` to `/classly/` and verify the old URL no longer returns 404
- [ ] Homepage conversion: show verified store rating, six useful calculators and contextual download CTAs
- [ ] Trust and freshness: publish dedicated Support and What's New pages
- [ ] Social sharing: replace the square icon with a purpose-built 1200×630 OG/Twitter image
- [ ] App-intent landing pages: add only 2–3 pages supported by Keyword Planner or Search Console demand
- [ ] Comparison hub: publish sourced, dated and balanced comparisons only after validating query demand
- [ ] Authority: connect the website, store listings and official community profiles; earn relevant links without paid/link-scheme tactics
- [ ] Domain decision: evaluate a product-owned root domain after indexing stabilizes; migrate only with a complete redirect map

Gates:
- Do not copy Doz's page count. New topics require query/search-volume evidence and a distinct user intent.
- Do not mass-translate articles. Translate after the English original receives impressions, then obtain native review.
- Never add self-authored review/aggregate-rating schema. Visible ratings must match a linked store listing and include the observation date.
- Every comparison must use primary sources, include “when the alternative is better”, and show a checked/updated date.
