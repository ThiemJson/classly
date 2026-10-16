(function () {
  "use strict";

  var STORAGE_KEY = "classly.language";
  var menu = document.querySelector(".language-menu");
  if (!menu) return;

  var links = Array.prototype.slice.call(menu.querySelectorAll("a[hreflang]"));
  var byLanguage = new Map(links.map(function (link) {
    return [normalize(link.getAttribute("hreflang")), link];
  }));
  var current = normalize(document.documentElement.lang || "en");
  var saved = readPreference();

  links.forEach(function (link) {
    link.addEventListener("click", function () {
      writePreference(normalize(link.getAttribute("hreflang")));
    });
  });

  // An explicit localized URL wins over a previously saved preference. This
  // keeps shared/search URLs stable and also makes that locale the new choice.
  if (current !== "en" && saved !== current) {
    writePreference(current);
    saved = current;
  }

  // English is the x-default entry point. Reopen it in the visitor's explicit
  // saved language when this page has an exact translated counterpart.
  if (saved && saved !== current && byLanguage.has(saved)) {
    var savedTarget = byLanguage.get(saved);
    var target = new URL(savedTarget.href, window.location.href);
    target.search = window.location.search;
    target.hash = window.location.hash;
    window.location.replace(target.href);
    return;
  }

  // Browser language is a suggestion, never a forced redirect. This keeps
  // every localized URL stable for crawlers and lets the visitor decide.
  if (!saved) {
    var detected = detectLanguage();
    if (detected && detected !== current && byLanguage.has(detected)) {
      var suggested = byLanguage.get(detected);
      var badge = document.createElement("span");
      badge.className = "language-suggested";
      badge.textContent = "Suggested";
      suggested.appendChild(badge);
      suggested.setAttribute("data-suggested", "true");
      menu.classList.add("has-suggestion");
      menu.querySelector("summary").setAttribute(
        "aria-label",
        "Change language. " + suggested.lang + " suggested"
      );
    }
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase().split("-")[0];
  }

  function detectLanguage() {
    var candidates = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language];
    for (var index = 0; index < candidates.length; index += 1) {
      var code = normalize(candidates[index]);
      if (byLanguage.has(code)) return code;
    }
    return "";
  }

  function readPreference() {
    try {
      return normalize(window.localStorage.getItem(STORAGE_KEY));
    } catch (error) {
      return "";
    }
  }

  function writePreference(language) {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      // Navigation still works when storage is blocked or unavailable.
    }
  }
}());
