# Abdalla's Portfolio

A personal portfolio website built from scratch during my first year of Computer Engineering (Datateknik) at Luleå University of Technology. Everything here — the design, the code, the interactive demos — was made by me as I was learning. Some projects are polished, some are rough around the edges, all of them are real.

The portfolio is live at **[abdoahmed07.github.io/portfolio-site](https://abdoahmed07.github.io/portfolio-site/)** and links out to each project in its own folder.

---

## Who is this for?

If you're a friend: this is basically a log of everything I've built so far. You can click around and play with the demos.

If you're looking at this for work or an application: I'm a first-year student who builds things to learn. I don't just read about concepts — I implement them. Every course project on here has a live interactive demo next to the code.

---

## Structure

```
/
├── portfolio-site/       ← The main portfolio index page
├── name-checker/         ← Project 01
├── fly-game/             ← Project 02
├── islam-kindles/        ← Project 03
├── login-system/         ← Project 04
├── tic-tac-toe/          ← Project 05
├── D0009E/               ← Project 06 — Python course
├── D0010E/               ← Project 07 — Java / OOP course
├── D0015E/               ← Project 08 — Computer Engineering survey course
└── hero-fight/           ← Project 09 — C# console RPG, playable in browser
```

Each folder is self-contained. Open the `index.html` inside any folder to run it — no build step, no server required for most projects.

---

## Projects

### 01 — Name Checker

The very first website I ever made. A simple tool that checks a name against some rules. Not impressive technically, but it's where everything started.

**Tech:** HTML, CSS, JavaScript

---

### 02 — The Fly Game

A reflex game where you try to click a fly before it moves. Sounds simple, gets surprisingly hard. Has four modes: Infinite, 3 Lives, Time Attack, and Precision. Best scores are saved locally.

**Tech:** HTML, CSS, JavaScript · `localStorage` for scores

---

### 03 — Islam Kindles

A practice web project I built to get comfortable with multi-page layouts, navigation, and consistent styling across pages. Content is about Islamic topics.

**Tech:** HTML, CSS · shared stylesheet across 8 pages

---

### 04 — Login / Signup System

The end project for Programming 2 (high school). A full authentication flow with two access methods — username/password login and a separate signup path. Built entirely from scratch without any libraries.

**Tech:** HTML, CSS, JavaScript, PHP · demo mode works without a server

---

### 05 — Tic-Tac-Toe

The other end project for Programming 2. Classic game with a leaderboard stored in the browser. Two-player on the same screen.

**Tech:** HTML, CSS, JavaScript · `localStorage` for the leaderboard

---

### 06 — D0009E: Introduction to Programming in Python

**Course:** D0009E at LTU — the first university programming course. Covers Python fundamentals: functions, data structures, OOP, file I/O, and algorithms.

Six interactive labs, each with a live demo you can run in the browser:

| Lab   | What it is                                                                 |
| ----- | -------------------------------------------------------------------------- |
| L1·T1 | Loan calculator — computes total cost, interest, monthly payment           |
| L1·T2 | Recipe scaler — slider adjusts ingredients for 1–20 people                 |
| L3·A1 | Word book using two parallel lists                                         |
| L3·A2 | Word book using tuples                                                     |
| L3·A3 | Word book using a dictionary — live insert / lookup / delete demo          |
| L4    | Phonebook OOP — full terminal with commands like `add`, `search`, `delete` |

**Tech:** Python concepts ported to JavaScript for the browser demos · Syne + DM Mono fonts · unified dark design system

---

### 07 — D0010E: Object-Oriented Programming in Java

**Course:** D0010E at LTU — the main OOP course. Covers Java, data structures, algorithms, design patterns, and simulation.

Six labs, all with live interactive demos:

| Lab   | What it is                                                             |
| ----- | ---------------------------------------------------------------------- |
| Lab 1 | Arithmetic quiz + spellchecker with 5 correction algorithms            |
| Lab 2 | Custom `MyArrayList<E>` — full ArrayList reimplemented from scratch    |
| Lab 3 | Room navigation game — MVC + Observer pattern, canvas-drawn rooms      |
| Lab 4 | BFS graph traversal — click a node, watch it spread level by level     |
| Lab 5 | Integer calculator — state machine with 4 states, live state inspector |
| Lab 6 | Discrete event simulation — car wash with configurable parameters      |

The room navigation game (Lab 3) includes an editor where you can change room colours, sizes, positions, and the corridor and background colours. Lab 6 runs the full simulation step by step and shows the event log, machine states, and queue live.

**Tech:** Java concepts ported to JavaScript · `script.js` + `style.css` · scrollable code viewer for all source files · 72,000-word spellcheck dictionary loaded async

---

### 08 — D0015E: Computer Engineering & Engineering Science

**Course:** D0015E at LTU — a broad survey course covering five very different modules in one semester.

| Module                 | What it is                                                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A — Hammurabi          | Classic 1973 strategy game. Govern ancient Sumeria for 10 years. Resource allocation, random events, plague. Fully playable in the browser.                               |
| B — Arduino            | Four circuits: LED blink timing, potentiometer-controlled blink rate, LDR ambient light sensor, and a melody-playing buzzer that syncs with LEDs.                         |
| C — LaTeX              | Two academic papers typeset in LaTeX — a proof that the Koch snowflake has infinite perimeter but finite area, and a calculus analysis of a ski slope.                    |
| D — Algorithm Analysis | Three implementations of maximum subarray sum — O(n³), O(n²), and O(n²) with prefix sums — analysed in a LaTeX report.                                                    |
| E — Engineering Ethics | Written assignment on gender equality in tech, engineering virtues, professional licensing, and the ethics of refusing clients. Co-authored in LaTeX, written in Swedish. |

**Tech:** HTML, CSS, JavaScript · PDF generation with ReportLab · original Hammurabi game files included

---

### 09 — HeroFight

A turn-based console RPG originally written in C# .NET 10, then fully ported to run in the browser. Pick one of three hero classes — Warrior, Mage, or Rogue — each with unique stats, a passive ability, and a special move. Fight through seven rooms of enemies, collect loot, visit shops, rest at campfires, and face a final boss.

The page has two tabs: **Play** (the actual game, fully playable) and **Code** (the original C# source with syntax highlighting).

| Class   | Style                                              |
| ------- | -------------------------------------------------- |
| Warrior | High HP and defence, lifesteal on special          |
| Mage    | Glass cannon, AoE burst that scales with INT       |
| Rogue   | Fast and evasive, double-strike with bleed         |

**Tech:** C# .NET 10 (original) · JavaScript ES6 port for the browser · OOP architecture — abstract classes, interfaces, polymorphism · highlight.js for source display

---

## Tech Stack

The whole portfolio is plain web — no frameworks, no build tools, no bundlers. Just files you can open in a browser.

| Thing               | What I used                                            |
| ------------------- | ------------------------------------------------------ |
| Languages           | HTML, CSS, JavaScript, Python, Java, C#, Arduino C++   |
| Fonts               | Syne (headings) + DM Mono (code/mono) via Google Fonts |
| Syntax highlighting | highlight.js                                           |
| PDF generation      | ReportLab (Python)                                     |
| Storage             | `localStorage` for game scores and leaderboards        |
| Contact form        | Formspree (serverless, no backend needed)              |
| Hosting             | GitHub Pages — [abdoahmed07.github.io](https://abdoahmed07.github.io/portfolio-site/) |

---

## How to run it locally

No installation needed. Just clone the repo and open files directly in your browser.

```bash
git clone https://github.com/abdoahmed07/portfolio.git
cd portfolio
```

Then open any `index.html` in your browser. Start here:

```
portfolio-site/index.html
```

Or jump straight to a project:

```
D0009E/index.html
D0010E/index.html
D0015E/index.html
hero-fight/index.html
```

**One exception:** the Login/Signup system (`login-system/`) uses PHP for the real backend. Opening it locally activates demo mode automatically — login and signup show success messages without writing to a database.

**D0015E extras needed in the folder:**

- `Babylonian.png` — the standing warrior image used in the Hammurabi standalone page
- PDF files (`D1_Snowflake.pdf`, `D2_SkiSlope.pdf`, `L_Yrkesrollen.pdf`) are already included

---

## A few notes

- Everything was built while actively learning the concepts. Early projects (Name Checker, The Fly) are simple by design — they show where I started.
- The university course labs were originally written in Python and Java. I ported the logic to JavaScript so they run interactively in the browser without installing anything.
- HeroFight was originally a C# .NET 10 console application. The whole game engine was ported to JavaScript — same classes, same logic, same OOP patterns, just in the browser.
- The design system — dark background, Syne headings, orange accent (portfolio), amber (D0010E), sky blue (D0009E), gold (D0015E), green (Islam Kindles) — was built and maintained consistently across all pages.
- The D0015E Arduino project and ethics assignment were co-authored with a classmate.

---

_Abdalla · Computer Engineering Year 1 · Luleå University of Technology · 2025–2026_
