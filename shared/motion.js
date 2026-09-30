/* One requestAnimationFrame loop for scroll scenes. Nothing listens to scroll events.
   Every [data-scene] element gets:
     --p   progress through it while pinned (0 at its top, 1 when its end reaches the bottom)
     --in  how far it has come into view (eased, 0 below the fold, 1 once well inside)
   With reduced motion the loop only redraws when something changed, and --in is always 1.
   The page glow takes the color of the [data-glow] element nearest the middle of the screen.
   Other scripts hook in with Motion.onFrame(fn(time, dt)). The loop stops when the tab is hidden. */
(function () {
    var root = document.documentElement;
    var mq = window.matchMedia('(prefers-reduced-motion: reduce)');

    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function smooth(v) { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); }

    var Motion = {
        get reduce() { return mq.matches; },
        get small() { return window.innerWidth < 760; },
        scenes: {},
        items: [],
        clamp: clamp,
        smooth: smooth,
        dirty: true,
        onFrame: function (fn) { hooks.push(fn); Motion.dirty = true; },
        refresh: function () { collect(); Motion.dirty = true; }
    };
    var hooks = [];
    var glowEls = [];
    var glowColor = '';
    var baseGlow = '';

    function collect() {
        Motion.items = Array.prototype.map.call(document.querySelectorAll('[data-scene]'), function (el) {
            var s = { el: el, name: el.getAttribute('data-scene'), p: -1, inn: -1, enter: 0, e: 0, visible: false };
            if (s.name) Motion.scenes[s.name] = s;
            return s;
        });
        glowEls = Array.prototype.slice.call(document.querySelectorAll('[data-glow]'));
    }

    function applyMotionClass() {
        root.classList.toggle('motion', !Motion.reduce);
        Motion.dirty = true;
    }

    function frame(now, dt) {
        var H = window.innerHeight;
        var reduce = Motion.reduce;
        var items = Motion.items;
        for (var i = 0; i < items.length; i++) {
            var s = items[i];
            var r = s.el.getBoundingClientRect();
            if (r.height === 0 && r.width === 0) { s.visible = false; continue; }
            s.visible = r.bottom > 0 && r.top < H;
            var span = r.height - H;
            var p = span > 1 ? clamp(-r.top / span, 0, 1) : (r.top < 0 ? 1 : 0);
            s.enter = clamp((H - r.top) / H, 0, 1);
            var inn = reduce ? 1 : smooth((H - r.top) / (H * 0.6));
            s.e = inn;
            if (Math.abs(p - s.p) > 0.0004) { s.p = p; s.el.style.setProperty('--p', p.toFixed(4)); }
            if (Math.abs(inn - s.inn) > 0.001) { s.inn = inn; s.el.style.setProperty('--in', inn.toFixed(3)); }
        }

        if (glowEls.length) {
            var best = null, bestD = Infinity;
            for (var g = 0; g < glowEls.length; g++) {
                var el = glowEls[g];
                var rr = el.getBoundingClientRect();
                if (rr.height === 0 || rr.bottom < 0 || rr.top > H) continue;
                var d = Math.abs(rr.top + rr.height / 2 - H / 2);
                if (rr.top < H / 2 && rr.bottom > H / 2) d = 0;
                if (d < bestD) { bestD = d; best = el; }
            }
            var color = best ? best.getAttribute('data-glow') : '';
            if (color === 'brand' || !color) color = baseGlow;
            if (color !== glowColor) {
                glowColor = color;
                if (color) root.style.setProperty('--glow', color); else root.style.removeProperty('--glow');
            }
        }

        for (var h = 0; h < hooks.length; h++) hooks[h](now / 1000, dt);
    }

    var running = false, raf = 0, lastT = 0, lastY = -1, lastW = 0, lastH = 0;
    function loop(now) {
        var dt = Math.min((now - lastT) / 1000, 0.05);
        lastT = now;
        if (Motion.reduce) {
            var changed = Motion.dirty || window.scrollY !== lastY || window.innerWidth !== lastW || window.innerHeight !== lastH;
            if (changed) {
                Motion.dirty = false;
                lastY = window.scrollY; lastW = window.innerWidth; lastH = window.innerHeight;
                frame(now, 0);
            }
        } else {
            Motion.dirty = false;
            frame(now, dt);
        }
        raf = requestAnimationFrame(loop);
    }
    function sync() {
        var should = !document.hidden;
        if (should && !running) { running = true; lastT = performance.now(); raf = requestAnimationFrame(loop); }
        else if (!should && running) { running = false; cancelAnimationFrame(raf); }
        Motion.dirty = true;
    }

    function start() {
        /* module scripts (the 3D layer) don't load from file://, so show the fallback there */
        if (location.protocol === 'file:') root.classList.add('no-gl');
        collect();
        baseGlow = root.getAttribute('data-glow-base') || '';
        applyMotionClass();
        sync();
    }

    mq.addEventListener('change', applyMotionClass);
    document.addEventListener('visibilitychange', sync);
    document.addEventListener('themechange', function () { Motion.dirty = true; });
    window.addEventListener('resize', function () { Motion.dirty = true; });

    window.Motion = Motion;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
