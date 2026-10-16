#!/usr/bin/env node

/** Fill every supported locale with the full English calculator set. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  LOCALES,
  htmlStrings,
  localizeHtml,
  readArticle,
  slugify,
  translateStrings,
} from "./translate_blog.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "content");
const localeArg = process.argv.slice(2).find((arg) => arg.startsWith("--locales="));
const requested = localeArg
  ? localeArg.slice("--locales=".length).split(",").filter(Boolean)
  : Object.keys(LOCALES);

for (const locale of requested) {
  if (!LOCALES[locale]) throw new Error(`Unsupported locale: ${locale}`);
}

const englishDirectory = path.join(CONTENT, "en", "tools");
const englishTools = fs.readdirSync(englishDirectory)
  .filter((file) => file.endsWith(".html"))
  .map((file) => ({ file, ...readArticle(path.join(englishDirectory, file)) }));

function headerStrings(header) {
  const values = [
    header.title,
    header.description,
    header.og_title,
    header.og_description,
    header.h1,
    header.card_title,
    header.card_text,
    ...htmlStrings(header.intro || ""),
  ];
  for (const widget of header.widgets || []) {
    if (widget.title) values.push(widget.title);
    if (widget.hint) values.push(widget.hint);
  }
  for (const item of header.faq || []) values.push(item.q, item.a);
  return values.filter(Boolean);
}

function localizedHeader(header, locale, translations) {
  const copy = structuredClone(header);
  for (const key of ["title", "description", "og_title", "og_description", "h1", "card_title", "card_text"]) {
    if (header[key]) copy[key] = translations.get(header[key]) || header[key];
  }
  copy.intro = localizeHtml(header.intro || "", locale);
  copy.widgets = (header.widgets || []).map((widget) => ({
    ...widget,
    ...(widget.title ? { title: translations.get(widget.title) || widget.title } : {}),
    ...(widget.hint ? { hint: translations.get(widget.hint) || widget.hint } : {}),
  }));
  copy.faq = (header.faq || []).map((item) => ({
    q: translations.get(item.q) || item.q,
    a: translations.get(item.a) || item.a,
  }));
  copy.slug = `${locale}/${slugify(copy.h1)}/`;
  copy.title = clampTitle(copy.title);
  copy.description = clampText(copy.description, 160);
  return copy;
}

function clampText(value, maxLength) {
  if (!value || value.length <= maxLength) return value;
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

function existingById(locale) {
  const directory = path.join(CONTENT, locale, "tools");
  if (!fs.existsSync(directory)) return new Map();
  return new Map(
    fs.readdirSync(directory)
      .filter((file) => file.endsWith(".html"))
      .map((file) => [readArticle(path.join(directory, file)).header.id, file]),
  );
}

for (const locale of requested) {
  const directory = path.join(CONTENT, locale, "tools");
  fs.mkdirSync(directory, { recursive: true });
  const existing = existingById(locale);
  const pending = englishTools.filter(({ header }) => !existing.has(header.id));
  console.log(`[${locale}] ${pending.length} calculator page(s) to translate`);
  if (pending.length) {
    translateStrings(
      pending.flatMap(({ header, body }) => [...headerStrings(header), ...htmlStrings(body)]),
      locale,
    );
  }
  for (const tool of pending) {
    const translations = translateStrings(headerStrings(tool.header), locale);
    const header = localizedHeader(tool.header, locale, translations);
    const body = localizeHtml(tool.body, locale);
    fs.writeFileSync(
      path.join(directory, tool.file),
      `${JSON.stringify(header, null, 2)}\n---\n${body}\n`,
    );
  }
  for (const file of fs.readdirSync(directory).filter((name) => name.endsWith(".html"))) {
    const fullPath = path.join(directory, file);
    const page = readArticle(fullPath);
    const title = clampTitle(page.header.title);
    const description = clampText(page.header.description, 160);
    if (title !== page.header.title || description !== page.header.description) {
      page.header.title = title;
      page.header.description = description;
      fs.writeFileSync(fullPath, `${JSON.stringify(page.header, null, 2)}\n---\n${page.body}\n`);
    }
  }
}

// Make every internal calculator link point to the matching localized page.
const englishSlugToId = new Map(englishTools.map(({ header }) => [header.slug, header.id]));
for (const locale of requested) {
  const directory = path.join(CONTENT, locale, "tools");
  const files = fs.readdirSync(directory).filter((file) => file.endsWith(".html"));
  const localized = files.map((file) => ({ file, ...readArticle(path.join(directory, file)) }));
  const slugById = new Map(localized.map(({ header }) => [header.id, header.slug]));
  for (const page of localized) {
    const fullPath = path.join(directory, page.file);
    let raw = fs.readFileSync(fullPath, "utf8");
    for (const [englishSlug, id] of englishSlugToId) {
      const target = slugById.get(id);
      if (target) raw = raw.split(`href="/classly/${englishSlug}"`).join(`href="/classly/${target}"`);
    }
    fs.writeFileSync(fullPath, raw);
  }
}

console.log("Calculator translations complete.");
