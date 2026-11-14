# Abdalla's Portfolio

A personal portfolio website built from scratch during my first year of Computer Engineering (Datateknik) at Luleå University of Technology, plus a summer of independent side projects. I made everything here myself while learning: the design, the code, the interactive demos. Some projects are polished, some are rough around the edges, all of them are real.

The portfolio is live at **[abdoahmed07.github.io/portfolio/portfolio-site/index.html](https://abdoahmed07.github.io/portfolio/portfolio-site/index.html)**. Every project links out from there.

---

## Who is this for?

If you're a friend: this is basically a log of everything I've built so far. Click around and play with the demos.

If you're looking at this for work or an application: I'm a first-year student who builds things to learn. I don't just read about concepts. I implement them. Every project here has a live interactive demo next to the code.

---

## Structure

```
/
├── portfolio-site/         ← The main portfolio index page + About page
├── shared/                 ← Styles, theme, scroll and 3D code every page uses
│   └── gl/                 ← Three.js studio, the 20 project objects, the hub's chrome form
├── name-checker/           ← Project 01
├── fly-game/               ← Project 02
├── islam-kindles/          ← Project 03
├── login-system/           ← Project 04
├── tic-tac-toe/            ← Project 05
├── D0009E/                 ← Project 06, Python course
├── D0010E/                 ← Project 07, Java / OOP course
├── D0015E/                 ← Project 08, Computer Engineering survey course
├── hero-fight/             ← Project 09, C# console RPG, playable in browser
├── airplane-simulator/     ← Project 10, C++ airport simulator with custom data structures
├── D0011E/                 ← Project 11, Veryl HDL course, a 32-bit MIPS processor
├── code-review/            ← Project 12, real-time code review web app
├── ray-tracer/             ← Project 13, C++ path tracer, live in the browser
├── interpreter/            ← Project 14, tree-walking interpreter for the Lox language
├── neural-network/         ← Project 15, NumPy neural network with live inference
├── packet-analyser/        ← Project 16, C network packet analyser using libpcap
├── ctf/                    ← Project 17, PicoCTF writeups + a live SQL injection challenge
├── open-source/            ← Project 18, a merged pull request to socket.io
├── technical-writing/      ← Project 19, five technical blog posts
└── problem-solving/        ← Project 20, LeetCode practice with an animated graph demo
```

Each project folder has its own page, script and styles, and they all share `shared/`. There's no build step. Serve the repo root (see below) so the `../shared/` paths work.

---

## Projects

### 01. Name Checker

The very first website I ever made. A simple tool that checks a name against some rules. Not impressive technically, but it's where everything started.

**Tech:** HTML, CSS, JavaScript

---

### 02. The Fly Game

A reflex game where you try to click a fly before it moves. Sounds simple, gets surprisingly hard. Has four modes: Infinite, 3 Lives, Time Attack, and Precision. Best scores are saved locally.

**Tech:** HTML, CSS, JavaScript · `localStorage` for scores

---

### 03. Islam Kindles

A practice web project I built to get comfortable with multi-page layouts, navigation, and consistent styling across pages. Content is about Islamic topics.

**Tech:** HTML, CSS · shared stylesheet across 8 pages

---

### 04. Login / Signup System

The end project for Programming 2 (high school). A full authentication flow with two access methods: username/password login and a separate signup path. Built entirely from scratch without any libraries.

**Tech:** HTML, CSS, JavaScript, PHP · demo mode works without a server

---

### 05. Tic-Tac-Toe

The other end project for Programming 2. Classic game with a leaderboard stored in the browser. Two-player on the same screen.

**Tech:** HTML, CSS, JavaScript · `localStorage` for the leaderboard

---

### 06. D0009E: Introduction to Programming in Python

**Course:** D0009E at LTU, the first university programming course. Covers Python fundamentals: functions, data structures, OOP, file I/O, and algorithms.

Six interactive labs, each with a live demo you can run in the browser:

| Lab   | What it is                                                                 |
| ----- | -------------------------------------------------------------------------- |
| L1·T1 | Loan calculator: computes total cost, interest, monthly payment           |
| L1·T2 | Recipe scaler: slider adjusts ingredients for 1-20 people                 |
| L3·A1 | Word book using two parallel lists                                         |
| L3·A2 | Word book using tuples                                                     |
| L3·A3 | Word book using a dictionary: live insert/lookup/delete demo               |
| L4    | Phonebook OOP: full terminal with commands like `add`, `search`, `delete` |

**Tech:** Python concepts ported to JavaScript for the browser demos · Syne + DM Mono fonts · unified dark design system

---

### 07. D0010E: Object-Oriented Programming in Java

**Course:** D0010E at LTU, the main OOP course. Covers Java, data structures, algorithms, design patterns, and simulation.

Six labs, all with live interactive demos:

| Lab   | What it is                                                             |
| ----- | ---------------------------------------------------------------------- |
| Lab 1 | Arithmetic quiz + spellchecker with 5 correction algorithms            |
| Lab 2 | Custom `MyArrayList<E>`: full ArrayList reimplemented from scratch    |
| Lab 3 | Room navigation game: MVC + Observer pattern, canvas-drawn rooms      |
| Lab 4 | BFS graph traversal: click a node, watch it spread level by level     |
| Lab 5 | Integer calculator: state machine with 4 states, live state inspector |
| Lab 6 | Discrete event simulation: car wash with configurable parameters      |

The room navigation game (Lab 3) includes an editor where you can change room colours, sizes, positions, and the corridor and background colours. Lab 6 runs the full simulation step by step and shows the event log, machine states, and queue live.

**Tech:** Java concepts ported to JavaScript · `script.js` + `style.css` · scrollable code viewer for all source files · 72,000-word spellcheck dictionary loaded async

---

### 08. D0015E: Computer Engineering & Engineering Science

**Course:** D0015E at LTU, a broad survey course covering five very different modules in one semester.

| Module                 | What it is                                                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Hammurabi          | Classic 1973 strategy game. Govern ancient Sumeria for 10 years. Resource allocation, random events, plague. Fully playable in the browser.                               |
| B. Arduino            | Four circuits: LED blink timing, potentiometer-controlled blink rate, LDR ambient light sensor, and a melody-playing buzzer that syncs with LEDs.                         |
| C. LaTeX              | Two academic papers typeset in LaTeX, a proof that the Koch snowflake has infinite perimeter but finite area, and a calculus analysis of a ski slope.                    |
| D. Algorithm Analysis | Three implementations of maximum subarray sum (O(n³), O(n²), and O(n²) with prefix sums), analysed in a LaTeX report.                                                    |
| E. Engineering Ethics | Written assignment on gender equality in tech, engineering virtues, professional licensing, and the ethics of refusing clients. Co-authored in LaTeX, written in Swedish. |

**Tech:** HTML, CSS, JavaScript · PDF generation with ReportLab · original Hammurabi game files included

---

### 09. HeroFight

A turn-based console RPG originally written in C# .NET 10, then fully ported to run in the browser. Pick one of three hero classes (Warrior, Mage, or Rogue), each with unique stats, a passive ability, and a special move. Fight through seven rooms of enemies, collect loot, visit shops, rest at campfires, and face a final boss.

The page has two tabs: **Play** (the actual game, fully playable) and **Code** (the original C# source with syntax highlighting).

| Class   | Style                                              |
| ------- | -------------------------------------------------- |
| Warrior | High HP and defence, lifesteal on special          |
| Mage    | Glass cannon, AoE burst that scales with INT       |
| Rogue   | Fast and evasive, double-strike with bleed         |

**Tech:** C# .NET 10 (original) · JavaScript ES6 port for the browser · OOP architecture: abstract classes, interfaces, polymorphism · highlight.js for source display

---

### 10. Airport Simulator

A terminal-based airport simulator written in C++ with manually implemented data structures. No STL queues used. Manages real-time plane arrivals and departures, fuel emergencies, priority-based runway assignment, and live ANSI terminal display.

Key features:
- **Priority queue** (sorted linked list) for arrivals: emergency planes under 20% fuel get immediate priority
- **FIFO queue** (linked list) for departures
- Fuel burns in real time for planes waiting to land, and planes can crash if queues get too full
- Configurable simulation: number of runways, duration, arrival/departure rates, step mode
- Live terminal UI with color-coded status, progress bars, fuel bars, and a scrolling event log

**Tech:** C++17 · manually implemented data structures · OOP · ANSI terminal rendering

---

### 11. D0011E: Digital Design

**Course:** D0011E at LTU, covering digital logic design in Veryl, a modern hardware description language that compiles to SystemVerilog.

Five labs, building up from a single logic gate to a full CPU:

| Lab | What it is                                                                              |
| --- | ---------------------------------------------------------------------------------------- |
| L2  | Combinational logic: 4-bit BCD digit checker, Karnaugh minimisation, PLD cells            |
| L3a | 4-bit ALU: a full adder assembled into an arithmetic and logic unit                       |
| L3b | 32-bit ALU and program counter, the processor's first sequential component                |
| L4  | Simplified single-cycle MIPS processor: register file, control decoder, datapath          |
| L5  | Full MIPS: data memory, branch, jump, and a working integer division program              |

**Tech:** Veryl · SystemVerilog · Verilator · live logic checker, ALU calculator, and MIPS emulator, all ported to JavaScript

---

### 12. Code Review Tool

A collaborative web app for inline code commenting with live updates, built during the Summer 2026 project sprint. Paste or upload code, share the link, and leave comments on specific lines. Comments appear instantly for everyone viewing the same snippet, no refresh needed. Deployed and actually running in production.

**Tech:** React + Vite · Node.js + Express · PostgreSQL · Socket.io · JWT auth · deployed on Railway (backend + DB) and Vercel (frontend)

---

### 13. Ray Tracer

A physically-based path tracer built from scratch in C++, following *Ray Tracing in One Weekend*. Lambertian, metal, and dielectric (glass) materials, multi-sample anti-aliasing, and depth of field via a thin-lens camera model. Ported to JavaScript so the showcase page renders live in a canvas, progressively clearing up as samples accumulate, instead of showing a static image.

**Tech:** C++17 · CMake · Monte Carlo path tracing · live progressive renderer in vanilla JS

---

### 14. Lox Interpreter

A complete tree-walking interpreter for Lox, a small dynamically-typed language, following *Crafting Interpreters*. Handwritten scanner, recursive-descent parser, and evaluator, supporting variables, functions, closures, and classes with inheritance, plus a custom string-interpolation extension (`f"{name}"`) not in the original language spec. Ported to JavaScript so you can write and run real Lox code directly on the showcase page.

**Tech:** Java · recursive descent parsing · a bytecode VM in C is scaffolded but not yet finished

---

### 15. Neural Network

A feedforward neural network trained from scratch using only NumPy, no PyTorch, TensorFlow, or Keras. Forward pass, backpropagation, and mini-batch gradient descent all hand-derived. Trained on MNIST to 97.4% test accuracy. The showcase page exports the real trained weights and ports the forward pass to JavaScript, so drawing a digit runs genuine inference, not a simulation.

**Tech:** Python · NumPy · Flask (original web app) · real trained weights running client-side in JS

---

### 16. netwatch: Packet Analyser

A terminal tool written in C that captures and decodes live network traffic using libpcap, parsing Ethernet, IPv4, TCP, UDP, and DNS headers by hand from raw bytes, with BPF-style filtering. A browser can't open a raw socket, so the showcase page simulates realistic traffic (real TCP handshakes, real DNS query/response pairs) through the same header-decoding and column-formatting logic as the C program.

**Tech:** C · libpcap · byte-level protocol parsing · ANSI terminal UI

---

### 17. CTF Writeups

Ten solved PicoCTF challenges across web exploitation, cryptography, reverse engineering, binary exploitation, and forensics, each documented with the vulnerability, the exploit, and the actual fix. Also includes an original SQL injection challenge I built and hosted for others to solve. The showcase page ports that challenge's vulnerable query-building logic to run client-side, so the intended bypass works exactly as it does in the real hosted version.

**Tech:** Flask + SQLite (original challenge) · client-side JS port of the same vulnerability

---

### 18. Contributing to socket.io

A merged pull request to socket.io, the real-time WebSocket library used in the Code Review Tool above. Fixed a bug where pending acknowledgement callbacks were silently dropped when a client disconnected before the server could respond, found from using the library, not from browsing issues cold.

**Tech:** TypeScript · includes an interactive before/after simulation of the actual race condition

---

### 19. Field Notes (Technical Writing)

Five blog posts written the same week each thing happened: setting up Node + PostgreSQL, WebSockets vs HTTP, JWT authentication explained plainly, production deployment lessons (three things broke), and the open source contribution story above.

**Tech:** Markdown · rendered with a small custom renderer on the showcase page

---

### 20. Problem Solving

Weekly LeetCode practice across four weeks: arrays and hash maps, trees and recursion, and graph traversal (BFS/DFS). The showcase page includes a live animated Number of Islands demo, running the actual recursive DFS from the solution, not a re-implementation.

**Tech:** Python · the classic interview patterns: hash maps, tree recursion, three-color cycle detection

---

## Tech stack

The whole portfolio is plain web: no frameworks, no build tools, no bundlers. Just files you can open in a browser. The Summer 2026 projects (12-20) were originally full applications with real backends; the showcase pages port their core logic to run standalone in a static site.

| Thing               | What I used                                            |
| ------------------- | ------------------------------------------------------ |
| Languages           | HTML, CSS, JavaScript, Python, Java, C, C++, C#, Arduino C++, Veryl |
| Original backends    | Node.js, Express, PostgreSQL, Socket.io, Flask, libpcap |
| Fonts               | Geist + Geist Mono via Google Fonts                    |
| 3D                  | Three.js (from jsDelivr), one object per project       |
| Syntax highlighting | highlight.js                                           |
| PDF generation      | ReportLab (Python)                                     |
| Storage             | `localStorage` for game scores and leaderboards        |
| Contact form        | Formspree (serverless, no backend needed)              |
| Hosting             | GitHub Pages, [live site](https://abdoahmed07.github.io/portfolio/portfolio-site/index.html) |

---

## How to run it locally

No installation needed. Clone the repo and serve the root folder with any static server:

```bash
git clone https://github.com/abdoahmed07/portfolio.git
cd portfolio
python3 -m http.server 8934
```

Then open http://localhost:8934/portfolio-site/index.html. Opening the files directly also works, but browsers won't load the 3D objects from `file://`, so each project shows its number instead.

Or jump straight to a project:

```
D0009E/index.html
D0010E/index.html
D0015E/index.html
D0011E/index.html
hero-fight/index.html
airplane-simulator/index.html
ray-tracer/index.html
interpreter/index.html
neural-network/index.html
packet-analyser/index.html
ctf/index.html
```

**One exception for Airport Simulator:** the showcase page displays the source code and a terminal mockup, but to actually run the simulation you need a C++17 compiler:
```bash
cd airplane-simulator
make run
```

**One exception:** the Login/Signup system (`login-system/`) uses PHP for the real backend. Opening it locally activates demo mode automatically: login and signup show success messages without writing to a database.

**Code Review Tool** (`code-review/`) links to its real live deployment since a Node + PostgreSQL + Socket.io backend can't run inside a static page. The showcase page includes a small client-only demo of the core interaction instead.

**D0015E extras needed in the folder:**

- `Babylonian.png`: the standing warrior image used in the Hammurabi standalone page
- PDF files (`D1_Snowflake.pdf`, `D2_SkiSlope.pdf`, `L_Yrkesrollen.pdf`) are already included

---

## A few notes

- Everything was built while actively learning the concepts. Early projects (Name Checker, The Fly) are simple by design. They show where I started.
- The university course labs were originally written in Python and Java. I ported the logic to JavaScript so they run interactively in the browser without installing anything.
- HeroFight was originally a C# .NET 10 console application. The whole game engine was ported to JavaScript: same classes, same logic, same patterns, just running in the browser.
- Projects 12 through 20 came from a separate summer sprint of independent side projects (real-time systems, graphics, interpreters, security, machine learning), each originally a full standalone project with its own repo, then adapted into a showcase page here.
- Where a project's original form needs something a static site can't provide (a database, a raw socket, a GPU-scale render), the showcase page ports the actual algorithm or logic to JavaScript rather than faking the output, the neural network runs its real trained weights, the ray tracer runs the real path-tracing math, and so on.
- Every page shares one design system in `shared/`: a dark and a light theme, Geist type, and a distinct accent color per project. Each project also has its own small 3D object, shown on the hub and at the top of its page.
- The D0015E Arduino project and ethics assignment were co-authored with a classmate.

---

_Abdalla · Computer Engineering Year 1 · Luleå University of Technology · 2025-2026_
