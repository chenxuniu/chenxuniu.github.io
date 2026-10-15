const assert = require('node:assert/strict');
const { launchBrowser, openPage, runCheck } = require('./e2e-browser.cjs');

// The homepage News list as rendered from _data/news.yml.
const EXPECTED_NEWS = [
  {
    logo: '/images/icons/conferences/neurips-2026.png', logoClass: 'news-logo', datetime: '2026-09',
    href: '/publications/one-over-w-law/', emphasized: true,
    text: '2026.09 Our paper The 1/W Law: Context Length is the Dominant Energy Lever in LLM Inference Fleets. has been accepted at NeurIPS 2026; the camera-ready PDF is on the paper page.',
  },
  {
    logo: '/images/icons/conferences/iccad-2026.webp', logoClass: 'news-logo news-logo--iccad', datetime: '2026-08',
    href: '/publications/microevo/', emphasized: false,
    text: '2026.08 Our paper MicroEvo: Knowledge-Guided LLM Sampling for Efficient Microarchitecture Design Space Exploration. has been accepted for presentation at ICCAD 2026. An arXiv preprint is available now; the proceedings version is forthcoming.',
  },
  {
    logo: '/images/icons/conferences/pearc-2026.jpg', logoClass: 'news-logo news-logo--pearc', datetime: '2026-07',
    href: 'https://doi.org/10.1145/3785462.3815795', emphasized: false,
    text: '2026.07 Our paper Power-Centric Observability for HPC Systems: Design, Deployment, and Evaluation on REPACSS. has been published in the Proceedings of PEARC 2026.',
  },
  {
    logo: '/images/icons/conferences/aaai-2026.png', logoClass: 'news-logo news-logo--aaai', datetime: '2026-04',
    href: '/publications/tokenpowerbench/', emphasized: false,
    text: '2026.04 Our paper TokenPowerBench: Benchmarking the Power Consumption of LLM Inference. has been published in the Proceedings of AAAI 2026 (acceptance rate: 17.6%).',
  },
  {
    logo: '/images/icons/conferences/aaai-2026.png', logoClass: 'news-logo news-logo--aaai', datetime: '2026-04',
    href: '/publications/fixme/', emphasized: false,
    text: '2026.04 Our paper FIXME: Towards End-to-End Benchmarking of LLM-Aided Design Verification. has been published in the Proceedings of AAAI 2026 (acceptance rate: 17.6%).',
  },
];

runCheck(async () => {
  const browser = await launchBrowser();
  try {
    const { context, page, errors } = await openPage(browser, '/');
    assert.equal(await page.locator('#-news').count(), 1, 'The navigation anchor for News must remain');
    const items = await page.locator('.news-item').evaluateAll(nodes => nodes.map(node => {
      const link = node.querySelector('.news-entry a');
      return {
        logo: node.querySelector('.news-logo img').getAttribute('src'),
        logoClass: node.querySelector('.news-logo').className,
        datetime: node.querySelector('time').getAttribute('datetime'),
        href: link.getAttribute('href'),
        emphasized: Boolean(link.querySelector('em')),
        text: node.querySelector('.news-entry').textContent.replace(/\s+/g, ' ').trim(),
      };
    }));
    assert.deepEqual(items, EXPECTED_NEWS);
    // A `link.paper` slug that matches no paper renders unlinked text, never an empty link.
    assert.equal(await page.locator('.news-entry a[href=""], [data-terminal-news] a[href=""]').count(), 0);
    const targets = await page.locator('.news-entry a').evaluateAll(links => links.map(link =>
      [link.getAttribute('href'), link.target, link.rel]));
    for (const [href, target, rel] of targets) {
      if (href.includes('://')) assert.deepEqual([target, rel], ['_blank', 'noopener noreferrer'], href);
      else assert.deepEqual([target, rel], ['', ''], `${href} opens in the same tab`);
    }
    assert.equal(errors.length, 0, errors.join('\n'));
    await context.close();
    console.log('Homepage News renders unchanged from data');
  } finally {
    await browser.close();
  }
});
