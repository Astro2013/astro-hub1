# Astro Galaxy — HTML game-file loader update

This update preserves Astro Galaxy's existing styling and mascot and changes the game-loading behavior. The player now accepts the direct HTTPS URL of an individual HTML game file, fetches the HTML, and loads it into a sandboxed iframe. `style.css` and `assets/astro-mascot.png` are unchanged.

## How to use it

1. Open Astro Galaxy and expand **Load an individual game HTML file** beneath the player.
2. Paste the direct URL to an individual game `.html` file, not a catalog/series page.
3. Choose **Fetch & load file**.

## Important limits

- The game host must allow cross-origin `fetch()` requests from your Astro Galaxy site using CORS. If the host blocks the request, browser JavaScript cannot force it to allow access.
- The HTML file's supporting scripts, images, and data need to remain available at their original relative paths. The loader adds a base URL to help relative paths resolve.
- Some games require browser features or storage that a sandboxed frame does not provide, so not every game will work with this simple loader.
- This update does not scrape catalog pages, guess hidden game-file URLs, proxy requests, or bypass host restrictions.

## Files

- `index.html` — minimal wording/input changes for the direct HTML file loader
- `app.js` — fetches and loads a direct HTML game file
- `style.css` — retained unchanged
- `assets/astro-mascot.png` — retained unchanged
