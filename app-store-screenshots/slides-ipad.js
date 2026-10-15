const slides = [
  {
    title: 'Know how many<br>classes you can miss',
    subtitle: 'See every subject at once and stay safely above your target.',
    image: 'source-ipad/insights-en.png',
    className: 'insights-slide',
    callouts: `
      <div class="callout left">
        <div class="icon">✓</div>
        <div><strong class="accent">Can miss: 2</strong><span>Linear Algebra · 100%</span></div>
      </div>
      <div class="callout right warn">
        <div class="icon">!</div>
        <div><strong class="danger">Needs attention</strong><span>Recover before it is too late</span></div>
      </div>`
  },
  {
    title: 'Mark attendance<br>in one tap',
    subtitle: 'Your full day, rooms and notes—made for the bigger screen.',
    image: 'source-ipad/today-en.png',
    className: 'today-slide',
    callouts: `
      <div class="callout wide lower">
        <div class="icon">✓</div>
        <div><strong class="accent">Present</strong><span>Update any class before you leave the room</span></div>
      </div>`
  },
  {
    title: 'Catch low attendance<br>before it is too late',
    subtitle: 'Classly shows exactly what to attend to recover your target.',
    image: 'source-ipad/today-en.png',
    className: 'today-slide alert-slide',
    callouts: `
      <div class="callout wide warn">
        <div class="icon">!</div>
        <div><strong class="danger">Attend the next 5 classes</strong><span>Marxist–Leninist Philosophy · Target 80%</span></div>
      </div>`
  },
  {
    title: 'Plan before<br>you skip',
    subtitle: 'Try future choices and see the result without changing your data.',
    image: 'source-ipad/simulator-linear-algebra-en.png',
    className: 'simulator-slide clean',
    callouts: `
      <div class="callout compact center-float">
        <div class="icon">2</div>
        <div><strong>Miss next 2</strong><span>Still above your target</span></div>
      </div>`
  },
  {
    title: 'Missed a day?<br>Fix it in seconds',
    subtitle: 'Review the month, edit past classes and plan days off.',
    image: 'source-ipad/calendar-en.png',
    className: 'calendar-slide clean',
    callouts: ''
  },
  {
    title: 'Exams and deadlines,<br>sorted',
    subtitle: 'Keep assignments and exams beside your timetable.',
    image: 'source-ipad/planner-en.png',
    className: 'planner-slide clean',
    callouts: `
      <div class="callout compact center-float">
        <div class="icon">✓</div>
        <div><strong>Due today</strong><span>Nothing important slips through</span></div>
      </div>`
  },
  {
    title: 'Turn plans<br>into progress',
    subtitle: 'To-dos, due dates and priorities—linked to every subject.',
    image: 'source-ipad/todo-study-en.png',
    className: 'todo-slide',
    callouts: `
      <div class="callout wide todo-callout">
        <div class="icon">✓</div>
        <div><strong>Today · 6:00 PM</strong><span>Submit Linear Algebra problem set</span></div>
      </div>`
  },
  {
    title: 'Your whole week,<br>in one view',
    subtitle: 'A spacious timetable with every class, room and status.',
    image: 'source-ipad/week-en.png',
    className: 'week-slide clean',
    callouts: `
      <div class="mini-row">
        <div class="mini-chip"><b>7</b><span>Full week</span></div>
        <div class="mini-chip"><b>✓</b><span>Live status</span></div>
        <div class="mini-chip"><b>⌂</b><span>Room details</span></div>
      </div>`
  },
  {
    title: 'Everything your<br>semester needs',
    subtitle: 'To-do, reports, days off and more—built right in.',
    image: 'source-ipad/utilities-en.png',
    className: 'utilities-slide',
    callouts: `
      <div class="mini-row utility-row">
        <div class="mini-chip"><b>✓</b><span>To-do</span></div>
        <div class="mini-chip"><b>▥</b><span>Reports</span></div>
        <div class="mini-chip"><b>◷</b><span>Days off</span></div>
      </div>`
  },
  {
    title: 'Private by design',
    subtitle: 'Offline-first. No account required. Your timetable stays with you.',
    image: 'source-ipad/today-dark-en.png',
    className: 'dark clean private-slide',
    callouts: `
      <div class="privacy-row">
        <span>Offline-first</span><i></i><span>No account</span><i></i><span>Your data</span>
      </div>`
  }
];

const params = new URLSearchParams(window.location.search);
const requested = Number(params.get('slide') || 1);
const slideNumber = Math.min(Math.max(requested, 1), slides.length);
const data = slides[slideNumber - 1];
const root = document.querySelector('#slide');

root.dataset.slide = String(slideNumber);
root.className = `slide ${data.className}`.trim();
root.innerHTML = `
  <div class="brand">CLASSLY · IPAD</div>
  <section class="copy">
    <h1>${data.title}</h1>
    <p class="subtitle">${data.subtitle}</p>
  </section>
  <div class="tablet"><img src="${data.image}" alt=""></div>
  ${data.callouts}
`;

Promise.all(Array.from(document.images).map((image) => image.decode())).then(() => {
  document.documentElement.dataset.ready = 'true';
});
