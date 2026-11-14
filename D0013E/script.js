/* D0013E showcase page: tabs, the decoder, the pipeline diagram, the kernel model and the code viewer. */

/* ── Tab switching ── */
document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});

var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function hex(n) { return '0x' + (n >>> 0).toString(16).padStart(8, '0'); }

/* ════════════════════════════════════════════════════════════
   THE DECODER (labs 1b, 2 and 4)
   codgen() and decode() follow lab4.c line for line. JavaScript numbers
   are not 32-bit, so every result is wrapped with >>> 0, the same as
   the unsigned int arithmetic in C and the addu/subu in assembly.
════════════════════════════════════════════════════════════ */
var CODED = [
    0xd62f9cb8, 0x79cedb9e, 0x2852e1bc, 0x530acf27, 0xc8336127, 0x0c5ae983, 0xcd997594, 0xc20f1dfa,
    0x8cc32869, 0x66ae5ace, 0xf5c8646c, 0x3dee4f91, 0xc1f85894, 0xb3d98684, 0x7420117b, 0xd9d09c54,
    0x126e8124, 0xd4919f2f, 0x8b482255, 0xf266c0b7, 0xd1fb748a, 0xdc0a4d05, 0x61779480, 0xca330316,
    0x7835e914, 0x3065d928, 0x10040e9a, 0x6b8a2e18, 0x0178138b, 0x6109db7f, 0x7ed41c65, 0x64d61ed3,
    0x4da6b774, 0x2238a4b8, 0xf935b19f, 0xad6e0b55, 0x0c8d4c2b, 0x318639b5, 0x39d22cba, 0xd45634de,
    0xbde867c9, 0xe879dec5, 0x6c7844c0, 0x90d200fb, 0xbe4c4aec, 0x8d736787, 0xb9d0df78, 0x43740603,
    0x7df48ea3, 0x0471d174, 0x3c194a72, 0x4223eb74, 0xf3ae0ee2, 0xf4127725, 0x9ec0d51d, 0x06dc375b,
    0x244fdc88, 0xbb4bf1b2, 0x386cb287, 0x0f5b267c, 0xb6676658, 0x4c2a3b95, 0x40d19e01, 0x84765f94,
    0x5c800d1b, 0x02114139, 0x55c0b859, 0x67a6d6fa, 0x676c32dc, 0x0fb28271, 0xcefa829c, 0xaaf96ec7,
    0x2972ed44, 0x0d06d2cb, 0xa299e306, 0x0098bd49, 0xc1a19e30, 0x3ff74193, 0xf0dcaca9, 0x243238a3,
    0
];
var ABC = [0x5268bae7, 0xc602d881, 0xeeac3e63, 0];
var SEED = 0x237fcc97;
var FRAME_BYTES = 32;   // decode's frame: $ra, old $fp, wordarr, bytearr, x, y, m, r

/* codgen: updates the seed and returns the new seed XOR 0x1e4aea1c */
function codgen(st) {
    var s = st.seed, n = 32;
    while (s !== 0) { s = (s & (s - 1)) >>> 0; n--; }   // n := number of 0's in seed
    var x = (st.seed * 2) >>> 0;                         // multiply seed by 2
    var y = st.seed >>> 5;                               // divide seed by 32 (unsigned)
    st.seed = (x + y + n) >>> 0;                         // overflow is ignored
    st.calls++;
    return (st.seed ^ 0x1e4aea1c) >>> 0;
}

/* decode: the recursion from lab 1b. events records what happens, so the page can replay it slowly. */
function decode(words, i, out, st, depth, events) {
    var m, r, x, y;
    events.push({ t: 'in', depth: depth, calls: st.calls });
    x = (~codgen(st)) >>> 0;                             // one's complement
    if (words[i] === 0) {
        out[i] = 0;                                      // end of the string
        r = x;
    } else {
        y = decode(words, i + 1, out, st, depth + 1, events);
        m = ((((x ^ y) >>> 0) + words[i]) >>> 0);
        out[i] = (m >>> 21) & 0xff;                      // the eight bits m<28:21>
        r = (-codgen(st)) >>> 0;                         // two's complement
        r = (x + y + m + r + 5) >>> 0;
        events.push({ t: 'out', i: i, ch: out[i], depth: depth, calls: st.calls });
    }
    return r;
}

(function () {
    var input = 'coded';
    var out = document.getElementById('decOut');
    var runBtn = document.getElementById('decRun');
    var seedEl = document.getElementById('decSeed');
    var fill = document.getElementById('decDepthFill');
    var phase = document.getElementById('decPhase');
    var depthTxt = document.getElementById('decDepthTxt');
    var timer = null;

    function words() { return input === 'abc' ? ABC : CODED; }
    function show(ch) {
        if (ch >= 32 && ch < 127) return String.fromCharCode(ch);
        return '·';   // not a printable character: what a wrong seed gives you
    }
    function blank() {
        var n = words().length - 1;
        out.innerHTML = '';
        for (var k = 0; k < n; k++) {
            var s = document.createElement('span');
            s.className = 'dec-ch';
            out.appendChild(s);
        }
    }
    function setStats(calls, deep) {
        document.getElementById('decCalls').textContent = calls;
        document.getElementById('decDeep').textContent = deep;
        document.getElementById('decStack').textContent = (deep * FRAME_BYTES).toLocaleString('en') + ' B';
    }
    function parseSeed() {
        var v = seedEl.value.trim();
        var n = /^0x[0-9a-f]{1,8}$/i.test(v) ? parseInt(v, 16) : (/^\d+$/.test(v) ? Number(v) : NaN);
        if (isNaN(n) || n > 0xffffffff) return null;
        return n >>> 0;
    }

    function run() {
        clearInterval(timer);
        var seed = parseSeed();
        if (seed === null) { phase.textContent = 'The seed must be a 32-bit number, like 0x237fcc97.'; return; }
        seedEl.value = hex(seed);
        var w = words(), n = w.length;
        var st = { seed: seed, calls: 0 }, buf = new Array(n), events = [];
        decode(w, 0, buf, st, 1, events);
        blank();
        setStats(0, 0);
        var spans = out.children, k = 0, deep = 0;
        runBtn.disabled = true;

        function step(e) {
            if (e.t === 'in') {
                deep = Math.max(deep, e.depth);
                phase.textContent = e.depth < n ? 'Going down: decode calls itself on the rest of the words' : 'Reached the 0 word that ends the string';
            } else {
                var s = spans[e.i];
                s.textContent = show(e.ch);
                s.classList.add('on');
                if (!(e.ch >= 32 && e.ch < 127)) s.classList.add('bad');
                phase.textContent = 'Coming back up: each call writes its character';
            }
            depthTxt.textContent = 'depth ' + e.depth;
            fill.style.width = (e.depth / n * 100) + '%';
            setStats(e.calls, deep);
        }
        function finish() {
            clearInterval(timer);
            runBtn.disabled = false;
            fill.style.width = '0%';
            depthTxt.textContent = 'depth 0';
            setStats(st.calls, deep);
            var good = buf.slice(0, n - 1).every(function (c) { return c >= 32 && c < 127; });
            phase.textContent = good ? 'Done. The whole string is decoded.' : 'Done, but this seed gives garbage. Only the right seed decodes it.';
        }
        if (reduceMotion) { events.forEach(step); finish(); return; }
        var perTick = Math.max(1, Math.round(events.length / 120));
        timer = setInterval(function () {
            for (var j = 0; j < perTick && k < events.length; j++) step(events[k++]);
            if (k >= events.length) finish();
        }, 25);
    }

    document.getElementById('decInput').addEventListener('click', function (e) {
        var b = e.target.closest('.dec-seg-btn');
        if (!b) return;
        input = b.dataset.input;
        this.querySelectorAll('.dec-seg-btn').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        clearInterval(timer); runBtn.disabled = false;
        blank(); setStats(0, 0); phase.textContent = 'Press Decode to start.';
    });
    runBtn.addEventListener('click', run);
    seedEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
    blank();

    /* the lab's own test: seed 0x66e26625 must give these five values */
    var EXPECT = [0xceb13590, 0xb635743c, 0x4809d35d, 0xb1726643, 0x7da03732];
    document.getElementById('decCheck').addEventListener('click', function () {
        var st = { seed: 0x66e26625, calls: 0 }, list = document.getElementById('decCheckList');
        list.innerHTML = EXPECT.map(function (want, k) {
            var got = codgen(st), ok = got === want;
            return '<li class="' + (ok ? 'ok' : 'no') + '"><code>' + hex(got) + '</code><span>' + (ok ? '✓ matches' : '✗ expected ' + hex(want)) + '</span></li>';
        }).join('');
    });
})();

/* ════════════════════════════════════════════════════════════
   THE PIPELINE (lab 2)
   Three instructions from decode: a load from the stack, then an
   instruction that needs the loaded value straight away.
════════════════════════════════════════════════════════════ */
(function () {
    var grid = document.getElementById('pipeGrid');
    var caption = document.getElementById('pipeCaption');
    var STAGES = ['IF', 'ID', 'EX', 'MEM', 'WB'];
    var PLANS = {
        nop: {
            rows: [
                ['lw   $t5, -16($fp)', 0, ''],
                ['nop', 1, 'bubble'],
                ['xor  $t6, $t4, $t5', 2, 'use']
            ],
            text: 'The load only has the value at the end of MEM. With a nop in between, xor reads $t5 one cycle later and gets the right value. Every reload of a stack variable costs one of these.'
        },
        bad: {
            rows: [
                ['lw   $t5, -16($fp)', 0, ''],
                ['xor  $t6, $t4, $t5', 1, 'hazard']
            ],
            text: 'Without the nop, xor needs $t5 in EX while the load is still in MEM. This pipeline doesn\'t forward a load\'s result that early, so xor computes with the old value and the decoded string comes out wrong.'
        }
    };
    function draw(mode) {
        var plan = PLANS[mode], cols = 7, html = '<div class="pg-row pg-head"><span></span>';
        for (var c = 1; c <= cols; c++) html += '<span>' + c + '</span>';
        html += '</div>';
        plan.rows.forEach(function (r) {
            html += '<div class="pg-row"><code>' + r[0] + '</code>';
            for (var c = 0; c < cols; c++) {
                var s = c - r[1], cls = 'pg-cell';
                var label = s >= 0 && s < 5 ? STAGES[s] : '';
                if (label && r[2] === 'bubble') cls += ' bubble';
                if (label === 'EX' && r[2] === 'use') cls += ' good';
                if (label === 'EX' && r[2] === 'hazard') cls += ' bad';
                if (label === 'MEM' && r[1] === 0) cls += ' load';
                html += '<span class="' + cls + (label ? '' : ' empty') + '">' + label + '</span>';
            }
            html += '</div>';
        });
        grid.innerHTML = html;
        caption.textContent = plan.text;
    }
    document.getElementById('pipeMode').addEventListener('click', function (e) {
        var b = e.target.closest('.dec-seg-btn');
        if (!b) return;
        this.querySelectorAll('.dec-seg-btn').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        draw(b.dataset.mode);
    });
    draw('nop');
})();

/* ════════════════════════════════════════════════════════════
   THE KERNEL (lab 3b)
   Same round robin as lab3.s: on a timer interrupt, save 27 registers
   on the running process's stack (108 bytes), store PC, $gp and $sp in
   its PCB, move curpcb 12 bytes on (wrapping after pcb3), restore the
   next process and RFE back to user mode.
   Instruction counts per character come from the code: 10 in the process
   loop and 18 on the kernel's SYSCALL path.
════════════════════════════════════════════════════════════ */
(function () {
    var CYCLES_PER_CHAR = 28, QUANTUM = 1000, SAVE = 108;
    var PROCS = [
        { name: 'proc1', first: 65, last: 90, gp: 'glob1', top: null },          // 'A'..'Z', $sp set at boot
        { name: 'proc2', first: 48, last: 57, gp: 'glob2', top: 0x7fffc000 },    // '0'..'9'
        { name: 'proc3', first: 97, last: 122, gp: 'glob3', top: 0x7fff8000 }    // 'a'..'z'
    ];
    var out = document.getElementById('kOut'), log = document.getElementById('kLog');
    var pcbEl = document.getElementById('kPcb'), cycEl = document.getElementById('kCycles');
    var runBtn = document.getElementById('kRun');
    var state, timer = null;

    function reset() {
        clearInterval(timer); timer = null;
        state = {
            cur: 0, cycle: 0, nextTimer: QUANTUM, frozen: false, chars: 0,
            next: PROCS.map(function (p) { return p.first; }),
            // pcb1 starts as 0, 0, 0 and is filled in on the first switch; pcb2 and pcb3 are set up in .kdata
            pcb: [
                { pc: '0', gp: '0', sp: '0' },
                { pc: 'proc2', gp: 'glob2', sp: hex(0x7fffbf94) },
                { pc: 'proc3', gp: 'glob3', sp: hex(0x7fff7f94) }
            ]
        };
        out.innerHTML = '';
        log.innerHTML = '';
        runBtn.textContent = '▶ Run';
        runBtn.disabled = false;
        addLog('Boot: timer and input interrupts on, user mode, proc1 starts.');
        draw();
    }
    function addLog(text, cls) {
        var li = document.createElement('li');
        li.innerHTML = '<b>' + state.cycle.toLocaleString('en') + '</b> ' + text;
        if (cls) li.className = cls;
        log.prepend(li);
        while (log.children.length > 6) log.removeChild(log.lastChild);
    }
    function draw() {
        pcbEl.innerHTML = state.pcb.map(function (p, k) {
            return '<tr class="' + (k === state.cur && !state.frozen ? 'cur' : '') + '"><th>pcb' + (k + 1) + '</th><td>' + p.pc + '</td><td>' + p.gp + '</td><td>' + p.sp + '</td></tr>';
        }).join('');
        cycEl.textContent = 'cycle ' + state.cycle.toLocaleString('en');
    }
    function print(k) {
        var p = PROCS[k], c = state.next[k];
        var s = document.createElement('span');
        s.className = 'k-c p' + (k + 1);
        s.textContent = String.fromCharCode(c);
        out.appendChild(s);
        while (out.children.length > 900) out.removeChild(out.firstChild);
        state.next[k] = c === p.last ? p.first : c + 1;
    }
    function contextSwitch() {
        var from = state.cur, to = (from + 1) % 3, p = PROCS[from];
        var offset = 4 * Math.floor(Math.random() * 10);   // where in its loop the timer caught it
        state.pcb[from] = {
            pc: p.name + (offset ? '+0x' + offset.toString(16) : ''),
            gp: p.gp,
            sp: p.top === null ? 'boot $sp − 108' : hex(p.top - SAVE)
        };
        state.cur = to;
        addLog('Timer: saved ' + p.name + ' (27 registers on its stack, PC/$gp/$sp in pcb' + (from + 1) + '), resumed ' + PROCS[to].name + '.');
    }
    function tick() {
        if (state.frozen) return;
        for (var j = 0; j < 4; j++) {
            print(state.cur);
            state.cycle += CYCLES_PER_CHAR;
            if (state.cycle >= state.nextTimer) {
                contextSwitch();
                state.nextTimer += QUANTUM;
            }
        }
        out.scrollTop = out.scrollHeight;
        draw();
    }
    function play() {
        if (state.frozen) return;
        if (timer) { clearInterval(timer); timer = null; runBtn.textContent = '▶ Run'; return; }
        timer = setInterval(tick, reduceMotion ? 200 : 60);
        runBtn.textContent = '❚❚ Pause';
    }

    runBtn.addEventListener('click', play);
    document.getElementById('kReset').addEventListener('click', reset);
    document.getElementById('kKey').addEventListener('click', function () {
        if (state.frozen) return;
        clearInterval(timer); timer = null;
        state.frozen = true;
        runBtn.textContent = '▶ Run';
        runBtn.disabled = true;
        addLog('Input interrupt (Int1): not the timer, so the kernel stops in kernel_loop. Reset to start again.', 'stop');
        draw();
    });
    reset();
})();

/* ── Source viewer ── */
(function () {
    var codeBlock = document.getElementById('codeBlock');
    function loadCode(key) {
        var f = D0013E_SRC[key];
        codeBlock.className = 'language-' + f.lang;
        codeBlock.textContent = f.text;
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
    loadCode('lab1b');
})();
