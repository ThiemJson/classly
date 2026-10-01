# Classly website

Static marketing site for **Classly: Attendance Tracker**, published with
GitHub Pages from the root of the default branch.

- `index.html` — landing page (copy follows the store metadata in the app
  repository, `store/metadata/`).
- `privacy.html` — privacy policy, generated from the app's `PRIVACY_POLICY.md`
  with `python3 tools/build_privacy.py` (never edit it by hand).
- `terms.html` — terms of service.
- `assets/site.css` — shared styles; colours mirror the app theme.
- `screenshots/` — rendered from the app with demo data
  (`tool/screenshots/capture_screens.dart` in the app repository).

The privacy policy URL used by the stores and the app is
`https://thiemjson.github.io/attendmate-website/privacy.html`.

## Local preview

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`.
