/* Theme toggle and a few shared page helpers.
   - #themeToggle flips data-theme, saves it, keeps its aria-label honest and fires 'themechange'
   - highlight.js switches between a dark and a light stylesheet with the theme
   - <meta name="theme-color"> follows the page background
   - tab strips get real ARIA tabs (roles, aria-selected, arrow keys) on top of each
     page's own click handlers */
(function () {
    var root = document.documentElement;

    function get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
    function set(key, v) { try { localStorage.setItem(key, v); } catch (e) {} }

    var saved = get('theme');
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);

    function isLight() { return root.getAttribute('data-theme') === 'light'; }

    var MOON = '<svg class="icon-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var SUN = '<svg class="icon-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

    /* highlight.js: the dark theme is linked in the page, the light one is swapped in */
    var HLJS_DARK = 'base16/tomorrow-night.min.css';
    var HLJS_LIGHT = 'github.min.css';
    function syncHljs() {
        var link = document.querySelector('link[href*="highlight.js"][href*="/styles/"]');
        if (!link) return;
        var href = link.getAttribute('href');
        var base = href.slice(0, href.indexOf('/styles/') + 8);
        var want = base + (isLight() ? HLJS_LIGHT : HLJS_DARK);
        if (href !== want) link.setAttribute('href', want);
    }

    function syncMeta() {
        var meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'theme-color';
            document.head.appendChild(meta);
        }
        meta.content = isLight() ? '#f5f5f4' : '#09090b';
    }

    function syncToggle(btn) {
        btn.setAttribute('aria-label', isLight() ? 'Switch to dark mode' : 'Switch to light mode');
        btn.removeAttribute('title');
    }

    function initToggle() {
        var btn = document.getElementById('themeToggle');
        if (!btn) return;
        if (!btn.querySelector('svg')) btn.innerHTML = MOON + SUN;
        if (!btn.hasAttribute('type')) btn.type = 'button';
        syncToggle(btn);
        btn.addEventListener('click', function () {
            var next = isLight() ? 'dark' : 'light';
            root.setAttribute('data-theme', next);
            set('theme', next);
            syncToggle(btn);
            syncHljs();
            syncMeta();
            document.dispatchEvent(new CustomEvent('themechange', { detail: next }));
        });
    }

    /* ── ARIA tabs ──
       Works with the existing markup: a strip of buttons with .active on the chosen one.
       Pages keep their own click handlers; this adds roles, keeps aria-selected in step
       with the .active class and moves between tabs with the arrow keys. */
    function enhanceTabs(strip, btnSel, panelFor) {
        var btns = Array.prototype.slice.call(strip.querySelectorAll(btnSel));
        if (btns.length < 2 || strip.dataset.tabsReady) return;
        strip.dataset.tabsReady = '1';
        strip.setAttribute('role', 'tablist');
        btns.forEach(function (b, i) {
            b.setAttribute('role', 'tab');
            if (!b.id) b.id = 'tab-btn-' + Math.random().toString(36).slice(2, 8);
            var panel = panelFor ? panelFor(b) : null;
            if (panel) {
                b.setAttribute('aria-controls', panel.id);
                panel.setAttribute('role', 'tabpanel');
                panel.setAttribute('aria-labelledby', b.id);
                if (!panel.hasAttribute('tabindex')) panel.tabIndex = 0;
            }
        });
        function sync() {
            var any = btns.some(function (b) { return b.classList.contains('active'); });
            btns.forEach(function (b, i) {
                var on = b.classList.contains('active') || (!any && i === 0);
                b.setAttribute('aria-selected', String(on));
                b.tabIndex = on ? 0 : -1;
            });
        }
        sync();
        var mo = new MutationObserver(sync);
        btns.forEach(function (b) { mo.observe(b, { attributes: true, attributeFilter: ['class'] }); });
        strip.addEventListener('keydown', function (e) {
            var i = btns.indexOf(document.activeElement);
            if (i < 0) return;
            var j = -1;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % btns.length;
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + btns.length) % btns.length;
            else if (e.key === 'Home') j = 0;
            else if (e.key === 'End') j = btns.length - 1;
            if (j < 0) return;
            e.preventDefault();
            btns[j].focus();
            btns[j].click();
        });
    }

    function initTabs() {
        document.querySelectorAll('[data-tabs]').forEach(function (strip) {
            enhanceTabs(strip, strip.getAttribute('data-tabs') || 'button', function (b) {
                var id = b.getAttribute('data-panel');
                return id ? document.getElementById(id) : null;
            });
        });
        document.querySelectorAll('.tabs, .tab-bar, .tab-nav').forEach(function (strip) {
            enhanceTabs(strip, '.tab-btn, .tab', function (b) {
                return b.dataset.tab ? document.getElementById('tab-' + b.dataset.tab) || document.getElementById(b.dataset.tab) : null;
            });
        });
        document.querySelectorAll('.file-tabs').forEach(function (strip) { enhanceTabs(strip, '.file-tab', null); });
    }

    /* Scrollable code and log regions need to be reachable by keyboard. Checked on load and
       after clicks, since tabs and demos swap content in. */
    var scrollQueued = false;
    function markScrollables() {
        scrollQueued = false;
        document.querySelectorAll('pre, pre > code, [data-scroll]').forEach(function (el) {
            if (el.hasAttribute('tabindex') || !el.offsetParent) return;
            var cs = getComputedStyle(el);
            var scrolls = /(auto|scroll)/.test(cs.overflowY + cs.overflowX + cs.overflow) &&
                (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
            if (scrolls) el.tabIndex = 0;
        });
    }
    function queueScrollables() {
        if (scrollQueued) return;
        scrollQueued = true;
        setTimeout(markScrollables, 120);
    }

    window.Theme = { isLight: isLight, enhanceTabs: enhanceTabs, get: get, set: set };

    syncMeta();
    function ready() {
        initToggle(); syncHljs(); initTabs();
        queueScrollables();
        window.addEventListener('load', queueScrollables);
        document.addEventListener('click', queueScrollables);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
    else ready();
})();
