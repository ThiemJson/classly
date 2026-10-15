# Classly App Store screenshots

This directory contains two App Store screenshot sets:

- iPhone: 1290 × 2796 px, generated from `../screenshots` and `source`.
- iPad 13-inch: 2064 × 2752 px, generated from real iPad Simulator captures in `source-ipad`.

Run:

```bash
NODE_PATH=/Users/thiem.nguyen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules node app-store-screenshots/build.js
```

The PNG files are written to `app-store-screenshots/output` in App Store display order.
`preview-contact-sheet.png` provides a compact review of the complete set.

Build the iPad set:

```bash
node app-store-screenshots/build-ipad.js
```

The ten upload-ready iPad PNG files are written to `app-store-screenshots/output-ipad-13`.
They have no alpha channel and are ordered to match the iPhone story.
