#!/usr/bin/env node

/** Generate localized copies of the public, non-calculator pages. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  LOCALES,
  htmlStrings,
  localizeHtml,
  protectedText,
  translateStrings,
} from "./translate_blog.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "content");
const localeArg = process.argv.slice(2).find((arg) => arg.startsWith("--locales="));
const pageArg = process.argv.slice(2).find((arg) => arg.startsWith("--pages="));
const exportQueueArg = process.argv.slice(2).find((arg) => arg.startsWith("--export-browser-queue="));
const importQueueArg = process.argv.slice(2).find((arg) => arg.startsWith("--browser-queue="));
const importResultsArg = process.argv.slice(2).find((arg) => arg.startsWith("--import-browser-results="));
const allowPartialBrowserResults = process.argv.includes("--allow-partial-browser-results");
const normalizeOnly = process.argv.includes("--normalize-only");
const normalizeLinksOnly = process.argv.includes("--normalize-links-only");
const requested = localeArg
  ? localeArg.slice("--locales=".length).split(",").filter(Boolean)
  : Object.keys(LOCALES);
const ALL_PAGES = [
  { id: "home", source: "index.html", englishSlug: "", localizedSlug: (lang) => `${lang}/` },
  { id: "faq", source: "faq.html", englishSlug: "faq.html", localizedSlug: (lang) => `${lang}/faq/` },
  { id: "privacy", source: "privacy.html", englishSlug: "privacy.html", localizedSlug: (lang) => `${lang}/privacy/` },
  { id: "terms", source: "terms.html", englishSlug: "terms.html", localizedSlug: (lang) => `${lang}/terms/` },
  { id: "support", source: "support/index.html", englishSlug: "support/", localizedSlug: (lang) => `${lang}/support/` },
  { id: "whats-new", source: "whats-new/index.html", englishSlug: "whats-new/", localizedSlug: (lang) => `${lang}/whats-new/` },
  { id: "compare", source: "compare/index.html", englishSlug: "compare/", localizedSlug: (lang) => `${lang}/compare/` },
];
const requestedPages = pageArg
  ? new Set(pageArg.slice("--pages=".length).split(",").filter(Boolean))
  : new Set(ALL_PAGES.map((page) => page.id));
const unknownPages = [...requestedPages].filter((id) => !ALL_PAGES.some((page) => page.id === id));
if (unknownPages.length) throw new Error(`Unsupported page(s): ${unknownPages.join(", ")}`);
const PAGES = ALL_PAGES.filter((page) => requestedPages.has(page.id));
const BASE = "https://thiemjason-work.site/classly/";
const LANGUAGE_SCRIPT = '<script src="/classly/assets/language-preference.js?v=20261016-2" defer></script>';
const MENU_PATTERN = /<details class="language-menu">[\s\S]*?<\/details>/u;
const FAQ_SCHEMA_PATTERN = /<!-- faq-schema:start --><script type="application\/ld\+json">[\s\S]*?<\/script><!-- faq-schema:end -->/u;
const FAQ_CONTENT_PATTERN = /<!-- faq:start -->([\s\S]*?)<!-- faq:end -->/u;
const FAQ_FETCH_PATTERN = /\n\s*fetch\('assets\/faq\.json',[\s\S]*?\n\s*\}\);\n(?=\}\)\(\);)/u;
const FAQ_EMPTY_TEXT = "No questions match your search.";

for (const locale of requested) {
  if (!LOCALES[locale]) throw new Error(`Unsupported locale: ${locale}`);
}

function pageSlug(page, lang) {
  return lang === "en" ? page.englishSlug : page.localizedSlug(lang);
}

function languageMenu(page, current) {
  const items = ["en", ...Object.keys(LOCALES)].map((lang) => {
    const name = lang === "en" ? "English" : LOCALES[lang].name;
    const currentAttributes = lang === current ? ' aria-current="page"' : "";
    const check = lang === current ? '<span class="language-check" aria-hidden="true">✓</span>' : "";
    return `<a href="/classly/${pageSlug(page, lang)}" hreflang="${lang}" lang="${lang}"${currentAttributes}>`
      + `<span class="language-code">${lang.toUpperCase()}</span><span>${name}</span>${check}</a>`;
  });
  const currentName = current === "en" ? "English" : LOCALES[current].name;
  return '<details class="language-menu"><summary aria-label="Change language">'
    + '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/>'
    + '<path d="M3 12h18M12 3c2.4 2.5 3.7 5.5 3.7 9S14.4 18.5 12 21c-2.4-2.5-3.7-5.5-3.7-9S9.6 5.5 12 3Z"/></svg>'
    + `<span>${currentName}</span></summary><div class="language-popover">${items.join("")}</div></details>`;
}

function alternates(page) {
  const links = ["en", ...Object.keys(LOCALES)].map((lang) =>
    `  <link rel="alternate" hreflang="${lang}" href="${BASE}${pageSlug(page, lang)}">`,
  );
  links.push(`  <link rel="alternate" hreflang="x-default" href="${BASE}${page.englishSlug}">`);
  return links.join("\n");
}

function injectMenu(document, page, current) {
  const menu = languageMenu(page, current);
  if (MENU_PATTERN.test(document)) return document.replace(MENU_PATTERN, menu);
  return document.replace(/(<header>[\s\S]*?<div class="links">)([\s\S]*?)(<\/div>\s*<\/nav>\s*<\/header>)/u,
    (whole, start, links, end) => `${start}${links}${menu}${end}`);
}

function ensureHead(document, page, current) {
  const slug = pageSlug(page, current);
  let result = document
    .replace(/\s*<base href="[^"]*">/gu, "")
    .replace(/<html lang="[^"]+">/u, `<html lang="${current}">`)
    .replace(/<link rel="canonical" href="[^"]+">/u, `<link rel="canonical" href="${BASE}${slug}">`)
    .replace(/<meta property="og:url" content="[^"]+">/u, `<meta property="og:url" content="${BASE}${slug}">`)
    .replace(/<script src="\/classly\/assets\/language-preference\.js(?:\?v=[^"]*)?" defer><\/script>/u, LANGUAGE_SCRIPT)
    .replace(/\s*<link rel="alternate" hreflang="[^"]+" href="[^"]+">/gu, "")
    .replace(/(\s*<link rel="canonical")/u, `\n${alternates(page)}$1`);
  if (!result.includes("language-preference.js")) {
    result = result.replace(/<\/head>/u, `  ${LANGUAGE_SCRIPT}\n</head>`);
  }
  return result;
}

function metadataStrings(document) {
  const values = [];
  for (const match of document.matchAll(/<meta (?:name="description"|property="og:(?:title|description|image:alt)") content="([^"]+)"/gu)) {
    values.push(match[1]);
  }
  return values;
}

function translateMetadata(document, translations) {
  return document.replace(
    /(<meta (?:name="description"|property="og:(?:title|description|image:alt)") content=")([^"]+)(")/gu,
    (whole, before, value, after) => `${before}${translations.get(value) || value}${after}`,
  );
}

function clampText(value, maxLength) {
  if (!value || value.length <= maxLength) return value;
  const room = maxLength - 1;
  const candidate = value.slice(0, room + 1);
  const lastSpace = candidate.lastIndexOf(" ");
  const cutAt = lastSpace >= Math.floor(room * 0.65) ? lastSpace : room;
  return `${candidate.slice(0, cutAt).replace(/[\s,;:.-]+$/u, "")}…`;
}

function normalizeMetadata(document) {
  return document
    .replace(/(<title>)([\s\S]*?)(<\/title>)/u, (whole, before, value, after) =>
      `${before}${clampText(value, 65)}${after}`)
    .replace(/(<meta name="description" content=")([^"]+)(")/u, (whole, before, value, after) =>
      `${before}${clampText(value, 160)}${after}`)
    .replace(/(<meta property="og:title" content=")([^"]+)(")/u, (whole, before, value, after) =>
      `${before}${clampText(value, 65)}${after}`)
    .replace(/(<meta property="og:description" content=")([^"]+)(")/u, (whole, before, value, after) =>
      `${before}${clampText(value, 160)}${after}`);
}

function htmlText(value) {
  return value
    .replace(/<[^>]+>/gu, "")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .trim();
}

function localizeFaqRuntime(document, emptyMessage) {
  const content = document.match(FAQ_CONTENT_PATTERN)?.[1];
  if (!content) throw new Error("Could not find localized FAQ content.");
  const mainEntity = [...content.matchAll(
    /<details\b[^>]*>\s*<summary>([\s\S]*?)<\/summary>\s*<div class="answer">([\s\S]*?)<\/div>\s*<\/details>/gu,
  )].map((match) => ({
    "@type": "Question",
    name: htmlText(match[1]),
    acceptedAnswer: { "@type": "Answer", text: match[2].trim() },
  }));
  if (!mainEntity.length) throw new Error("Could not build localized FAQ structured data.");
  const schema = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity });
  const staticRuntime = `
  var staticCategories = Array.from(list.querySelectorAll('.faq-group')).map(function (group) {
    return { id: group.dataset.category, title: group.querySelector('h2').textContent };
  });
  renderChips({ categories: staticCategories });
  list.querySelectorAll('details').forEach(function (details) {
    details.addEventListener('toggle', function () {
      if (details.open) history.replaceState(null, '', '#' + details.id);
    });
  });
  var empty = document.createElement('p');
  empty.className = 'faq-status';
  empty.id = 'faq-empty';
  empty.hidden = true;
  empty.textContent = ${JSON.stringify(emptyMessage)};
  list.appendChild(empty);
  openFromHash();
`;
  return document
    .replace(FAQ_SCHEMA_PATTERN, `<!-- faq-schema:start --><script type="application/ld+json">${schema}</script><!-- faq-schema:end -->`)
    .replace(FAQ_FETCH_PATTERN, `\n${staticRuntime}`);
}

function localizeLinks(document, locale, page) {
  const site = JSON.parse(fs.readFileSync(path.join(CONTENT, locale, "site.json"), "utf8"));
  const localizedHome = `/classly/${locale}/`;
  const internalRoutes = [
    { sources: ["../tools/", "tools/", site.hub.slug], target: `/classly/${site.hub.slug}` },
    { sources: ["../blog/", "blog/", `${locale}/blog/`], target: `${localizedHome}blog/` },
    { sources: ["../faq.html", "faq.html"], target: `${localizedHome}faq/` },
    { sources: ["../privacy.html", "privacy.html"], target: `${localizedHome}privacy/` },
    { sources: ["../terms.html", "terms.html"], target: `${localizedHome}terms/` },
    { sources: ["../support/", "support/"], target: `${localizedHome}support/` },
    { sources: ["../whats-new/", "whats-new/"], target: `${localizedHome}whats-new/` },
    { sources: ["../compare/", "compare/"], target: `${localizedHome}compare/` },
    { sources: ["../", "index.html"], target: localizedHome },
  ];
  let result = document
    .replace(/((?:href|src|srcset)=")\.\.\/assets\//gu, '$1/classly/assets/')
    .replace(/((?:href|src|srcset)=")assets\//gu, '$1/classly/assets/')
    .replace(/href="([^"]+)"/gu, (whole, href) => {
      for (const route of internalRoutes) {
        for (const source of route.sources) {
          if (href === source || href.startsWith(`${source}#`)) {
            return `href="${route.target}${href.slice(source.length)}"`;
          }
        }
      }
      if (["#top", "#features", "#how-it-works", "#download"].includes(href)) {
        return `href="${localizedHome}${href}"`;
      }
      return whole;
    });

  const englishStructuredUrl = `${BASE}${page.englishSlug}`;
  const localizedStructuredUrl = `${BASE}${pageSlug(page, locale)}`;
  result = result.replace(
    /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/gu,
    (whole, start, json, end) => `${start}${json.replaceAll(englishStructuredUrl, localizedStructuredUrl)}${end}`,
  );

  for (const kind of ["articles", "tools"]) {
    const englishDirectory = path.join(CONTENT, "en", kind);
    const localizedDirectory = path.join(CONTENT, locale, kind);
    if (!fs.existsSync(localizedDirectory)) continue;
    const english = fs.readdirSync(englishDirectory).filter((file) => file.endsWith(".html"))
      .map((file) => readSource(path.join(englishDirectory, file)).header);
    const localized = fs.readdirSync(localizedDirectory).filter((file) => file.endsWith(".html"))
      .map((file) => readSource(path.join(localizedDirectory, file)).header);
    const slugById = new Map(localized.map((item) => [item.id, item.slug]));
    for (const source of english) {
      const target = slugById.get(source.id);
      if (target) result = result.replaceAll(`href="${source.slug}"`, `href="${target}"`);
    }
  }
  const localePrefixes = [locale, ...Object.keys(LOCALES)]
    .filter((value, index, values) => values.indexOf(value) === index)
    .join("|");
  return result
    .replace(/((?:src|srcset)=")screenshots\//gu, '$1/classly/screenshots/')
    .replace(new RegExp(`href="((?:${localePrefixes})/[^"#]*(?:#[^"]*)?)"`, "gu"), 'href="/classly/$1"');
}

function normalizeTranslatedSpacing(document, locale) {
  if (locale === "ja") return document;
  const tokens = document.split(/(<[^>]+>)/gu);
  const protectedTags = [];
  return tokens.map((token) => {
    if (token.startsWith("<")) {
      const closing = token.match(/^<\/([a-z][\w-]*)\b/iu)?.[1]?.toLowerCase();
      if (closing && protectedTags.at(-1) === closing) protectedTags.pop();
      const opening = token.match(/^<([a-z][\w-]*)\b/iu)?.[1]?.toLowerCase();
      if (opening && ["code", "pre", "script", "style"].includes(opening) && !/\/>$/u.test(token)) {
        protectedTags.push(opening);
      }
      return token;
    }
    return protectedTags.length
      ? token
      : token
        .replace(/([.!?])(?=\p{Lu})/gu, "$1 ")
        .replace(/([.!?])(?=[\uAC00-\uD7AF])/gu, "$1 ")
        .replace(/([.!?])(?=[\u0900-\u097F])/gu, "$1 ")
        .replace(/।(?=\S)/gu, "। ");
  }).join("");
}

function readSource(file) {
  const raw = fs.readFileSync(file, "utf8");
  const [header] = raw.split("\n---\n", 1);
  return { header: JSON.parse(header) };
}

function outputPath(page, locale) {
  return path.join(ROOT, page.localizedSlug(locale), "index.html");
}

const CACHE_PATH = process.env.CLASSLY_TRANSLATION_CACHE
  || path.join(os.tmpdir(), "classly-blog-translation-cache.json");

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function collectSelectedSourceStrings() {
  const values = [];
  for (const page of PAGES) {
    const english = fs.readFileSync(path.join(ROOT, page.source), "utf8");
    const protectedDocument = ensureHead(injectMenu(english, page, "en"), page, "en")
      .replace(MENU_PATTERN, '<div data-classly-language-menu="placeholder"></div>');
    values.push(...htmlStrings(protectedDocument), ...metadataStrings(protectedDocument));
    if (page.id === "faq") values.push(FAQ_EMPTY_TEXT);
  }
  return [...new Set(values.filter((value) => typeof value === "string" && /\p{L}/u.test(value)))];
}

function browserProtectedText(value) {
  const prepared = protectedText(value);
  return {
    ...prepared,
    masked: prepared.masked.replace(
      /https:\/\/classly\.invalid\/ph\/(\d{4})/gu,
      "CLASSLYPH$1TOKEN",
    ),
  };
}

function restoreBrowserProtected(value, kept) {
  let result = value;
  kept.forEach((original, index) => {
    const token = `CLASSLYPH${String(index).padStart(4, "0")}TOKEN`;
    result = result.split(token).join(original);
  });
  return result;
}

function exportBrowserQueue(destination) {
  const cache = readCache();
  const values = collectSelectedSourceStrings();
  const batchCharacterLimit = Number(process.env.CLASSLY_BROWSER_BATCH_CHARS || 2200);
  const queue = [];
  for (const locale of requested) {
    const missing = values.filter((value) => {
      const cached = cache[`${locale}\u0000${value}`];
      return cached === undefined || /classly\.invalid\/ph\/\d{4}|CLASSLYPH\d{4}TOKEN/u.test(cached);
    });
    let batch = [];
    let size = 0;
    const flush = () => {
      if (!batch.length) return;
      const prepared = batch.map((value) => browserProtectedText(value));
      const text = prepared.map((entry, index) => {
        const boundary = index === 0
          ? ""
          : `\nhttps://classly.invalid/segment/${String(index).padStart(4, "0")}\n`;
        return boundary + entry.masked;
      }).join("");
      queue.push({ id: queue.length, locale, originals: batch, text });
      batch = [];
      size = 0;
    };
    for (const value of missing) {
      const addition = value.length + 40;
      if (batch.length && size + addition > batchCharacterLimit) flush();
      batch.push(value);
      size += addition;
    }
    flush();
  }
  fs.writeFileSync(destination, `${JSON.stringify(queue)}\n`);
  console.log(`Exported ${queue.length} browser translation batch(es) to ${destination}.`);
}

function importBrowserResults(queuePath, resultsPath, allowPartial = false) {
  const queue = JSON.parse(fs.readFileSync(queuePath, "utf8"));
  const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
  const translatedById = new Map(results.map((item) => [item.id, item.translated]));
  const cache = readCache();
  const items = allowPartial ? queue.filter((item) => translatedById.has(item.id)) : queue;
  for (const item of items) {
    const translated = translatedById.get(item.id);
    if (typeof translated !== "string") throw new Error(`Missing browser result for batch ${item.id}.`);
    const parts = translated.split(/\s*https:\/\/classly\.invalid\/segment\/\d{4}\s*/u);
    if (parts.length !== item.originals.length) {
      if (allowPartial) {
        console.warn(`Skipping browser result ${item.id}: ${parts.length} segment(s), expected ${item.originals.length}.`);
        continue;
      }
      throw new Error(`Browser result ${item.id} has ${parts.length} segment(s), expected ${item.originals.length}.`);
    }
    item.originals.forEach((original, index) => {
      const { kept } = browserProtectedText(original);
      cache[`${item.locale}\u0000${original}`] = restoreBrowserProtected(parts[index].trim(), kept);
    });
  }
  fs.writeFileSync(CACHE_PATH, `${JSON.stringify(cache)}\n`);
  console.log(`Imported ${results.length} browser translation batch(es) into ${CACHE_PATH}.`);
}

if (exportQueueArg) {
  exportBrowserQueue(exportQueueArg.slice("--export-browser-queue=".length));
  process.exit(0);
}

if (importResultsArg) {
  if (!importQueueArg) throw new Error("--browser-queue is required when importing browser results.");
  importBrowserResults(
    importQueueArg.slice("--browser-queue=".length),
    importResultsArg.slice("--import-browser-results=".length),
    allowPartialBrowserResults,
  );
  process.exit(0);
}

if (normalizeOnly) {
  for (const page of PAGES) {
    for (const locale of requested) {
      const destination = outputPath(page, locale);
      if (fs.existsSync(destination)) {
        fs.writeFileSync(destination, normalizeMetadata(fs.readFileSync(destination, "utf8")));
      }
    }
  }
  console.log("Existing localized page metadata normalized.");
  process.exit(0);
}

if (normalizeLinksOnly) {
  for (const page of PAGES) {
    for (const locale of requested) {
      const destination = outputPath(page, locale);
      if (!fs.existsSync(destination)) continue;
      let localized = fs.readFileSync(destination, "utf8");
      localized = ensureHead(localized, page, locale);
      localized = injectMenu(localized, page, locale);
      localized = localizeLinks(localized, locale, page);
      localized = normalizeTranslatedSpacing(localized, locale);
      fs.writeFileSync(destination, localized);
    }
  }
  console.log("Existing localized page links normalized.");
  process.exit(0);
}

for (const page of PAGES) {
  const sourcePath = path.join(ROOT, page.source);
  let english = fs.readFileSync(sourcePath, "utf8");
  english = ensureHead(injectMenu(english, page, "en"), page, "en");
  fs.writeFileSync(sourcePath, english);

  const protectedDocument = english.replace(MENU_PATTERN, '<div data-classly-language-menu="placeholder"></div>');
  const sourceStrings = [...htmlStrings(protectedDocument), ...metadataStrings(protectedDocument)];
  if (page.id === "faq") sourceStrings.push(FAQ_EMPTY_TEXT);
  for (const locale of requested) {
    console.log(`[${locale}] translating ${page.id}`);
    const translations = translateStrings(sourceStrings, locale);
    let localized = localizeHtml(protectedDocument, locale)
      .replace('<div data-classly-language-menu="placeholder"></div>', languageMenu(page, locale));
    localized = translateMetadata(localized, translations);
    localized = normalizeMetadata(ensureHead(localized, page, locale));
    localized = localizeLinks(localized, locale, page);
    localized = normalizeTranslatedSpacing(localized, locale);
    if (page.id === "faq") {
      localized = localizeFaqRuntime(localized, translations.get(FAQ_EMPTY_TEXT) || FAQ_EMPTY_TEXT);
    }
    localized = localized.replace(/<!-- Generated by tools\/translate_static_pages\.mjs[^>]*-->\s*/u, "");
    localized = localized.replace(/<body>/u, '<body>\n<!-- Generated by tools/translate_static_pages.mjs; edit the English page and rerun. -->');
    const destination = outputPath(page, locale);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, localized);
  }
}

console.log("Static page translations complete.");
