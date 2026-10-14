// Attendance calculator for attendance-calculator/ and its translations.
//
// The page supplies its wording in window.CALC_TEXT before loading this file.
// The maths follows lib/features/reports/attendance_report_model.dart in the
// app repository (bunkable, classesToTarget), so the site and the app always
// give the same answer for the same numbers.
(function () {
  var T = window.CALC_TEXT;
  // Guards against 74.99999… from floating point turning into one class less.
  var EPS = 1e-9;

  function $(id) { return document.getElementById(id); }
  function num(id) {
    var value = $(id).value.trim();
    return value === '' ? NaN : Number(value);
  }
  // Rounds down, so a percentage just under the target never reads as the target.
  function fmt(value) {
    return (Math.floor(value * 100 + EPS) / 100).toLocaleString(document.documentElement.lang);
  }
  function fill(template, values) {
    return template.replace(/\{(\w+)\}/g, function (_, key) { return values[key]; });
  }
  function show(box, headline, detail, tone) {
    box.hidden = false;
    box.dataset.tone = tone || '';
    box.querySelector('.result-headline').textContent = headline;
    box.querySelector('.result-detail').textContent = detail || '';
  }

  // How many more classes may be missed while staying at target.
  function canMiss(held, attended, target) {
    return Math.max(0, Math.floor(attended * 100 / target - held + EPS));
  }
  // How many classes in a row must be attended to get back to target.
  function mustAttend(held, attended, target) {
    var ratio = target / 100;
    return Math.max(0, Math.ceil((ratio * held - attended) / (1 - ratio) - EPS));
  }

  function standing() {
    var box = $('standing-result');
    var held = num('held');
    var attended = num('attended');
    var target = num('target');
    if ([held, attended, target].some(isNaN)) { box.hidden = true; return; }
    if (held < 1 || attended < 0 || held % 1 || attended % 1) {
      return show(box, T.wholeNumbers, '', 'warn');
    }
    if (attended > held) return show(box, T.attendedTooMany, '', 'warn');
    if (target <= 0 || target > 100) return show(box, T.targetRange, '', 'warn');

    var now = attended * 100 / held;
    var current = fill(T.current, { pct: fmt(now) });
    if (now + EPS >= target) {
      var miss = canMiss(held, attended, target);
      if (miss === 0) {
        return show(box, T.atEdge, fill(T.atEdgeDetail, { current: current, target: fmt(target) }), 'edge');
      }
      var after = attended * 100 / (held + miss);
      return show(box,
        fill(T.canMiss(miss), { n: miss, target: fmt(target) }),
        fill(T.canMissDetail, { current: current, pct: fmt(after) }), 'good');
    }
    if (target >= 100) return show(box, T.unreachable, current, 'bad');
    var need = mustAttend(held, attended, target);
    var reached = (attended + need) * 100 / (held + need);
    show(box,
      fill(T.mustAttend(need), { n: need, target: fmt(target) }),
      fill(T.mustAttendDetail, { current: current, pct: fmt(reached) }), 'bad');
  }

  function plan() {
    var box = $('plan-result');
    var total = num('total');
    var target = num('plan-target');
    if ([total, target].some(isNaN)) { box.hidden = true; return; }
    if (total < 1 || total % 1) return show(box, T.wholeNumbers, '', 'warn');
    if (target <= 0 || target > 100) return show(box, T.targetRange, '', 'warn');
    var miss = Math.max(0, Math.floor(total * (1 - target / 100) + EPS));
    show(box,
      fill(T.planMiss(miss), { n: miss, total: total, target: fmt(target) }),
      fill(T.planDetail, { attend: total - miss, total: total }), 'good');
  }

  ['held', 'attended', 'target'].forEach(function (id) { $(id).addEventListener('input', standing); });
  ['total', 'plan-target'].forEach(function (id) { $(id).addEventListener('input', plan); });
  // Keep the two targets in step until the reader changes the second one.
  var planTargetTouched = false;
  $('plan-target').addEventListener('input', function () { planTargetTouched = true; });
  $('target').addEventListener('input', function () {
    if (!planTargetTouched) { $('plan-target').value = $('target').value; plan(); }
  });
  standing();
  plan();
})();
