const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { BASE_URL, VIEWPORTS, launchBrowser, openPage, settle, assertNoHorizontalOverflow, runCheck } =
  require('./e2e-browser.cjs');

// One entry per _papers/<slug>.md; titles, venues and links mirror _data/publications.yml.
const PAPERS = [
  {
    slug: 'one-over-w-law',
    title: 'The 1/W Law: Context Length is the Dominant Energy Lever in LLM Inference Fleets',
    shortTitle: '1/W Law',
    venue: 'NeurIPS 2026',
    bib: '/assets/bib/neurips2026-one-over-w-law.bib',
    links: ['PDF', 'BibTeX'],
    figures: 3,
  },
  {
    slug: 'tokenpowerbench',
    title: 'TokenPowerBench: Benchmarking the Power Consumption of LLM Inference',
    shortTitle: 'TokenPowerBench',
    venue: 'AAAI 2026',
    bib: '/assets/bib/aaai2026-tokenpowerbench.bib',
    links: ['PDF', 'Code', 'DOI', 'BibTeX', 'Poster'],
    figures: 3,
  },
  {
    slug: 'fixme',
    title: 'FIXME: Towards End-to-End Benchmarking of LLM-Aided Design Verification',
    shortTitle: 'FIXME',
    venue: 'AAAI 2026',
    bib: '/assets/bib/aaai2026-fixme.bib',
    links: ['PDF', 'DOI', 'BibTeX'],
    figures: 3,
  },
  {
    slug: 'microevo',
    title: 'MicroEvo: Knowledge-Guided LLM Sampling for Efficient Microarchitecture Design Space Exploration',
    shortTitle: 'MicroEvo',
    venue: 'ICCAD 2026',
    bib: '/assets/bib/iccad2026-microevo-arxiv.bib',
    links: ['PDF (arXiv v1)', 'arXiv', 'Code', 'BibTeX'],
    figures: 3,
  },
  {
    slug: 'llm-inference-engines',
    title: 'Energy Efficient or Exhaustive? Benchmarking Power Consumption of LLM Inference Engines',
    shortTitle: 'Energy Efficient or Exhaustive?',
    venue: 'HotCarbon 2025',
    bib: '/assets/bib/hotcarbon2025-llm-inference-engines.bib',
    links: ['PDF', 'Code', 'DOI', 'BibTeX'],
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

async function linksIn(page, selector) {
  return page.locator(selector).evaluateAll(links => links.map(link => ({
    text: link.textContent.trim(), href: link.getAttribute('href'),
    target: link.getAttribute('target'), rel: link.getAttribute('rel'),
  })));
}

// Every paper page is linked once per list and opens in the same tab; all other
// links keep opening in a new tab. Returns the links that are not paper pages.
function assertLinksToPages(links, label) {
  const pages = new Set(PAPERS.map(pagePath));
  const internal = links.filter(link => pages.has(link.href));
  assert.deepEqual(new Set(internal.map(link => link.href)), pages, `${label}: every paper page is linked`);
  assert.equal(internal.length, pages.size, `${label}: each paper page is linked once`);
  assert.ok(internal.every(link => link.target === null && link.rel === null), `${label}: paper pages open in the same tab`);
  const others = links.filter(link => !pages.has(link.href));
  assert.ok(others.every(link => link.target === '_blank' && link.rel === 'noopener noreferrer'),
    `${label}: other papers keep opening in a new tab`);
  return others;
}

async function checkEntryPoints(browser) {
  const files = fs.readdirSync(path.join(__dirname, '../_papers')).filter(name => name.endsWith('.md'));
  assert.deepEqual(new Set(files.map(name => name.replace(/\.md$/, ''))), new Set(PAPERS.map(paper => paper.slug)),
    'PAPERS lists every _papers file');

  const publications = await openPage(browser, '/publications/');
  const others = assertLinksToPages(await linksIn(publications.page, '.paper-title a'), '/publications/');
  assert.equal(others.length, 6, 'The six papers without a page keep their DOI, arXiv or PDF link');
  await publications.context.close();

  const research = await openPage(browser, '/research/');
  assertLinksToPages(await linksIn(research.page, '.research-theme__papers a'), '/research/');
  await research.context.close();

  const home = await openPage(browser, '/');
  const selected = await linksIn(home.page, '.paper-title a');
  assert.deepEqual(selected.map(link => link.href),
    ['/publications/tokenpowerbench/', '/publications/fixme/', '/publications/llm-inference-engines/']);
  const news = await linksIn(home.page, '.news-entry a');
  assert.deepEqual(news.map(link => link.href), ['/publications/one-over-w-law/', '/publications/microevo/',
    'https://doi.org/10.1145/3785462.3815795', '/publications/tokenpowerbench/', '/publications/fixme/']);
  assert.ok(news.filter(link => link.href.startsWith('/')).every(link => link.target === null),
    'News links to paper pages open in the same tab');

  await home.page.getByRole('button', { name: 'Open HPC + AI terminal' }).click();
  const dialog = home.page.getByRole('dialog', { name: 'HPC + AI' });
  const input = dialog.getByRole('textbox', { name: 'Terminal command' });
  await input.fill('papers');
  await input.press('Enter');
  const terminal = await linksIn(home.page, '[data-terminal-paper]');
  assert.equal(terminal.length, 11);
  assert.equal(terminal[0].href, '/publications/one-over-w-law/');
  assertLinksToPages(terminal, 'terminal papers');
  assert.equal(home.errors.length, 0, home.errors.join('\n'));
  await home.context.close();
  console.log('Cards, research themes, News and the terminal link to the paper pages');
}

async function checkBackToFilteredList(browser) {
  const { context, page, errors } = await openPage(browser, '/publications/?theme=energy-ai-hpc');
  await page.locator('.paper-filters').waitFor({ state: 'visible' });
  await page.locator('.paper-title a', { hasText: 'TokenPowerBench' }).click();
  await page.waitForURL('**/publications/tokenpowerbench/');
  await page.goBack();
  await page.waitForURL('**/publications/?theme=energy-ai-hpc');
  await page.locator('.paper-filters').waitFor({ state: 'visible' });
  assert.equal(await page.getByRole('status').innerText(), 'Showing 5 of 11 publications');
  assert.equal(errors.length, 0, errors.join('\n'));
  await context.close();
  console.log('Back from a paper page returns to the filtered list');
}

// The width and height attributes must reserve each figure's final size, so the
// page does not jump while images load.
async function checkFiguresReserveSpace(browser) {
  for (const paper of PAPERS) {
    for (const viewport of [VIEWPORTS[0], VIEWPORTS[1]]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const held = [];
      let holding = true;
      await page.route('**/images/papers/**', route => (holding ? held.push(route) : route.continue()));
      await page.goto(BASE_URL + pagePath(paper), { waitUntil: 'domcontentloaded' });
      const boxes = () => page.locator('.paper-page__figure img').evaluateAll(images =>
        images.map(image => Math.round(image.getBoundingClientRect().height)));
      const pending = await boxes();
      holding = false;
      await Promise.all(held.map(route => route.continue()));
      await loadFigures(page);
      const loaded = await boxes();
      assert.deepEqual(pending, loaded, `${paper.slug} at ${viewport.width}px: figures keep their size while loading`);
      await context.close();
    }
  }
  console.log('Figures reserve their space before they load');
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
    await checkEntryPoints(browser);
    await checkBackToFilteredList(browser);
    await checkBibtexFailure(browser);
    await checkBibtexIsText(browser);
    await checkWithoutJavaScript(browser);
    await checkFigureSizing(browser);
    await checkFiguresReserveSpace(browser);
    await checkLayout(browser);
  } finally {
    await browser.close();
  }
});
