// Sends a Classly link to the app, or to the store when the app is missing.
//
// https://thiemjason-work.site/classly/open/<screen> opens the app directly
// on phones where it is installed (Android App Links, iOS Universal Links),
// so this page only runs when it is not, when the link was opened inside an
// app that blocks those links, or on a computer.
(function () {
  var APP_STORE = 'https://apps.apple.com/app/id6760553317';
  var PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.thiemjason.classattendance';
  var PACKAGE = 'com.thiemjason.classattendance';

  var match = location.pathname.match(/\/classly\/open(?:\/(.*))?$/i);
  if (!match) {
    // 404.html runs this too: a mistyped page is not a link to the app.
    var heading = document.querySelector('h1');
    if (heading) heading.textContent = 'Page not found';
    var note = document.querySelector('.open-card p');
    if (note) note.textContent = 'This page does not exist. Classly is available on the App Store and Google Play.';
    var button = document.getElementById('open-app');
    if (button) button.remove();
    return;
  }
  var rest = (match[1] || '').replace(/\/+$/, '');
  var target = 'open' + (rest ? '/' + rest : '') + location.search;
  var appLink = 'classly://' + target;

  var openButton = document.getElementById('open-app');
  if (openButton) openButton.href = appLink;

  var ua = navigator.userAgent || '';
  var isAndroid = /Android/i.test(ua);
  var isIOS = /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isAndroid) {
    // Chrome opens the app when it is installed and the Play Store when not.
    location.replace('intent://' + target + '#Intent;scheme=classly;package=' +
      PACKAGE + ';S.browser_fallback_url=' + encodeURIComponent(PLAY_STORE) + ';end');
  } else if (isIOS) {
    // Universal Links would have opened the app already, so it is most likely
    // not installed. The App Store shows "Open" when it is.
    setTimeout(function () { location.replace(APP_STORE); }, 700);
  } else {
    document.documentElement.classList.add('desktop');
  }
})();
