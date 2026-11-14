# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git

Never run `git commit` or `git push`. Leave all changes uncommitted in the working tree. I review and commit everything myself.

## What this is

A static personal portfolio hosted on GitHub Pages at https://abdoahmed07.github.io/portfolio/portfolio-site/index.html. Plain HTML, CSS and vanilla JS. No framework, no package.json, no bundler, no tests, no linter.

## Running it

Serve the repo root (this matches `.claude/launch.json`). Opening files directly works too, but the 3D layer can't load from `file://`, so stages show their fallback numbers:

```bash
python3 -m http.server 8934
# then http://localhost:8934/portfolio-site/index.html
```

Serve from the repo root, not from a subfolder. Pages reference siblings with `../` paths (`../favicon.svg`, `../portfolio-site/index.html`), so serving a single project folder breaks them.

A Playwright CLI skill lives in `.claude/skills/playwright-cli` for checking pages in a real browser. Its output dir `.playwright-cli/` is gitignored.

## Layout

- `portfolio-site/` is the hub: `index.html` (project list), `about.html`, and `hub.js` for the statement, filter and contact panel. The rest of the top-level folders are one project each, numbered 01-20 in the README and on the hub page.
- `shared/` holds what every page uses: `base.css`, `theme.js`, `motion.js`, and `gl/` for the 3D layer (`studio.js`, `objects.js`, `chrome.js`).
- Each project folder is otherwise self-contained, usually `index.html` + `script.js` + `style.css`. `islam-kindles/` is the exception, a multi-page site with subfolders and its own shared `style.css` on top of `shared/base.css`.
- `login-system/` has PHP files for the real backend. Without a PHP server it falls back to demo mode automatically.
- `airplane-simulator/` only holds the showcase page. The C++ source and Makefile the README mentions are not in this repo.

## Adding or changing a project

A new project touches several places by hand:

1. The new folder with its own `index.html`, `script.js`, `style.css`. Copy the head, nav, hero and footer from an existing project page (ray-tracer is a clean one). The hero's `.stage` needs `data-object="<folder name>"`, `data-accent="<accent hex>"` and the project number as its fallback text.
2. An object builder in `shared/gl/objects.js`, keyed by the folder name. Without one the stage stays empty.
3. A `<li class="project-item" data-num="NN">` entry in `portfolio-site/index.html`, with its own `.stage` (same `data-object` and `data-accent`), `data-glow` and `style="--c:<accent>"`. Its `.project-tag` text must exactly match a `data-tag` on a `.filter-btn` in the filter strip, or filtering won't pick it up. Add a new filter button if the tag is new.
4. The hardcoded `"20 projects"` count appears twice: in the `.section-count` markup in `portfolio-site/index.html` and in `applyFilter` in `portfolio-site/hub.js` (`tag === 'All'` branch). Update both.
5. The README structure tree and project section.

## Shared conventions across pages

Every page except the Fly game and the standalone Hammurabi page (both keep their own look) is built on `shared/`:

- Head: Geist and Geist Mono from Google Fonts, an inline script that reads `localStorage.theme` (inside `try`) before paint, the Three.js import map on pages with 3D, then `shared/base.css` before the page's own `style.css`.
- Body: project pages use `<body class="pj">`. The page starts with a skip link, `.backdrop` and the `.site-nav` (name, "All projects" back link to `../portfolio-site/index.html`, empty `#themeToggle` that `theme.js` fills), and ends with `.site-footer`. Load `shared/theme.js` and `shared/motion.js` before the page script, and `shared/gl/studio.js` as a module after it.
- Tokens live in `shared/base.css` for both themes (`--bg`, `--surface`, `--border`, `--text`, `--muted`, `--ink`, `--accent-text`, `--on-accent`, `--code-bg`, `--panel*`, radius and fonts). A page only sets `--accent` in `:root` and a darker `--accent` under `[data-theme="light"]` that passes AA on white. Reuse the tokens rather than hardcoding colors.
- `--accent` is the project color. `--ink`/`--on-ink` are the monochrome fill for primary and pressed states, and `--on-accent` is text on an accent fill.
- Terminals, canvases and simulators stay dark in both themes: give the block `.dark-panel`. Code blocks follow the theme, and `theme.js` swaps the highlight.js stylesheet.
- Tab strips (`.tabs`, `.tab-bar`, `.file-tabs`) get ARIA roles and arrow keys from `theme.js`. Pages keep their own click handlers and the `.active` class.
- Scroll effects come from `motion.js`: anything with `data-scene` gets `--p` and `--in`. Nothing listens to scroll events, and everything must read fine with reduced motion, where the `.motion` class is off.
- 3D objects are decoration next to real text, so stages are `aria-hidden`. Without WebGL the page gets `.no-gl` and stages show the project number.
- Source code is displayed with highlight.js from a CDN.

## Showcase philosophy

Many projects were originally written in other languages (Python, Java, C#, C, C++, Veryl) or had real backends (Node/Postgres/Socket.io, Flask). The showcase pages port the real algorithm to JS rather than faking output: the neural network runs its actual trained weights (`neural-network/weights.js`), the ray tracer runs real path-tracing math, the CTF page runs the same vulnerable query logic. Keep it that way when changing a demo.

## Writing style

All prose, UI copy, comments and commit messages should read like a person wrote them.

- Keep it simple and easy to understand. Short sentences, everyday words.
- UI copy stays short and plain. Say what a thing does, nothing more.
- No em dashes, no AI-cliche phrasing, sentence-case headers, match existing quote style.
- Emoji used as functional UI glyphs (♥, ⚔, ★, ✓/✗) and single em dashes used as empty-value placeholders in UIs are fine and should be left alone.
