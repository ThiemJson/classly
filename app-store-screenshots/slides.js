const slides = [
  {
    title: 'Know how many<br>classes you can miss',
    subtitle: 'Stay above your attendance target—without doing the math.',
    image: '../screenshots/insights-light.jpg',
    className: '',
    callouts: `
      <div class="callout left">
        <div class="icon">✓</div>
        <div><strong class="accent">Can miss: 4</strong><span>Still safely above target</span></div>
      </div>
      <div class="callout right warn">
        <div class="icon">!</div>
        <div><strong class="danger">Must attend: 2</strong><span>Recover to your target</span></div>
      </div>`
  },
  {
    title: 'Mark attendance<br>in one tap',
    subtitle: 'Your timetable, rooms and notes—all in one place.',
    image: '../screenshots/today-light.jpg',
    className: '',
    callouts: `
      <div class="callout wide lower">
        <div class="icon">✓</div>
        <div><strong><span class="tap-pill">Present</span></strong><span>Done before you leave the classroom</span></div>
      </div>`
  },
  {
    title: 'Catch low attendance<br>before it is too late',
    subtitle: 'Classly shows exactly what you need to attend to recover.',
    image: '../screenshots/today-light.jpg',
    className: '',
    callouts: `
      <div class="callout wide warn">
        <div class="icon">!</div>
        <div><strong class="danger">Attend the next 2 classes</strong><span>Cognitive Psychology · Target 75%</span></div>
      </div>`
  },
  {
    title: 'Plan before<br>you skip',
    subtitle: 'See how your next choices change your attendance percentage.',
    image: 'source/simulator-linear-algebra-en.png',
    className: 'clean no-callout simulator-slide',
    callouts: ''
  },
  {
    title: 'Missed a day?<br>Fix it in seconds',
    subtitle: 'Edit past classes, add extras or mark holidays.',
    image: '../screenshots/calendar-light.jpg',
    className: 'clean no-callout',
    callouts: ''
  },
  {
    title: 'Exams and deadlines,<br>sorted',
    subtitle: 'See what is due next and get reminded ahead of time.',
    image: '../screenshots/planner-light.jpg',
    className: 'clean no-callout',
    callouts: ''
  },
  {
    title: 'Turn plans<br>into progress',
    subtitle: 'To-dos, due dates and priorities—linked to every subject.',
    image: 'source/todo-study-en.png',
    className: 'todo-slide',
    callouts: `
      <div class="callout wide todo-callout">
        <div class="icon">✓</div>
        <div><strong>Due today · 6:00 PM</strong><span>Linear Algebra problem set</span></div>
      </div>`
  },
  {
    title: 'Your whole week,<br>in one view',
    subtitle: 'See every class, room and attendance status at a glance.',
    image: 'source/week-en.png',
    className: 'week-slide',
    callouts: `
      <div class="callout left compact-callout">
        <div class="icon">7</div>
        <div><strong>Full week</strong><span>Monday to Sunday</span></div>
      </div>
      <div class="callout right compact-callout">
        <div class="icon">✓</div>
        <div><strong>Always current</strong><span>Rooms and status</span></div>
      </div>`
  },
  {
    title: 'Everything your<br>semester needs',
    subtitle: 'To-do, reports, days off and more—built right in.',
    image: 'source/utilities-en.png',
    className: 'utilities-slide',
    callouts: `
      <div class="utility-floats">
        <div class="utility-chip"><b>✓</b><span>To-do</span></div>
        <div class="utility-chip"><b>▥</b><span>Reports</span></div>
        <div class="utility-chip"><b>◷</b><span>Days off</span></div>
      </div>`
  },
  {
    title: 'Private by design',
    subtitle: 'Offline-first. No account required. Your timetable stays on your device.',
    image: '../screenshots/today-dark.jpg',
    className: 'dark clean no-callout',
    callouts: ''
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
  <div class="brand">CLASSLY</div>
  <section class="copy">
    <h1>${data.title}</h1>
    <p class="subtitle">${data.subtitle}</p>
  </section>
  <div class="phone"><img src="${data.image}" alt=""></div>
  ${data.callouts}
`;

Promise.all(Array.from(document.images).map((image) => image.decode())).then(() => {
  document.documentElement.dataset.ready = 'true';
});
