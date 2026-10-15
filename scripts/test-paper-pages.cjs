const assert = require('node:assert/strict');
const { BASE_URL, VIEWPORTS, launchBrowser, openPage, settle, assertNoHorizontalOverflow, runCheck } =
  require('./e2e-browser.cjs');

// One entry per _papers/<slug>.md; titles, venues and links mirror _data/publications.yml.
const PAPERS = [
  {
    slug: 'tokenpowerbench',
    title: 'TokenPowerBench: Benchmarking the Power Consumption of LLM Inference',
    shortTitle: 'TokenPowerBench',
    venue: 'AAAI 2026',
    bib: '/assets/bib/aaai2026-tokenpowerbench.bib',
    links: ['PDF', 'Code', 'DOI', 'BibTeX', 'Poster'],
    figures: 3,
  },
];

const pagePath = paper => `/publications/${paper.slug}/`;

function waitForBibtex(page) {
  return page.locator('.paper-page__bib[data-bib-state]').waitFor({ state: 'attached' });
}

// Lazy images below the fold load only when scrolled to; load them all before measuring or screenshotting.
async function loadFigures(page) {
  for (const image of await page.locator('.paper-page__figure img').all()) {
    await image.scrollIntoViewIfNeeded();
    await page.waitForFunction(element => element.complete && element.naturalWidth > 0, await image.elementHandle());
  }
}

// The card on /publications/ is the reference for each page's resource links.
async function cardLinks(browser) {
  const { context, page } = await openPage(browser, '/publications/');
  const cards = await page.locator('.paper-box').evaluateAll(boxes => boxes.map(box => ({
    title: box.querySelector('.paper-title').textContent.trim(),
    links: [...box.querySelectorAll('.paper-links a')].map(link => [link.textContent.trim(), link.getAttribute('href')]),
  })));
  await context.close();
  return cards;
}

async function checkPage(browser, paper, cards) {
  const { context, page, errors } = await openPage(browser, pagePath(paper));
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE_URL });
  const response = await page.request.get(BASE_URL + pagePath(paper));
  assert.equal(response.status(), 200, `${pagePath(paper)} exists`);

  assert.equal(await page.title(), `${paper.title} | Chenxu Niu`);
  assert.equal((await page.locator('.paper-page__title').innerText()).trim(), paper.title);
  assert.equal(await page.locator('meta[property="og:type"]').getAttribute('content'), 'article');
  assert.equal((await page.locator('.paper-page__venue').innerText()).trim(), paper.venue);
  assert.equal(await page.locator('.paper-page__authors strong', { hasText: 'Chenxu Niu' }).count(), 1);
  assert.equal(await page.getByRole('link', { name: 'All publications' }).getAttribute('href'), '/publications/');

  const tldr = (await page.locator('.paper-page__tldr p').innerText()).trim();
  assert.ok(tldr.length > 60, `${paper.slug} has a TL;DR`);
  assert.equal(await page.locator('meta[name="description"]').getAttribute('content'), tldr);
  assert.ok((await page.locator('.paper-page__abstract').innerText()).length >= 400, `${paper.slug} has its abstract`);

  const card = cards.find(entry => entry.title === `${paper.title}.`);
  assert.ok(card, `${paper.slug} has a card on /publications/`);
  const buttons = await page.locator('.paper-page__links a').evaluateAll(links =>
    links.map(link => [link.textContent.trim(), link.getAttribute('href'), link.target, link.rel]));
  assert.deepEqual(buttons.map(([label, href]) => [label, href]), card.links, 'Buttons match the card links');
  assert.deepEqual(buttons.map(([label]) => label), paper.links);
  assert.ok(buttons.every(([, , target, rel]) => target === '_blank' && rel === 'noopener noreferrer'));

  const figures = page.locator('.paper-page__figure');
  assert.equal(await figures.count(), paper.figures);
  await loadFigures(page);
  for (let index = 0; index < paper.figures; index += 1) {
    const figure = figures.nth(index);
    const image = figure.locator('img');
    const size = await image.evaluate(element => ({
      attributes: [element.getAttribute('width'), element.getAttribute('height')].map(Number),
      natural: [element.naturalWidth, element.naturalHeight],
    }));
    assert.deepEqual(size.attributes, size.natural, `${paper.slug} figure ${index + 1}: width and height match the file`);
    assert.ok((await image.getAttribute('alt')).length > 40, `${paper.slug} figure ${index + 1} has alt text`);
    assert.match(await figure.locator('figcaption').innerText(), /^Figure \d+\. \S/);
    assert.equal(await figure.getByRole('link').getAttribute('href'), await image.getAttribute('src'));
  }

  const expected = await (await page.request.get(BASE_URL + paper.bib)).text();
  await waitForBibtex(page);
  const block = page.locator('.paper-page__bib');
  assert.equal(await block.getAttribute('data-bib-state'), 'loaded');
  assert.equal(await block.textContent(), expected.trim());
  const copy = page.getByRole('button', { name: `Copy BibTeX: ${paper.shortTitle}`, exact: true });
  await copy.click();
  await page.waitForFunction(element => element.textContent.trim() === 'Copied', await copy.elementHandle());
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expected);
  assert.equal(errors.length, 0, errors.join('\n'));
  await context.close();
}

async function checkPages(browser) {
  const cards = await cardLinks(browser);
  for (const paper of PAPERS) await checkPage(browser, paper, cards);
  console.log(`${PAPERS.length} paper pages render their content, links and BibTeX`);
}

async function openWithBibtexRoute(browser, paper, fulfill) {
  const context = await browser.newContext();
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE_URL });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(`**${paper.bib}`, fulfill);
  await page.goto(BASE_URL + pagePath(paper), { waitUntil: 'domcontentloaded' });
  await waitForBibtex(page);
  return { context, page, errors };
}

async function checkBibtexFailure(browser) {
  const paper = PAPERS[0];
  const { context, page, errors } = await openWithBibtexRoute(browser, paper,
    route => route.fulfill({ status: 404, body: 'missing' }));
  const block = page.locator('.paper-page__bib');
  assert.equal(await block.getAttribute('data-bib-state'), 'failed');
  assert.equal(await block.getByRole('link', { name: 'Download BibTeX' }).isVisible(), true,
    'The download link stays when the preview fails');
  const copy = page.getByRole('button', { name: `Copy BibTeX: ${paper.shortTitle}`, exact: true });
  await copy.click();
  await page.waitForFunction(element => element.textContent.trim() === 'Copy failed', await copy.elementHandle());
  assert.equal(errors.length, 0, errors.join('\n'));
  await context.close();
  console.log('A failed BibTeX request keeps the download link and reports a failed copy');
}

async function checkBibtexIsText(browser) {
  const body = '@misc{probe, note = {<img src=x onerror="window.injected = true">}}';
  const { context, page, errors } = await openWithBibtexRoute(browser, PAPERS[0],
    route => route.fulfill({ status: 200, contentType: 'text/plain', body }));
  const block = page.locator('.paper-page__bib');
  assert.equal(await block.textContent(), body);
  assert.equal(await block.locator('img').count(), 0, 'BibTeX text is never parsed as HTML');
  assert.equal(await page.evaluate(() => window.injected), undefined);
  assert.equal(errors.length, 0, errors.join('\n'));
  await context.close();
  console.log('BibTeX previews render as plain text');
}

async function checkWithoutJavaScript(browser) {
  for (const paper of PAPERS) {
    const { context, page } = await openPage(browser, pagePath(paper), { javaScriptEnabled: false });
    const fallback = page.locator('.paper-page__bib').getByRole('link', { name: 'Download BibTeX' });
    assert.equal(await fallback.getAttribute('href'), paper.bib);
    assert.equal(await page.locator('.paper-copy-bib:visible').count(), 0);
    assert.equal(await page.locator('.paper-page__figure img').count(), paper.figures);
    await context.close();
  }
  console.log('Paper pages stay usable without JavaScript');
}

// Tall figures stay within one screen at desktop width, and captions use the body font.
async function checkFigureSizing(browser) {
  for (const paper of PAPERS) {
    const { context, page } = await openPage(browser, pagePath(paper), { viewport: { width: 1440, height: 900 } });
    await loadFigures(page);
    const sizes = await page.locator('.paper-page__figure').evaluateAll(figures => figures.map(figure => {
      const caption = getComputedStyle(figure.querySelector('figcaption'));
      return {
        height: figure.querySelector('img').getBoundingClientRect().height,
        captionFont: caption.fontFamily,
        captionSize: parseFloat(caption.fontSize),
        bodyFont: getComputedStyle(document.querySelector('.paper-page__abstract')).fontFamily,
      };
    }));
    for (const [index, size] of sizes.entries()) {
      const label = `${paper.slug} figure ${index + 1}`;
      assert.ok(size.height <= 600, `${label} is at most 600px tall at 1440px (was ${size.height})`);
      assert.equal(size.captionFont, size.bodyFont, `${label} caption uses the body font`);
      assert.ok(size.captionSize >= 13, `${label} caption is at least 13px (was ${size.captionSize})`);
    }
    await context.close();
  }
  console.log('Figures fit the screen and captions are readable');
}

async function checkLayout(browser) {
  for (const paper of PAPERS) {
    for (const viewport of VIEWPORTS) {
      const label = `${pagePath(paper)} at ${viewport.width}px`;
      const { context, page, errors } = await openPage(browser, pagePath(paper), { viewport });
      await settle(page);
      await waitForBibtex(page);
      await assertNoHorizontalOverflow(page, label);
      await loadFigures(page);
      await assertNoHorizontalOverflow(page, `${label} with figures loaded`);
      const bib = await page.locator('.paper-page__bib').evaluate(element => ({
        overflowX: getComputedStyle(element).overflowX, tabIndex: element.tabIndex,
      }));
      assert.ok(['auto', 'scroll'].includes(bib.overflowX), `${label}: BibTeX scrolls inside its box`);
      assert.equal(bib.tabIndex, 0, `${label}: the BibTeX box is keyboard-scrollable`);
      await page.screenshot({ path: `/tmp/chenxu-paper-${paper.slug}-${viewport.width}.png`, fullPage: true });
      assert.equal(errors.length, 0, errors.join('\n'));
      await context.close();
    }
  }
  console.log('Paper pages fit every viewport');
}

runCheck(async () => {
  const browser = await launchBrowser();
  try {
    await checkPages(browser);
    await checkBibtexFailure(browser);
    await checkBibtexIsText(browser);
    await checkWithoutJavaScript(browser);
    await checkFigureSizing(browser);
    await checkLayout(browser);
  } finally {
    await browser.close();
  }
});
