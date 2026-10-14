const assert = require('node:assert/strict');
const { VIEWPORTS, launchBrowser, openPage, settle, assertNoHorizontalOverflow, runCheck } = require('./e2e-browser.cjs');

const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const THEMES = [
  { id: 'energy-ai-hpc', name: 'Energy-Efficient AI & HPC Systems', papers: 4, projects: 3 },
  { id: 'llm-hardware-design', name: 'LLMs for Hardware Design', papers: 2, projects: 0 },
  { id: 'scientific-data', name: 'Scientific Data Management', papers: 4, projects: 0 },
];

async function checkNavigation(browser) {
  const { context, page, errors } = await openPage(browser, '/');
  const labels = await page.locator('.greedy-nav .visible-links a').allInnerTexts();
  const research = labels.findIndex(label => label.trim() === 'Research');
  assert.ok(research >= 0, `Research is in the navigation: ${labels.join(', ')}`);
  assert.equal(labels[research + 1].trim(), 'Publications', 'Research comes right before Publications');
  const href = await page.locator('.greedy-nav .visible-links a', { hasText: 'Research' }).getAttribute('href');
  assert.equal(href, '/research/');
  assert.equal(errors.length, 0, errors.join('\n'));
  await context.close();
  console.log('Navigation links to the research page');
}

async function checkThemes(browser) {
  const { context, page, errors } = await openPage(browser, '/research/');
  assert.match((await page.locator('h1').first().innerText()).trim(), /Research$/);
  const overview = page.getByRole('navigation', { name: 'Research themes' });
  for (const theme of THEMES) {
    const card = overview.getByRole('link', { name: new RegExp(escapeRegExp(theme.name)) });
    assert.equal(await card.getAttribute('href'), `#${theme.id}`);
    assert.match(await card.innerText(), new RegExp(`${theme.papers} papers`));

    const section = page.locator(`section#${theme.id}`);
    assert.equal((await section.locator('h2').innerText()).trim(), theme.name);
    assert.ok((await section.locator('.research-theme__summary').innerText()).length > 80, 'Each theme has a summary');
    assert.equal(await section.locator('.research-theme__papers li').count(), theme.papers);
    assert.equal(await section.locator('.research-theme__projects li').count(), theme.projects);
    const image = section.locator('img');
    await image.scrollIntoViewIfNeeded();
    await page.waitForFunction(element => element.complete && element.naturalWidth > 0, await image.elementHandle());
    assert.ok((await image.getAttribute('alt')).length > 0);
    const viewAll = section.getByRole('link', { name: `View all ${theme.papers} publications` });
    assert.equal(await viewAll.getAttribute('href'), `/publications/?theme=${theme.id}`);
  }
  const introMargin = await page.locator('.research-intro').evaluate(element => parseFloat(getComputedStyle(element).marginTop));
  assert.ok(introMargin > 0, 'The intro keeps its spacing below the page heading');
  const listed = new Set(await page.locator('.research-theme__papers li a').allInnerTexts());
  const publications = await openPage(browser, '/publications/');
  const missing = (await publications.page.locator('.paper-title').allInnerTexts()).filter(title => !listed.has(title.trim()));
  assert.deepEqual(missing, [], 'Every publication belongs to at least one known research theme');
  await publications.context.close();
  await page.locator('section#llm-hardware-design').getByRole('link', { name: 'View all 2 publications' }).click();
  await page.waitForURL('**/publications/?theme=llm-hardware-design');
  await page.locator('.paper-filters').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.paper-box:visible').count(), 2);
  assert.equal(errors.length, 0, errors.join('\n'));
  await context.close();
  console.log('Research themes, papers, projects and filtered links passed');
}

async function checkLayout(browser) {
  for (const viewport of VIEWPORTS) {
    const { context, page, errors } = await openPage(browser, '/research/', { viewport });
    await assertNoHorizontalOverflow(page, `/research/ at ${viewport.width}px`);
    for (const image of await page.locator('.research-theme img').all()) {
      await image.scrollIntoViewIfNeeded();
      await page.waitForFunction(element => element.complete && element.naturalWidth > 0, await image.elementHandle());
    }
    const underlined = await page.locator('.research-overview__card').evaluateAll(cards =>
      cards.some(card => getComputedStyle(card).textDecorationLine.includes('underline')));
    assert.equal(underlined, false, 'Overview cards are not underlined like body links');
    assert.equal(errors.length, 0, errors.join('\n'));
    // Full-page captures draw sticky elements at the current scroll offset.
    await page.evaluate(() => window.scrollTo(0, 0));
    await settle(page);
    await page.screenshot({ path: `/tmp/chenxu-research-${viewport.width}.png`, fullPage: true });
    await context.close();
  }
  console.log('Research layout passed at every viewport');
}

runCheck(async () => {
  const browser = await launchBrowser();
  try {
    await checkNavigation(browser);
    await checkThemes(browser);
    await checkLayout(browser);
  } finally {
    await browser.close();
  }
});
