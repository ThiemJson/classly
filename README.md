# Classly website

Static marketing site for **Classly: Attendance Tracker**, published with
GitHub Pages from the root of the default branch.

- `index.html` — landing page (copy follows the store metadata in the app
  repository, `store/metadata/`).
- `privacy.html` — privacy policy, generated from the app's `PRIVACY_POLICY.md`
  with `python3 tools/build_privacy.py` (never edit it by hand).
- `terms.html` — terms of service.
- `assets/site.css` — shared styles; colours mirror the app theme.
- `attendance-calculator/` and `vi/tinh-chuyen-can/` — the free attendance
  calculator in English and Vietnamese. The maths is in `assets/calculator.js`
  and must match `attendance_report_model.dart` in the app; each page supplies
  its own wording in `window.CALC_TEXT`. A new language gets a new page, an
  `hreflang` link on every translation, and an entry in `sitemap.xml`.
- `sitemap.xml` — every indexable page; submit it in Search Console. The
  `open/` pages are `noindex` and stay out of it.
- `screenshots/` — rendered from the app with demo data
  (`tool/screenshots/capture_screens.dart` in the app repository).

The privacy policy URL used by the stores and the app is
`https://thiemjson.github.io/classly/privacy.html`.

## Local preview

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`. Pages under `attendance-calculator/` and
`vi/` use root paths (`/classly/...`), so preview those by serving the parent
folder of a `classly` symlink to this repository instead.
