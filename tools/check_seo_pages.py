#!/usr/bin/env python3
"""Validate generated, indexable SEO pages using only the Python stdlib."""

from __future__ import annotations

import json
import pathlib
import sys
import urllib.parse
import xml.etree.ElementTree as ET
from html.parser import HTMLParser


ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
BASE = "https://thiemjason-work.site/classly/"
LANGUAGE_SCRIPT_URL = "/classly/assets/language-preference.js?v=20261016-2"
STATIC_PAGES = {"", "faq.html", "privacy.html", "terms.html", "support/", "whats-new/"}
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title_parts: list[str] = []
        self.description: str | None = None
        self.h1_count = 0
        self.hrefs: list[str] = []
        self.sources: list[str] = []
        self.base_href: str | None = None
        self.alternates: dict[str, str] = {}
        self.json_ld: list[str] = []
        self._in_title = False
        self._in_json_ld = False
        self._script_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        attrs = dict(attrs)
        if tag == "title":
            self._in_title = True
        elif tag == "h1":
            self.h1_count += 1
        elif tag == "meta" and attrs.get("name", "").lower() == "description":
            self.description = attrs.get("content", "")
        elif tag == "script" and attrs.get("type", "").lower() == "application/ld+json":
            self._in_json_ld = True
            self._script_parts = []

        href = attrs.get("href")
        if href:
            self.hrefs.append(href)
        if tag == "base":
            self.base_href = href
        source = attrs.get("src")
        if source:
            self.sources.append(source)
        srcset = attrs.get("srcset")
        if srcset:
            self.sources.extend(item.strip().split()[0] for item in srcset.split(",") if item.strip())
        rel = attrs.get("rel", "").lower().split()
        if tag == "link" and "alternate" in rel and attrs.get("hreflang") and href:
            self.alternates[attrs["hreflang"]] = href

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False
        elif tag == "script" and self._in_json_ld:
            self.json_ld.append("".join(self._script_parts).strip())
            self._in_json_ld = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title_parts.append(data)
        if self._in_json_ld:
            self._script_parts.append(data)

    @property
    def title(self) -> str:
        return "".join(self.title_parts).strip()


def local_path(url: str) -> pathlib.Path | None:
    """Map an internal /classly URL to its file, ignoring query and fragment."""
    parsed = urllib.parse.urlsplit(url)
    path = parsed.path
    if not path.startswith("/classly/"):
        return None
    relative = urllib.parse.unquote(path[len("/classly/"):])
    candidate = ROOT / relative
    if not relative or path.endswith("/"):
        candidate /= "index.html"
    return candidate


def content_slugs() -> set[str]:
    slugs = set(STATIC_PAGES)
    locales = [path.parent.name for path in CONTENT.glob("*/site.json") if path.parent.name != "en"]
    for english_slug in STATIC_PAGES:
        localized_name = "home" if not english_slug else english_slug.removesuffix(".html").strip("/")
        for lang in locales:
            slug = f"{lang}/" if not english_slug else f"{lang}/{localized_name}/"
            if (ROOT / slug / "index.html").is_file():
                slugs.add(slug)
    for site_path in CONTENT.glob("*/site.json"):
        site = json.loads(site_path.read_text(encoding="utf-8"))
        slugs.add(site["hub"]["slug"])
        lang = site_path.parent.name
        slugs.add("blog/" if lang == "en" else f"{lang}/blog/")
    for page_path in CONTENT.glob("*/tools/*.html"):
        header = page_path.read_text(encoding="utf-8").partition("\n---\n")[0]
        slugs.add(json.loads(header)["slug"])
    for page_path in CONTENT.glob("*/articles/*.html"):
        header = page_path.read_text(encoding="utf-8").partition("\n---\n")[0]
        slugs.add(json.loads(header)["slug"])
    return slugs


def parse_page(path: pathlib.Path, errors: list[str]) -> PageParser | None:
    parser = PageParser()
    try:
        parser.feed(path.read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"{path.relative_to(ROOT)}: invalid HTML input: {exc}")
        return None
    return parser


def main() -> int:
    errors: list[str] = []
    sitemap_path = ROOT / "sitemap.xml"
    try:
        sitemap_source = sitemap_path.read_text(encoding="utf-8")
        tree = ET.parse(sitemap_path)
    except (OSError, ET.ParseError) as exc:
        print(f"ERROR sitemap.xml: {exc}")
        return 1

    stylesheet_href = '/classly/sitemap.xsl'
    if f'<?xml-stylesheet type="text/xsl" href="{stylesheet_href}"?>' not in sitemap_source:
        errors.append(f"sitemap.xml: missing stylesheet {stylesheet_href}")
    try:
        ET.parse(ROOT / "sitemap.xsl")
    except (OSError, ET.ParseError) as exc:
        errors.append(f"sitemap.xsl: {exc}")

    sitemap_urls = {
        loc.text or "" for loc in tree.findall("sm:url/sm:loc", NS)
    }
    expected_urls = {BASE + slug for slug in content_slugs()}
    for url in sorted(expected_urls - sitemap_urls):
        errors.append(f"sitemap.xml: missing {url}")
    for url in sorted(sitemap_urls - expected_urls):
        errors.append(f"sitemap.xml: unexpected {url}")

    for locale_dir in sorted(path for path in ROOT.iterdir() if path.is_dir() and len(path.name) == 2):
        homepage = locale_dir / "index.html"
        if not homepage.is_file():
            continue
        source = homepage.read_text(encoding="utf-8")
        localized_home = f'/classly/{locale_dir.name}/'
        required_fragments = (
            f'href="{localized_home}#features"',
            f'href="{localized_home}#download"',
            f'href="{localized_home}privacy/"',
            f'href="{localized_home}terms/"',
            'class="reviews"',
            'id="how-it-works"',
            'assets/engagement.js',
        )
        for fragment in required_fragments:
            if fragment not in source:
                errors.append(f"{locale_dir.name}/index.html: missing {fragment}")

    pages: dict[str, tuple[pathlib.Path, PageParser]] = {}
    for url in sorted(sitemap_urls):
        path = local_path(url)
        if path is None or not path.is_file():
            errors.append(f"sitemap.xml: URL has no local file: {url}")
            continue
        parser = parse_page(path, errors)
        if parser:
            pages[url] = (path, parser)

    for url, (path, parser) in pages.items():
        label = str(path.relative_to(ROOT))
        if parser.h1_count != 1:
            errors.append(f"{label}: expected exactly 1 <h1>, found {parser.h1_count}")
        if not parser.title:
            errors.append(f"{label}: missing <title>")
        elif len(parser.title) > 65:
            errors.append(f"{label}: title is {len(parser.title)} characters (max 65)")
        if parser.description is None:
            errors.append(f"{label}: missing meta description")
        elif len(parser.description) > 160:
            errors.append(f"{label}: description is {len(parser.description)} characters (max 160)")
        if parser.base_href:
            errors.append(f"{label}: unexpected <base> can break localized relative links")
        if LANGUAGE_SCRIPT_URL not in parser.sources:
            errors.append(f"{label}: missing current language preference script {LANGUAGE_SCRIPT_URL}")

        for index, raw in enumerate(parser.json_ld, 1):
            try:
                json.loads(raw)
            except json.JSONDecodeError as exc:
                errors.append(f"{label}: invalid JSON-LD #{index}: {exc}")

        for reference in parser.hrefs + parser.sources:
            resolved = urllib.parse.urljoin(url, reference)
            target = local_path(resolved)
            if target is not None and not target.exists():
                errors.append(f"{label}: broken internal link {reference} -> {resolved}")

        for lang, target_url in parser.alternates.items():
            if lang == "x-default":
                continue
            other = pages.get(target_url)
            if other is None:
                errors.append(f"{label}: hreflang {lang} target is not in sitemap: {target_url}")
                continue
            other_alternates = other[1].alternates.values()
            if url not in other_alternates:
                errors.append(f"{label}: hreflang is not reciprocal with {target_url}")

    if errors:
        print(f"SEO checks failed ({len(errors)} error(s)):")
        for error in errors:
            print(f"- {error}")
        return 1
    print(f"SEO checks passed: {len(pages)} sitemap pages, all links and metadata valid.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
