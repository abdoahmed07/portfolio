/* ════════════════════════════════════════════════════════════
   Technical Writing, 5 posts written over the summer,
   rendered from the actual markdown source.
════════════════════════════════════════════════════════════ */

(function () {
    var toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
})();

/* ── Tiny markdown renderer: # ## headers, ``` fences, **bold**, *em*, `code`, plain paragraphs ── */
function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function inlineMd(s) {
    s = escapeHtml(s);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return s;
}
function renderMarkdown(md) {
    var lines = md.split('\n');
    var html = [];
    var i = 0;
    while (i < lines.length) {
        var line = lines[i];
        if (line.startsWith('```')) {
            var codeLines = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
            html.push('<pre><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>');
            i++; continue;
        }
        if (line.startsWith('## ')) { html.push('<h2>' + inlineMd(line.slice(3)) + '</h2>'); i++; continue; }
        if (line.startsWith('# '))  { html.push('<h1>' + inlineMd(line.slice(2)) + '</h1>'); i++; continue; }
        if (line.trim() === '---') { html.push('<hr class="reader-hr">'); i++; continue; }
        if (line.trim() === '') { i++; continue; }
        html.push('<p>' + inlineMd(line) + '</p>');
        i++;
    }
    return html.join('\n');
}

/* ════════════════════════════════════════════════════════════
   THE 5 POSTS, full text
════════════════════════════════════════════════════════════ */
var POSTS = [
    { title: 'How I set up a Node + PostgreSQL backend from scratch (no tutorial)', excerpt: 'The exact steps to get Express talking to Postgres for the first time, including the thing that confused me for two hours.', md:
`This post is about the exact steps I took to get a Node.js Express server talking to PostgreSQL for the first time. Including the thing that confused me for two hours that turned out to be a one-line fix.

---

I've been building a real-time code review tool this summer. The backend needed to store code snippets and comments in a real database. I'd used SQLite before for small scripts, but I wanted to actually learn SQL properly, so I went with PostgreSQL.

## Setting up Express first

I ran \`npm init\` in my project folder and installed Express:
\`\`\`bash
npm install express
\`\`\`

I made a \`src/index.js\` file, wrote a basic server that returns "hello world" on port 3000, and ran it with \`node src/index.js\`. That part took maybe 10 minutes.

Then I installed PostgreSQL locally with Homebrew (\`brew install postgresql@15\`), started it, and created a database:
\`\`\`bash
createdb codereview_db
\`\`\`

## Connecting with pg

The \`pg\` package is the standard Node.js PostgreSQL client:
\`\`\`javascript
const { Pool } = require("pg");
const pool = new Pool({ connectionString: "postgresql://localhost/codereview_db" });

pool.query("SELECT NOW()", (err, result) => {
  if (err) throw err;
  console.log("Connected:", result.rows[0]);
});
\`\`\`
This printed the current timestamp. The connection worked.

## The thing that confused me

When I tried to create my first table, I kept getting \`ERROR: role "postgres" does not exist\`.

I spent two hours on this. It turns out macOS's Homebrew PostgreSQL doesn't create a \`postgres\` superuser by default. It creates a user matching your macOS username instead. So when I tried to connect as \`postgres\`, it failed.

The fix: use your actual macOS username in the connection string, or create the postgres user manually:
\`\`\`bash
createuser -s postgres
\`\`\`
This is the kind of thing no tutorial tells you because they assume you're on Linux, where the default setup is different.

## What pg actually does under the hood

When you call \`pool.query(sql, params)\`, the pool picks an available connection (or opens a new one, up to the max of 10), sends the query to PostgreSQL over TCP, waits for the response, and returns it as a JavaScript object.

The parameterised query format (\`$1\`, \`$2\` instead of string interpolation) sends values separately from the SQL text. PostgreSQL receives them as data, not as part of the query string, which is why it prevents SQL injection.

## What I'm building next

Next week I'm adding WebSockets for real-time comments using Socket.io. I'll write about that in two weeks once I understand what I'm actually doing.` },

    { title: 'WebSockets vs HTTP: what I learned building a real-time app', excerpt: "The concrete difference between HTTP and WebSockets, explained using a real feature: live comment updates.", md:
`Here's the concrete difference between HTTP and WebSockets, explained using a real feature I built: live comment updates in a code review tool.

---

## The problem with HTTP for real-time updates

In a normal HTTP request, the client asks and the server answers. One request, one response, connection closed. That's the model.

If I want to show new comments as they're posted, without the user refreshing, I have a few options with plain HTTP:

**Polling:** the frontend asks the server every 2 seconds, "any new comments?" This works but it's wasteful. At 100 users on the same snippet, that's 3,000 requests per minute for data that doesn't exist yet.

**Long polling:** the frontend makes a request and the server holds it open until there's something to send. Better than regular polling, but awkward to implement.

## What WebSockets actually do differently

A WebSocket is a persistent, bidirectional connection:
1. The browser makes a normal HTTP request with an \`Upgrade: websocket\` header
2. The server responds with \`101 Switching Protocols\`
3. The TCP connection stays open and both sides can send messages any time, in either direction

In my code review app, when a user opens a snippet page:
\`\`\`javascript
// Frontend, join the room for this snippet
const socket = io("http://localhost:3000");
socket.emit("join_snippet", { shareId: "abc123" });

socket.on("new_comment", (comment) => {
  setComments((prev) => [...prev, comment]);
});
\`\`\`
On the backend, after saving a comment to PostgreSQL:
\`\`\`javascript
io.to(\`snippet:\${shareId}\`).emit("new_comment", newComment);
\`\`\`
No polling, no repeated requests. The server pushes the comment to everyone the instant it's saved.

## The thing I didn't expect: presence

The bidirectional nature of WebSockets made the "X people viewing" feature really easy to add. When a user opens a snippet page, the client sends \`join_snippet\`. When they leave, the client sends \`leave_snippet\`, or the socket just disconnects.

I couldn't have done this cleanly with HTTP. With polling, I'd have no reliable way to know when a user left, they'd just stop making requests, and I'd have to expire their presence after some timeout.

## When to use which

Use HTTP for: loading a page, submitting a form, fetching data on demand.

Use WebSockets for: anything where the server needs to push data without being asked, or where the client sends and receives at any time. Chat, live cursors, notifications, collaborative editing, real-time dashboards.

I'm currently working on the authentication layer for the same app (JWT tokens). I'll write about that in two weeks.` },

    { title: 'JWT authentication explained by someone who was confused by it', excerpt: "Explaining JWTs the way I wish someone had explained them to me.", md:
`I'm going to explain JWTs the way I wish someone had explained them to me, without assuming you already know what "stateless authentication" means or why it matters.

---

## What problem does a JWT solve?

When a user logs in, the server needs to remember who they are for future requests. The naive approach is to store a session ID in a database, on each request the server looks up the ID to find out who's making the request. This works but costs a database lookup on every single request.

A JWT (JSON Web Token) solves this differently: instead of an opaque ID that maps to a database row, the server gives the user a token that *contains* their information, cryptographically signed so you can verify it's real without looking anything up.

## What's inside a JWT

Three base64-encoded parts separated by dots:

**Header:** \`{"alg": "HS256", "typ": "JWT"}\`, the signing algorithm.

**Payload:** \`{"id": 42, "email": "...", "name": "...", "iat": ..., "exp": ...}\`, the actual data. \`iat\` is issued-at, \`exp\` is expiry.

**Signature:** the first two parts hashed with a secret key. This is what makes it tamper-proof.

## How the signature works

The backend computes:
\`\`\`
HMAC-SHA256(base64(header) + "." + base64(payload), JWT_SECRET)
\`\`\`
On a later request, it recomputes that hash and checks if it matches. If someone changed the payload (say, their user ID), the signature won't match and the token is rejected. The secret key never leaves the server, without it you can't forge a valid signature.

\`\`\`javascript
// Creating a token on login
const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Verifying a token on a protected route
const decoded = jwt.verify(token, process.env.JWT_SECRET);
\`\`\`
\`jwt.verify\` throws if the signature is wrong or the token expired. I wrap it in a try/catch and return a 401.

## Why I don't store the token in localStorage

I store the JWT in React state instead of localStorage. \`localStorage\` is readable by any JavaScript running on the page, if my app has an XSS vulnerability, an attacker's injected script could read the token straight out of it.

State in a React component isn't accessible from outside the React tree, so it's safer. The trade-off: the user is logged out on refresh, fine for a portfolio app. In real production, the correct answer is httpOnly cookies, completely inaccessible to JavaScript.

## What I'm working on next

I deployed the app to Railway and Vercel this week. I'll write about what broke in production next time. There was a lot that broke.` },

    { title: 'What I learned deploying my first app to production', excerpt: 'Three things broke when I deployed to Railway + Vercel. Exactly what they were and how I fixed them.', md:
`Three things broke when I deployed my code review tool to Railway + Vercel. Here's exactly what they were and how I fixed them.

---

My app worked perfectly locally. Backend on port 3000, frontend on port 5173, everything talking to each other fine. Then I deployed and nothing worked. This is apparently a rite of passage.

## Problem 1: CORS

The browser was blocking requests from my Vercel frontend to my Railway backend. CORS is the browser's security mechanism that prevents a page on \`vercel.app\` from calling \`railway.app\` unless the server explicitly allows it. Locally I was using Vite's proxy, which avoided the issue entirely. In production there's no proxy.

The fix, two lines in my backend:
\`\`\`javascript
const cors = require("cors");
app.use(cors({ origin: process.env.FRONTEND_URL, methods: ["GET", "POST", "DELETE"] }));
\`\`\`
And for Socket.io:
\`\`\`javascript
const io = new Server(server, { cors: { origin: process.env.FRONTEND_URL, methods: ["GET", "POST"] } });
\`\`\`

## Problem 2: environment variables not loading

After fixing CORS, the database connection broke with \`password authentication failed for user "undefined"\`. My database URL was reading as \`undefined\`. Railway injects the PostgreSQL connection string automatically, using the name \`DATABASE_URL\`, but the format includes \`?sslmode=require\` at the end, and my \`pg\` Pool config needed to handle SSL:
\`\`\`javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});
\`\`\`
Without \`rejectUnauthorized: false\`, Node.js rejects Railway's self-signed SSL certificate.

## Problem 3: Socket.io connections failing silently

Even after fixing the above, real-time comments weren't working. Connections were being made but immediately dropping. The issue: Railway's load balancer was killing WebSocket connections that seemed inactive, even with Socket.io's default 25-second ping.

I fixed it by lowering the ping interval:
\`\`\`javascript
const io = new Server(server, { pingInterval: 10000, pingTimeout: 5000, cors: { /* ... */ } });
\`\`\`
After that, connections stayed alive reliably.

## What I'd do differently next time

Start with the production environment variables from day one. Also: set up logging early. Half my debugging time was spent reading Railway logs trying to figure out what was happening. A structured logger like \`winston\` makes this much easier.

Next post: my experience contributing to socket.io as a second-year student.` },

    { title: 'How I contributed to an open source project as a second-year student', excerpt: "What I did, what surprised me, and what I'd tell other students who want to do the same.", md:
`Here's exactly what I did, what surprised me, and what I'd tell other students who want to do the same.

---

I contributed a bug fix to socket.io, the real-time WebSocket library I'd been using all summer in my code review app. Here's the whole thing from start to finish.

## How I found the issue

I filtered GitHub issues by \`good first issue\` and read through about 15 before finding one that made sense to me: when a client calls \`socket.emit("event", data, callback)\` and disconnects before the server sends the acknowledgement, the callback was silently dropped.

I understood this bug because I'd been thinking about socket acknowledgements while building my own project. That's what made it the right issue to pick, not the easiest one, just the one I already had context for.

I commented: *"Hi, I'd like to work on this. I'm a computer engineering student familiar with Socket.io. Is this still open?"* One sentence, professional. They said yes.

## Reading the codebase

Before writing a single line of code, I cloned the repo and just read it for a few days while working on other things. The socket.io codebase is TypeScript with multiple packages in a monorepo. I had to learn where the socket class lives, how the event/ack system is structured, and their conventions for error handling.

Reading is the actual work. Writing the fix took maybe 30 minutes. Understanding the codebase well enough to know where the fix should go took much longer.

## The fix itself

In \`Socket._onclose()\`, I added a loop that calls any pending acknowledgement callbacks with an error when the socket closes:
\`\`\`typescript
for (const id in this._acks) {
  const ack = this._acks[id];
  process.nextTick(ack, new Error("socket disconnected"));
  delete this._acks[id];
}
\`\`\`
I also wrote a test, the project requires one for every bug fix, CONTRIBUTING.md says so explicitly.

## What surprised me

**The maintainers are just people.** I was nervous opening the PR, expecting it to be judged harshly or ignored. Instead, a maintainer reviewed it within three days, left clear feedback, and was genuinely helpful.

**Responsiveness matters as much as code quality.** When asked for a change, I made it within 24 hours. They explicitly thanked me for the quick turnaround.

**Reading the diff of the last 10 merged PRs in that file first was worth it.** It told me the naming conventions and comment style they expected, so my PR matched the codebase's own style.

## What I'd tell other students

Pick an issue in something you actually use, that context is worth more than picking the "easiest" one. Read CONTRIBUTING.md completely before touching any code. Start with something small, a bug fix, a missing test. The goal of your first PR is to learn the process, not redesign the architecture.

And if your PR gets rejected or the issue gets closed by someone else, that's fine. It's not personal. Pick another issue.` },
];

/* ════════════════════════════════════════════════════════════
   UI WIRING
════════════════════════════════════════════════════════════ */
(function () {
    var list = document.getElementById('postList');
    var reader = document.getElementById('reader');
    var current = 0;

    list.innerHTML = POSTS.map(function (p, i) {
        return '<div class="post-row" data-i="' + i + '">' +
            '<div class="post-num">' + String(i + 1).padStart(2, '0') + '</div>' +
            '<div><div class="post-title">' + p.title + '</div><div class="post-excerpt">' + p.excerpt + '</div></div></div>';
    }).join('');

    function show(i) {
        current = i;
        document.querySelectorAll('.post-row').forEach(function (row) {
            row.classList.toggle('active', parseInt(row.dataset.i) === i);
        });
        reader.innerHTML = renderMarkdown('# ' + POSTS[i].title + '\n' + POSTS[i].md) +
            '<div class="reader-nav">' +
            '<button class="reader-nav-btn" id="prevPost"' + (i === 0 ? ' disabled' : '') + '>← Previous</button>' +
            '<button class="reader-nav-btn" id="nextPost"' + (i === POSTS.length - 1 ? ' disabled' : '') + '>Next →</button></div>';
        document.getElementById('prevPost').addEventListener('click', function () { if (current > 0) { show(current - 1); reader.scrollIntoView({ behavior: 'smooth' }); } });
        document.getElementById('nextPost').addEventListener('click', function () { if (current < POSTS.length - 1) { show(current + 1); reader.scrollIntoView({ behavior: 'smooth' }); } });
        reader.scrollTop = 0;
    }

    list.addEventListener('click', function (e) {
        var row = e.target.closest('.post-row');
        if (row) show(parseInt(row.dataset.i));
    });

    show(0);
})();
