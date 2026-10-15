const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = __dirname;
const output = path.join(root, 'output-ipad-13');
const chrome = process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const names = [
  '01-can-miss-ipad.png',
  '02-one-tap-ipad.png',
  '03-low-attendance-ipad.png',
  '04-attendance-simulator-ipad.png',
  '05-fix-any-day-ipad.png',
  '06-planner-ipad.png',
  '07-todo-ipad.png',
  '08-week-ipad.png',
  '09-utilities-ipad.png',
  '10-private-ipad.png'
];

function render(url, destination, width, height) {
  const result = spawnSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${width},${height}`,
    `--screenshot=${destination}`,
    url
  ], { encoding: 'utf8' });

  if (result.status !== 0 || !fs.existsSync(destination)) {
    throw new Error(result.stderr || `Chrome failed to render ${destination}`);
  }
}

function build() {
  fs.mkdirSync(output, { recursive: true });

  names.forEach((name, index) => {
    const page = `file://${path.join(root, 'template-ipad.html')}?slide=${index + 1}`;
    render(page, path.join(output, name), 2064, 2752);
  });

  render(
    `file://${path.join(root, 'preview-ipad.html')}`,
    path.join(output, 'preview-contact-sheet.png'),
    1076,
    1764
  );

  console.log(`Generated ${names.length} iPad screenshots in ${output}`);
}

try {
  build();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
