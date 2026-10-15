const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const sharp = require('sharp');

const root = __dirname;
const output = path.join(root, 'output');
const names = [
  '01-can-miss.png',
  '02-one-tap.png',
  '03-low-attendance.png',
  '04-attendance-simulator.png',
  '05-fix-any-day.png',
  '06-planner.png',
  '07-todo.png',
  '08-week.png',
  '09-utilities.png',
  '10-private.png'
];

async function build() {
  fs.mkdirSync(output, { recursive: true });
  for (const file of fs.readdirSync(output)) {
    if (file.endsWith('.png')) fs.unlinkSync(path.join(output, file));
  }
  const executablePath = process.env.CHROME_PATH ||
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await chromium.launch({ headless: true, executablePath });
  const page = await browser.newPage({
    viewport: { width: 1290, height: 2796 },
    deviceScaleFactor: 1
  });

  for (let index = 0; index < names.length; index += 1) {
    const url = `file://${path.join(root, 'template.html')}?slide=${index + 1}`;
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
    await page.screenshot({
      path: path.join(output, names[index]),
      type: 'png',
      fullPage: false
    });
  }

  await browser.close();

  const thumbWidth = 300;
  const thumbHeight = 650;
  const gap = 28;
  const margin = 40;
  const previewWidth = margin * 2 + thumbWidth * 3 + gap * 2;
  const rows = Math.ceil(names.length / 3);
  const previewHeight = margin * 2 + thumbHeight * rows + gap * (rows - 1);
  const composites = [];

  for (let index = 0; index < names.length; index += 1) {
    const input = path.join(output, names[index]);
    const resized = await sharp(input)
      .resize(thumbWidth, thumbHeight, { fit: 'fill' })
      .png()
      .toBuffer();
    composites.push({
      input: resized,
      left: margin + (index % 3) * (thumbWidth + gap),
      top: margin + Math.floor(index / 3) * (thumbHeight + gap)
    });
  }

  await sharp({
    create: {
      width: previewWidth,
      height: previewHeight,
      channels: 4,
      background: '#e9ece8'
    }
  })
    .composite(composites)
    .png()
    .toFile(path.join(output, 'preview-contact-sheet.png'));

  console.log(`Generated ${names.length} screenshots in ${output}`);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
