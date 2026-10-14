# Per-paper pages — design

Date: 2026-10-14
Status: approved in conversation, awaiting written-spec review

## Goal

Give the five most important papers their own page on the site, so that a visitor who wants more than a publication card (a colleague, a collaborator, a hiring manager) can read a short summary, the abstract and the key figures, and copy the citation. For those five papers the page becomes the site's single entry point: every place on the site that shows the paper's title links to it, and the page links on to the PDF, DOI, code and other resources.

Success means:

- Five pages exist at `/publications/<slug>/` and show title, authors, venue, resource links, a TL;DR, the abstract, two or three captioned figures and the BibTeX entry with a copy button.
- Publication cards (homepage and `/publications/`), the `/research/` page, the footer terminal's `papers` command and the News items for these papers link to the pages.
- The NeurIPS 2026 paper is part of the regular publication data, so it shows up in the publication list, research themes, terminal and CV like every other paper.
- `npm run test:e2e` covers the pages and their entry points, and the pages render without horizontal scrolling at 320, 390 and 1440 px.

## Decisions made with the user

| Question | Decision |
| --- | --- |
| Purpose | In-depth reading and a unified entry point. Not aimed at social sharing or Google Scholar indexing. |
| Which papers | The 1/W Law (NeurIPS 2026), TokenPowerBench (AAAI 2026), FIXME (AAAI 2026), MicroEvo (ICCAD 2026), and Energy Efficient or Exhaustive? (HotCarbon 2025). |
| NeurIPS paper | Add it to `_data/publications.yml`, not `selected` (so it does not appear on the homepage). Its only public links are the site PDF and a new BibTeX file. |
| Page content | Title, authors, venue, resource links and BibTeX with copy, plus TL;DR, abstract and two or three key figures with captions. No key-findings list, affiliations or related-papers section. |
| URL | `/publications/<slug>/` |
| Layout | Keep the site's left author sidebar, like every other page. |
| Data model | A Jekyll collection (approach A below). |

## Approach

Three data models were considered:

- **A. `_papers` collection (chosen).** One Markdown file per paper holds only the page-specific content (TL;DR, figures, abstract). Shared metadata stays in `_data/publications.yml`, joined by a new `slug` field. Metadata has a single source, the abstract is ordinary Markdown, GitHub Pages builds collections natively, and `site.papers` tells every include whether a paper has a page.
- **B. Everything in `publications.yml`.** Long abstracts in YAML are awkward to edit, the file would grow by about half, and GitHub Pages cannot generate pages from data, so a stub page per paper would still be needed.
- **C. Hand-written standalone pages.** Most flexible, but titles, authors and links would be duplicated and drift from the publication list, BibTeX and CV.

## Data

### Collection

`_config.yml` gains:

```yaml
collections:
  papers:
    output: true
    permalink: /publications/:name/
```

and a defaults entry:

```yaml
  - scope:
      path: ""
      type: papers
    values:
      layout: paper
      author_profile: true
```

### Paper files

One file per page in `_papers/`, named by slug:

| Slug | Paper |
| --- | --- |
| `one-over-w-law` | The 1/W Law (NeurIPS 2026) |
| `tokenpowerbench` | TokenPowerBench (AAAI 2026) |
| `fixme` | FIXME (AAAI 2026) |
| `microevo` | MicroEvo (ICCAD 2026) |
| `llm-inference-engines` | Energy Efficient or Exhaustive? (HotCarbon 2025) |

Schema:

```yaml
---
tldr: "One sentence, about 30 words, plain text."
figures:               # two or three entries
  - src: "/images/papers/<slug>/figure-<n>.png"
    alt: "What the figure shows, for screen readers and failed loads."
    caption: "Figure <n>. Caption shortened from the paper."
---
The abstract, verbatim from the paper, as Markdown. Inline math uses $...$ (MathJax is already loaded site-wide).
```

Jekyll derives `slug` from the file name, so the file does not repeat it. The file does not repeat the title, authors, venue or links either.

### Publication data

In `_data/publications.yml`:

- The five papers gain `slug: "<slug>"`, matching their file name in `_papers/`.
- A new entry for the NeurIPS paper goes at the top of the list (it is the newest):

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
  image: "/images/neurips2026-figure1.png"
  note: "Camera-ready version; proceedings version forthcoming."
  authors: "Huamin Chen, Xunzhuo Liu, Yuhan Liu, Junchen Jiang, Xue Liu, **Chenxu Niu**, and Bowei He."
  links:
    - label: "PDF"
      url: "/assets/pdf/neurips2026-one-over-w-law.pdf"
    - label: "BibTeX"
      url: "/assets/bib/neurips2026-one-over-w-law.bib"
```

It has no `scholar_id` because Google Scholar does not list the paper yet; the card's citation row and the terminal's `citations` table already skip papers without one. It is not `selected`.

- `assets/bib/neurips2026-one-over-w-law.bib` is a new `@inproceedings` entry (key `chen2026onew`, booktitle "Advances in Neural Information Processing Systems", year 2026, no pages or DOI yet).
- `images/neurips2026-figure1.png` is the card image: Figure 1 of the paper at 1600×700, matching the other recent card images.

### News

A News item can now point at a paper instead of a URL: `link.paper: "<slug>"` replaces `link.url`. `_includes/news-text.html` resolves it through the shared paper-link include (below). The NeurIPS, TokenPowerBench, FIXME and MicroEvo items switch to `link.paper`. HotCarbon has no News item. Items that keep a `url` render exactly as before.

### CV

`_pages/cv.md` drops its hand-written NeurIPS `<li>` and the numbering offset that made room for it; the paper now comes from the data like every other paper. `assets/pdf/Chenxu_Niu_Academic_CV.pdf` is regenerated with `npm run cv:build`, and its text is compared with the current PDF (`pdftotext`) to confirm the CV content is unchanged.

## Page

### Layout

`_layouts/paper.html` uses the `default` layout, so the masthead, author sidebar, footer and terminal stay as on every page. It finds its paper with `site.data.publications | where: "slug", page.slug | first` and renders:

```
← All publications
[NeurIPS 2026]  Camera-ready version; proceedings version forthcoming.
The 1/W Law: Context Length is the Dominant Energy Lever in LLM Inference Fleets   (h1)
Huamin Chen, …, **Chenxu Niu**, and Bowei He.
[PDF] [BibTeX]                         resource buttons from `links`, wrapping
┌ TL;DR ───────────────────────────────┐
│ one sentence                          │
└───────────────────────────────────────┘
Abstract        page content
Figures         2–3 <figure>s; each image links to the full-size file; caption below
BibTeX          <pre> with the entry, Copy button
```

Details:

- The title drops its trailing period on the page, in `<title>` and in the CV, through one shared include (`paper-display-title.html`, extracted from the logic already in `cv-publication.html`).
- Resource buttons keep each link's label and target: external links and site files open in a new tab with `rel="noopener noreferrer"`, as they do on the cards.
- Figures are `<figure>` elements with `<img loading="lazy" decoding="async" width height alt>` inside a link to the image file, and a `<figcaption>`.
- Styles live in a new `_sass/_paper-page.scss`, imported after `publications` in `assets/css/main.scss`, and reuse the publication accent colours.

### BibTeX block

GitHub Pages' Jekyll cannot read `/assets/bib/*.bib` into a page at build time (`include_relative` cannot reach outside the page's directory). Instead:

- The page renders `<pre class="paper-page__bib" data-bib-src="/assets/bib/<file>.bib">` containing a "Download BibTeX" link as the no-JavaScript fallback, and a Copy button that uses the existing `.paper-copy-bib` markup and behaviour.
- `assets/js/publications.js` gains `setupBibtexPreview()`, which fetches each `[data-bib-src]` file and replaces the fallback with the entry's text. If the fetch fails, the fallback link stays.
- Preview and copy share one cached fetch per BibTeX URL, so copying does not request the file a second time. The Safari clipboard handling stays as it is.

### Title and description

For paper pages, `<title>`, `og:title`, `twitter:title` and the `headline` microdata come from the paper's display title, and `description`/`og:description` come from `tldr`. Without this, Jekyll would title the page after its file name ("One Over W Law"). A small include, `page-title.html`, resolves the title for both `_includes/seo.html` and `_layouts/default.html`.

### Narrow screens

- Buttons wrap.
- Figures are `max-width: 100%`.
- The `<pre>` block scrolls horizontally inside its own box, so the page never scrolls horizontally at 320 px.

## Entry points

A new include, `_includes/paper-link.html`, sets `paper_link_url` and `paper_link_internal` for a paper:

- if the paper has a `slug` and `site.papers` contains that page: the page URL, internal;
- otherwise: the existing primary URL (DOI, else arXiv, else PDF, via `paper-primary-url.html`), external.

Internal links open in the same tab without `target`. External links keep `target="_blank" rel="noopener noreferrer"`.

Callers:

- `_includes/publication-list.html`: the card title (homepage selected list and `/publications/`). The links row under the title is unchanged.
- `_pages/research.md`: paper titles under each theme.
- `_includes/hpc-terminal.html`, `papers` command: papers with a page link to it; the rest keep their PDF link.
- `_includes/news-text.html`: items with `link.paper`.

Papers without a page behave exactly as today.

## Content

### Abstracts

Extracted from the PDFs already in `assets/pdf/` with `pdftotext`, then cleaned: line breaks and hyphenation removed, ligatures and math symbols (×, −, ±, λ, ≈) restored. Wording is kept verbatim.

### TL;DR drafts

| Slug | TL;DR |
| --- | --- |
| `one-over-w-law` | For decode-dominated LLM serving, tokens per watt scale inversely with the serving context window, so routing requests by context length is the largest single lever on fleet energy efficiency. |
| `tokenpowerbench` | An open-source benchmark that measures LLM inference power at the GPU, node and system level without special power meters, and attributes energy to the prefill and decode phase of every request. |
| `fixme` | The first end-to-end benchmark for LLMs in hardware functional verification: 747 tasks from real-world designs across five verification sub-tasks, revealing where state-of-the-art LLMs still fall short. |
| `microevo` | MicroEvo couples off-the-shelf LLMs with Monte Carlo Tree Search to explore microarchitecture design spaces, improving Pareto-front quality by up to 36.2% and search efficiency by 10.6× over NSGA-II. |
| `llm-inference-engines` | Benchmarking vLLM, TensorRT-LLM, DeepSpeed and Transformers on H100 GPUs across the inference lifecycle shows where energy goes by stage and component, and that no single engine is the most efficient in every scenario. |

### Figures

| Slug | Figures (paper numbering) | Caption drafts |
| --- | --- | --- |
| `one-over-w-law` | 1, 2, 3 | 1: Single-GPU tokens per watt for Llama-3.1-70B on H100 and calibrated B200 across serving context windows from 2K to 128K (a), and fleet-level tok/W on the Azure trace at λ = 1,000 req/s (b). 2: Mechanism behind the 1/W law on H100: GPU power and decode throughput versus concurrency (a), and per-context tok/W curves with their operating points (b). 3: Fleet tok/W at λ = 1,000 req/s for Llama-3.1-70B under homogeneous, two-pool and FleetOpt topologies on H100 and B200. |
| `tokenpowerbench` | 1, 2, 4 | 1: Overview of the TokenPowerBench architecture. 2: Prefill energy (a) and decode energy per token (b) across models and inference engines. 4: Total energy per token across models at varying batch sizes. |
| `fixme` | 1, 5, 6 | 1: Typical IC development workflow; verification typically takes over half of the time. 5: FIXME workflow, construction and task examples. 6: Pass rates of state-of-the-art LLMs across FIXME's tasks. |
| `microevo` | 5, 8, 9 | 5: Overview of MicroEvo: LLM-driven initialization and expansion, Pareto-UCT selection in the MCTS tree, PPA evaluation, active knowledge accumulation and state-aware directives. 8: Pareto fronts of different design-space exploration methods in the CPI–Power and CPI–Area spaces. 9: Convergence efficiency and time-to-target comparison. |
| `llm-inference-engines` | 1, 2, 5 | 1: Energy per token across all engines and workloads. 2: Component-wise (GPU, CPU, DRAM) energy per token across inference engines. 5: Energy per token versus throughput. |

Each figure is cropped from its PDF page with poppler's `pdftoppm` (`-r`, `-x`, `-y`, `-W`, `-H`) to a PNG about 1600 px wide, kept under about 300 KB, and saved as `images/papers/<slug>/figure-<n>.png`, where `<n>` is the paper's figure number. No new dependency is added; the command goes into the maintenance docs.

## Documentation

`docs/cv-maintenance.md`:

- The NeurIPS note is replaced: the paper is now in the data.
- A new section, "Adding a paper page", covers: add `slug` to the paper, create `_papers/<slug>.md` with `tldr`, `figures` and the abstract, crop figures with `pdftoppm`, optionally point News items at it with `link.paper`, and run `npm run test:e2e`.

## Testing

New `scripts/test-paper-pages.cjs`, appended to `npm run test:e2e`, using the helpers in `scripts/e2e-browser.cjs`.

1. **Pages.** For each of the five slugs:
   - the page responds with 200;
   - `<title>` starts with the display title, and `<h1>` is the display title;
   - the authors contain a bold "Chenxu Niu";
   - the venue badge shows the venue;
   - the TL;DR is non-empty;
   - the abstract is at least 400 characters;
   - there are two or three figures, each loaded (`naturalWidth > 0`) with non-empty alt text and a caption;
   - the resource buttons match the card's links for the same paper;
   - the back link points to `/publications/`;
   - the BibTeX `<pre>` fills with text starting with `@`;
   - Copy puts exactly the `.bib` file's text on the clipboard;
   - no page errors.
2. **Consistency.** The set of `_papers/*.md` file names equals the set of `/publications/` card titles that link to `/publications/<slug>/`. A missing or misspelled `slug` on either side fails.
3. **Entry points.**
   - On `/publications/`: 5 internal title links without `target`, and 6 external title links with `target="_blank"`.
   - Homepage: TokenPowerBench, FIXME and HotCarbon titles link to their pages.
   - `/research/`: the five titles link to their pages.
   - Terminal `papers`: 5 internal links.
   - News: 4 items link to their pages in the same tab.
4. **Layout.** At 320, 390 and 1440 px, none of the five pages scrolls horizontally.
5. **No JavaScript.** With JavaScript disabled, the BibTeX block shows the download link.

Existing tests are updated for the new paper:

- `test-publications.cjs`: 10 → 11 papers, the energy theme count, and title-link expectations.
- `test-research.cjs`: energy theme 4 → 5 papers.
- `test-hpc-terminal.cjs`: `papers`/`squeue` 10 → 11, the energy theme 4 → 5, and the first `papers` entry.
- `test-news.cjs`: the four changed hrefs become `/publications/<slug>/`, and its check that every News link opens in a new tab applies only to the PEARC item, which keeps its external DOI.

Build check: `bundle exec jekyll build --safe` with github-pages 232 (the version GitHub Pages uses) confirms the collection, permalinks and `where` lookups work in safe mode. The Python crawler tests (`google_scholar_crawler/test_update.py`) still pass with an entry that has no `scholar_id`.

## Out of scope

- Google Scholar `citation_*` meta tags.
- Analytics.
- Key-findings lists, author affiliations and related-papers sections.
- Pages for the other six papers.
- Restructuring how BibTeX files are stored.
