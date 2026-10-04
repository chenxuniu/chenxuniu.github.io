const assert = require('node:assert/strict');
const { chromium } = require('playwright');

async function check() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
      const linkedPage = await browser.newPage({ viewport });
      await linkedPage.goto('http://127.0.0.1:4000/?terminal=1', { waitUntil: 'networkidle' });
      const linkedDialog = linkedPage.getByRole('dialog', { name: 'HPC + AI' });
      assert.equal(await linkedDialog.isVisible(), true, 'The profile link should open the terminal automatically');
      const linkedInput = linkedDialog.getByRole('textbox', { name: 'Terminal command' });
      assert.ok(await linkedInput.evaluate(element => element === document.activeElement));
      await linkedInput.fill('projects');
      await linkedInput.press('Enter');
      assert.equal(await linkedDialog.locator('[data-terminal-project]').count(), 3);
      await linkedInput.press('Escape');
      await linkedDialog.waitFor({ state: 'hidden' });
      await linkedPage.waitForFunction(() => document.body.style.overflow === '');
      assert.equal(await linkedPage.evaluate(() => document.body.style.overflow), '');
      assert.ok(await linkedPage.getByRole('button', { name: 'Open HPC + AI terminal' })
        .evaluate(element => element === document.activeElement));
      await linkedPage.close();

      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:4000/', { waitUntil: 'networkidle' });
      const trigger = page.getByRole('button', { name: 'Open HPC + AI terminal' });
      assert.equal(await trigger.count(), 1, 'The footer should have a terminal button');
      assert.equal(await page.getByRole('dialog', { name: 'HPC + AI' }).isVisible(), false,
        'Ordinary visits should keep the terminal hidden');
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: 'HPC + AI' });
      await dialog.waitFor({ state: 'visible' });
      const input = dialog.getByRole('textbox', { name: 'Terminal command' });
      assert.ok(await input.evaluate(element => element === document.activeElement));
      await page.screenshot({ path: `/tmp/chenxu-hpc-terminal-welcome-${viewport.width}.png` });
      const log = dialog.getByRole('log');
      async function run(command) {
        await input.fill(command);
        await input.press('Enter');
      }
      await run('whoami');
      assert.match(await log.innerText(), /Chenxu Niu/);
      assert.match(await log.innerText(), /AI-native Solutions Architect/);
      await run('research');
      assert.match(await log.innerText(), /Scientific data management/i);
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
      await run('<img src=x onerror=alert(1)>');
      assert.equal(await log.locator('img').count(), 0, 'Commands must be rendered as plain text');
      assert.match(await log.innerText(), /Command not found/);
      await run('clear');
      assert.equal((await log.innerText()).trim(), '');
      await run('papers');
      const dimensions = await dialog.evaluate(element => {
        const rect = element.getBoundingClientRect();
        return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom,
          width: innerWidth, height: innerHeight,
          overflow: element.scrollWidth > element.clientWidth,
          pageOverflow: document.documentElement.scrollWidth > innerWidth };
      });
      assert.ok(dimensions.x >= 0 && dimensions.y >= 0);
      assert.ok(dimensions.right <= dimensions.width && dimensions.bottom <= dimensions.height);
      assert.equal(dimensions.overflow, false);
      assert.equal(dimensions.pageOverflow, false);
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
    const ignoredLink = await browser.newPage();
    await ignoredLink.goto('http://127.0.0.1:4000/?terminal=0', { waitUntil: 'networkidle' });
    assert.equal(await ignoredLink.getByRole('dialog', { name: 'HPC + AI' }).isVisible(), false);
    await ignoredLink.close();
    const noScript = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await noScript.newPage();
    await staticPage.goto('http://127.0.0.1:4000/?terminal=1');
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
