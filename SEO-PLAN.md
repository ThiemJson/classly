# SEO plan

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
- [ ] App Store campaign links: set APP_STORE_PROVIDER_TOKEN in the generator
- [x] SEO-CHANGELOG.md
- [ ] Bing Webmaster Tools (import from Search Console)

## Phase 2 — Tools (weeks 1–3)
- [x] Attendance calculator · bunk calculator · 75% (vi: 80%) table · recovery
- [ ] "Attendance after missing N" across subjects (subject-wise table)
- [ ] Semester planner by weeks × classes per week − holidays
- [ ] Periods/hours (tiết) calculator for schools that count periods
- [ ] Exam countdown; credit hours → study hours per week
- [ ] Trial: CGPA → percentage, GPA calculator (only after phase 2 tools get impressions)
Check search volume (Keyword Planner / Ahrefs free tools) before building each one.

## Phase 3 — Languages (weeks 2–4)
en, vi done. Next: hi, id, es, pt, tr, fr. Terms come from lib/l10n/app_<lang>.arb
in the app repo; slugs use the local search phrase. Native review for en, vi, hi.

## Phase 4 — Answer-first articles (weeks 3–8, ~10 a week)
Topics: attendance rules (sourced), calculating and recovering attendance,
timetables and study planning, how-to for the app (from the FAQ). After the first
10, pick topics from Search Console → Performance → Queries. Translate an article
only once the original gets impressions.

## Phase 5 — Weekly tuning (from week 3)
Search Console → Performance → Pages: position 5–20 with CTR under 2% →
rewrite title and description (put the answer or number in the title) → log it
in SEO-CHANGELOG.md → compare after 14 days.
