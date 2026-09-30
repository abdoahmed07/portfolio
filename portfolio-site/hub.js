/* Hub page: the statement that lights up word by word, the tag filter and the contact panel.
   The projects themselves are plain HTML; shared/motion.js and shared/gl/studio.js add the
   scroll scenes and the 3D objects on top. */
(function () {
    /* ── STATEMENT: one span per word so each can light up in turn as --p grows ── */
    var st = document.getElementById('statement');
    var words = st.textContent.trim().split(/\s+/);
    st.innerHTML = words.map(function (w, i) {
        var span = document.createElement('span');
        span.className = 'word';
        span.setAttribute('aria-hidden', 'true');
        span.style.setProperty('--lit', 'clamp(0, calc(var(--p, 1) * ' + (words.length * 1.3).toFixed(2) + ' - ' + i + '), 1)');
        span.textContent = w;
        return span.outerHTML;
    }).join(' ') + '<span class="sr-only">' + st.textContent.trim() + '</span>';

    /* ── TAG FILTER ──
       A project's .project-tag text must match a filter button's data-tag. */
    var strip = document.getElementById('filterStrip');
    var filterBtns = strip.querySelectorAll('.filter-btn');
    var allItems = Array.prototype.slice.call(document.querySelectorAll('.project-item'));
    var countEl = document.querySelector('.section-count');

    function applyFilter(tag) {
        filterBtns.forEach(function (b) {
            b.setAttribute('aria-pressed', String(b.dataset.tag === tag));
        });
        if (tag === 'All') {
            allItems.forEach(function (item) { item.hidden = false; });
            countEl.textContent = '20 projects';
        } else {
            var n = 0;
            allItems.forEach(function (item) {
                var match = item.querySelector('.project-tag').textContent.trim() === tag;
                item.hidden = !match;
                if (match) n++;
            });
            countEl.textContent = n + (n === 1 ? ' project' : ' projects');
        }
        if (window.Motion) window.Motion.dirty = true;
    }
    strip.addEventListener('click', function (e) {
        var b = e.target.closest('.filter-btn');
        if (b) applyFilter(b.dataset.tag);
    });

    /* ── CONTACT PANEL ──
       inert while closed; focus moves into the form on open and back to the button on close */
    var btn = document.getElementById('contactBtn');
    var panel = document.getElementById('contactPanel');
    var form = document.getElementById('contactForm');
    var submit = document.getElementById('cfSubmit');
    var status = document.getElementById('cfStatus');

    function open() {
        panel.classList.add('open');
        panel.inert = false;
        btn.setAttribute('aria-expanded', 'true');
        document.getElementById('cf-email').focus();
    }
    function close(returnFocus) {
        if (!panel.classList.contains('open')) return;
        panel.classList.remove('open');
        panel.inert = true;
        btn.setAttribute('aria-expanded', 'false');
        if (returnFocus) btn.focus();
    }
    btn.addEventListener('click', function () { panel.classList.contains('open') ? close(true) : open(); });
    document.getElementById('contactClose').addEventListener('click', function () { close(true); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(true); });
    document.addEventListener('click', function (e) {
        if (!panel.contains(e.target) && !btn.contains(e.target)) close(false);
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        status.textContent = '';
        status.className = 'cf-status';
        if (!form.checkValidity()) {
            status.textContent = 'Add your email and a message first.';
            status.classList.add('err');
            return;
        }
        submit.disabled = true;
        submit.textContent = 'Sending...';
        fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                form.reset();
                status.textContent = 'Message sent, thanks!';
            })
            .catch(function () {
                status.textContent = 'Something went wrong. Try again or email me directly.';
                status.classList.add('err');
            })
            .then(function () {
                submit.disabled = false;
                submit.textContent = 'Send message';
            });
    });
})();
