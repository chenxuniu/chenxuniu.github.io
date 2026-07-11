# Tax Planner Static HTML

This folder is a standalone static version of the tax planner.

## Run Locally

Open `index.html` directly in a browser, or run:

```bash
python3 -m http.server 8000 --directory tax-planner-static
```

Then visit `http://127.0.0.1:8000`.

## Put It In A New GitHub Repo

1. Create a new GitHub repository, for example `tax-planner`.
2. Copy these three files to the new repo root:
   - `index.html`
   - `style.css`
   - `script.js`
3. Commit and push.
4. In GitHub, open `Settings -> Pages`.
5. Choose `Deploy from a branch`, select `main` and `/root`, then save.

GitHub Pages will publish it as a static website.
