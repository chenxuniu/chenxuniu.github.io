const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

const BASE_URL = process.env.SITE_URL || 'http://127.0.0.1:4000';
const MAC_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const VIEWPORTS = [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }];

function launchBrowser() {
  const executablePath = process.env.CHROME_PATH || (fs.existsSync(MAC_CHROME) ? MAC_CHROME : undefined);
  return chromium.launch(executablePath ? { executablePath, headless: true } : { channel: 'chrome', headless: true });
}

// Opens a page in its own context and records uncaught page errors. Deferred site
// scripts have run by DOMContentLoaded; waiting for network idle would also wait on CDNs.
async function openPage(browser, path, contextOptions = {}) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(BASE_URL + path, { waitUntil: 'domcontentloaded' });
  return { context, page, errors };
}

// Waits for the load event and the theme's intro fade so screenshots show the final page.
async function settle(page) {
  await page.waitForLoadState('load');
  await page.waitForFunction(() => document.getAnimations().every(animation => animation.playState !== 'running'));
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  assert.equal(overflow, false, `${label} should not scroll horizontally`);
}

function runCheck(check) {
  check().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { BASE_URL, VIEWPORTS, launchBrowser, openPage, settle, assertNoHorizontalOverflow, runCheck };
