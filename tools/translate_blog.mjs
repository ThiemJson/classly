#!/usr/bin/env node

/**
 * Translate the English Classly blog sources into every supported app locale.
 *
 * The script deliberately translates content sources, never generated pages.
 * It preserves HTML tags, code samples, template placeholders and URLs, then
 * build_seo_pages.py turns the sources into pages, hreflang tags and sitemap
 * entries.
 *
 * Usage:
 *   node tools/translate_blog.mjs
 *   node tools/translate_blog.mjs --locales vi,es
 *
 * Existing article IDs are not overwritten. Delete an individual translated
 * source first if it needs to be regenerated.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "content");
const CACHE_PATH = process.env.CLASSLY_TRANSLATION_CACHE
  || path.join(os.tmpdir(), "classly-blog-translation-cache.json");
const TRANSLATOR_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0";
let bingConfig;

const LOCALES = {
  de: { name: "Deutsch", og: "de_DE", hub: "de/werkzeuge/" },
  es: { name: "Español", og: "es_ES", hub: "es/herramientas/" },
  fr: { name: "Français", og: "fr_FR", hub: "fr/outils/" },
  hi: { name: "हिन्दी", og: "hi_IN", hub: "hi/tools/" },
  id: { name: "Bahasa Indonesia", og: "id_ID", hub: "id/alat/" },
  it: { name: "Italiano", og: "it_IT", hub: "it/strumenti/" },
  ja: { name: "日本語", og: "ja_JP", hub: "ja/tools/" },
  ko: { name: "한국어", og: "ko_KR", hub: "ko/tools/" },
  pl: { name: "Polski", og: "pl_PL", hub: "pl/narzedzia/" },
  pt: { name: "Português", og: "pt_BR", hub: "pt/ferramentas/" },
  ru: { name: "Русский", og: "ru_RU", hub: "ru/instrumenty/" },
  tr: { name: "Türkçe", og: "tr_TR", hub: "tr/araclar/" },
  vi: { name: "Tiếng Việt", og: "vi_VN", hub: "vi/cong-cu/" },
};
const GENERATED_SITE_LOCALES = new Set(["de", "it", "ja", "ko", "pl", "ru"]);
const UNICODE_SLUG_LOCALES = new Set(["hi", "ja", "ko"]);

const ARTICLE_WORDS = {
  updated_label: "Updated",
  sources_heading: "Sources",
  blog_intro: "Practical answers for attendance and study planning.",
  blog_description: "Practical answers for attendance, classes and study planning.",
  empty: "No articles yet.",
};

const args = process.argv.slice(2);
const localeArg = args.find((arg) => arg.startsWith("--locales="));
const forceSites = args.includes("--force-sites");
const requested = localeArg
  ? localeArg.slice("--locales=".length).split(",").filter(Boolean)
  : Object.keys(LOCALES);
for (const locale of requested) {
  if (!LOCALES[locale]) throw new Error(`Unsupported locale: ${locale}`);
  if (forceSites && !GENERATED_SITE_LOCALES.has(locale)) {
    throw new Error(`Refusing to overwrite the hand-maintained ${locale} site config.`);
  }
}

let cache = {};
try {
  cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
} catch {
  cache = {};
}

function saveCache() {
  fs.writeFileSync(CACHE_PATH, `${JSON.stringify(cache)}\n`);
}

function readArticle(file) {
  const raw = fs.readFileSync(file, "utf8");
  const marker = "\n---\n";
  const splitAt = raw.indexOf(marker);
  if (splitAt < 0) throw new Error(`Missing article separator: ${file}`);
  return {
    header: JSON.parse(raw.slice(0, splitAt)),
    body: raw.slice(splitAt + marker.length).trim(),
  };
}

function protectedText(value) {
  const kept = [];
  const masked = value.replace(
    /\{[^{}]+\}|Classly|App Store|Google Play|Google Sheets|Excel|ECTS|FAQ|https?:\/\/\S+/g,
    (match) => {
      const token = `https://classly.invalid/ph/${String(kept.length).padStart(4, "0")}`;
      kept.push(match);
      return token;
    },
  );
  return { masked, kept };
}

function restoreProtected(value, kept) {
  let result = value;
  kept.forEach((original, index) => {
    const token = `https://classly.invalid/ph/${String(index).padStart(4, "0")}`;
    result = result.split(token).join(original);
  });
  return result;
}

function refreshBingConfig() {
  const result = spawnSync(
    "curl",
    [
      "-sS", "-L", "--fail-with-body", "--retry", "5", "--retry-all-errors",
      "--connect-timeout", "10", "--max-time", "90",
      "-H", `User-Agent: ${TRANSLATOR_USER_AGENT}`,
      "https://www.bing.com/translator?ref=TThis&edgepdftranslator=1",
    ],
    { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
  );
  if (result.status !== 0) throw new Error(`Could not open Bing Translator: ${result.stderr.trim()}`);
  const html = result.stdout;
  const ig = html.match(/IG:"([^"]+)"/u)?.[1];
  const iid = html.match(/data-iid="([^"]+)"/u)?.[1];
  const auth = html.match(/params_AbusePreventionHelper\s*=\s*(\[[^\]]+\])/u)?.[1];
  if (!ig || !iid || !auth) throw new Error("Could not read the Bing Translator session.");
  const [key, token, expiresIn] = JSON.parse(auth);
  bingConfig = { ig, iid, key, token, expiresIn, fetchedAt: Date.now(), count: 0 };
}

function requestTranslation(text, locale) {
  let lastError = "unknown response";
  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (attempt) {
      const delay = Math.min(5000 * (2 ** (attempt - 1)), 40000);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay);
    }
    if (!bingConfig || Date.now() - bingConfig.fetchedAt > bingConfig.expiresIn - 60000) {
      refreshBingConfig();
    }
    bingConfig.count += 1;
    const requestUrl = "https://www.bing.com/ttranslatev3?isVertical=1"
      + `&IG=${encodeURIComponent(bingConfig.ig)}`
      + `&IID=${encodeURIComponent(bingConfig.iid)}`
      + `&SFX=${bingConfig.count}&ref=TThis&edgepdftranslator=1`;
    const result = spawnSync(
      "curl",
      [
        "-sS",
        "-L",
        "--fail-with-body",
        "--retry",
        "5",
        "--retry-all-errors",
        "--retry-delay", "2",
        "--connect-timeout",
        "10",
        "--max-time",
        "90",
        "-H", "Referer: https://www.bing.com/translator",
        "-H", `User-Agent: ${TRANSLATOR_USER_AGENT}`,
        requestUrl,
        "--data-urlencode", "fromLang=en",
        "--data-urlencode", `to=${locale}`,
        "--data-urlencode", `text=${text}`,
        "--data-urlencode", `token=${bingConfig.token}`,
        "--data-urlencode", `key=${bingConfig.key}`,
        "--data-urlencode", "tryFetchingGenderDebiasedTranslations=true",
      ],
      { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
    );
    if (result.status !== 0) {
      lastError = result.stderr.trim() || result.stdout.slice(0, 200);
      continue;
    }
    try {
      const payload = JSON.parse(result.stdout);
      const translated = payload?.[0]?.translations?.[0]?.text;
      if (!translated) throw new Error("Translation text is missing.");
      return translated;
    } catch {
      lastError = result.stdout.slice(0, 200);
      bingConfig = undefined;
    }
  }
  throw new Error(`Translation request failed after retries (${locale}): ${lastError}`);
}

function translateChunk(entries, locale) {
  const prepared = entries.map((entry) => protectedText(entry));
  const joined = prepared
    .map((entry, index) => {
      const boundary = index === 0
        ? ""
        : `\n[[[CLASSLY_SEGMENT_${String(index).padStart(4, "0")}]]]\n`;
      return boundary + entry.masked;
    })
    .join("");
  const translated = requestTranslation(joined, locale);
  const parts = translated.split(/\s*\[\[\[CLASSLY_SEGMENT_\d{4}\]\]\]\s*/u);
  if (parts.length !== entries.length) {
    if (entries.length === 1) return [restoreProtected(translated.trim(), prepared[0].kept)];
    return entries.flatMap((entry) => translateChunk([entry], locale));
  }
  return parts.map((part, index) => restoreProtected(part.trim(), prepared[index].kept));
}

function translateStrings(values, locale) {
  const unique = [...new Set(values.filter((value) => typeof value === "string" && /\p{L}/u.test(value)))];
  const missing = unique.filter((value) => cache[`${locale}\u0000${value}`] === undefined);
  let batch = [];
  let size = 0;
  const flush = () => {
    if (!batch.length) return;
    const translated = translateChunk(batch, locale);
    batch.forEach((value, index) => {
      cache[`${locale}\u0000${value}`] = translated[index];
    });
    saveCache();
    batch = [];
    size = 0;
  };
  for (const value of missing) {
    const addition = value.length + 40;
    if (batch.length && size + addition > 2200) flush();
    batch.push(value);
    size += addition;
  }
  flush();
  return new Map(unique.map((value) => [value, cache[`${locale}\u0000${value}`] ?? value]));
}

function localizeHtml(body, locale) {
  const tokens = body.split(/(<[^>]+>)/gu);
  const textIndexes = [];
  const attributeIndexes = [];
  const values = [];
  let protectedDepth = 0;
  tokens.forEach((token, index) => {
    if (token.startsWith("<")) {
      for (const match of token.matchAll(/\b(alt|title|aria-label)="([^"]*\p{L}[^"]*)"/giu)) {
        attributeIndexes.push({ index, name: match[1], original: match[2] });
        values.push(match[2]);
      }
      if (/^<\/(?:code|pre|script|style)\b/iu.test(token)) protectedDepth = Math.max(0, protectedDepth - 1);
      else if (/^<(?:code|pre|script|style)\b/iu.test(token) && !/\/>$/u.test(token)) protectedDepth += 1;
      return;
    }
    if (protectedDepth || !/\p{L}/u.test(token)) return;
    const leading = token.match(/^\s*/u)?.[0] || "";
    const trailing = token.match(/\s*$/u)?.[0] || "";
    const core = token.slice(leading.length, token.length - trailing.length || undefined);
    if (!core) return;
    textIndexes.push({ index, leading, trailing, core });
    values.push(core);
  });
  const translated = translateStrings(values, locale);
  textIndexes.forEach(({ index, leading, trailing, core }) => {
    tokens[index] = leading + (translated.get(core) || core) + trailing;
  });
  attributeIndexes.forEach(({ index, name, original }) => {
    const localized = (translated.get(original) || original).replaceAll('"', "&quot;");
    tokens[index] = tokens[index].replace(`${name}="${original}"`, `${name}="${localized}"`);
  });
  return tokens.join("");
}

function htmlStrings(body) {
  const tokens = body.split(/(<[^>]+>)/gu);
  const values = [];
  let protectedDepth = 0;
  for (const token of tokens) {
    if (token.startsWith("<")) {
      for (const match of token.matchAll(/\b(?:alt|title|aria-label)="([^"]*\p{L}[^"]*)"/giu)) {
        values.push(match[1]);
      }
      if (/^<\/(?:code|pre|script|style)\b/iu.test(token)) protectedDepth = Math.max(0, protectedDepth - 1);
      else if (/^<(?:code|pre|script|style)\b/iu.test(token) && !/\/>$/u.test(token)) protectedDepth += 1;
      continue;
    }
    if (protectedDepth || !/\p{L}/u.test(token)) continue;
    const core = token.trim();
    if (core) values.push(core);
  }
  return values;
}

function rewriteInternalArticleLinks(locale) {
  const englishDirectory = path.join(CONTENT, "en", "articles");
  const englishSlugToId = new Map(
    fs.readdirSync(englishDirectory)
      .filter((file) => file.endsWith(".html"))
      .map((file) => readArticle(path.join(englishDirectory, file)).header)
      .map((header) => [header.slug, header.id]),
  );
  const directory = path.join(CONTENT, locale, "articles");
  const localizedFiles = fs.readdirSync(directory).filter((file) => file.endsWith(".html"));
  const localizedHeaders = localizedFiles
    .map((file) => readArticle(path.join(directory, file)).header);
  const localizedSlugById = new Map(localizedHeaders.map((header) => [header.id, header.slug]));
  const legacySlugToId = new Map(localizedHeaders.map((header) => [
    `${locale}/blog/${legacySlugify(header.h1)}/`,
    header.id,
  ]));
  for (const file of localizedFiles) {
    const fullPath = path.join(directory, file);
    let raw = fs.readFileSync(fullPath, "utf8");
    for (const [englishSlug, id] of englishSlugToId) {
      const localizedSlug = localizedSlugById.get(id);
      if (localizedSlug) {
        raw = raw.split(`href="/classly/${englishSlug}"`).join(`href="/classly/${localizedSlug}"`);
      }
    }
    for (const [legacySlug, id] of legacySlugToId) {
      const localizedSlug = localizedSlugById.get(id);
      if (localizedSlug) {
        raw = raw.split(`href="/classly/${legacySlug}"`).join(`href="/classly/${localizedSlug}"`);
      }
    }
    fs.writeFileSync(fullPath, raw);
  }
}

function collectSiteStrings(value, output = []) {
  if (typeof value === "string") {
    if (!value.startsWith("/") && /\p{L}/u.test(value)) output.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectSiteStrings(item, output));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectSiteStrings(item, output));
  }
  return output;
}

function translatedClone(value, translations) {
  if (typeof value === "string") return translations.get(value) || value;
  if (Array.isArray(value)) return value.map((item) => translatedClone(item, translations));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, translatedClone(item, translations)]));
  }
  return value;
}

function clampText(value, maxLength) {
  if (value.length <= maxLength) return value;
  const room = maxLength - 1;
  const candidate = value.slice(0, room + 1);
  const lastSpace = candidate.lastIndexOf(" ");
  const cutAt = lastSpace >= Math.floor(room * 0.65) ? lastSpace : room;
  return `${candidate.slice(0, cutAt).replace(/[\s,;:.-]+$/u, "")}…`;
}

function clampTitle(value) {
  const suffix = value.endsWith("· Classly") ? " · Classly" : "";
  if (!suffix) return clampText(value, 65);
  const main = value.slice(0, -"· Classly".length).trim();
  return `${clampText(main, 65 - suffix.length)}${suffix}`;
}

function ensureSite(locale, englishSite) {
  const directory = path.join(CONTENT, locale);
  const file = path.join(directory, "site.json");
  fs.mkdirSync(directory, { recursive: true });
  let site;
  if (fs.existsSync(file) && !forceSites) {
    site = JSON.parse(fs.readFileSync(file, "utf8"));
  } else {
    const strings = collectSiteStrings(englishSite);
    const translations = translateStrings(strings, locale);
    site = translatedClone(englishSite, translations);
    site.language_name = LOCALES[locale].name;
    site.og_locale = LOCALES[locale].og;
    site.hub.slug = LOCALES[locale].hub;
    const toolsLink = site.nav.footer.find((item) => item[1] === "/classly/tools/");
    if (toolsLink) toolsLink[1] = `/classly/${site.hub.slug}`;
  }
  if (!site.article) {
    const translations = translateStrings(Object.values(ARTICLE_WORDS), locale);
    site.article = Object.fromEntries(
      Object.entries(ARTICLE_WORDS).map(([key, value]) => [key, translations.get(value) || value]),
    );
  }
  site.hub.title = clampTitle(site.hub.title);
  site.hub.description = clampText(site.hub.description, 160);
  fs.writeFileSync(file, `${JSON.stringify(site, null, 2)}\n`);
}

function placeholderSignature(value) {
  return [...String(value).matchAll(/\{[^{}]+\}/gu)].map((match) => match[0]).sort().join("|");
}

function validateSitePlaceholders(source, localized, trail = []) {
  if (typeof source === "string") {
    if (placeholderSignature(source) !== placeholderSignature(localized)) {
      throw new Error(`Placeholder mismatch in ${trail.join(".")}: ${localized}`);
    }
    return;
  }
  if (Array.isArray(source)) {
    source.forEach((item, index) => validateSitePlaceholders(item, localized[index], [...trail, index]));
    return;
  }
  if (source && typeof source === "object") {
    for (const [key, value] of Object.entries(source)) {
      validateSitePlaceholders(value, localized[key], [...trail, key]);
    }
  }
}

function articleStrings(header) {
  const values = [header.title, header.description, header.h1, header.answer];
  for (const source of header.sources || []) values.push(source.title);
  for (const item of header.faq || []) values.push(item.q, item.a);
  return values;
}

function localizedHeader(header, locale, translations) {
  const copy = structuredClone(header);
  for (const key of ["title", "description", "h1", "answer"]) {
    copy[key] = translations.get(header[key]) || header[key];
  }
  copy.sources = (header.sources || []).map((source) => ({
    ...source,
    title: translations.get(source.title) || source.title,
  }));
  copy.faq = (header.faq || []).map((item) => ({
    q: translations.get(item.q) || item.q,
    a: translations.get(item.a) || item.a,
  }));
  copy.slug = `${locale}/blog/${slugify(copy.h1)}/`;
  return copy;
}

function slugify(value) {
  const slug = value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{Letter}\p{Number}\p{Mark}]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 100)
    .replace(/-+$/u, "");
  return slug || "article";
}

function legacySlugify(value) {
  const slug = value
    .normalize("NFKD")
    .replace(/\p{Mark}+/gu, "")
    .toLocaleLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 100)
    .replace(/-+$/u, "");
  return slug || "article";
}

function normalizeArticleMetadata(locale) {
  const directory = path.join(CONTENT, locale, "articles");
  for (const file of fs.readdirSync(directory).filter((name) => name.endsWith(".html"))) {
    const fullPath = path.join(directory, file);
    const article = readArticle(fullPath);
    const title = clampTitle(article.header.title);
    const description = clampText(article.header.description, 160);
    const slug = UNICODE_SLUG_LOCALES.has(locale)
      ? `${locale}/blog/${slugify(article.header.h1)}/`
      : article.header.slug;
    if (title === article.header.title && description === article.header.description && slug === article.header.slug) continue;
    article.header.title = title;
    article.header.description = description;
    article.header.slug = slug;
    fs.writeFileSync(fullPath, `${JSON.stringify(article.header, null, 2)}\n---\n${article.body}\n`);
  }
}

function existingArticleIds(locale) {
  const directory = path.join(CONTENT, locale, "articles");
  if (!fs.existsSync(directory)) return new Set();
  return new Set(
    fs.readdirSync(directory)
      .filter((file) => file.endsWith(".html"))
      .map((file) => readArticle(path.join(directory, file)).header.id),
  );
}

const englishSite = JSON.parse(fs.readFileSync(path.join(CONTENT, "en", "site.json"), "utf8"));
const englishFiles = fs.readdirSync(path.join(CONTENT, "en", "articles"))
  .filter((file) => file.endsWith(".html"))
  .sort();

for (const locale of requested) {
  console.log(`[${locale}] preparing site labels`);
  ensureSite(locale, englishSite);
  if (GENERATED_SITE_LOCALES.has(locale)) {
    validateSitePlaceholders(
      englishSite,
      JSON.parse(fs.readFileSync(path.join(CONTENT, locale, "site.json"), "utf8")),
    );
  }
  const directory = path.join(CONTENT, locale, "articles");
  fs.mkdirSync(directory, { recursive: true });
  const existing = existingArticleIds(locale);
  const pending = englishFiles
    .map((file) => ({ file, ...readArticle(path.join(CONTENT, "en", "articles", file)) }))
    .filter(({ header }) => !existing.has(header.id));
  console.log(`[${locale}] ${pending.length} article(s) to translate`);
  if (pending.length) {
    translateStrings(
      pending.flatMap((article) => [
        ...articleStrings(article.header),
        ...htmlStrings(article.body),
      ]),
      locale,
    );
  }
  for (const [index, article] of pending.entries()) {
    const translations = translateStrings(articleStrings(article.header), locale);
    const header = localizedHeader(article.header, locale, translations);
    const body = localizeHtml(article.body, locale);
    const output = path.join(directory, `${article.header.id}.html`);
    fs.writeFileSync(output, `${JSON.stringify(header, null, 2)}\n---\n${body}\n`);
    console.log(`[${locale}] ${index + 1}/${pending.length} ${article.header.id}`);
  }
  normalizeArticleMetadata(locale);
  rewriteInternalArticleLinks(locale);
}

console.log("Blog translations complete.");
