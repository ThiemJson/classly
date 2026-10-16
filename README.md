# Classly website

Static marketing site for **Classly: Attendance Tracker**, published with
GitHub Pages from the root of the default branch.

- `index.html` — landing page (copy follows the store metadata in the app
  repository, `store/metadata/`).
- `privacy.html` — privacy policy, generated from the app's `PRIVACY_POLICY.md`
  with `python3 tools/build_privacy.py` (never edit it by hand).
- `terms.html` — terms of service.
- `assets/site.css` — shared styles; colours mirror the app theme.
- Search pages (free tools under `attendance-calculator/`, `bunk-calculator/`,
  `vi/…`, the `tools/` and `vi/cong-cu/` hubs), the answers inside `faq.html`
  and `sitemap.xml` are generated from `content/` and `assets/faq.json` by
  `python3 tools/build_seo_pages.py`; see the top of that script. The
  calculator maths is in `assets/calculator.js` and must match
  `attendance_report_model.dart` in the app.
- `SEO-PLAN.md` and `SEO-CHANGELOG.md` — what is planned, and every change
  with its before/after Search Console numbers.
- `sitemap.xml` — every indexable page (generated); submitted in Search
  Console. `sitemap.xsl` only provides a readable browser view and does not
  change the XML consumed by search engines. The `open/` pages are `noindex`
  and stay out of it.
- `screenshots/` — rendered from the app with demo data
  (`tool/screenshots/capture_screens.dart` in the app repository).

The privacy policy URL used by the stores and the app is
`https://thiemjson.github.io/classly/privacy.html`.

## SEO checks

After changing content or the generator, rebuild and run the automated checks:

```sh
python3 tools/build_seo_pages.py
python3 tools/check_seo_pages.py
```

The checker validates internal `/classly/` links, reciprocal hreflang links,
sitemap coverage and XML, JSON-LD, one H1 per indexable page, and title and
description length limits.

## Local preview

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`. Generated pages use root paths (`/classly/...`), so preview those by serving the parent
folder of a `classly` symlink to this repository instead.
