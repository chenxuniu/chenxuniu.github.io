const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

// Expected citation rows come from the same snapshot the site renders.
function citationSnapshot() {
  const text = fs.readFileSync(path.join(__dirname, '../_data/google_scholar_citations.yml'), 'utf8');
  const counts = Object.fromEntries([...text.matchAll(/^\s+"?([A-Za-z0-9_-]+)"?:\s+(\d+)/gm)]
    .map(([, id, count]) => [id, Number(count)]));
  return { counts, checkedOn: text.match(/^checked_on:\s+["']?([0-9-]+)/m)[1] };
}

async function check() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:4000/', { waitUntil: 'networkidle' });
      const trigger = page.getByRole('button', { name: 'Open HPC + AI terminal' });
      assert.equal(await trigger.count(), 1, 'The footer should have a terminal button');
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: 'HPC + AI' });
      await dialog.waitFor({ state: 'visible' });
      const input = dialog.getByRole('textbox', { name: 'Terminal command' });
      assert.ok(await input.evaluate(element => element === document.activeElement));
      await page.screenshot({ path: `/tmp/chenxu-hpc-terminal-welcome-${viewport.width}.png` });
      const log = dialog.getByRole('log');
      async function assertFits(label) {
        const dimensions = await dialog.evaluate(element => {
          const rect = element.getBoundingClientRect();
          return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom,
            width: innerWidth, height: innerHeight,
            overflow: element.scrollWidth > element.clientWidth,
            pageOverflow: document.documentElement.scrollWidth > innerWidth };
        });
        assert.ok(dimensions.x >= 0 && dimensions.y >= 0, label);
        assert.ok(dimensions.right <= dimensions.width && dimensions.bottom <= dimensions.height, label);
        assert.equal(dimensions.overflow, false, label);
        assert.equal(dimensions.pageOverflow, false, label);
      }
      async function run(command) {
        await input.fill(command);
        await input.press('Enter');
      }
      await run('whoami');
      assert.match(await log.innerText(), /Chenxu Niu/);
      assert.match(await log.innerText(), /AI-native Solutions Architect/);
      await run('research');
      assert.match(await log.innerText(), /Scientific data management/i);
      const themes = log.locator('[data-terminal-theme]');
      assert.deepEqual(await themes.evaluateAll(links => links.map(link => link.getAttribute('href'))),
        ['/research/#energy-ai-hpc', '/research/#llm-hardware-design', '/research/#scientific-data']);
      assert.match(await log.innerText(), /Energy-Efficient AI & HPC Systems\s+4 papers/);
      await run('papers');
      const papers = log.locator('[data-terminal-paper]');
      assert.equal(await papers.count(), 10);
      assert.equal(await papers.first().getAttribute('href'), '/assets/pdf/arxiv2026-tokenpowersandbox-v1.pdf');
      const pdf = await page.request.get(new URL(await papers.first().getAttribute('href'), page.url()).href);
      assert.equal(pdf.status(), 200);
      await run('projects');
      assert.equal(await log.locator('[data-terminal-project]').count(), 3);
      assert.equal(await log.getByRole('link', { name: 'TokenPowerBench', exact: true }).getAttribute('href'),
        'https://github.com/chenxuniu/TokenPowerBench');
      await run('help');
      assert.match(await log.innerText(), /whoami/);
      await input.press('ArrowUp');
      assert.equal(await input.inputValue(), 'help');
      await input.press('ArrowDown');
      assert.equal(await input.inputValue(), '');
      await input.fill('proj');
      await input.press('Tab');
      assert.equal(await input.inputValue(), 'projects');
      for (const [prefix, completion] of [['nv', 'nvidia-smi'], ['ci', 'citations'], ['ne', 'news'], ['s', 's']]) {
        await input.fill(prefix);
        await input.press('Tab');
        assert.equal(await input.inputValue(), completion, `Tab completion for ${prefix}`);
      }
      await input.fill('');

      await run('news');
      const news = log.locator('[data-terminal-news]');
      assert.equal(await news.count(), 5);
      assert.match(await news.first().innerText(), /2026\.09.*NeurIPS 2026/s);

      const snapshot = citationSnapshot();
      await run('citations');
      const citations = log.locator('[data-terminal-citation]');
      assert.equal(await citations.count(), Object.keys(snapshot.counts).length);
      assert.match(await log.locator('[data-terminal-citation="ufrVoPGSRksC"]').innerText(),
        new RegExp(`TokenPowerBench[\\s\\S]*\\b${snapshot.counts.ufrVoPGSRksC}\\b`));
      const total = Object.values(snapshot.counts).reduce((sum, count) => sum + count, 0);
      assert.match(await log.locator('[data-terminal-citation-total]').last().innerText(), new RegExp(`\\b${total}\\b`));
      assert.match(await log.innerText(), new RegExp(`checked ${snapshot.checkedOn}`));

      await run('nvidia-smi');
      assert.match(await log.innerText(), /NVIDIA-SMI/);
      assert.equal(await log.locator('[data-terminal-gpu]').count(), 3);
      assert.match(await log.locator('[data-terminal-process]').allInnerTexts().then(rows => rows.join('\n')), /TokenPowerBench/);

      await run('sinfo');
      const partitions = log.locator('[data-terminal-partition]');
      assert.equal(await partitions.count(), 3);
      assert.match(await partitions.first().innerText(), /energy-ai-hpc\*?\s+up\s+4/);
      // A partition is busy when its newest paper (2025 for scientific data) is at most a year old.
      const scientificState = 2025 >= new Date().getFullYear() - 1 ? 'alloc' : 'idle';
      assert.match(await partitions.nth(2).innerText(), new RegExp(`scientific-data\\s+up\\s+4\\s+${scientificState}`));

      await run('squeue');
      const jobs = log.locator('[data-terminal-job]');
      assert.equal(await jobs.count(), 10);
      assert.match(await log.locator('[data-terminal-job="3fE2CSJIrl8C"]').innerText(), /\bR\b/);
      assert.match(await log.locator('[data-terminal-job="ufrVoPGSRksC"]').innerText(), /\bCD\b/);
      await assertFits(`squeue at ${viewport.width}px`);

      const unnamed = await log.locator('.hpc-terminal__table').evaluateAll(tables => tables.filter(table =>
        !table.getAttribute('aria-label') && !table.querySelector('caption')).length);
      assert.equal(unnamed, 0, 'Every terminal table has an accessible name');
      const wraps = await log.locator('.hpc-terminal__table-wrap').evaluateAll(regions => regions.every(region =>
        region.tabIndex === 0 && region.getAttribute('role') === 'region' && region.getAttribute('aria-label')));
      assert.ok(wraps, 'Scrollable terminal tables are named, focusable regions');

      await run('help');
      const reference = await log.locator('.hpc-terminal__reference').last().innerText();
      for (const command of ['news', 'citations', 'nvidia-smi', 'sinfo', 'squeue']) {
        assert.match(reference, new RegExp(`\\b${command}\\b`), `help lists ${command}`);
      }
      await run('<img src=x onerror=alert(1)>');
      assert.equal(await log.locator('img').count(), 0, 'Commands must be rendered as plain text');
      assert.match(await log.innerText(), /Command not found/);
      await run('clear');
      assert.equal((await log.innerText()).trim(), '');
      await run('papers');
      await assertFits(`papers at ${viewport.width}px`);
      await page.screenshot({ path: `/tmp/chenxu-hpc-terminal-${viewport.width}.png` });
      await input.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
      assert.ok(await trigger.evaluate(element => element === document.activeElement));
      await trigger.click();
      await dialog.getByRole('button', { name: 'Close terminal' }).click();
      await dialog.waitFor({ state: 'hidden' });
      await trigger.click();
      await run('exit');
      await dialog.waitFor({ state: 'hidden' });
      await trigger.click();
      await page.mouse.click(4, 4);
      await dialog.waitFor({ state: 'hidden' });
      await page.keyboard.type('hpc');
      await dialog.waitFor({ state: 'visible' });
      assert.equal(errors.length, 0, errors.join('\n'));
      await page.close();
      console.log(`Terminal interactions and layout passed at ${viewport.width}px`);
    }
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:4000/publications/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Open HPC + AI terminal' }).click();
    await page.getByRole('dialog', { name: 'HPC + AI' }).waitFor({ state: 'visible' });
    console.log('Terminal available on the full publications page');
    await page.close();
    const noScript = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await noScript.newPage();
    await staticPage.goto('http://127.0.0.1:4000/');
    assert.equal(await staticPage.locator('.hpc-terminal-trigger').isVisible(), false);
    assert.equal(await staticPage.locator('.site-footer').isVisible(), true);
    await noScript.close();
    console.log('Footer remains usable without JavaScript');
  } finally {
    await browser.close();
  }
}

check().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
