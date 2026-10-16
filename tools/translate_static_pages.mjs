#!/usr/bin/env node

/** Generate localized copies of the public, non-calculator pages. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LOCALES, htmlStrings, localizeHtml, translateStrings } from "./translate_blog.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "content");
const localeArg = process.argv.slice(2).find((arg) => arg.startsWith("--locales="));
const normalizeOnly = process.argv.includes("--normalize-only");
const requested = localeArg
  ? localeArg.slice("--locales=".length).split(",").filter(Boolean)
  : Object.keys(LOCALES);
const PAGES = [
  { id: "home", source: "index.html", englishSlug: "", localizedSlug: (lang) => `${lang}/` },
  { id: "faq", source: "faq.html", englishSlug: "faq.html", localizedSlug: (lang) => `${lang}/faq/` },
  { id: "privacy", source: "privacy.html", englishSlug: "privacy.html", localizedSlug: (lang) => `${lang}/privacy/` },
  { id: "terms", source: "terms.html", englishSlug: "terms.html", localizedSlug: (lang) => `${lang}/terms/` },
  { id: "support", source: "support/index.html", englishSlug: "support/", localizedSlug: (lang) => `${lang}/support/` },
  { id: "whats-new", source: "whats-new/index.html", englishSlug: "whats-new/", localizedSlug: (lang) => `${lang}/whats-new/` },
];
const BASE = "https://thiemjason-work.site/classly/";
const MENU_PATTERN = /<details class="language-menu">[\s\S]*?<\/details>/u;

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
    .replace(/<html lang="[^"]+">/u, `<html lang="${current}">`)
    .replace(/<link rel="canonical" href="[^"]+">/u, `<link rel="canonical" href="${BASE}${slug}">`)
    .replace(/<meta property="og:url" content="[^"]+">/u, `<meta property="og:url" content="${BASE}${slug}">`)
    .replace(/\s*<link rel="alternate" hreflang="[^"]+" href="[^"]+">/gu, "")
    .replace(/(\s*<link rel="canonical")/u, `\n${alternates(page)}$1`);
  if (!result.includes("language-preference.js")) {
    result = result.replace(/<\/head>/u, '  <script src="/classly/assets/language-preference.js" defer></script>\n</head>');
  }
  if (current !== "en" && !result.includes("<base ")) {
    result = result.replace(/(<meta name="viewport"[^>]*>)/u, '$1\n  <base href="/classly/">');
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

function localizeLinks(document, locale) {
  const site = JSON.parse(fs.readFileSync(path.join(CONTENT, locale, "site.json"), "utf8"));
  let result = document
    .replaceAll('href="tools/"', `href="${site.hub.slug}"`)
    .replaceAll('href="../tools/"', `href="${site.hub.slug}"`)
    .replaceAll('href="blog/"', `href="${locale}/blog/"`)
    .replaceAll('href="../blog/"', `href="${locale}/blog/"`);

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
  return result;
}

function readSource(file) {
  const raw = fs.readFileSync(file, "utf8");
  const [header] = raw.split("\n---\n", 1);
  return { header: JSON.parse(header) };
}

function outputPath(page, locale) {
  return path.join(ROOT, page.localizedSlug(locale), "index.html");
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

for (const page of PAGES) {
  const sourcePath = path.join(ROOT, page.source);
  let english = fs.readFileSync(sourcePath, "utf8");
  english = ensureHead(injectMenu(english, page, "en"), page, "en");
  fs.writeFileSync(sourcePath, english);

  const protectedDocument = english.replace(MENU_PATTERN, '<div data-classly-language-menu="placeholder"></div>');
  const sourceStrings = [...htmlStrings(protectedDocument), ...metadataStrings(protectedDocument)];
  for (const locale of requested) {
    console.log(`[${locale}] translating ${page.id}`);
    const translations = translateStrings(sourceStrings, locale);
    let localized = localizeHtml(protectedDocument, locale)
      .replace('<div data-classly-language-menu="placeholder"></div>', languageMenu(page, locale));
    localized = translateMetadata(localized, translations);
    localized = normalizeMetadata(ensureHead(localized, page, locale));
    localized = localizeLinks(localized, locale);
    localized = localized.replace(/<!-- Generated by tools\/translate_static_pages\.mjs[^>]*-->\s*/u, "");
    localized = localized.replace(/<body>/u, '<body>\n<!-- Generated by tools/translate_static_pages.mjs; edit the English page and rerun. -->');
    const destination = outputPath(page, locale);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, localized);
  }
}

console.log("Static page translations complete.");
