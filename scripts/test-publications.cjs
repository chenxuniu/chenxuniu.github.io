const assert = require('node:assert/strict');
const { BASE_URL, VIEWPORTS, launchBrowser, openPage, settle, assertNoHorizontalOverflow, runCheck } =
  require('./e2e-browser.cjs');

const THEMES = [
  { id: 'energy-ai-hpc', name: 'Energy-Efficient AI & HPC Systems', count: 4 },
  { id: 'llm-hardware-design', name: 'LLMs for Hardware Design', count: 2 },
  { id: 'scientific-data', name: 'Scientific Data Management', count: 4 },
];

function visibleTitles(page) {
  return page.locator('.paper-box:visible .paper-title').allInnerTexts();
}

async function assertCitationOrder(page) {
  const counts = await page.locator('.paper-box:visible .paper-citations strong')
    .allInnerTexts();
  const numeric = counts.map(Number);
  assert.deepEqual(numeric, [...numeric].sort((a, b) => b - a),
    'Publications appear in descending numeric citation order');
}

async function checkFilters(browser) {
  const { context, page, errors } = await openPage(browser, '/publications/');
  const filters = page.getByRole('group', { name: 'Filter publications by research theme' });
  await filters.waitFor({ state: 'visible' });
  const status = page.getByRole('status');
  const all = filters.getByRole('button', { name: 'All (10)' });
  assert.equal(await all.getAttribute('aria-pressed'), 'true');
  assert.equal((await visibleTitles(page)).length, 10);
  await assertCitationOrder(page);
  const titleLinks = page.locator('.paper-title a');
  assert.equal(await titleLinks.filter({ hasText: 'TokenPowerBench' }).getAttribute('href'),
    'https://doi.org/10.1609/aaai.v40i38.40535', 'Titles link to the DOI first');
  assert.equal(await titleLinks.filter({ hasText: 'TokenPowerSandbox' }).getAttribute('href'),
    'https://doi.org/10.48550/arXiv.2608.18149');

  for (const theme of THEMES) {
    const button = filters.getByRole('button', { name: `${theme.name} (${theme.count})` });
    await button.click();
    assert.equal(await button.getAttribute('aria-pressed'), 'true');
    assert.equal(await all.getAttribute('aria-pressed'), 'false');
    assert.equal((await visibleTitles(page)).length, theme.count, theme.name);
    await assertCitationOrder(page);
    assert.equal(new URL(page.url()).searchParams.get('theme'), theme.id);
    assert.equal(await status.innerText(), `Showing ${theme.count} of 10 publications`);
  }
  const scientific = await visibleTitles(page);
  assert.ok(scientific.every(title => /^(ICEAGE|PSQS|Kv2vec|Exploring Metadata Search)/.test(title)),
    scientific.join('\n'));

  await all.click();
  assert.equal((await visibleTitles(page)).length, 10);
  assert.equal(new URL(page.url()).search, '');
  assert.equal(errors.length, 0, errors.join('\n'));
  await context.close();

  const linked = await openPage(browser, '/publications/?theme=llm-hardware-design');
  const titles = await visibleTitles(linked.page);
  assert.equal(titles.length, 2);
  assert.ok(titles.some(title => title.startsWith('FIXME')) && titles.some(title => title.startsWith('MicroEvo')));
  assert.equal(linked.errors.length, 0, linked.errors.join('\n'));
  await linked.context.close();

  const unknown = await openPage(browser, '/publications/?theme=%3Cscript%3E');
  assert.equal((await visibleTitles(unknown.page)).length, 10, 'Unknown themes show every paper');
  assert.equal(await unknown.page.getByRole('button', { name: 'All (10)' }).getAttribute('aria-pressed'), 'true');
  assert.equal(unknown.errors.length, 0, unknown.errors.join('\n'));
  await unknown.context.close();
  console.log('Theme filters, shareable URLs and unknown themes passed');
}

async function checkCopy(browser) {
  const { context, page, errors } = await openPage(browser, '/publications/');
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE_URL });
  const copyButtons = page.getByRole('button', { name: /^Copy BibTeX:/ });
  assert.equal(await copyButtons.count(), 10, 'Every BibTeX link gets a copy button');
  const target = await copyButtons.first().boundingBox();
  assert.ok(target.height >= 24 && target.width >= 24, `Copy target is at least 24px: ${JSON.stringify(target)}`);
  const button = page.getByRole('button', { name: /^Copy BibTeX: TokenPowerBench/ });
  await button.click();
  await page.waitForFunction(element => element.textContent.trim() === 'Copied', await button.elementHandle());
  const expected = await (await page.request.get(BASE_URL + '/assets/bib/aaai2026-tokenpowerbench.bib')).text();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expected);

  await page.route('**/assets/bib/aaai2026-fixme.bib', route => route.fulfill({ status: 404, body: 'missing' }));
  const failing = page.getByRole('button', { name: /^Copy BibTeX: FIXME/ });
  await failing.click();
  await page.waitForFunction(element => element.textContent.trim() === 'Copy failed', await failing.elementHandle());
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expected,
    'A failed copy leaves the previous clipboard contents');
  const fallback = failing.locator('xpath=ancestor::p[1]').getByRole('link', { name: 'BibTeX' });
  assert.equal(await fallback.isVisible(), true, 'The download link stays available after a failed copy');
  assert.equal(errors.length, 0, errors.join('\n'));
  await context.close();

  const home = await openPage(browser, '/');
  assert.equal(await home.page.getByRole('button', { name: /^Copy BibTeX:/ }).count(), 3);
  await assertCitationOrder(home.page);
  assert.equal(await home.page.getByRole('group', { name: 'Filter publications by research theme' }).count(), 0,
    'Selected publications on the homepage are not filtered');
  assert.equal(home.errors.length, 0, home.errors.join('\n'));
  await home.context.close();
  console.log('BibTeX copy, failure fallback and homepage buttons passed');
}

// A paper without `themes:` in the data must not leak into every theme filter.
async function checkPaperWithoutThemes(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(url => new URL(url).pathname === '/publications/', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace(' data-themes="scientific-data"', '');
    await route.fulfill({ response, body });
  });
  await page.goto(BASE_URL + '/publications/?theme=energy-ai-hpc', { waitUntil: 'domcontentloaded' });
  await page.locator('.paper-filters').waitFor({ state: 'visible' });
  assert.equal((await visibleTitles(page)).length, 4, 'An unthemed paper is hidden while a theme is selected');
  assert.equal(await page.getByRole('status').innerText(), 'Showing 4 of 10 publications');
  await page.getByRole('button', { name: 'All (10)' }).click();
  assert.equal((await visibleTitles(page)).length, 10);
  assert.equal(errors.length, 0, errors.join('\n'));
  await context.close();
  console.log('Papers without themes only appear under All');
}

async function checkUrlHandling(browser) {
  const { context, page, errors } = await openPage(browser, '/publications/?ref=cv#top');
  await page.locator('.paper-filters').waitFor({ state: 'visible' });
  await page.getByRole('button', { name: /^LLMs for Hardware Design/ }).click();
  const url = new URL(page.url());
  assert.equal(url.searchParams.get('ref'), 'cv', 'Other query parameters are kept');
  assert.equal(url.searchParams.get('theme'), 'llm-hardware-design');
  assert.equal(url.hash, '#top', 'The fragment is kept');
  assert.equal(errors.length, 0, errors.join('\n'));
  await context.close();

  const unknown = await openPage(browser, '/publications/?theme=%3Cscript%3E&ref=cv');
  await unknown.page.locator('.paper-filters').waitFor({ state: 'visible' });
  assert.equal(new URL(unknown.page.url()).search, '?ref=cv', 'Unknown themes are removed from the URL');
  await unknown.context.close();
  console.log('Filter URLs keep other parameters and drop unknown themes');
}

async function checkCopyRobustness(browser) {
  const { context, page, errors } = await openPage(browser, '/publications/');
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE_URL });
  let requests = 0;
  await page.route('**/assets/bib/aaai2026-tokenpowerbench.bib', async route => {
    requests += 1;
    await new Promise(resolve => setTimeout(resolve, 600));
    await route.continue();
  });
  const button = page.getByRole('button', { name: /^Copy BibTeX: TokenPowerBench/ });
  await button.click();
  await button.click();
  await button.click();
  await page.waitForFunction(element => element.textContent.trim() === 'Copied', await button.elementHandle());
  assert.equal(requests, 1, 'Clicks while a copy is pending are ignored');
  const announcer = page.locator('.visually-hidden[aria-live="polite"]');
  assert.equal(await announcer.getAttribute('aria-atomic'), 'true');
  assert.equal(await announcer.textContent(), 'BibTeX copied to clipboard');
  await page.waitForFunction(element => element.textContent.trim() === 'Copy', await button.elementHandle(),
    { timeout: 4000 });
  assert.equal(await announcer.textContent(), '', 'The announcement clears so a repeat copy is announced again');
  assert.equal(errors.length, 0, errors.join('\n'));
  const expected = await (await page.request.get(BASE_URL + '/assets/bib/aaai2026-tokenpowerbench.bib')).text();
  await context.close();

  const variants = [
    ['without ClipboardItem', () => { delete window.ClipboardItem; }],
    ['when ClipboardItem rejects promise values', () => {
      window.ClipboardItem = function () { throw new TypeError('Promise values are not supported'); };
    }],
  ];
  for (const [label, init] of variants) {
    const fallback = await browser.newContext();
    await fallback.addInitScript(init);
    await fallback.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE_URL });
    const fallbackPage = await fallback.newPage();
    const fallbackErrors = [];
    fallbackPage.on('pageerror', error => fallbackErrors.push(error.message));
    await fallbackPage.goto(BASE_URL + '/publications/', { waitUntil: 'domcontentloaded' });
    const copy = fallbackPage.getByRole('button', { name: /^Copy BibTeX: TokenPowerBench/ });
    await copy.click();
    await fallbackPage.waitForFunction(element => element.textContent.trim() === 'Copied', await copy.elementHandle());
    assert.equal(await fallbackPage.evaluate(() => navigator.clipboard.readText()), expected, label);
    assert.equal(fallbackErrors.length, 0, `${label}: ${fallbackErrors.join('\n')}`);
    await fallback.close();
  }
  console.log('BibTeX copy ignores repeat clicks, re-announces, and falls back to writeText');
}

async function checkWithoutJavaScript(browser) {
  const { context, page } = await openPage(browser, '/publications/', { javaScriptEnabled: false });
  assert.equal(await page.locator('.paper-box:visible').count(), 10);
  await assertCitationOrder(page);
  assert.equal(await page.locator('.paper-filters').isVisible(), false);
  assert.equal(await page.locator('.paper-copy-bib:visible').count(), 0);
  assert.equal(await page.locator('.paper-links a', { hasText: 'BibTeX' }).count(), 10);
  await context.close();
  console.log('Publications stay complete without JavaScript');
}

async function checkLayout(browser) {
  for (const viewport of VIEWPORTS) {
    const { context, page } = await openPage(browser, '/publications/?theme=energy-ai-hpc', { viewport });
    await assertNoHorizontalOverflow(page, `/publications/ at ${viewport.width}px`);
    await settle(page);
    await page.screenshot({ path: `/tmp/chenxu-publications-${viewport.width}.png`, fullPage: false });
    await context.close();
  }
  console.log('Publications layout passed at every viewport');
}

runCheck(async () => {
  const browser = await launchBrowser();
  try {
    await checkFilters(browser);
    await checkCopy(browser);
    await checkPaperWithoutThemes(browser);
    await checkUrlHandling(browser);
    await checkCopyRobustness(browser);
    await checkWithoutJavaScript(browser);
    await checkLayout(browser);
  } finally {
    await browser.close();
  }
});
