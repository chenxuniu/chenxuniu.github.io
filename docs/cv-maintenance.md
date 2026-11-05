# Maintaining the CV

The academic CV webpage at `/cv/` is the source for the downloadable academic CV PDF. The existing two-page resume remains a separate PDF.

- Edit `_pages/cv.md` for experience, education, research projects, teaching, service, talks, and skills.
- Edit `_data/publications.yml` for papers already in the site's publication list. Keep each paper's `year`, abbreviated `cv_authors`, and full `cv_venue` in sync with its main metadata and BibTeX; `cv_note` is for CV-only status details.
- The peer-reviewed list numbers papers from oldest to newest even though it displays newest first. Its starting number is calculated from the publication data; preprints are not numbered.
- Keep `assets/pdf/Resume_ChenxuNiu_2026.pdf` separate from the generated academic CV.

To regenerate the website and `assets/pdf/Chenxu_Niu_Academic_CV.pdf` after an edit:

```sh
bundle install
npm ci
npx playwright install chromium
npm run cv:build
```

On a machine with Chrome installed, `CHROME_PATH=/path/to/Chrome npm run cv:build` can use that browser instead. Check both `/cv/` and the generated PDF before committing the changed source and PDF together.

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
