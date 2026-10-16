(function () {
  "use strict";

  var IOS_URL = "https://apps.apple.com/app/id6760553317";
  var ANDROID_URL = "https://play.google.com/store/apps/details?id=com.thiemjason.classattendance&referrer=utm_source%3Dclassly_site%26utm_medium%3Dweb%26utm_campaign%3Dhome-mobile-sticky";
  var agent = navigator.userAgent || "";
  var isAndroid = /Android/i.test(agent);
  var isIOS = /iPhone|iPad|iPod/i.test(agent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  document.querySelectorAll(".smart-store-link").forEach(function (link) {
    if (isAndroid) link.href = ANDROID_URL;
    if (isIOS) link.href = IOS_URL;
  });

  document.querySelectorAll('a[href*="apps.apple.com"], a[href*="play.google.com/store/apps/details"]').forEach(function (link) {
    var store = link.href.includes("apps.apple.com") ? "app_store" : "google_play";
    var placement = link.dataset.cta || link.closest("section")?.id || link.closest("header, footer")?.tagName.toLowerCase() || "page";
    link.addEventListener("click", function () {
      var detail = { store: store, placement: placement, language: document.documentElement.lang || "en" };
      window.dispatchEvent(new CustomEvent("classly:store-click", { detail: detail }));
      if (typeof window.gtag === "function") {
        window.gtag("event", "store_click", detail);
      }
      if (typeof window.plausible === "function") {
        window.plausible("Store click", { props: detail });
      }
    });
  });
}());
