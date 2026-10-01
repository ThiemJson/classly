#!/usr/bin/env python3
"""Regenerates privacy.html from the app repo's PRIVACY_POLICY.md.

    python3 tools/build_privacy.py [path/to/PRIVACY_POLICY.md]
"""
import html
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / 'class-attence' / 'PRIVACY_POLICY.md'


def inline(text):
    text = html.escape(text, quote=False)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'`(.+?)`', r'<code>\1</code>', text)
    return re.sub(r'\[(.+?)\]\((.+?)\)', r'<a href="\2">\1</a>', text)


lines = SOURCE.read_text(encoding='utf-8').replace('\r\n', '\n').split('\n')
title = lines[0].lstrip('# ').strip()
updated = ''
body, in_list = [], False
for line in lines[1:]:
    line = line.rstrip()
    if line.startswith('- '):
        if not in_list:
            body.append('<ul>')
            in_list = True
        body.append(f'<li>{inline(line[2:])}</li>')
        continue
    if in_list:
        body.append('</ul>')
        in_list = False
    if not line:
        continue
    match = re.fullmatch(r'\*\*Last updated: (.+)\*\*', line)
    if match:
        updated = match.group(1)
    elif line.startswith('### '):
        body.append(f'<h3>{inline(line[4:])}</h3>')
    elif line.startswith('## '):
        body.append(f'<h2>{inline(line[3:])}</h2>')
    else:
        body.append(f'<p>{inline(line)}</p>')
if in_list:
    body.append('</ul>')

content = '\n'.join('      ' + b for b in body)
page = f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Privacy Policy · Classly</title>
  <meta name="description" content="How Classly: Attendance Tracker handles your information.">
  <link rel="icon" type="image/png" href="assets/favicon.png">
  <link rel="stylesheet" href="assets/site.css">
</head>
<body>
<header>
  <nav class="wrap" aria-label="Main">
    <a class="brand" href="index.html"><img src="assets/classly-icon.png" alt="" width="34" height="34">Classly</a>
    <div class="links"><a href="index.html#features">Features</a><a href="terms.html">Terms</a></div>
  </nav>
</header>
<main class="wrap">
  <article class="doc">
    <span class="kicker">Legal</span>
    <h1>{inline(title)}</h1>
    <p class="updated">Last updated: {updated}</p>
{content}
  </article>
</main>
<footer><div class="wrap"><div class="footer-row"><span>© 2026 Nguyen Cao Thiem · Classly</span><nav class="footer-links" aria-label="Footer"><a href="index.html">Home</a><a href="terms.html">Terms</a><a href="index.html#support">Support</a></nav></div></div></footer>
</body>
</html>
'''
(ROOT / 'privacy.html').write_text(page, encoding='utf-8')
print(f'privacy.html <- {SOURCE} ({len(body)} blocks)')
