# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git

Never run `git commit` or `git push`. Leave all changes uncommitted in the working tree. I review and commit everything myself.

## What this is

A static personal portfolio hosted on GitHub Pages at https://abdoahmed07.github.io/portfolio/portfolio-site/index.html. Plain HTML, CSS and vanilla JS. No framework, no package.json, no bundler, no tests, no linter.

## Running it

Open any `index.html` directly in a browser, or serve the repo root (this matches `.claude/launch.json`):

```bash
python3 -m http.server 8934
# then http://localhost:8934/portfolio-site/index.html
```

Serve from the repo root, not from a subfolder. Pages reference siblings with `../` paths (`../favicon.svg`, `../portfolio-site/index.html`), so serving a single project folder breaks them.

A Playwright CLI skill lives in `.claude/skills/playwright-cli` for checking pages in a real browser. Its output dir `.playwright-cli/` is gitignored.

## Layout

- `portfolio-site/` is the hub: `index.html` (project list) and `about.html`. The rest of the top-level folders are one project each, numbered 01-20 in the README and on the hub page.
- Each project folder is self-contained, usually `index.html` + `script.js` + `style.css`. `islam-kindles/` is the exception, a multi-page site with subfolders and a shared `style.css`.
- `login-system/` has PHP files for the real backend. Without a PHP server it falls back to demo mode automatically.
- `airplane-simulator/` only holds the showcase page. The C++ source and Makefile the README mentions are not in this repo.

## Adding or changing a project

A new project touches several places by hand:

1. The new folder with its own `index.html`, `script.js`, `style.css`.
2. A `<a class="project-item" data-num="NN">` entry in `portfolio-site/index.html`. Its `.project-tag` text must exactly match a `data-tag` on a `.filter-btn` in the filter strip, or filtering won't pick it up. Add a new filter button if the tag is new.
3. The hardcoded `"20 projects"` count appears twice in `portfolio-site/index.html`: in the `.section-count` markup and in the `applyFilter` script (`tag === 'All'` branch). Update both.
4. The README structure tree and project section.

## Shared conventions across pages

There's no shared stylesheet or script. Each page copies the same patterns, so keep them consistent when editing:

- Theme: `<html data-theme="dark">`, an inline script in `<head>` that reads `localStorage.theme` before paint, and a `#themeToggle` button with moon/sun SVGs. Light mode is done by overriding CSS variables under `[data-theme="light"]`.
- CSS variables on `:root` (`--bg`, `--surface`, `--border`, `--text`, `--muted`, `--accent`, `--accent-dim`, `--accent-glow`, `--font-display`, `--font-mono`). Each project has its own `--accent` color. Reuse the variables rather than hardcoding colors.
- Fonts: Syne for headings, DM Mono for code/mono, loaded from Google Fonts.
- Every project page links back to `../portfolio-site/index.html` and uses `../favicon.svg`.
- Source code is displayed with highlight.js from a CDN.

## Showcase philosophy

Many projects were originally written in other languages (Python, Java, C#, C, C++, Veryl) or had real backends (Node/Postgres/Socket.io, Flask). The showcase pages port the real algorithm to JS rather than faking output: the neural network runs its actual trained weights (`neural-network/weights.js`), the ray tracer runs real path-tracing math, the CTF page runs the same vulnerable query logic. Keep it that way when changing a demo.

## Writing style

All prose, UI copy, comments and commit messages should read like a person wrote them.

- Keep it simple and easy to understand. Short sentences, everyday words.
- UI copy stays short and plain. Say what a thing does, nothing more.
- No em dashes, no AI-cliche phrasing, sentence-case headers, match existing quote style.
- Emoji used as functional UI glyphs (♥, ⚔, ★, ✓/✗) and single em dashes used as empty-value placeholders in UIs are fine and should be left alone.
