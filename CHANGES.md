# Changes

What changed in each step of the plan (`~/.claude/plans/i-want-to-change-pure-allen.md`). Nothing is committed.

## P1 batch D: small logic bugs and public dev notes

- **Hero-fight** (`hero-fight/script.js`)
  - Heavy Strike's recoil can't take you below 1 HP, so a winning strike never leaves you at 0.
  - Fireball with too little gold no longer costs the turn. The enemy doesn't get a free hit.
  - `addXP` now loops, so a big XP gain can level you up more than once.
- **Airplane sim** (`airplane-simulator/index.html`): changing a setting always resets the sim, also while paused or before the first start. Average wait says "steps" everywhere.
- **D0011E** (`D0011E/script.js`): the status bar and listing redraw when a program ends on a NOP, and the Run button goes back to "⏩ Run" when it's done.
- **Ray tracer** (`ray-tracer/index.html`): `main.cpp` is the active file tab on load, matching the code shown.
- **Neural net** (`neural-network/script.js`): `mouseup` only runs inference if a stroke was started on the canvas.
- **Name checker** (`name-checker/script.js`): the length check uses the trimmed name, so spaces alone keep the button disabled.
- **D0009E** (`D0009E/script.js`): the dictionary and phonebook use `Map`, so words like "constructor" work.
- **islam-kindles support** (`islam-kindles/support/script.js`): the success message's hide timer restarts on each submit.
- **islam-kindles debunks and hadith**: the "How to add more" developer notes are gone from the page. They're now HTML comments that point at the right file (`script.js`, not `index.html`).

Checked in Chrome: each fix above scripted on its page, zero page errors.

**Needs you:** the open-source "View merged PR" link still goes to the socket.io `/pulls` list. I couldn't find the PR (the GitHub API shows no PRs by `abdoahmed07` in socketio/socket.io), so paste the real PR URL into `open-source/index.html` line 45.

## Step 3 (R1 + R2): shared foundation and the hub

New `shared/` folder, built from the D reference:
- `shared/base.css`: tokens for both themes (D palette, Geist and Geist Mono, radius scale 10px/20px/pill), nav, theme toggle, footer, contact panel, focus ring, skip link, `.sr-only`, the Glow backdrop and `.stage` light pool, and a reduced-motion block. Project-page rules (hero with the object beside it, section headings, tab pills, cards, code viewer) are scoped under `body.pj`, so they win over each page's older rules.
  - `--accent` stays the project color. The monochrome "pressed" color from D is now its own token, `--ink`.
  - Code blocks follow the theme. Demo panels get fixed dark `--panel*` tokens.
- `shared/theme.js`: guarded `localStorage`, toggle with a live `aria-label`, highlight.js dark/light stylesheet swap, `theme-color` meta, a `themechange` event, and ARIA tabs. The tabs part adds roles, keeps `aria-selected` in step with `.active` and adds arrow keys on top of each page's own tab code.
- `shared/motion.js`: one `requestAnimationFrame` loop that writes `--p` and `--in` on `[data-scene]` elements and sets the page glow from the `[data-glow]` element in view. It stops while the tab is hidden and only redraws on change under reduced motion. Other scripts hook in with `Motion.onFrame()`.
- `shared/gl/studio.js`: the 3D layer, with one canvas and scissor rendering for every `.stage[data-object]`. Three.js 0.186.1 comes from jsDelivr through an import map and loads after the `load` event. Without WebGL, or if the load fails, the page gets `.no-gl` and the stages show the project number as an outline.
- `shared/gl/objects.js`: the 20 D objects plus the shared materials, one builder per project folder name.
- `shared/gl/chrome.js`: the hub's pinned chrome form.

Hub (`portfolio-site/index.html`, `style.css`, new `hub.js`):
- Rebuilt as D: nav, pinned hero with the chrome form, pinned statement, projects list, outro, footer, contact panel.
- The 20 projects are static HTML (`<li class="project-item">`), so they show without JS. Titles and descriptions are unchanged.
- The filter still matches `.project-tag` text against the buttons' `data-tag`, and both "20 projects" strings are still there (markup and the `applyFilter` All branch).
- Filter buttons use `aria-pressed`. The count is `aria-live`.
- The contact panel is `inert` while closed. Focus moves into the email field on open and back to the button on close. An empty submit shows a message instead of posting.
- The hover preview code and the `data-preview` attributes are gone. The view-transition click handler is gone too, so Cmd/Ctrl-click opens a new tab again (the P1 hub item).
- The skills strip is gone from the hub, as in the D reference. The skills now live on the about page (step 4).

Checked in Chrome (1440 and 375, dark and light):
- No page errors, no horizontal overflow.
- The statement lights up word by word, and filter counts are right for Python/C/Game/Open Source/All.
- Contact focus and `inert` work, and the tab order is right, with the focus ring around the whole project row.
- Reduced motion: no pinning, the statement is fully lit, and the objects and chrome form are still.
- No WebGL: outline numbers show, and filter and contact still work.
- The render loop stops when the tab is hidden.
- 375px with 4x CPU throttle while scrolling the list: p95 frame 16.7ms, 99% of frames under 17ms.

**Needs you:** delete `portfolio-site/previews/`. Nothing references it any more. My delete command was blocked by the permission check.

## Step 4 (R2): about page

- `portfolio-site/about.html` and `about.css` use the shared system now: the D nav (name, "All projects" back link, theme toggle), a large "Abdalla." heading with the orange dot, the bio in the D type scale, and the photo in a rounded 20px frame with a soft orange light pool behind it.
- It no longer loads the hub's `style.css`. No 3D here.
- The skills section ("What I work with") uses group headings (`h3`) and plain pills, and rises in on scroll.
- Its old inline theme script is replaced by `shared/theme.js`.
- The nav and footer line up with the page content on every page. I fixed that in `shared/base.css`.

Checked in Chrome at 1440 and 375, dark and light: no page errors, no horizontal overflow.

## Step 5 (R3): project pages

Every migrated page gets the same changes:
- **Head:** Geist fonts, a guarded pre-paint theme script, `shared/base.css` before its own `style.css`, and the Three.js import map.
- **Chrome:** `<body class="pj">`, a skip link, the D nav (name, "All projects" back link, theme toggle), `<main id="main">` and the shared footer. `shared/theme.js` and `shared/motion.js` load before the page script, and `shared/gl/studio.js` after it.
- **Hero:** the existing hero text sits on the left in `.hero-text`. The project's own object, the same one as on the hub, sits on the right in a Glow stage. On phones the object sits above the title. Course pages get "Luleå University of Technology" as a small line in the hero.
- **Section labels** are real `<h2>`s now and rise in as they scroll into view.
- **`style.css`:** the old tokens, noise overlay, topnav, toggle, hero, tabs and code-viewer rules are gone. The file starts with its accent pair: dark accent, plus a darker light-mode shade that passes AA.
- **`script.js`:** the page's own theme-toggle block is gone, since `shared/theme.js` handles it. Any tab strip now gets ARIA roles and arrow keys.
- **Dark demo panels** get `.dark-panel`, so they stay dark with light text in both themes.

### Reference pages: ray-tracer and D0010E
- ray-tracer: the render panel is a dark panel. Tab labels and "What I learned" are in sentence case.
- D0010E: this page had no theme toggle before. It gets one now, and its light mode works. Its `--font-d`/`--font-m` point at Geist.

### Summer pages
code-review, interpreter, neural-network, packet-analyser, ctf, open-source, technical-writing, problem-solving.
- Dark panels: the Lox REPL, the packet capture, the SQLi panel, the open-source diffs, and the code blocks inside CTF writeups and Field Notes posts.
- Light accents: code-review `#4f46e5`, interpreter `#1d4ed8`, neural-network `#be185d`, packet `#15803d`, ctf `#b91c1c`, open-source `#a16207`, technical-writing `#be123c`, problem-solving `#0f766e`, ray-tracer `#be123c`, D0010E `#b45309`.

Checked in Chrome at 1440 and 375, in both themes:
- No page errors, no horizontal overflow.
- Lox `while (true)` stops with the step-budget error, and packet `--host google` shows rows.
- Code review renders `<b>` as text.
- Arrow keys move between tabs and switch the panel.

### Course pages and earlier projects
D0009E, D0015E, hero-fight, airplane-simulator, D0011E, name-checker, login-system, tic-tac-toe.
- The course pages (D0009E, D0015E, D0011E) get the "Luleå University of Technology" line in the hero. D0015E's hero pills are no longer uppercase.
- Code blocks that hardcoded `#0d1117` or `#0d0d0d` (D0009E, D0010E, D0015E, airplane, hero-fight) now use `--code-bg`, so they match the highlight.js theme in light mode.
- Dark panels: the airport sim and the D0011E MIPS panel.
- **App pages.** Name checker, login and tic-tac-toe have no hero: the app card holds the title. They use a new `.app-layout`, with the app on the left and its object on the right, and the object above the app on phones.
  - Tic-tac-toe's three screens used to be `position: fixed` layers. They now share one grid cell, so they sit inside the page.
- Login: the demo notice was a fixed bar over the nav. It's now a static strip above "Welcome." (the R4 item), readable in both themes. The decorative `.bg-glow` is gone, since the shared backdrop does that job.
- Tic-tac-toe: X and O colors come from theme tokens, so O's show in light mode. The title stays on one line (the old P5 item).
- `.acc` title words use the accent everywhere through a shared rule.
- Light accents: D0009E/airplane `#0284c7`, D0015E/login `#b45309`, hero-fight `#c2410c`, D0011E `#6d28d9`, name-checker `#0891b2`, tic-tac-toe `#7e22ce`.

Checked in Chrome at 1440 and 375 in both themes: no page errors, no overflow. Tic-tac-toe was played against the bot: the O color is right in each theme and the title is on one line.

### islam-kindles, the Fly game and Hammurabi
- **islam-kindles, all 8 pages:**
  - The shared nav sits on top, and the site's own header (logo plus Quran/Hadith/... links) is a second row under it that sticks while scrolling.
  - Geist fonts; Amiri is kept for the Arabic text. The unused DM Serif Display font and the old in-bar "← Portfolio" link are gone.
  - `<main id="main">`, shared footer, `shared/theme.js` and `shared/motion.js`. The subpages had no theme toggle or light mode before, and they have both now.
- **islam-kindles home:** the lantern object sits beside the hero text. The faint background photo (`.hero-bg`, `images/home-top.jpg` at 8% opacity) is removed from the page. The image file itself is still there. The primary "Explore Quran" button uses the ink color, so it reads in both themes.
- **islam-kindles header on phones (R4):** a proper row with the logo on the left and a 44px menu button on the right. The menu button has `aria-label`, `aria-controls` and a live `aria-expanded`, updated in all eight scripts.
- **Fly game and Hammurabi standalone** keep their own look, as planned. Changes:
  - The back link says "← All projects", and the Fly game's back link has readable contrast now.
  - Both get a `:focus-visible` ring and a reduced-motion block.
  - Hammurabi hides the soldier image under 640px (R4), and its alt text is empty since it's decoration.

Checked in Chrome at 1440 and 375 in both themes: no page errors, no overflow.

## Step 6 (R4): mobile, accessibility and cleanup

**Contrast.** axe-core (serious and critical) now passes on every page in both themes.
- Light-mode accents that failed on white or tinted cards moved to the 700/800 shade of the same hue:
  - name-checker `#155e75`
  - D0009E/airplane `#0369a1`
  - D0010E/D0015E/login `#92400e`
  - open-source `#854d0e`
  - packet `#166534`
  - hero-fight `#9a3412`
  - islam-kindles `#065f46`
  - problem-solving `#115e59`
- In dark mode, code-review text uses `#818cf8` and ctf uses `#f87171`. The 3D objects keep the original hub colors.
- New `--on-accent` token (near-black in dark mode, white in light) for text on accent-filled buttons. It replaces 16 hardcoded `#000`/`#fff`.
- Faded text made with `opacity` or hardcoded greys is fixed: quran surah list, D0010E architecture boxes, D0011E lab numbers, Field Notes post numbers, airport queue text, and the Fly game's greys and give-up button.
- Code review's own syntax colors get light-mode values.
- The D0010E room name was colored with the room's own color, which was unreadable on light. It's now normal text with a small color swatch next to it.

**Text size floor.** Across the migrated pages' CSS, 375 font sizes went up: anything under 12px is now 12px, and description or paragraph text under 14px is now 14px. The Fly game and Hammurabi keep their sizes.

**Structure and semantics:**
- One `<h1>` per page. Login's "Welcome." is the h1 now, and the Fly result, CTF writeup titles and Field Notes post titles are h2s.
- Every input has a label. Labels are linked with `for`, and the Hammurabi sliders, Lox editor, example picker and aperture slider are labelled.
- Symbol-only buttons get real names: calculator operators, airport steppers, search arrow, leaderboard, password eye.
- The open-source fix toggle is a `role="switch"` with `aria-checked`.
- Clickable spans and divs are real buttons: spell-check chips, search chips, Field Notes post list (with `aria-current`), island grid cells (with `aria-pressed`; focus stays on the cell after the grid redraws), and code-review line numbers ("Comment on line N").
- `aria-live="polite"` on result and status text: name checker, login alerts, tic-tac-toe error, D0009E/D0010E demo outputs, Lox output, SQLi result, open-source status, islands status.
- `aria-expanded` on the "View code" toggles (D0009E/D0010E/D0015E), the support FAQ, hadith chains and debunk cards.
- `lang="ar" dir="rtl"` on Arabic text in the Quran, surah and hadith pages.
- Canvases have text descriptions: room map, BFS graph, ray tracer, digit pad.
- The hero-fight file tabs (`.tab`) get ARIA tab roles too.
- Scrollable code and log regions become keyboard-focusable. `shared/theme.js` does this automatically.
- The hub statement's `aria-label` on a `<p>` was invalid, so it's now a screen-reader-only copy of the sentence.

**Sentence case.** 96 generic headings, tab labels and section names changed ("Source Code" → "Source code", "What I Learned" → "What I learned", "How It Works" → "How it works", and so on). Project names, program names and proper nouns stayed as they are. "View Code"/"Hide Code" are now "View code"/"Hide code".

**Mobile (375px):** a check for any visible element sticking out past the screen edge, run on every page with every tab opened, comes back clean.
- Hammurabi's help card used to open off the left edge. On phones it's now a sheet across the bottom.
- The contact button is icon-only under 640px (from step 3).
- Tab strips scroll sideways, the login notice is a static strip, the islam-kindles header has a phone row, and the Hammurabi soldier is hidden (all from step 5).

**Cleanup:**
- D0015E's stylesheet was mostly a leftover copy of D0010E's. 270 unused rules are gone (2281 → 678 lines).
- 21 unused rules are gone from the airport page, including `.terminal-mock`.
- The Fly game's duplicate `.ctrl-btn--danger` blocks are merged.
- The page-level theme/nav/focus code was already removed in step 5. I checked that no class still used in the markup lost its styles.
- **Found and fixed on the way:** the step 5 cleanup had also removed each page's `* { margin: 0; padding: 0 }` reset. It's back in `shared/base.css` with zero specificity (`:where(.pj) *`), so page rules still win.

**Needs you (deletes):** `D0015E/snowflake.jpg` and `islam-kindles/images/home-top.jpg` are no longer referenced anywhere.

## Step 7: final sweep and docs

- Deleted `portfolio-site/directions/` (the A-D test pages). Nothing referenced it.
- `CLAUDE.md`: "Layout", "Adding or changing a project" and "Shared conventions" are rewritten for `shared/`. A new project now also needs an object builder in `shared/gl/objects.js` and a stage on the hub. The "20 projects" count now lives in `portfolio-site/hub.js`. The run note says 3D needs a server.
- `README.md`: `shared/` is in the structure tree. The fonts row says Geist, and there's a Three.js row. The run instructions say to serve the repo root, and the design note is updated.
- `shared/motion.js`: when a page is opened from `file://` (where browsers block module scripts), it shows the outline-number fallback instead of an empty stage.

**Bugs the sweep caught, now fixed:**
- **`.dark-panel` accent (my bug from step 5):** `--accent: var(--accent-on-dark, var(--accent))` referenced itself, so the accent was invalid inside every dark panel (CTF submit button at 1.02:1).
  - Each page now declares `--accent-dark`, and dark panels use it in both themes, along with a dark `--on-accent`.
- **D0010E Lab 6 code tabs (already broken in HEAD):** the `CarWashState.java` snippet's `<pre><code>` was never closed. The next six panels ended up inside it, highlight.js wiped them, and six tabs threw errors.
  - I closed it with `// ...` and `}` rather than invent the missing code. **You may want to paste the real rest of `CarWashState.java` there.**
- **highlight.js colors under AA:** GitHub light's `built_in`/`symbol` and Tomorrow Night's `meta` are overridden in `shared/base.css`.
- **Smaller fixes:** the D0010E UML and notes panels are dark panels now, the MIPS program picker has a label, the D0011E ALU result box and the hero-fight class flavor text have readable contrast.

**Sweep results (Chrome, local server):**
- **All 30 pages × dark/light × 1440/375 (120 loads):** zero page errors, and no element sticks out past the screen edge.
- **Click-every-button pass on all 30 pages:** zero page errors, after the D0010E fix above.
- **Scripted checks:**
  - Tic-tac-toe pills and light-mode O's (`rgb(12,12,14)`).
  - Hammurabi embed: "Make It So!" is hidden before the start, and a turn plays after it. The standalone order button works.
  - Packet `--host google` shows rows. The hub contact panel in light mode says "Message sent" (Formspree mocked).
  - Code review renders `<b>` as text. Lox `while (true) {}` stops with the step-budget error.
- **axe-core, all 30 pages, both themes, every tab and toggle opened:** zero serious or critical violations, contrast included.
- **Reduced motion (hub, ray-tracer, D0010E):** no `.motion` class, nothing pinned, headings fully shown, and the 3D objects stay still.
- **No WebGL (same three pages):** `.no-gl` is set, outline numbers show, there are no GL canvases, and tabs, filter and contact still work.
- **Greps:** `grep -r "—"` only finds the 10 known placeholder glyphs (calculator operator, airport runway slot, hero-fight stats, packet top lists). The personnummer pattern has zero hits.

## Still yours to do
1. Delete `portfolio-site/previews/`, `D0015E/snowflake.jpg` and `islam-kindles/images/home-top.jpg`. They're unreferenced now, but my delete was blocked by the permission check.
2. Paste the real socket.io PR URL into `open-source/index.html` (the "View merged PR" link).
3. Optional: the rest of `CarWashState.java` in D0010E Lab 6.
4. From P0, still open: rewrite git history to remove the personnummer, and check the title pages of `D0015E/D1.pdf`, `D2.pdf` and `L.pdf`.
