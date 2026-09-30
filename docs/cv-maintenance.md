# Maintaining the CV

The academic CV webpage at `/cv/` is the source for the downloadable academic CV PDF. The existing two-page resume remains a separate PDF.

- Edit `_pages/cv.md` for experience, education, research projects, teaching, service, talks, and skills.
- Edit `_data/publications.yml` for papers already in the site's publication list. Keep each paper's `year`, abbreviated `cv_authors`, and full `cv_venue` in sync with its main metadata and BibTeX; `cv_note` is for CV-only status details. The accepted NeurIPS 2026 paper currently has a CV-only entry; remove it from `_pages/cv.md` if it is later added to `_data/publications.yml`.
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
