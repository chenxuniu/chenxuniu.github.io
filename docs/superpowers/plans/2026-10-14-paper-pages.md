# Per-paper pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give five papers their own page at `/publications/<slug>/` (TL;DR, abstract, figures, links, BibTeX with copy) and make every title link on the site lead there.

**Architecture:** A `papers` Jekyll collection holds only page-specific content (TL;DR, figures, abstract); all shared metadata stays in `_data/publications.yml`, joined by a new `slug` field. A shared include, `paper-link.html`, decides whether a title links to the site page or to the paper's DOI/arXiv/PDF, and every list (cards, research themes, terminal, News) uses it. The BibTeX block is filled client-side by `assets/js/publications.js`, which already handles BibTeX copying.

**Tech Stack:** Jekyll via `github-pages` 232 (Jekyll 3.10, Liquid 4, `--safe`), SCSS, ES5 JavaScript, Playwright 1.63 end-to-end scripts (`scripts/*.cjs`), poppler (`pdftoppm`, `pdftotext`) for preparing figures and abstracts.

**Spec:** `docs/superpowers/specs/2026-10-14-paper-pages-design.md`

## Global Constraints

- The site must build on GitHub Pages: `github-pages` 232, safe mode, Liquid 4. No plugins beyond `_config.yml`'s whitelist, and no Liquid 5 filters (for example, no `remove_last`).
- No new dependencies in the repository. `package.json` keeps `playwright` 1.63.0 only. poppler is a local tool for preparing content, not a build step.
- Do not commit the local-only Gemfile. It lives at `$SCRATCH/jekyll/Gemfile`, outside the repo.
- Commit messages use `<type>: <description>` (feat, fix, refactor, docs, test, chore) with no attribution trailers.
- URLs: `/publications/<slug>/` with slugs `one-over-w-law`, `tokenpowerbench`, `fixme`, `microevo`, `llm-inference-engines`.
- Display titles drop the trailing period stored in `publications.yml`.
- Paper-page links open in the same tab (no `target`). External links and site files keep `target="_blank" rel="noopener noreferrer"`.
- JavaScript follows `assets/js/publications.js`: ES5 (`var`, `function`), an IIFE, and `'use strict'`.
- New tests use `scripts/e2e-browser.cjs` (`BASE_URL` from `SITE_URL`, viewports 1440, 390 and 320) and keep screenshots under `/tmp/chenxu-*.png`, like the existing tests.
- The NeurIPS paper is not `selected`. The homepage keeps three selected papers.

## Review Focus

1. **A BibTeX file fails to load on a paper page** (404, offline). The "Download BibTeX" link should stay, Copy should report "Copy failed", and there should be no page error. Test: Task 2, `checkBibtexFailure`.
2. **A BibTeX file contains markup-like text** (`<img onerror=…>`). It should appear as literal text, with no elements created and no script run. Test: Task 2, `checkBibtexIsText`.
3. **Long unbreakable content at 320 px** (BibTeX lines, long title words, wide figures). The page must not scroll horizontally; the BibTeX box scrolls on its own and is keyboard-focusable. Test: Task 2, `checkLayout`.
4. **A visitor opens a paper from a filtered list and presses Back.** They should return to `/publications/?theme=…` with the filter still applied. Test: Task 4, `checkBackToFilteredList`.
5. **Production build.** GitHub Pages applies `compress_html`, which the local development server skips. The pages and the BibTeX block must behave the same as in development. Test: Task 5, run `test-paper-pages.cjs` against a `JEKYLL_ENV=production` server.

---

## Local environment (used by every task)

Port 4000 is taken by another session's server, so this branch previews on **4005**.

```bash
export SCRATCH=/private/tmp/claude-501/-Users-chenxun-Desktop-Claude-Projects-PersonalWebsite/312a25a6-a6d5-4af7-a51d-8be3fb4e7159/scratchpad
export PATH=/opt/homebrew/opt/ruby@3.3/bin:$PATH LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 BUNDLE_GEMFILE=$SCRATCH/jekyll/Gemfile
cd /Users/chenxun/Desktop/Claude_Projects/PersonalWebsite/site/.claude/worktrees/paper-pages
bundle exec jekyll serve --host 127.0.0.1 --port 4005   # run in the background; restart after editing _config.yml
SITE_URL=http://127.0.0.1:4005 npm run test:e2e
```

`$SCRATCH/jekyll/Gemfile` pins `github-pages` 232 plus `webrick`, `csv`, `base64`, `bigdecimal` and `logger`. `$SCRATCH/venv` has Pillow, used only to print image sizes.

---

### Task 1: Add the NeurIPS paper to the publication data

**Files:**
- Modify: `_data/publications.yml` (new first entry)
- Create: `assets/bib/neurips2026-one-over-w-law.bib`
- Create: `images/papers/one-over-w-law/figure-1.png` (card image, reused as the page's Figure 1 in Task 3)
- Modify: `_pages/cv.md:68-79` (drop the hand-written entry)
- Modify: `assets/pdf/Chenxu_Niu_Academic_CV.pdf` (regenerated)
- Test: `scripts/test-publications.cjs`, `scripts/test-research.cjs`, `scripts/test-hpc-terminal.cjs`

**Interfaces:**
- Consumes: nothing.
- Produces: a publication entry with `slug: "one-over-w-law"`, `short_title: "1/W Law"`, `venue: "NeurIPS 2026"`, and links `PDF` and `BibTeX`. `test-hpc-terminal.cjs` now reads `BASE_URL` and `launchBrowser` from `e2e-browser.cjs`.

- [ ] **Step 1: Point the terminal test at `SITE_URL`.**

`scripts/test-hpc-terminal.cjs` hard-codes `http://127.0.0.1:4000` and the Chrome path. Switch it to the shared helpers so it can run against port 4005:

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { BASE_URL, VIEWPORTS, launchBrowser } = require('./e2e-browser.cjs');
```

Then:
- replace `chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })` with `launchBrowser()`;
- replace the inline viewport array with `VIEWPORTS`;
- replace each of the three `'http://127.0.0.1:4000/...'` strings with `BASE_URL + '/...'`.

- [ ] **Step 2: Update existing expectations for the 11th paper (RED).**

`scripts/test-publications.cjs`:
- `THEMES[0].count`: `4` → `5`.
- Every `'All (10)'` → `'All (11)'`, every `` `of 10 publications` `` / `'… of 10 publications'` → `of 11`.
- Every `.length, 10` and `.count(), 10` assertion → `11` (`visibleTitles` checks, `copyButtons.count()`, `.paper-box:visible`, `.paper-links a` BibTeX count).
- In `checkPaperWithoutThemes`: `'Showing 4 of 10 publications'` → `'Showing 5 of 11 publications'`, and the visible-title count under the energy filter `4` → `5`.

`scripts/test-research.cjs`:
- `THEMES[0].papers`: `4` → `5`.

`scripts/test-hpc-terminal.cjs`:
- `/Energy-Efficient AI & HPC Systems\s+4 papers/` → `5 papers`.
- `papers.count()`: `10` → `11`.
- First `papers` href: `'/assets/pdf/arxiv2026-tokenpowersandbox-v1.pdf'` → `'/assets/pdf/neurips2026-one-over-w-law.pdf'`.
- `/energy-ai-hpc\*?\s+up\s+4/` → `up\s+5`.
- `jobs.count()`: `10` → `11`, and add `assert.match(await log.locator('[data-terminal-job]').first().innerText(), /\bR\b.*NeurIPS 2026/);` right after it.

- [ ] **Step 3: Run the updated tests and confirm they fail.**

Run: `SITE_URL=http://127.0.0.1:4005 node scripts/test-publications.cjs; SITE_URL=http://127.0.0.1:4005 node scripts/test-research.cjs; SITE_URL=http://127.0.0.1:4005 node scripts/test-hpc-terminal.cjs`
Expected: each fails on a count, for example `getByRole('button', { name: 'All (11)' })` times out, or `10 !== 11`.

- [ ] **Step 4: Crop the card image.**

Figure 1 is on page 2 of the PDF, box (105.0, 69.0)–(507.0, 238.6) pt. At `r = round(1600·72/402) = 287` dpi, that is `-x 419 -y 275 -W 1602 -H 676`:

```bash
mkdir -p images/papers/one-over-w-law
pdftoppm -png -r 287 -f 2 -l 2 -x 419 -y 275 -W 1602 -H 676 -singlefile \
  assets/pdf/neurips2026-one-over-w-law.pdf images/papers/one-over-w-law/figure-1
du -k images/papers/one-over-w-law/figure-1.png   # expect about 180 KB
```

- [ ] **Step 5: Add the BibTeX file.**

`assets/bib/neurips2026-one-over-w-law.bib`:

```bibtex
@inproceedings{chen2026onew,
  title = {The 1/W Law: Context Length is the Dominant Energy Lever in LLM Inference Fleets},
  author = {Chen, Huamin and Liu, Xunzhuo and Liu, Yuhan and Jiang, Junchen and Liu, Xue and Niu, Chenxu and He, Bowei},
  booktitle = {Advances in Neural Information Processing Systems},
  year = {2026}
}
```

- [ ] **Step 6: Add the publication entry at the top of `_data/publications.yml`.**

```yaml
- title: "The 1/W Law: Context Length is the Dominant Energy Lever in LLM Inference Fleets."
  venue: "NeurIPS 2026"
  short_title: "1/W Law"
  slug: "one-over-w-law"
  themes: ["energy-ai-hpc"]
  year: 2026
  cv_authors: "H. Chen, X. Liu, Y. Liu, J. Jiang, X. Liu, **C. Niu**, and B. He."
  cv_venue: "Conference on Neural Information Processing Systems (NeurIPS '26)"
  cv_note: "Accepted; proceedings version forthcoming."
  image: "/images/papers/one-over-w-law/figure-1.png"
  note: "Camera-ready version; proceedings version forthcoming."
  authors: "Huamin Chen, Xunzhuo Liu, Yuhan Liu, Junchen Jiang, Xue Liu, **Chenxu Niu**, and Bowei He."
  links:
    - label: "PDF"
      url: "/assets/pdf/neurips2026-one-over-w-law.pdf"
    - label: "BibTeX"
      url: "/assets/bib/neurips2026-one-over-w-law.bib"

```

`slug` is harmless until Task 2 creates the collection: `paper-link.html` does not exist yet, so nothing reads it.

- [ ] **Step 7: Remove the hand-written CV entry.**

In `_pages/cv.md`, replace:

```liquid
    {% assign publication_number = 1 %}
```

with:

```liquid
    {% assign publication_number = 0 %}
```

and delete these lines (the hand-written `<li>` and the offset after it):

```liquid
      <li>
        H. Chen, X. Liu, Y. Liu, J. Jiang, X. Liu, <strong>C. Niu</strong>, and B. He.
        <strong class="cv-pub-title">The 1/W Law: Context Length is the Dominant Energy Lever in LLM Inference Fleets</strong>.
        <cite>Conference on Neural Information Processing Systems (NeurIPS '26)</cite>, 2026. Accepted; proceedings version forthcoming.
      </li>
      {% assign publication_number = publication_number | minus: 1 %}
```

- [ ] **Step 8: Run the updated tests and confirm they pass (GREEN).**

Run: `SITE_URL=http://127.0.0.1:4005 npm run test:e2e`
Expected: every script prints its success lines and exits 0.

- [ ] **Step 9: Regenerate the CV PDF and confirm its text is unchanged apart from the new links.**

```bash
pdftotext -layout assets/pdf/Chenxu_Niu_Academic_CV.pdf $SCRATCH/cv-before.txt
npm run cv:build
pdftotext -layout assets/pdf/Chenxu_Niu_Academic_CV.pdf $SCRATCH/cv-after.txt
diff $SCRATCH/cv-before.txt $SCRATCH/cv-after.txt
```

Expected: the NeurIPS entry keeps its number, authors, venue and note. The only difference is its new "PDF · BibTeX" links, which every other entry already has, plus any line reflow those links cause. If the number or any other entry changes, fix `cv.md` before continuing.

- [ ] **Step 10: Commit.**

```bash
git add _data/publications.yml assets/bib/neurips2026-one-over-w-law.bib images/papers/one-over-w-law/figure-1.png \
  _pages/cv.md assets/pdf/Chenxu_Niu_Academic_CV.pdf scripts/test-publications.cjs scripts/test-research.cjs scripts/test-hpc-terminal.cjs
git commit -m "feat: add the NeurIPS 2026 1/W Law paper to the publication data"
```

---

### Task 2: Paper page layout, with TokenPowerBench as the first page

**Files:**
- Modify: `_config.yml` (collection and defaults)
- Create: `_includes/paper-display-title.html`
- Modify: `_includes/cv-publication.html:3-5` (use the new include)
- Create: `_includes/page-title.html`
- Modify: `_includes/seo.html` (title, description, `og:type`)
- Modify: `_layouts/default.html:17` (headline)
- Create: `_layouts/paper.html`
- Create: `_sass/_paper-page.scss`
- Modify: `assets/css/main.scss` (import)
- Modify: `assets/js/publications.js` (shared fetch cache, `setupBibtexPreview`)
- Modify: `_data/publications.yml` (`slug: "tokenpowerbench"`)
- Create: `_papers/tokenpowerbench.md`
- Create: `images/papers/tokenpowerbench/figure-1.png`, `figure-2.png`, `figure-4.png`
- Create: `scripts/test-paper-pages.cjs`
- Modify: `package.json` (`test:e2e`)

**Interfaces:**
- Consumes: Task 1's publication entries (`slug`, `short_title`, `venue`, `note`, `authors`, `links`).
- Produces:
  - `{% include paper-display-title.html title=<string> %}` sets `paper_display_title`.
  - `{% include page-title.html %}` sets `page_title` (a paper page's display title, else `page.title`).
  - `_layouts/paper.html` renders these classes: `.paper-page`, `.paper-page__back`, `.paper-page__meta`, `.paper-page__venue`, `.paper-page__note`, `.paper-page__title`, `.paper-page__authors`, `.paper-page__links`, `.paper-page__button`, `.paper-page__tldr`, `.paper-page__abstract`, `.paper-page__figure`, `.paper-page__bib`.
  - The BibTeX block is `pre.paper-page__bib[data-bib-src]` and gets `data-bib-state` set to `loaded` or `failed`.
  - JS: `fetchBibtex(url)` returns a cached `Promise<string>`; `setupBibtexPreview()`.
  - The test file exports nothing; it has a `PAPERS` array (extended in Task 3) and functions `checkPages`, `checkBibtexFailure`, `checkBibtexIsText`, `checkWithoutJavaScript`, `checkLayout`.

- [ ] **Step 1: Write the failing end-to-end test.**

Create `scripts/test-paper-pages.cjs`:

```js
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
  for (let index = 0; index < paper.figures; index += 1) {
    const figure = figures.nth(index);
    const image = figure.locator('img');
    await image.scrollIntoViewIfNeeded();
    await page.waitForFunction(element => element.complete && element.naturalWidth > 0, await image.elementHandle());
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

async function checkLayout(browser) {
  for (const paper of PAPERS) {
    for (const viewport of VIEWPORTS) {
      const label = `${pagePath(paper)} at ${viewport.width}px`;
      const { context, page, errors } = await openPage(browser, pagePath(paper), { viewport });
      await settle(page);
      await waitForBibtex(page);
      await assertNoHorizontalOverflow(page, label);
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
    await checkLayout(browser);
  } finally {
    await browser.close();
  }
});
```

Append ` && node scripts/test-paper-pages.cjs` to the `test:e2e` script in `package.json`.

- [ ] **Step 2: Run it and confirm it fails.**

Run: `SITE_URL=http://127.0.0.1:4005 node scripts/test-paper-pages.cjs`
Expected: FAIL with `404 !== 200` (`/publications/tokenpowerbench/ exists`).

- [ ] **Step 3: Add the collection to `_config.yml` and restart the server.**

After the `defaults:` list's existing `_pages` entry, add:

```yaml
  # _papers: one page per paper at /publications/<slug>/
  - scope:
      path: ""
      type: papers
    values:
      layout: paper
      author_profile: true
```

Before `# Sass/SCSS`, add:

```yaml
# Collections
collections:
  papers:
    output: true
    permalink: /publications/:name/

```

- [ ] **Step 4: Extract the shared display-title include.**

`_includes/paper-display-title.html` (keep it on one line after the comment so it adds no whitespace, like `paper-primary-url.html`):

```liquid
{% comment %}
  Sets paper_display_title to include.title without the trailing period that
  _data/publications.yml titles carry.
{% endcomment %}{% assign paper_display_title = include.title %}{% assign paper_display_title_last = include.title | slice: -1, 1 %}{% if paper_display_title_last == '.' %}{% assign paper_display_title_length = include.title | size | minus: 1 %}{% assign paper_display_title = include.title | slice: 0, paper_display_title_length %}{% endif %}
```

In `_includes/cv-publication.html`, replace lines 3–5 (`title_last_char`, `title_length` and the `if` that sets `display_title`) with:

```liquid
{% include paper-display-title.html title=paper.title %}
```

and change `{{ display_title | escape }}` to `{{ paper_display_title | escape }}`.

- [ ] **Step 5: Add the page-title include and use it in the SEO tags and headline.**

`_includes/page-title.html`:

```liquid
{% comment %}
  Sets page_title: for a _papers page, its paper's display title from
  _data/publications.yml (Jekyll would otherwise title it after the file name);
  for every other page, page.title.
{% endcomment %}{% assign page_title = page.title %}{% if page.collection == "papers" %}{% assign page_title_paper = site.data.publications | where: "slug", page.slug | first %}{% if page_title_paper %}{% include paper-display-title.html title=page_title_paper.title %}{% assign page_title = paper_display_title %}{% endif %}{% endif %}
```

In `_includes/seo.html`, replace:

```liquid
{% assign seo_title = site.title %}
{% if page.title and page.title != "" %}
  {% assign seo_title = page.title | append: " | Chenxu Niu" %}
{% endif %}
```

with:

```liquid
{% include page-title.html %}
{% assign seo_title = site.title %}
{% if page_title and page_title != "" %}
  {% assign seo_title = page_title | append: " | Chenxu Niu" %}
{% endif %}
```

Then change `page.description | default: page.excerpt` to `page.description | default: page.tldr | default: page.excerpt`, and the `og:type` line to:

```liquid
<meta property="og:type" content="{% if page.url == '/' %}profile{% elsif page.collection == 'papers' %}article{% else %}website{% endif %}">
```

In `_layouts/default.html`, replace:

```liquid
        {% if page.title %}<meta itemprop="headline" content="{{ page.title | markdownify | strip_html | strip_newlines | escape_once }}">{% endif %}
```

with:

```liquid
        {% include page-title.html %}{% if page_title %}<meta itemprop="headline" content="{{ page_title | markdownify | strip_html | strip_newlines | escape_once }}">{% endif %}
```

- [ ] **Step 6: Create the layout.**

`_layouts/paper.html`:

```liquid
---
layout: default
---
{% comment %} Content comes from _papers/<slug>.md; metadata from the _data/publications.yml entry with the same slug. {% endcomment %}
{% assign paper = site.data.publications | where: "slug", page.slug | first %}
{% include paper-display-title.html title=paper.title %}
{% assign paper_bib = paper.links | where: "label", "BibTeX" | first %}
<div class="paper-page">
  <p class="paper-page__back"><a href="{{ '/publications/' | relative_url }}"><i class="fas fa-arrow-left" aria-hidden="true"></i> All publications</a></p>

  <header class="paper-page__header">
    <p class="paper-page__meta"><span class="paper-page__venue">{{ paper.venue | escape }}</span>{% if paper.note %} <span class="paper-page__note">{{ paper.note | escape }}</span>{% endif %}</p>
    <h1 class="paper-page__title">{{ paper_display_title | escape }}</h1>
    <p class="paper-page__authors">{{ paper.authors | markdownify | remove: '<p>' | remove: '</p>' | strip_newlines }}</p>
    {% if paper.links %}
      <ul class="paper-page__links" aria-label="Paper resources">
        {% for link in paper.links %}
          {% assign link_url = link.url %}
          {% unless link_url contains '://' %}{% assign link_url = link_url | relative_url %}{% endunless %}
          <li><a class="paper-page__button" href="{{ link_url }}" target="_blank" rel="noopener noreferrer">{{ link.label | escape }}</a></li>
        {% endfor %}
      </ul>
    {% endif %}
  </header>

  <section class="paper-page__tldr" aria-labelledby="paper-tldr">
    <h2 id="paper-tldr">TL;DR</h2>
    <p>{{ page.tldr | escape }}</p>
  </section>

  <section class="paper-page__section" aria-labelledby="paper-abstract">
    <h2 id="paper-abstract">Abstract</h2>
    <div class="paper-page__abstract">{{ content }}</div>
  </section>

  {% if page.figures.size > 0 %}
    <section class="paper-page__section" aria-labelledby="paper-figures">
      <h2 id="paper-figures">Figures</h2>
      {% for figure in page.figures %}
        {% assign figure_src = figure.src | relative_url %}
        <figure class="paper-page__figure">
          <a href="{{ figure_src }}" target="_blank" rel="noopener noreferrer"><img src="{{ figure_src }}" alt="{{ figure.alt | escape }}" width="{{ figure.width }}" height="{{ figure.height }}" loading="lazy" decoding="async"></a>
          <figcaption>{{ figure.caption | escape }}</figcaption>
        </figure>
      {% endfor %}
    </section>
  {% endif %}

  {% if paper_bib %}{% unless paper_bib.url contains '://' %}
    {% assign paper_bib_url = paper_bib.url | relative_url %}
    <section class="paper-page__section" aria-labelledby="paper-bibtex">
      <div class="paper-page__section-heading">
        <h2 id="paper-bibtex">BibTeX</h2>
        <button type="button" class="paper-copy-bib" data-bib-url="{{ paper_bib_url | escape }}" aria-label="Copy BibTeX: {{ paper.short_title | default: paper_display_title | escape }}" hidden>Copy</button>
      </div>
      {% comment %} assets/js/publications.js replaces the link with the file's text. {% endcomment %}
      <pre class="paper-page__bib" data-bib-src="{{ paper_bib_url | escape }}" tabindex="0" aria-labelledby="paper-bibtex"><a href="{{ paper_bib_url }}">Download BibTeX</a></pre>
    </section>
  {% endunless %}{% endif %}
</div>
```

- [ ] **Step 7: Add the styles.**

`_sass/_paper-page.scss`:

```scss
/* ==========================================================================
   Per-paper pages (_layouts/paper.html)
   ========================================================================== */

$paper-page-accent: #254b7e;

// Doubled classes outrank the `.page__content p`, `h1` and `a` rules.
.paper-page__back.paper-page__back {
    margin: 0 0 1em;
    font-size: .85em;
}

.paper-page__meta.paper-page__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: .4em .75em;
    margin: 0 0 .5em;
}

.paper-page__venue {
    padding: .1em .6em;
    background: #00369f;
    color: #fff;
    font-size: .8em;
    font-weight: 600;
}

.paper-page__note {
    color: #666;
    font-size: .85em;
    font-style: italic;
}

.paper-page__title.paper-page__title {
    margin: 0 0 .5em;
    font-size: $type-size-3;
    line-height: 1.3;
    overflow-wrap: break-word;
}

.paper-page__authors.paper-page__authors {
    margin: 0 0 .75em;
}

.paper-page__links {
    display: flex;
    flex-wrap: wrap;
    gap: .5em;
    margin: 0;
    padding: 0;
    list-style: none;

    li {
        margin: 0;
    }
}

.paper-page__button.paper-page__button {
    display: inline-block;
    padding: .3em .8em;
    border: 1px solid #c9d3e0;
    border-radius: 2px;
    color: $paper-page-accent;
    font-size: .85em;
    font-weight: 600;
    line-height: 1.4;
    text-decoration: none;

    &:hover,
    &:focus-visible {
        border-color: $paper-page-accent;
        text-decoration: none;
    }

    &:focus-visible {
        outline: 2px solid $paper-page-accent;
        outline-offset: 2px;
    }
}

.paper-page__tldr {
    margin: 1.5em 0 0;
    padding: .8em 1em;
    border-left: 3px solid $paper-page-accent;
    background: #f4f7fb;

    h2 {
        margin: 0 0 .3em;
        color: $paper-page-accent;
        font-size: .8em;
        letter-spacing: .05em;
        text-transform: uppercase;
    }

    p {
        margin: 0;
    }
}

.paper-page__section {
    margin-top: 2em;

    h2 {
        margin-top: 0;
    }
}

.paper-page__section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1em;
}

.paper-page__figure {
    margin: 1.25em 0 0;

    img {
        display: block;
        width: 100%;
        height: auto;
        border: 1px solid #eee;
    }

    figcaption {
        margin-top: .5em;
        color: #555;
        font-size: .8em;
        line-height: 1.5;
    }
}

.paper-page__bib {
    max-width: 100%;
    margin: .75em 0 0;
    padding: .8em 1em;
    overflow-x: auto;
    background: #f7f7f7;
    font-size: .75em;
    line-height: 1.5;
    white-space: pre;

    &:focus-visible {
        outline: 2px solid $paper-page-accent;
        outline-offset: 2px;
    }
}
```

In `assets/css/main.scss`, add after `@import "publications";`:

```scss
@import "paper-page";
```

- [ ] **Step 8: Add the BibTeX preview and the shared fetch cache.**

In `assets/js/publications.js`, below `var FEEDBACK_MS = 2000;`, add:

```js
  // One request per BibTeX file, shared by a paper page's preview and its Copy button.
  var bibtexRequests = new Map();
```

Replace `fetchBibtex` with:

```js
  function fetchBibtex(url) {
    if (!bibtexRequests.has(url)) {
      var request = fetch(url).then(function (response) {
        if (!response.ok) throw new Error('BibTeX request failed with HTTP ' + response.status);
        return response.text();
      });
      // Forget failures so the next attempt asks the server again.
      request.catch(function () { bibtexRequests.delete(url); });
      bibtexRequests.set(url, request);
    }
    return bibtexRequests.get(url);
  }

  // Paper pages render a download link inside the BibTeX block; once the file
  // loads, its text (set as text, never HTML) replaces the link.
  function setupBibtexPreview() {
    if (!window.fetch) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-bib-src]'), function (block) {
      fetchBibtex(block.dataset.bibSrc).then(function (text) {
        block.textContent = text.trim();
        block.dataset.bibState = 'loaded';
      }, function () {
        block.dataset.bibState = 'failed';
      });
    });
  }
```

At the bottom, call it between the existing calls:

```js
  setupThemeFilters();
  setupBibtexPreview();
  setupBibtexCopy();
```

- [ ] **Step 9: Crop the TokenPowerBench figures.**

```bash
mkdir -p images/papers/tokenpowerbench
pdf=assets/pdf/aaai2026-tokenpowerbench.pdf; out=images/papers/tokenpowerbench
pdftoppm -png -r 226 -f 4 -l 4 -x 160 -y 160 -W 1601 -H 468 -singlefile $pdf $out/figure-1
pdftoppm -png -r 227 -f 5 -l 5 -x 161 -y 171 -W 1600 -H 474 -singlefile $pdf $out/figure-2
pdftoppm -png -r 400 -f 6 -l 6 -x 283 -y 1688 -W 1358 -H 1176 -singlefile $pdf $out/figure-4
for f in $out/*.png; do $SCRATCH/venv/bin/python -c "from PIL import Image; print('$f', Image.open('$f').size)"; du -k $f; done
```

These come from boxes in points (page, x0 y0 x1 y1): Figure 1 (4, 51 51 561 200), Figure 2 (5, 51.0 54.1 558.5 204.3), Figure 4 (6, 51.0 303.8 295.5 515.5). The dpi is `r = min(400, round(1600·72/width))` and pixels are `pt·r/72`. Expected sizes: 1601×468, 1600×474 and 1358×1176, each under 200 KB. Open each PNG and check nothing is clipped.

- [ ] **Step 10: Write the TokenPowerBench page and its slug.**

In `_data/publications.yml`, add `slug: "tokenpowerbench"` after TokenPowerBench's `short_title`.

`_papers/tokenpowerbench.md`:

```markdown
---
tldr: "An open-source benchmark that measures LLM inference power at the GPU, node and system level without special power meters, and attributes energy to the prefill and decode phase of every request."
figures:
  - src: "/images/papers/tokenpowerbench/figure-1.png"
    width: 1601
    height: 468
    alt: "Architecture diagram: a configuration stage (model, inference engine, benchmark), an execution and measurement stage that follows each request through prefill and decode while collecting CPU and GPU power, and a report stage with energy during setup, per token, per second and per response."
    caption: "Figure 1. Overview of the TokenPowerBench architecture."
  - src: "/images/papers/tokenpowerbench/figure-2.png"
    width: 1600
    height: 474
    alt: "Two log-scale bar charts comparing Transformers, DeepSpeed, TensorRT-LLM and vLLM on ten models from Llama3-1B to Qwen-32B: prefill energy on top and decode energy per token below."
    caption: "Figure 2. Prefill energy (a) and decode energy per token (b) across models and inference engines."
  - src: "/images/papers/tokenpowerbench/figure-4.png"
    width: 1358
    height: 1176
    alt: "Four line charts of energy per token against batch sizes from 32 to 1024 for Llama, Qwen, Falcon and the largest models; energy per token falls as the batch grows and flattens beyond 256."
    caption: "Figure 4. Total energy per token across models at varying batch sizes."
---
Large language model (LLM) services now answer billions of queries per day, and industry reports show that inference, not training, accounts for more than 90% of total power consumption. However, existing benchmarks focus on either training/fine-tuning or performance of inference and provide little support for power consumption measurement and analysis of inference. We introduce TokenPowerBench, the first lightweight and extensible benchmark designed for LLM-inference power consumption studies. The benchmark combines (i) a declarative configuration interface covering model choice, prompt set, and inference engine, (ii) a measurement layer that captures GPU-, node-, and system-level power without specialized power meters, and (iii) a phase-aligned metrics pipeline that attributes energy to the prefill and decode stages of every request. These elements make it straightforward to explore the power consumed by an LLM inference run; furthermore, by varying batch size, context length, parallelism strategy and quantization, users can quickly assess how each setting affects joules per token and other energy-efficiency metrics. We evaluate TokenPowerBench on four of the most widely used model series (Llama, Falcon, Qwen, and Mistral). Our experiments cover from 1 billion parameters up to the frontier-scale Llama3-405B model. Furthermore, we release TokenPowerBench as open source to help users to measure power consumption, forecast operating expenses, and meet sustainability targets when deploying LLM services.
```

If any image size printed in Step 9 differs, use the printed size; the test compares the attributes with the file.

- [ ] **Step 11: Run the new test and confirm it passes.**

Run: `SITE_URL=http://127.0.0.1:4005 node scripts/test-paper-pages.cjs`
Expected: five success lines, from `1 paper pages render their content, links and BibTeX` to `Paper pages fit every viewport`. Open `/tmp/chenxu-paper-tokenpowerbench-{320,390,1440}.png` and check the layout by eye: buttons wrap, the TL;DR box, figure captions, and the BibTeX box.

- [ ] **Step 12: Run the whole suite** (the title include and SEO changes touch every page).

Run: `SITE_URL=http://127.0.0.1:4005 npm run test:e2e`
Expected: all scripts pass. Spot-check `/cv/`: every title is still printed without its trailing period.

- [ ] **Step 13: Commit.**

```bash
git add _config.yml _includes/paper-display-title.html _includes/cv-publication.html _includes/page-title.html \
  _includes/seo.html _layouts/default.html _layouts/paper.html _sass/_paper-page.scss assets/css/main.scss \
  assets/js/publications.js _data/publications.yml _papers/tokenpowerbench.md images/papers/tokenpowerbench \
  scripts/test-paper-pages.cjs package.json
git commit -m "feat: add per-paper pages with TokenPowerBench as the first"
```

---

### Task 3: Pages for the other four papers

**Files:**
- Modify: `_data/publications.yml` (`slug` for FIXME, MicroEvo and HotCarbon; the NeurIPS entry already has one)
- Create: `_papers/one-over-w-law.md`, `_papers/fixme.md`, `_papers/microevo.md`, `_papers/llm-inference-engines.md`
- Create: `images/papers/one-over-w-law/figure-2.png`, `figure-3.png`; `images/papers/fixme/figure-1.png`, `figure-5.jpg`, `figure-6.png`; `images/papers/microevo/figure-5.png`, `figure-8.png`, `figure-9.png`; `images/papers/llm-inference-engines/figure-1.png`, `figure-2.png`, `figure-5.png`
- Test: `scripts/test-paper-pages.cjs` (`PAPERS`)

**Interfaces:**
- Consumes: the layout, includes and test functions from Task 2; `images/papers/one-over-w-law/figure-1.png` from Task 1.
- Produces: five `_papers` documents; `PAPERS` with five entries in the order NeurIPS, TokenPowerBench, FIXME, MicroEvo, HotCarbon.

- [ ] **Step 1: Extend `PAPERS` (RED).**

In `scripts/test-paper-pages.cjs`, make `PAPERS`:

```js
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
```

- [ ] **Step 2: Run it and confirm it fails.**

Run: `SITE_URL=http://127.0.0.1:4005 node scripts/test-paper-pages.cjs`
Expected: FAIL with `404 !== 200` for `/publications/one-over-w-law/`.

- [ ] **Step 3: Crop the remaining figures.**

Each line gives the page, the box in points (x0 y0 x1 y1), the dpi, and the pixel crop. The dpi is `min(400, round(1600·72/width))` and pixels are `pt·dpi/72`.

```bash
crop() { # crop <pdf> <page> <dpi> <x> <y> <W> <H> <out-without-extension> [png|jpeg]
  local format=${9:-png}; local extra=; [ "$format" = jpeg ] && extra="-jpegopt quality=82"
  mkdir -p "$(dirname "$8")"
  pdftoppm -$format $extra -r $3 -f $2 -l $2 -x $4 -y $5 -W $6 -H $7 -singlefile "$1" "$8"
}
N=assets/pdf/neurips2026-one-over-w-law.pdf; F=assets/pdf/aaai2026-fixme.pdf
M=assets/pdf/iccad2026-microevo-arxiv-v1.pdf; H=assets/pdf/hotcarbon2025-llm-inference-engines.pdf
crop $N 6 318 546 305 1601 637 images/papers/one-over-w-law/figure-2      # 123.6 69.0 486.0 213.2
crop $N 9 292 437 280 1598 621 images/papers/one-over-w-law/figure-3      # 107.7 69.0 501.8 222.1
crop $F 1 400 1748 1322 1387 584 images/papers/fixme/figure-1             # 314.7 238.0 564.4 343.1
crop $F 4 150 127 106 1020 1216 images/papers/fixme/figure-5 jpeg         # 61 51 551 635 (raster; PNG would be ~2 MB)
crop $F 6 226 160 160 1601 722 images/papers/fixme/figure-6               # 51 51 561 281
crop $M 4 226 161 201 1600 266 images/papers/microevo/figure-5            # 51.2 64.0 560.8 148.6
crop $M 7 400 181 378 1452 594 images/papers/microevo/figure-8            # 32.6 68.0 294.0 175.0
crop $M 7 400 187 1083 1482 560 images/papers/microevo/figure-9           # 33.6 195.0 300.4 295.8
crop $H 4 400 271 1116 1379 568 images/papers/llm-inference-engines/figure-1   # 48.8 200.9 297.0 303.1
crop $H 4 400 1756 344 1389 1473 images/papers/llm-inference-engines/figure-2  # 316.0 62.0 566.0 327.1
crop $H 5 400 1750 1230 1379 1043 images/papers/llm-inference-engines/figure-5 # 315.0 221.4 563.2 409.1
for f in images/papers/*/figure-*; do $SCRATCH/venv/bin/python -c "from PIL import Image; print('$f', Image.open('$f').size)"; du -k "$f"; done
```

Expected: all files under about 330 KB. Open every image and confirm that no axis label, legend or panel is clipped, and that no neighbouring caption text leaked in. MicroEvo Figure 9's box starts below Figure 8's caption on purpose. Use the printed sizes in Step 5.

- [ ] **Step 4: Add the slugs.**

In `_data/publications.yml`, add after `short_title`:
- FIXME: `slug: "fixme"`
- MicroEvo: `slug: "microevo"`
- Energy Efficient or Exhaustive?: `slug: "llm-inference-engines"`

- [ ] **Step 5: Write the four paper files.**

`_papers/one-over-w-law.md`:

```markdown
---
tldr: "For decode-dominated LLM serving, tokens per watt scale inversely with the serving context window, so routing requests by context length is the largest single lever on fleet energy efficiency."
figures:
  - src: "/images/papers/one-over-w-law/figure-1.png"
    width: 1602
    height: 676
    alt: "Two panels. Left: log-log plot of tokens per watt against serving context windows from 2K to 128K for H100 and B200, both falling with a slope close to −1 for a spread of about 40×. Right: fleet tokens per watt on the Azure trace, from 5.58 for a homogeneous H100 fleet to 32.12 for B200 with FleetOpt routing."
    caption: "Figure 1. Single-GPU tokens per watt for Llama-3.1-70B on H100 and calibrated B200 across serving context windows from 2K to 128K (a), and fleet-level tok/W on the Azure trace at λ = 1,000 req/s (b)."
  - src: "/images/papers/one-over-w-law/figure-2.png"
    width: 1601
    height: 637
    alt: "Two panels. Left: GPU power saturates at low concurrency while decode throughput keeps rising with concurrency, one curve per context window. Right: tokens-per-watt curves per context window, whose operating points fall along a line of slope close to −1."
    caption: "Figure 2. Mechanism behind the 1/W law on H100: GPU power and decode throughput versus concurrency (a), and per-context tok/W curves with their operating points (b)."
  - src: "/images/papers/one-over-w-law/figure-3.png"
    width: 1598
    height: 621
    alt: "Grouped bar charts of fleet tokens per watt on the Azure and LMSYS-Chat-1M traces for homogeneous 64K, pool-routing and FleetOpt topologies; B200 bars are higher than H100 in every topology and reach 32.12 on Azure."
    caption: "Figure 3. Fleet tok/W at λ = 1,000 req/s for Llama-3.1-70B under homogeneous, two-pool and FleetOpt topologies on H100 and B200."
---
Energy efficiency in LLM inference is often treated as a property of the model, the hardware, or the serving software. We show that, for decode-dominated serving, a simpler systems variable dominates: the serving context window. Because KV-cache memory is finite, increasing the context window reduces the number of concurrent sequences a GPU can hold. Under continuous batching, this concurrency limit directly sets decode throughput, while GPU power remains nearly flat over most of the operating range. The result is a simple 1/*W* law: tokens per watt scale inversely with the serving context window *W*, with log-log exponent −1 in the power-saturated regime and a bounded, predictable shortfall outside it, as we derive from KV-cache capacity and a logistic GPU power model. On identical H100 hardware and software, Llama-3.1-70B tok/W varies by nearly 40× across the 2K–128K context range, and fitted exponents for four model scales from 1B to 70B match predictions fixed before fitting to within 0.003. The same mechanism determines fleet-level efficiency. On the short-context-dominant Azure trace, two-pool context-length routing improves tok/W by 2.5× over a homogeneous NVIDIA H100 fleet under measured H100 power, a gain reproduced in closed form without simulation; an NVIDIA B200 estimate anchored at one measured operating point (±15%) adds 2.0× at fixed topology, and the two levers combine approximately multiplicatively to 5.76×. Finally, sparse MoE weight streaming is a third lever whose sign is set by deployment topology: up to 5.1× in a large expert-parallel deployment, but at or below 1× in the single-node TP=8 configuration studied here once batch-level expert coverage is counted. These results suggest a deployment order for energy-efficient LLM serving: route by context length first, upgrade hardware second, and exploit sparse architectures where expert parallelism amortizes expert coverage.
```

`_papers/fixme.md`:

```markdown
---
tldr: "The first end-to-end benchmark for LLMs in hardware functional verification: 747 tasks from real-world designs across five verification sub-tasks, revealing where state-of-the-art LLMs still fall short."
figures:
  - src: "/images/papers/fixme/figure-1.png"
    width: 1387
    height: 584
    alt: "Diagram of a modern hardware development flow from frontend design through functional verification and backend design to tape-out, with functional verification taking at least 50% of the time."
    caption: "Figure 1. Typical IC development workflow; verification typically takes over half of the time."
  - src: "/images/papers/fixme/figure-5.jpg"
    width: 1020
    height: 1216
    alt: "Three-part diagram: A, the FIXME benchmark evaluation flow; B, dataset construction through agent and human expert collaboration; C, example questions and answers for each FIXME sub-set."
    caption: "Figure 5. FIXME workflow, construction and task examples."
  - src: "/images/papers/fixme/figure-6.png"
    width: 1601
    height: 722
    alt: "Heatmap of pass rates for ten LLMs, including GPT-4.1, Claude Sonnet 4 and Gemini 2.5 Flash, across nine FIXME task metrics; functional pass rates are far lower than syntax pass rates."
    caption: "Figure 6. Pass rates of state-of-the-art LLMs across FIXME's tasks."
---
We introduce FIXME, the first end-to-end and large-scale benchmark for evaluating Large Language Models (LLMs) in hardware design functional verification (FV). Comprising 747 tasks derived from real-world hardware designs, FIXME spans five core FV sub-sets: specification comprehension, reference model generation, testbench generation, assertion design, and RTL debugging. To ensure high data quality, we developed an AI-human collaborative framework for agile data curation and annotation. This process resulted in 25,000 lines of verified RTL, 35,000 lines of enhanced testbenches, and over 1,200 SystemVerilog Assertions. Furthermore, through expert-guided optimization within the multi-agent aided flow, we achieved a remarkable 45.57% improvement in average functional coverage, underscoring the benchmark's robustness. Through evaluation of state-of-the-art LLMs like GPT-4.1, FIXME identifies key limitations and provides actionable insights, advancing the potential of LLM-driven automation in hardware design functional verification.
```

`_papers/microevo.md`:

```markdown
---
tldr: "MicroEvo couples off-the-shelf LLMs with Monte Carlo Tree Search to explore microarchitecture design spaces, improving Pareto-front quality by up to 36.2% and search efficiency by 10.6× over NSGA-II."
figures:
  - src: "/images/papers/microevo/figure-5.png"
    width: 1600
    height: 266
    alt: "Pipeline diagram: LLM-driven initialization, Monte Carlo Tree Search with Pareto-UCT selection, LLM-operator expansion and PPA simulation, guided by active knowledge accumulation and state-aware directives, producing Pareto-optimal designs."
    caption: "Figure 5. Overview of MicroEvo: LLM-driven initialization and expansion, Pareto-UCT selection in the MCTS tree, PPA evaluation, active knowledge accumulation and state-aware directives."
  - src: "/images/papers/microevo/figure-8.png"
    width: 1452
    height: 594
    alt: "Two scatter plots of power and area against CPI for six design-space exploration methods; MicroEvo's points form the lowest and broadest Pareto front."
    caption: "Figure 8. Pareto fronts of different design-space exploration methods in the CPI–Power and CPI–Area spaces."
  - src: "/images/papers/microevo/figure-9.png"
    width: 1482
    height: 560
    alt: "Left: hypervolume against number of explorations, where MicroEvo rises fastest. Right: time to reach a hypervolume of 0.74, 23.3 minutes for MicroEvo against 117 to 280 minutes for the other methods."
    caption: "Figure 9. Convergence efficiency and time-to-target comparison."
---
Microarchitecture design space exploration suffers from expansive search spaces and expensive PPA evaluation, leaving only a small simulation budget for design decision-making. Existing methods perform blind search without considering microarchitectural dependencies and fail to learn from the iterative search effectively, leading to wasted evaluations and weak Pareto convergence. In this paper, we propose MicroEvo, a knowledge-guided framework that couples off-the-shelf LLMs with Monte Carlo Tree Search (MCTS) for multi-objective microarchitecture optimization. MicroEvo combines LLM-driven evolutionary operators, a Pareto-aware tree policy that balances Pareto contribution and diversity, an active knowledge accumulation mechanism that extracts and reuses optimization insights, and state-aware directives that adapt the search behavior online. Experiments show that MicroEvo improves Pareto-front quality by up to 36.2% over NSGA-II and achieves 10.6× higher search efficiency, and also demonstrates strong scalability to a complex industrial-scale core. The code repository is available at: <https://github.com/GEAR-SEU/MicroEvo-ICCAD-26>.
```

`_papers/llm-inference-engines.md`:

```markdown
---
tldr: "Benchmarking vLLM, TensorRT-LLM, DeepSpeed and Transformers on H100 GPUs across the inference lifecycle shows where energy goes by stage and component, and that no single engine is the most efficient in every scenario."
figures:
  - src: "/images/papers/llm-inference-engines/figure-1.png"
    width: 1379
    height: 568
    alt: "Three heatmaps of energy per token for 1B, 3B and 8B models across Transformers, DeepSpeed, TensorRT-LLM and vLLM under standard, high-concurrency and high-throughput workloads; vLLM and TensorRT-LLM have the lowest values."
    caption: "Figure 1. Energy per token across all engines and workloads."
  - src: "/images/papers/llm-inference-engines/figure-2.png"
    width: 1389
    height: 1473
    alt: "Bar charts of total and per-component (GPU, CPU, DRAM) energy per token for each engine and workload, with a table for the 8B model under high throughput where vLLM uses 0.143 J per token."
    caption: "Figure 2. Component-wise (GPU, CPU, DRAM) energy per token across inference engines."
  - src: "/images/papers/llm-inference-engines/figure-5.png"
    width: 1379
    height: 1043
    alt: "Scatter plot of energy per token against throughput for four engines; energy per token drops steeply as throughput rises and levels off above about 5,000 tokens per second."
    caption: "Figure 5. Energy per token versus throughput."
---
Large Language Models (LLMs) have remarkable advancements in recent years and have revolutionized the field of natural language processing. To reduce latency and improve inference throughput, many inference engines have been proposed such as vLLM, TensorRT-LLM, and DeepSpeed. However, there is no comprehensive analysis on the power consumption and energy efficiency of these inference engines. In this paper, we benchmark the power consumption of LLM inference engines on one single GPU node with 2 H100 GPUs and provide a fine-grained analysis by decomposing the inference lifecycle into two stages: the setup stage including engine initialization and model loading; and the token generation stage. For each stage, we further measure power consumption across key system components, including GPU, CPU, and DRAM. This breakdown analysis allows us to identify energy bottlenecks of inference lifecycle and gain deeper insights into the energy efficiency of modern inference engines.
```

- [ ] **Step 6: Run the test and confirm it passes.**

Run: `SITE_URL=http://127.0.0.1:4005 node scripts/test-paper-pages.cjs`
Expected: `5 paper pages render their content, links and BibTeX`, then the other success lines. Review all 15 screenshots in `/tmp/chenxu-paper-*.png`. In particular, check MicroEvo Figure 5 (very wide and short) at 320 px: it is small but legible when opened at full size from its link.

- [ ] **Step 7: Commit.**

```bash
git add _data/publications.yml _papers images/papers scripts/test-paper-pages.cjs
git commit -m "feat: add pages for the 1/W Law, FIXME, MicroEvo and HotCarbon papers"
```

---

### Task 4: Link every title to its paper page

**Files:**
- Create: `_includes/paper-link.html`
- Modify: `_includes/publication-list.html:10-15` (card title)
- Modify: `_includes/research-themes.html:28-33` (theme paper titles)
- Modify: `_includes/hpc-terminal.html` (`papers` template)
- Modify: `_includes/news-text.html` (`link.paper`)
- Modify: `_data/news.yml` (four items)
- Modify: `docs/cv-maintenance.md`
- Test: `scripts/test-paper-pages.cjs` (`checkEntryPoints`, `checkBackToFilteredList`), `scripts/test-publications.cjs`, `scripts/test-news.cjs`, `scripts/test-hpc-terminal.cjs`

**Interfaces:**
- Consumes: the `papers` collection (`site.papers`, each document's `slug` and `url`) and `paper-primary-url.html` (`paper_primary_url`).
- Produces:
  - `{% include paper-link.html paper=<publication> %}` sets `paper_link_url` (string, possibly `""`) and `paper_link_internal` (`true` for a site paper page, otherwise `false`).
  - News items accept `link.paper: "<slug>"` instead of `link.url`.

- [ ] **Step 1: Write the failing entry-point tests.**

Add `const fs = require('node:fs');` and `const path = require('node:path');` at the top of `scripts/test-paper-pages.cjs`, then add these functions:

```js
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
```

Call `await checkEntryPoints(browser);` and `await checkBackToFilteredList(browser);` in `runCheck`, after `checkPages`.

Update the existing tests:
- `scripts/test-publications.cjs`: the TokenPowerBench title assertion becomes `assert.equal(await titleLinks.filter({ hasText: 'TokenPowerBench:' }).getAttribute('href'), '/publications/tokenpowerbench/', 'Papers with a page link to it');`. The colon keeps the match to the paper's full title. Keep the TokenPowerSandbox DOI assertion, and move the `'Titles link to the DOI first'` message onto it.
- `scripts/test-news.cjs`: set `href` to `'/publications/one-over-w-law/'`, `'/publications/microevo/'`, `'/publications/tokenpowerbench/'` and `'/publications/fixme/'` for those four items. Replace the "all open in a new tab" check with:

```js
    const targets = await page.locator('.news-entry a').evaluateAll(links => links.map(link =>
      [link.getAttribute('href'), link.target, link.rel]));
    for (const [href, target, rel] of targets) {
      if (href.includes('://')) assert.deepEqual([target, rel], ['_blank', 'noopener noreferrer'], href);
      else assert.deepEqual([target, rel], ['', ''], `${href} opens in the same tab`);
    }
```

- `scripts/test-hpc-terminal.cjs`: the first `papers` href becomes `'/publications/one-over-w-law/'`. The following `page.request.get(...)` status check stays; it now checks that the page exists.

- [ ] **Step 2: Run them and confirm they fail.**

Run: `SITE_URL=http://127.0.0.1:4005 npm run test:e2e`
Expected: `test-news.cjs` fails its `deepEqual` on hrefs (it runs first, so the chain stops). Then run `SITE_URL=http://127.0.0.1:4005 node scripts/test-paper-pages.cjs`, expecting FAIL with `/publications/: every paper page is linked`.

- [ ] **Step 3: Create `_includes/paper-link.html`.**

```liquid
{% comment %}
  Sets paper_link_url and paper_link_internal for include.paper. A paper with a
  `slug` whose _papers page exists links to that page (paper_link_internal true,
  opened in the same tab); any other paper falls back to paper-primary-url.html
  (DOI, else arXiv, else PDF; paper_link_internal false; the URL may be empty).
{% endcomment %}{% assign paper_link_page = nil %}{% if include.paper.slug %}{% assign paper_link_page = site.papers | where: "slug", include.paper.slug | first %}{% endif %}{% if paper_link_page %}{% assign paper_link_url = paper_link_page.url | relative_url %}{% assign paper_link_internal = true %}{% else %}{% include paper-primary-url.html paper=include.paper %}{% assign paper_link_url = paper_primary_url %}{% assign paper_link_internal = false %}{% endif %}
```

- [ ] **Step 4: Use it on the cards and the research page.**

`_includes/publication-list.html`, replace:

```liquid
    {% include paper-primary-url.html paper=paper %}
    {% if paper_primary_url != "" %}
      <p class="paper-title"><a href="{{ paper_primary_url }}" target="_blank" rel="noopener noreferrer">{{ paper.title }}</a></p>
```

with:

```liquid
    {% include paper-link.html paper=paper %}
    {% if paper_link_url != "" %}
      <p class="paper-title"><a href="{{ paper_link_url }}"{% unless paper_link_internal %} target="_blank" rel="noopener noreferrer"{% endunless %}>{{ paper.title }}</a></p>
```

`_includes/research-themes.html`, replace:

```liquid
            {% include paper-primary-url.html paper=paper %}
            <li>
              {% if paper_primary_url != "" %}<a href="{{ paper_primary_url }}" target="_blank" rel="noopener noreferrer">{{ paper.title | escape }}</a>{% else %}{{ paper.title | escape }}{% endif %}
```

with:

```liquid
            {% include paper-link.html paper=paper %}
            <li>
              {% if paper_link_url != "" %}<a href="{{ paper_link_url }}"{% unless paper_link_internal %} target="_blank" rel="noopener noreferrer"{% endunless %}>{{ paper.title | escape }}</a>{% else %}{{ paper.title | escape }}{% endif %}
```

- [ ] **Step 5: Use it in the terminal's `papers` command.**

In `_includes/hpc-terminal.html`, replace the body of the `papers` loop:

```liquid
    {% for paper in site.data.publications %}
      {% assign paper_url = '/publications/' %}
      {% for link in paper.links %}
        {% if link.label contains 'PDF' %}{% assign paper_url = link.url %}{% break %}{% endif %}
      {% endfor %}
      <li>
        <a href="{{ paper_url | relative_url }}" data-terminal-paper target="_blank" rel="noopener noreferrer">{{ paper.title | escape }}</a>
```

with:

```liquid
    {% for paper in site.data.publications %}
      {% include paper-link.html paper=paper %}
      {% if paper_link_internal %}
        {% assign paper_url = paper_link_url %}
      {% else %}
        {% assign paper_url = '/publications/' | relative_url %}
        {% for link in paper.links %}
          {% if link.label contains 'PDF' %}{% assign paper_url = link.url | relative_url %}{% break %}{% endif %}
        {% endfor %}
      {% endif %}
      <li>
        <a href="{{ paper_url }}" data-terminal-paper{% unless paper_link_internal %} target="_blank" rel="noopener noreferrer"{% endunless %}>{{ paper.title | escape }}</a>
```

- [ ] **Step 6: Let News items point at a paper.**

`_includes/news-text.html` becomes one line:

```liquid
{{ include.item.before }}{% if include.item.link %}{% if include.item.link.paper %}{% assign news_paper = site.data.publications | where: "slug", include.item.link.paper | first %}{% include paper-link.html paper=news_paper %}{% assign news_url = paper_link_url %}{% assign news_internal = paper_link_internal %}{% else %}{% assign news_url = include.item.link.url %}{% unless news_url contains '://' %}{% assign news_url = news_url | relative_url %}{% endunless %}{% assign news_internal = false %}{% endif %} <a href="{{ news_url }}"{% unless news_internal %} target="_blank" rel="noopener noreferrer"{% endunless %}>{% if include.item.link.emphasis %}<em>{{ include.item.link.text | escape }}</em>{% else %}{{ include.item.link.text | escape }}{% endif %}</a>{% endif %} {{ include.item.after }}
```

In `_data/news.yml`:
- Update the header comment: `` `link.url` is a URL; `link.paper` is a slug from _data/publications.yml and links to that paper's page. ``
- Replace `url:` with `paper:` in four items: NeurIPS `paper: "one-over-w-law"`, MicroEvo `paper: "microevo"`, TokenPowerBench `paper: "tokenpowerbench"`, FIXME `paper: "fixme"`. The PEARC item keeps its DOI `url`.

- [ ] **Step 7: Document the workflow.**

In `docs/cv-maintenance.md`, replace the sentence beginning "The accepted NeurIPS 2026 paper currently has a CV-only entry" with nothing (the paper is now in the data), and append:

````markdown
## Adding a paper page

Five papers have their own page at `/publications/<slug>/`, built from the `papers` collection. To add one:

1. Give the paper a `slug` in `_data/publications.yml`, for example `slug: "kv2vec"`.
2. Create `_papers/<slug>.md` with a one-sentence `tldr`, two or three `figures` (each with `src`, `width`, `height`, `alt` and a `caption` starting `Figure N.`), and the abstract as the body. Title, authors, venue, links and BibTeX come from `publications.yml`.
3. Crop each figure from the PDF with poppler. Measure the figure's box in PDF points (x0, y0, x1, y1), choose a resolution `r = min(400, round(1600 * 72 / (x1 - x0)))`, and convert points to pixels with `pt * r / 72`:

   ```sh
   pdftoppm -png -r <r> -f <page> -l <page> -x <x0px> -y <y0px> -W <widthpx> -H <heightpx> -singlefile paper.pdf images/papers/<slug>/figure-<N>
   ```

   Use `-jpeg -jpegopt quality=82` for a raster screenshot whose PNG would exceed about 300 KB.
4. Optionally point News items at the page with `link.paper: "<slug>"` instead of `link.url`.
5. Add the paper to `PAPERS` in `scripts/test-paper-pages.cjs` and run `npm run test:e2e`.

Cards, the research page, the terminal's `papers` command and News link to a paper's page automatically once both the `slug` and the `_papers` file exist.
````

- [ ] **Step 8: Run everything and confirm it passes.**

Run: `SITE_URL=http://127.0.0.1:4005 npm run test:e2e`
Expected: every script passes, including `Cards, research themes, News and the terminal link to the paper pages` and `Back from a paper page returns to the filtered list`.

- [ ] **Step 9: Commit.**

```bash
git add _includes/paper-link.html _includes/publication-list.html _includes/research-themes.html _includes/hpc-terminal.html \
  _includes/news-text.html _data/news.yml docs/cv-maintenance.md \
  scripts/test-paper-pages.cjs scripts/test-publications.cjs scripts/test-news.cjs scripts/test-hpc-terminal.cjs
git commit -m "feat: link paper titles across the site to their pages"
```

---

### Task 5: Verify, review and open the pull request

**Files:** none changed unless verification finds a problem.

- [ ] **Step 1: Run a safe-mode build, as GitHub Pages does.**

Run: `bundle exec jekyll build --safe -d $SCRATCH/site-safe && ls $SCRATCH/site-safe/publications/`
Expected: no errors; five slug directories plus `index.html`. `grep -c '/publications/' $SCRATCH/site-safe/sitemap.xml` counts at least 6.

- [ ] **Step 2: Run the paper-page tests against a production build (Review Focus 5).**

```bash
JEKYLL_ENV=production bundle exec jekyll serve --host 127.0.0.1 --port 4006 --no-watch   # background
SITE_URL=http://127.0.0.1:4006 node scripts/test-paper-pages.cjs
SITE_URL=http://127.0.0.1:4006 node scripts/test-publications.cjs
```

Expected: both pass with `compress_html` active. Stop the 4006 server afterwards.

- [ ] **Step 3: Run the whole suite and the crawler tests.**

Run: `SITE_URL=http://127.0.0.1:4005 npm run test:e2e && python3 -m unittest discover -s google_scholar_crawler -p 'test_*.py'`
Expected: all pass.

- [ ] **Step 4: Check the pages by eye at 320, 390 and 1440 px.**

Open `/tmp/chenxu-paper-<slug>-<width>.png` for all five slugs and `/tmp/chenxu-publications-<width>.png`, and check:
- the title wraps cleanly;
- the buttons wrap;
- the TL;DR box has comfortable padding;
- figures are full width and captions readable;
- the BibTeX box scrolls inside itself.

- [ ] **Step 5: Get a code review.**

Dispatch the `code-reviewer` agent on `git diff origin/main...HEAD`. Fix CRITICAL and HIGH findings, rerun Step 3, and commit the fixes as `fix: …`.

- [ ] **Step 6: Push and open the pull request.**

```bash
git push -u origin feat/paper-pages
gh pr create --base main --head feat/paper-pages --title "feat: add per-paper pages" --body-file $SCRATCH/pr-body.md
```

The PR body covers:
- the five pages and their URLs;
- the NeurIPS data entry and the regenerated CV PDF;
- the entry-point changes (cards, research, terminal, News `link.paper`);
- the BibTeX preview;
- the test plan (`npm run test:e2e`, the safe build, the production build, screenshots at 320, 390 and 1440 px);
- the spec and plan paths.

No attribution lines.
