const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const siteDir = path.resolve(process.argv[2] || '_site');
const output = path.resolve('assets/pdf/Chenxu_Niu_Academic_CV.pdf');
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

if (!fs.existsSync(path.join(siteDir, 'cv', 'index.html'))) {
  throw new Error(`Build the Jekyll site first: missing ${siteDir}/cv/index.html`);
}

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }

  let file = path.resolve(siteDir, `.${pathname}`);
  if (file !== siteDir && !file.startsWith(`${siteDir}${path.sep}`)) {
    response.writeHead(403).end();
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html');
  }
  fs.readFile(file, (error, data) => {
    if (error) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'Content-Type': contentTypes[path.extname(file)] || 'application/octet-stream' });
    response.end(data);
  });
});

(async () => {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
  });
  try {
    const page = await browser.newPage();
    await page.emulateMedia({ media: 'print' });
    await page.goto(`http://127.0.0.1:${server.address().port}/cv/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    if ((await page.locator('.cv-section').count()) < 5) {
      throw new Error('CV page is missing expected sections');
    }
    await page.pdf({
      path: output,
      format: 'Letter',
      preferCSSPageSize: true,
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: '<div style="width:100%;padding:0 .66in;display:flex;justify-content:space-between;font:8px Arial;color:#666"><span>Chenxu Niu | Curriculum Vitae</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
    });
    fs.copyFileSync(output, path.join(siteDir, 'assets', 'pdf', path.basename(output)));
    console.log(`Wrote ${output}`);
  } finally {
    await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
  if (server.listening) server.close();
});
