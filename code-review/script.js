/* ════════════════════════════════════════════════════════════
   Code Review Tool, showcase + a client-only toy of the core
   interaction. The real product is a full Node/Express/Postgres/
   Socket.io backend with a React frontend, deployed live (linked
   in the hero). This demo fakes the "someone else is viewing and
   just commented" moment without a real second client, since a
   static page can't run a real WebSocket server.
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
document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});

/* ════════════════════════════════════════════════════════════
   TOY REVIEW DEMO
════════════════════════════════════════════════════════════ */
(function () {
    var SNIPPET = [
        'function requireAuth(req, res, next) {',
        '  const authHeader = req.headers["authorization"];',
        '  if (!authHeader?.startsWith("Bearer ")) {',
        '    return res.status(401).json({ error: "No token" });',
        '  }',
        '  const token = authHeader.split(" ")[1];',
        '  try {',
        '    req.user = jwt.verify(token, process.env.JWT_SECRET);',
        '    next();',
        '  } catch {',
        '    res.status(401).json({ error: "Invalid token" });',
        '  }',
        '}',
    ];

    var codeCol = document.getElementById('reviewCode');
    var sidebar = document.getElementById('commentSidebar');
    var viewerBadge = document.getElementById('viewerBadge');
    var comments = {}; // lineIdx -> [{author, body, fake}]
    var openLine = null;
    var fakeCommenterTimer = null;
    var lastLine = null; // line of the most recent comment, the fake reply goes there

    function escapeHtml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function highlight(src) {
        /* Single pass so the keyword and string matches can't interfere with
           each other (a two-pass version would match the quotes inside the
           class="kw" attribute it just inserted, corrupting the markup). */
        return src.replace(/("[^"]*")|\b(function|const|return|if|try|catch|next)\b/g, function (match, str, kw) {
            return str ? '<span class="str">' + str + '</span>' : '<span class="kw">' + kw + '</span>';
        });
    }

    function renderComments() {
        var total = Object.keys(comments).reduce(function (n, k) { return n + comments[k].length; }, 0);
        if (total === 0) {
            sidebar.innerHTML = '<div class="sidebar-title">Comments (0)</div><div class="comment-empty">Click a line number on the left to leave the first comment.</div>';
            return;
        }
        var html = '<div class="sidebar-title">Comments (' + total + ')</div>';
        Object.keys(comments).sort(function (a, b) { return a - b; }).forEach(function (line) {
            comments[line].forEach(function (c) {
                html += '<div class="comment-card' + (c.fake ? ' fake' : '') + '">' +
                    '<div class="comment-line-tag">Line ' + (parseInt(line) + 1) + '</div>' +
                    '<div class="comment-author">' + escapeHtml(c.author) + '</div>' +
                    '<div class="comment-body">' + escapeHtml(c.body) + '</div></div>';
            });
        });
        sidebar.innerHTML = html;
    }

    function renderCode() {
        codeCol.innerHTML = SNIPPET.map(function (line, i) {
            var hasComment = comments[i] && comments[i].length > 0;
            var row = '<div class="code-line' + (hasComment ? ' has-comment' : '') + '" data-line="' + i + '">' +
                '<span class="code-line-num">' + (i + 1) + '</span>' +
                '<span class="code-line-src">' + highlight(line) + '</span></div>';
            if (openLine === i) {
                row += '<div class="inline-comment-form">' +
                    '<textarea id="commentInput" placeholder="Leave a comment on this line..."></textarea>' +
                    '<button id="commentSubmit">Comment</button></div>';
            }
            return row;
        }).join('');

        codeCol.querySelectorAll('.code-line').forEach(function (row) {
            row.addEventListener('click', function () {
                var line = parseInt(row.dataset.line);
                openLine = openLine === line ? null : line;
                renderCode();
                var input = document.getElementById('commentInput');
                if (input) input.focus();
            });
        });

        var submitBtn = document.getElementById('commentSubmit');
        if (submitBtn) {
            submitBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                var input = document.getElementById('commentInput');
                var body = input.value.trim();
                if (!body) return;
                comments[openLine] = comments[openLine] || [];
                comments[openLine].push({ author: 'You', body: body });
                lastLine = openLine;
                openLine = null;
                renderCode();
                renderComments();
                maybeSpawnFakeReply();
            });
            document.getElementById('commentInput').addEventListener('click', function (e) { e.stopPropagation(); });
        }
    }

    /* Simulates the real app's Socket.io broadcast: another viewer sees your
       comment and replies a moment later, no page refresh needed. */
    function maybeSpawnFakeReply() {
        clearTimeout(fakeCommenterTimer);
        fakeCommenterTimer = setTimeout(function () {
            if (lastLine === null || !comments[lastLine]) return;
            comments[lastLine].push({ author: 'Anonymous', body: "Good catch, that's exactly why I added the optional-chaining check here.", fake: true });
            viewerBadge.textContent = '👥 2 viewing';
            renderComments();
        }, 1400);
    }

    document.getElementById('resetDemo').addEventListener('click', function () {
        comments = {}; openLine = null; lastLine = null;
        viewerBadge.textContent = '👥 1 viewing';
        clearTimeout(fakeCommenterTimer);
        renderCode(); renderComments();
    });

    renderCode();
    renderComments();
})();

/* ════════════════════════════════════════════════════════════
   CODE VIEWER, actual source from the real project
════════════════════════════════════════════════════════════ */
(function () {
    var SRC = {};

    SRC.handlers = String.raw`// Socket.io event handlers, I keep all socket logic here so index.js stays clean.
// Each snippet page is its own "room": clients join/leave as they open/close tabs.

const roomPresence = new Map(); // "snippet:abc123" -> Map<socketId, {name, userId}>

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    // Client joins a snippet room when they open a snippet page
    socket.on("join_snippet", ({ shareId, user }) => {
      const room = \`snippet:\${shareId}\`;
      socket.join(room);

      if (!roomPresence.has(room)) roomPresence.set(room, new Map());
      roomPresence.get(room).set(socket.id, {
        name: user?.name || "Anonymous",
        userId: user?.id || null,
      });

      // Tell everyone in the room how many people are viewing, including the new joiner
      const viewers = [...roomPresence.get(room).values()];
      io.to(room).emit("presence_update", { count: viewers.length, viewers });

      socket.data.room = room; // remember for cleanup on disconnect
    });

    socket.on("leave_snippet", ({ shareId }) => handleLeave(socket, \`snippet:\${shareId}\`, io));
    socket.on("disconnect", () => {
      if (socket.data.room) handleLeave(socket, socket.data.room, io);
    });
  });
}

function handleLeave(socket, room, io) {
  socket.leave(room);
  if (!roomPresence.has(room)) return;
  roomPresence.get(room).delete(socket.id);
  const viewers = [...roomPresence.get(room).values()];
  if (viewers.length === 0) roomPresence.delete(room); // clean up memory
  else io.to(room).emit("presence_update", { count: viewers.length, viewers });
}

module.exports = { registerSocketHandlers };`;

    SRC.auth = String.raw`// JWT auth middleware, attached to any route that requires a logged-in user.
// On success it adds req.user so route handlers know who's making the request.
const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    // jwt.verify throws if the token is expired or the signature doesn't match
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Optional auth, routes that work logged-out but behave differently when
// logged in (e.g. showing "your" snippets) use this instead of requireAuth
function optionalAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) { req.user = null; return next(); }
  try {
    req.user = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    req.user = null; // token invalid, but don't reject the request
  }
  next();
}

module.exports = { requireAuth, optionalAuth };`;

    SRC.schema = String.raw`-- I'm using UUIDs for public-facing IDs (like snippet share URLs) but
-- keeping integer primary keys internally for performance on joins

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- share_id is the random 8-char string that goes in the URL (e.g. /review/abc12345)
CREATE TABLE IF NOT EXISTS snippets (
  id          SERIAL PRIMARY KEY,
  share_id    TEXT UNIQUE NOT NULL,
  title       TEXT,
  code        TEXT NOT NULL,
  language    TEXT NOT NULL DEFAULT 'plaintext',
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- parent_id is NULL for top-level comments, or points to another comment for replies
CREATE TABLE IF NOT EXISTS comments (
  id          SERIAL PRIMARY KEY,
  snippet_id  INTEGER REFERENCES snippets(id) ON DELETE CASCADE NOT NULL,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  line_number INTEGER NOT NULL,
  body        TEXT NOT NULL,
  parent_id   INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_snippet_id ON comments(snippet_id);
CREATE INDEX IF NOT EXISTS idx_snippets_share_id ON snippets(share_id);`;

    SRC.socketClient = String.raw`// ReviewPage.jsx, the frontend half of the real-time connection
useEffect(() => {
  if (!snippet) return;

  const socket = io(API_URL);
  socketRef.current = socket;
  socket.emit("join_snippet", { shareId, user: user || null });

  // New comment from another user, add it to the list
  socket.on("new_comment", (comment) => {
    setComments((prev) => {
      // Avoid duplicates, our own comments are added optimistically already
      if (prev.some((c) => c.id === comment.id)) return prev;
      return [...prev, comment];
    });
  });

  socket.on("presence_update", ({ count }) => setViewerCount(count));

  return () => {
    socket.emit("leave_snippet", { shareId });
    socket.disconnect();
  };
}, [snippet?.id, shareId, user]);`;

    var codeBlock = document.getElementById('codeBlock');
    function loadCode(key) {
        codeBlock.textContent = SRC[key];
        codeBlock.removeAttribute('data-highlighted');
        if (window.hljs) hljs.highlightElement(codeBlock);
    }
    document.querySelectorAll('.file-tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.file-tab').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            loadCode(btn.dataset.file);
        });
    });
    loadCode('handlers');
})();
