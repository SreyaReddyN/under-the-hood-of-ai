# Under the Hood of AI — hosting guide

This is a zero-build static website. You do not need Node, React, npm, a database, or a backend.

## Preview locally

Option 1: double-click `index.html`.

Option 2 (recommended): in this folder run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Host with GitHub Pages

1. Create a new GitHub repository.
2. Upload all files from this folder to the repository root.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose the `main` branch and `/ (root)` folder.
6. Save. GitHub will give you a public URL.

## Host with Netlify

Drag this entire folder into Netlify's deploy interface. Because the site is static, there is no build command and the publish directory is the folder itself.

## Host with Vercel

Import the GitHub repository into Vercel. For a plain static site, no framework is required. Keep the root directory as the project directory.

## Customize

- Site name / hero copy: `index.html`
- Chapter text: the four `chapter-*.html` files
- Design: `styles.css`
- Theme toggle / reading progress / mobile menu: `script.js`
- Source links: `sources.html`

## Files

- `index.html` — landing page
- `chapter-1-neural-networks.html`
- `chapter-2-deep-learning.html`
- `chapter-3-transformers.html`
- `chapter-4-hardware.html`
- `sources.html`
- `styles.css`
- `script.js`
- `favicon.svg`

## Chapter 1 enhancement

Chapter 1 now includes three zero-dependency interactive learning demos:
- Live neuron calculator (inputs, weights, bias, sigmoid output)
- Activation explorer (ReLU, sigmoid, tanh)
- Gradient descent explorer (adjustable learning rate)

Everything is still plain HTML/CSS/JavaScript, so no build step is required.


## Standalone pages
Each HTML page now embeds the full CSS and JavaScript needed for its interactive demos. This makes the pages render consistently when opened directly, while the shared `styles.css` and `script.js` files are also kept for easier maintenance.
