/* ════════════════════════════════════════════════════════════
   D0011E: Digital Design  ·  Interactive demos + UI
════════════════════════════════════════════════════════════ */

/* ── Theme toggle ─────────────────────────────────────────── */
(function () {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
        const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
})();

/* ── Tab switching ────────────────────────────────────────── */
document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});

/* ════════════════════════════════════════════════════════════
   BCD CHECKER  (Lab 2)
   Mirrors bcdcheck4.veryl exactly, same boolean expressions
════════════════════════════════════════════════════════════ */
(function () {
    // bits[0]=x3, bits[1]=x2, bits[2]=x1, bits[3]=x0  (MSB first)
    var bits = [0, 0, 0, 0];

    function compute() {
        var x = (bits[0] << 3) | (bits[1] << 2) | (bits[2] << 1) | bits[3];
        return {
            x:     x,
            max:   x === 9            ? 1 : 0,
            min:   x === 0            ? 1 : 0,
            even:  (x & 1) === 0      ? 1 : 0,
            lo3:   x < 3              ? 1 : 0,
            noBCD: x > 9              ? 1 : 0,
            hieq3: x >= 3 && x <= 9  ? 1 : 0,
        };
    }

    function render() {
        var r = compute();
        document.getElementById('bcdBin').textContent = bits.join('');
        document.getElementById('bcdDec').textContent = r.x;

        var note = r.noBCD ? '(invalid BCD)'
                 : r.max   ? '(max BCD digit)'
                 : r.min   ? '(zero)'
                 :            '';
        document.getElementById('bcdNote').textContent = note;

        ['max', 'min', 'even', 'lo3', 'noBCD', 'hieq3'].forEach(function (k) {
            var v    = r[k];
            var chip = document.getElementById('out-' + k);
            var val  = document.getElementById('val-' + k);
            chip.classList.toggle('on', v === 1);
            val.textContent = v;
        });
    }

    // Wire the four bit-toggle buttons
    [3, 2, 1, 0].forEach(function (bitNum, idx) {
        var btn = document.getElementById('bit' + bitNum);
        btn.addEventListener('click', function () {
            bits[idx] ^= 1;
            this.textContent = bits[idx];
            this.dataset.val = bits[idx];
            this.classList.toggle('on', bits[idx] === 1);
            render();
        });
    });

    render(); // set initial state (x=0, min=1)
})();

/* ════════════════════════════════════════════════════════════
   ALU CALCULATOR  (Lab 3b)
   Mirrors Alu32.veryl, correct overflow/carry logic
════════════════════════════════════════════════════════════ */
(function () {
    var currentOp = 'ADD';

    function parseHex(s) {
        s = (s || '0').trim().replace(/^0x/i, '').slice(-8).padStart(8, '0');
        return parseInt(s, 16) >>> 0;
    }

    function toHex(v) { return '0x' + (v >>> 0).toString(16).toUpperCase().padStart(8, '0'); }
    function toU(v)   { return (v >>> 0).toString(); }
    function toS(v)   { return (v | 0).toString(); }

    function compute() {
        var A = parseHex(document.getElementById('aluA').value);
        var B = parseHex(document.getElementById('aluB').value);
        var R = 0, V = 0, C = 0;

        switch (currentOp) {
            case 'AND': R = A & B; break;
            case 'OR':  R = A | B; break;
            case 'ADD': {
                var sum = A + B;            // may exceed 32 bits in JS
                R = sum >>> 0;
                C = sum > 0xFFFFFFFF ? 1 : 0;
                V = (A >> 31) === (B >> 31) && (A >> 31) !== (R >> 31) ? 1 : 0;
                break;
            }
            case 'SUB': {
                R = (A - B) >>> 0;
                C = A < B ? 1 : 0;          // borrow occurred
                V = (A >> 31) !== (B >> 31) && (A >> 31) !== (R >> 31) ? 1 : 0;
                break;
            }
            case 'SLT': R = (A | 0) < (B | 0) ? 1 : 0; break;
        }

        var Z = R === 0 ? 1 : 0;

        // Result
        document.getElementById('aluResultHex').textContent = toHex(R);
        document.getElementById('aluResU').textContent = toU(R);
        document.getElementById('aluResS').textContent = toS(R);

        // Flags
        function setFlag(id, v) {
            var el = document.getElementById(id);
            el.textContent = id.replace('flag', '') + ' = ' + v;
            el.classList.toggle('set', v === 1);
        }
        setFlag('flagV', V);
        setFlag('flagC', C);
        setFlag('flagZ', Z);

        // Binary groups of 4
        var bin    = (R >>> 0).toString(2).padStart(32, '0');
        var groups = bin.match(/.{4}/g).join(' ');
        document.getElementById('aluBinary').innerHTML = 'Binary: <span>' + groups + '</span>';

        // Input metadata
        document.getElementById('aluAMeta').textContent = toU(A) + ' (unsigned)  ·  ' + toS(A) + ' (signed)';
        document.getElementById('aluBMeta').textContent = toU(B) + ' (unsigned)  ·  ' + toS(B) + ' (signed)';
    }

    document.getElementById('aluA').addEventListener('input', compute);
    document.getElementById('aluB').addEventListener('input', compute);

    document.querySelectorAll('.op-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.op-btn').forEach(function (b) { b.classList.remove('active'); });
            this.classList.add('active');
            currentOp = this.dataset.op;
            compute();
        });
    });

    compute(); // initial render
})();

/* ════════════════════════════════════════════════════════════
   MIPS PROGRAMS  (Labs 4 & 5)
════════════════════════════════════════════════════════════ */
var PROGRAMS = {
    sum: {
        title:  'Sum 1+2+3+4+5',
        result: 'r2 = 15  (sum of 1…5)',
        instrs: [
            { asm: 'addi r1, r0, 5',  comment: 'counter = 5',       op: 'ADDI', rs: 0, rt: 1, rd: 0, imm: 5  },
            { asm: 'addi r2, r0, 0',  comment: 'sum = 0',           op: 'ADDI', rs: 0, rt: 2, rd: 0, imm: 0  },
            { asm: 'addi r3, r0, 1',  comment: 'step = 1',          op: 'ADDI', rs: 0, rt: 3, rd: 0, imm: 1  },
            { asm: 'add  r2, r2, r1', comment: 'sum += counter',    op: 'ADD',  rs: 2, rt: 1, rd: 2, imm: 0  },
            { asm: 'sub  r1, r1, r3', comment: 'counter--',         op: 'SUB',  rs: 1, rt: 3, rd: 1, imm: 0  },
            { asm: 'beq  r1, r0, 1',  comment: 'if counter==0 exit',op: 'BEQ',  rs: 1, rt: 0, rd: 0, imm: 1  },
            { asm: 'j    3',          comment: 'back to loop',       op: 'J',    rs: 0, rt: 0, rd: 0, imm: 3  },
            { asm: '# done',          comment: 'r2 = 15  ✓',        op: 'NOP',  rs: 0, rt: 0, rd: 0, imm: 0  },
        ],
    },
    div: {
        title:  'Division  12 ÷ 5',
        result: 'r3 = 2 (quotient)  ·  r1 = 2 (remainder)',
        instrs: [
            { asm: 'addi r1, r0, 12', comment: 'R = 12  (numerator)', op: 'ADDI', rs: 0, rt: 1, rd: 0, imm: 12 },
            { asm: 'addi r2, r0, 5',  comment: 'D = 5   (divisor)',   op: 'ADDI', rs: 0, rt: 2, rd: 0, imm: 5  },
            { asm: 'addi r3, r0, 0',  comment: 'Q = 0   (quotient)',  op: 'ADDI', rs: 0, rt: 3, rd: 0, imm: 0  },
            { asm: 'slt  r4, r1, r2', comment: 'r4 = (R < D)',        op: 'SLT',  rs: 1, rt: 2, rd: 4, imm: 0  },
            { asm: 'beq  r4, r0, 1',  comment: 'if R ≥ D → body',    op: 'BEQ',  rs: 4, rt: 0, rd: 0, imm: 1  },
            { asm: 'j    9',          comment: 'R < D → done',        op: 'J',    rs: 0, rt: 0, rd: 0, imm: 9  },
            { asm: 'addi r3, r3, 1',  comment: 'Q++',                 op: 'ADDI', rs: 3, rt: 3, rd: 0, imm: 1  },
            { asm: 'sub  r1, r1, r2', comment: 'R -= D',              op: 'SUB',  rs: 1, rt: 2, rd: 1, imm: 0  },
            { asm: 'j    3',          comment: 'back to loop',         op: 'J',    rs: 0, rt: 0, rd: 0, imm: 3  },
            { asm: '# done',          comment: 'Q=r3, R=r1  ✓',      op: 'NOP',  rs: 0, rt: 0, rd: 0, imm: 0  },
        ],
    },
};

/* ════════════════════════════════════════════════════════════
   MIPS EMULATOR ENGINE
════════════════════════════════════════════════════════════ */
(function () {
    var prog        = PROGRAMS.sum;
    var regs        = new Uint32Array(32); // r0 is always 0
    var pc          = 0;     // word index into prog.instrs
    var cycle       = 0;
    var timer       = null;
    var lastChanged = -1;    // register index written this step (-1 = none)

    var toS32 = function (v) { return v | 0; };
    var toU32 = function (v) { return v >>> 0; };

    /* ── Execute one instruction ── */
    function step() {
        if (pc >= prog.instrs.length) { finish(); return; }

        var instr = prog.instrs[pc];

        if (instr.op === 'NOP') { pc++; cycle++; finish(); return; }

        var rsVal = toU32(regs[instr.rs]);
        var rtVal = toU32(regs[instr.rt]);
        var next  = pc + 1;
        lastChanged = -1;

        switch (instr.op) {
            case 'ADD':  regs[instr.rd] = toU32(toS32(rsVal) + toS32(rtVal)); lastChanged = instr.rd; break;
            case 'SUB':  regs[instr.rd] = toU32(toS32(rsVal) - toS32(rtVal)); lastChanged = instr.rd; break;
            case 'AND':  regs[instr.rd] = rsVal & rtVal;                       lastChanged = instr.rd; break;
            case 'OR':   regs[instr.rd] = rsVal | rtVal;                       lastChanged = instr.rd; break;
            case 'SLT':  regs[instr.rd] = toS32(rsVal) < toS32(rtVal) ? 1 : 0; lastChanged = instr.rd; break;
            case 'ADDI': regs[instr.rt] = toU32(toS32(rsVal) + instr.imm);    lastChanged = instr.rt; break;
            case 'SLTI': regs[instr.rt] = toS32(rsVal) < instr.imm ? 1 : 0;   lastChanged = instr.rt; break;
            case 'BEQ':  if (rsVal === rtVal) next = pc + 1 + instr.imm;       break;
            case 'J':    next = instr.imm;                                      break;
        }

        regs[0] = 0; // r0 is hardwired to zero
        pc      = next;
        cycle++;

        if (pc >= prog.instrs.length) { renderMips(); finish(); return; }
        renderMips();
    }

    /* ── Render the full dashboard ── */
    function renderMips() {
        // Status bar
        document.getElementById('mipsStatus').textContent =
            'PC: 0x' + (pc * 4).toString(16).toUpperCase().padStart(2, '0') +
            '  ·  Cycle: ' + cycle;

        // Instruction listing
        var listing = document.getElementById('mipsListing');
        listing.innerHTML = prog.instrs.map(function (ins, i) {
            var isCurrent = i === pc;
            var isPast    = i < pc;
            var addr      = (i * 4).toString(16).toUpperCase().padStart(2, '0');
            return '<div class="mips-instr' +
                (isCurrent ? ' current'    : '') +
                (isPast    ? ' done-instr' : '') + '">' +
                '<span class="mips-pc">' + addr + '</span>' +
                '<span class="mips-arrow"></span>' +
                '<span class="mips-asm">'     + ins.asm     + '</span>' +
                '<span class="mips-comment">' + ins.comment + '</span>' +
                '</div>';
        }).join('');

        var curEl = listing.querySelector('.current');
        if (curEl) curEl.scrollIntoView({ block: 'nearest' });

        // Register file: show r0-r9 (the registers used by both demo programs)
        var regFile = document.getElementById('mipsRegFile');
        regFile.innerHTML = Array.from({ length: 10 }, function (_, i) {
            var val     = regs[i];
            var hex     = '0x' + val.toString(16).toUpperCase().padStart(8, '0');
            var dec     = toS32(val);
            var changed = i === lastChanged;
            return '<div class="reg-row' + (changed ? ' changed' : '') + '">' +
                '<span class="reg-name">r' + i + '</span>' +
                '<span class="reg-hex">'  + hex + '</span>' +
                '<span class="reg-dec">'  + dec + '</span>' +
                '</div>';
        }).join('');
    }

    /* ── Simulation complete ── */
    function finish() {
        clearInterval(timer); timer = null;
        document.getElementById('mipsStep').disabled = true;
        document.getElementById('mipsRun').disabled  = true;
        document.getElementById('mipsDoneDesc').textContent = prog.result + '  ·  ' + cycle + ' cycles';
        document.getElementById('mipsDone').style.display = 'flex';
    }

    /* ── Reset to initial state ── */
    function resetSim() {
        clearInterval(timer); timer = null;
        regs        = new Uint32Array(32);
        pc          = 0;
        cycle       = 0;
        lastChanged = -1;
        document.getElementById('mipsDone').style.display  = 'none';
        document.getElementById('mipsStep').disabled       = false;
        document.getElementById('mipsRun').disabled        = false;
        document.getElementById('mipsRun').textContent     = '⏩ Run';
        renderMips();
    }

    /* ── Controls ── */
    document.getElementById('mipsStep').addEventListener('click', step);

    document.getElementById('mipsRun').addEventListener('click', function () {
        if (timer) {
            clearInterval(timer); timer = null;
            this.textContent = '⏩ Run';
            return;
        }
        this.textContent = '⏸ Pause';
        timer = setInterval(step, 220);
    });

    document.getElementById('mipsReset').addEventListener('click', resetSim);
    document.getElementById('mipsDoneReset').addEventListener('click', resetSim);

    document.getElementById('mipsProg').addEventListener('change', function () {
        prog = PROGRAMS[this.value];
        resetSim();
    });

    resetSim(); // initial render
})();

/* ════════════════════════════════════════════════════════════
   CODE VIEWER: Veryl source files
════════════════════════════════════════════════════════════ */
(function () {
    /* Register a minimal Veryl language for highlight.js */
    hljs.registerLanguage('veryl', function (hljs) {
        return {
            keywords: {
                keyword: 'module input output var inst assign always_comb always_ff ' +
                         'if else if_reset for in param clock reset initial',
                type:    'logic u32 u8 i32 f64 string bit',
            },
            contains: [
                hljs.C_LINE_COMMENT_MODE,
                hljs.C_BLOCK_COMMENT_MODE,
                hljs.QUOTE_STRING_MODE,
                { className: 'number', begin: /\d+'[bdho][0-9a-fA-FxzXZ_]+/ },
                hljs.C_NUMBER_MODE,
            ],
        };
    });

    var SRC = {};

    SRC.full_adder = [
        'module FullAdder (',
        '    a    : input  logic,',
        '    b    : input  logic,',
        '    c_in : input  logic,',
        '    r    : output logic,',
        '    c_out: output logic,',
        ') {',
        '    assign r     = a ^ b ^ c_in;',
        '    assign c_out = (a & b) | (a & c_in) | (b & c_in);',
        '}',
        '',
        '#[test(Fulladder_test)]',
        'module Fulladder_test {',
        '    inst clk: $tb::clock_gen #( period: 10 );',
        '    var a, b, c_in: logic;',
        '    var r, c_out:   logic;',
        '',
        '    inst dut: FullAdder (a, b, c_in, r, c_out);',
        '',
        '    initial {',
        '        a = 0; b = 0; c_in = 0; clk.next();',
        '        $assert(r == 0 && c_out == 0, "Wrong value for 000");',
        '',
        '        a = 0; b = 1; c_in = 1; clk.next();',
        '        $assert(r == 0 && c_out == 1, "Wrong value for 011");',
        '',
        '        a = 1; b = 1; c_in = 1; clk.next();',
        '        $assert(r == 1 && c_out == 1, "Wrong value for 111");',
        '',
        '        $finish();',
        '    }',
        '}',
    ].join('\n');

    SRC.adder = [
        '// 4-bit ripple-carry adder built from four FullAdder instances',
        'module Adder (',
        '    a   : input  logic<4>,',
        '    b   : input  logic<4>,',
        '    c_in: input  logic   ,',
        '    r   : output logic<4>,',
        '    c   : output logic   ,  // carry-out',
        '    v   : output logic   ,  // signed overflow',
        ') {',
        '    var c0: logic;',
        '    var c1: logic;',
        '    var c2: logic;',
        '',
        '    inst fa0: FullAdder (a: a[0], b: b[0], c_in: c_in, r: r[0], c_out: c0);',
        '    inst fa1: FullAdder (a: a[1], b: b[1], c_in: c0,   r: r[1], c_out: c1);',
        '    inst fa2: FullAdder (a: a[2], b: b[2], c_in: c1,   r: r[2], c_out: c2);',
        '    inst fa3: FullAdder (a: a[3], b: b[3], c_in: c2,   r: r[3], c_out: c);',
        '',
        '    // Overflow: the last two carry bits differ',
        '    assign v = c2 ^ c;',
        '}',
    ].join('\n');

    SRC.bcdcheck = [
        '// Lab 2: BCD digit checker',
        '// x is a 4-bit BCD input (0-9 valid, 10-15 are invalid BCD)',
        'module bcdcheck4 (',
        '    x    : input  logic<4>,',
        '    max  : output logic   ,   // x == 9',
        '    min  : output logic   ,   // x == 0',
        '    even : output logic   ,   // x is even',
        '    lo3  : output logic   ,   // x < 3',
        '    noBCD: output logic   ,   // x > 9  (invalid)',
        '    hieq3: output logic   ,   // 3 ≤ x ≤ 9',
        ') {',
        '    assign max   = x == 9;',
        '    assign min   = x == 0;',
        '    assign even  = !x[0];',
        '    assign lo3   = x <: 3;',
        '    assign noBCD = x >: 9 & x <= 15;',
        '    // hieq3 reuses lo3 and noBCD, no duplicated comparators',
        '    assign hieq3 = !lo3 & !noBCD;',
        '}',
    ].join('\n');

    SRC.alu32 = [
        '// Lab 3b: 32-bit ALU  (AND · OR · ADD · SUB · SLT)',
        'module Alu32 (',
        '    A  : input  logic<32>,',
        '    B  : input  logic<32>,',
        '    Sub: input  logic    ,  // 1 = subtract',
        '    Op : input  logic<2> ,  // 00=AND  01=OR  10=ADD/SUB  11=SLT',
        '    R  : output logic<32>,',
        '    V  : output logic    ,  // signed overflow',
        '    C  : output logic    ,  // carry-out',
        '    Z  : output logic    ,  // zero flag',
        ') {',
        '    var and_r, or_r, arith_r, slt_r: logic<32>;',
        '    var arith_v, arith_c: logic;',
        '',
        '    inst logic_unit: Logic32  (A, B, and_r, or_r);',
        '    inst arith:      Arith32  (A, B, Sub, R: arith_r, V: arith_v, C: arith_c);',
        '',
        '    // SLT: sign bit of (A − B) zero-extended to 32 bits',
        '    inst ze:  ZeroExtend      (A: arith_r[31] ^ arith_v, R: slt_r);',
        '',
        '    inst mux: FourToOneMux32  (A: and_r, B: or_r, C: arith_r, D: slt_r, Op, R);',
        '',
        '    assign V = arith_v;',
        '    assign C = arith_c;',
        '    assign Z = ~|R;   // NOR reduction, true only when every bit is 0',
        '}',
    ].join('\n');

    SRC.decoder = [
        '// Lab 5: MIPS control unit',
        '// Decodes opcode + funct → all control signals for the datapath',
        'module Decoder1 (',
        '    opcode         : input  logic<6>,',
        '    funct          : input  logic<6>,',
        '    z              : input  logic   ,  // ALU zero flag (used by BEQ)',
        '    reg_destination: output logic   ,  // 1 = rd,  0 = rt',
        '    write_enable   : output logic   ,',
        '    sign_extend    : output logic   ,',
        '    alu_source     : output logic   ,  // 1 = immediate,  0 = register',
        '    alu_sub        : output logic   ,',
        '    alu_op         : output logic<2>,',
        '    mem_write      : output logic   ,',
        '    mem_to_reg     : output logic   ,  // 1 = load from memory',
        '    branch         : output logic   ,',
        '    jump           : output logic   ,',
        ') {',
        '    always_comb {',
        '        // Safe defaults (unimplemented instruction → no effect)',
        '        reg_destination = 0; write_enable = 0; sign_extend = 1;',
        '        alu_source = 0; alu_sub = 0; alu_op = 2\'b10;',
        '        mem_write = 0; mem_to_reg = 0; branch = 0; jump = 0;',
        '',
        '        if opcode == 6\'b000000 {          // R-type',
        '            reg_destination = 1; write_enable = 1;',
        '            if      funct == 6\'d32 { alu_sub = 0; alu_op = 2\'b10; }  // ADD',
        '            else if funct == 6\'d34 { alu_sub = 1; alu_op = 2\'b10; }  // SUB',
        '            else if funct == 6\'d36 { alu_sub = 0; alu_op = 2\'b00; }  // AND',
        '            else if funct == 6\'d37 { alu_sub = 0; alu_op = 2\'b01; }  // OR',
        '            else if funct == 6\'d42 { alu_sub = 1; alu_op = 2\'b11; }  // SLT',
        '            else                   { write_enable = 0; }',
        '        } else if opcode == 6\'d8  { write_enable = 1; alu_source = 1; }              // ADDI',
        '        else if   opcode == 6\'d10 { write_enable = 1; alu_source = 1; alu_sub = 1; alu_op = 2\'b11; } // SLTI',
        '        else if   opcode == 6\'d35 { write_enable = 1; alu_source = 1; mem_to_reg = 1; }              // LW',
        '        else if   opcode == 6\'d43 { alu_source = 1; mem_write = 1; }                                  // SW',
        '        else if   opcode == 6\'d4  { alu_sub = 1; branch = 1; }                                        // BEQ',
        '        else if   opcode == 6\'d2  { jump = 1; }                                                        // J',
        '    }',
        '}',
    ].join('\n');

    SRC.vips = [
        '// Lab 5: Top-level MIPS processor',
        '// Supports: ADD  SUB  AND  OR  SLT  ADDI  SLTI  LW  SW  BEQ  J',
        'module Vips (',
        '    i_clk         : input  clock              ,',
        '    i_reset       : input  reset_async_high   ,',
        '    i_dbg_reg     : input  logic<5>           ,',
        '    i_dbg_dm_addr : input  logic<32>          ,',
        '    o_dbg_reg_data: output logic<32>          ,',
        '    o_dbg_dm_data : output logic<32>          ,',
        ') {',
        '    var pc, pc_plus4, next_pc: logic<32>;',
        '    always_comb { pc_plus4 = pc + 32\'d4; }',
        '',
        '    var instr: logic<32>;',
        '    inst imem: InstrMem1 (i_addr: pc, o_instr: instr);',
        '',
        '    // Decode fields from 32-bit instruction word',
        '    var opcode: logic<6>; var rs, rt, rd: logic<5>;',
        '    var imm: logic<16>;   var funct: logic<6>;',
        '    always_comb {',
        '        opcode = instr[31:26]; rs = instr[25:21]; rt = instr[20:16];',
        '        rd     = instr[15:11]; imm = instr[15:0]; funct = instr[5:0];',
        '    }',
        '',
        '    // Control signals from the decoder',
        '    var reg_destination, write_enable, sign_extend: logic;',
        '    var alu_source, alu_sub: logic; var alu_op: logic<2>;',
        '    var mem_write, mem_to_reg, branch, jump, zero: logic;',
        '',
        '    inst ctrl: Decoder1 (',
        '        opcode, funct, z: zero,',
        '        reg_destination, write_enable, sign_extend,',
        '        alu_source, alu_sub, alu_op, mem_write, mem_to_reg, branch, jump,',
        '    );',
        '',
        '    // Datapath wires',
        '    var reg_a_data, reg_b_data, alu_result, dm_out: logic<32>;',
        '    var w_addr: logic<5>;',
        '    always_comb { w_addr     = if reg_destination ? rd : rt; }',
        '    var reg_w_data: logic<32>;',
        '    always_comb { reg_w_data = if mem_to_reg     ? dm_out : alu_result; }',
        '',
        '    inst rf: RegFile (',
        '        i_clk, i_reset,',
        '        i_a_addr: rs,  i_b_addr: rt,',
        '        i_w_ena: write_enable, i_w_addr: w_addr, i_w_data: reg_w_data,',
        '        i_dbg_addr: i_dbg_reg, o_a_data: reg_a_data,',
        '        o_b_data: reg_b_data,  o_dbg_data: o_dbg_reg_data,',
        '    );',
        '',
        '    var ext_imm: logic<32>;',
        '    inst extunit: Extend16to32 (i_data: imm, i_sign_ext: sign_extend, o_data: ext_imm);',
        '',
        '    var alu_b: logic<32>;',
        '    always_comb { alu_b = if alu_source ? ext_imm : reg_b_data; }',
        '',
        '    inst alu: Alu32 (A: reg_a_data, B: alu_b, Sub: alu_sub, Op: alu_op,',
        '                     R: alu_result, V: _, C: _, Z: zero);',
        '',
        '    inst dm: DataMem (',
        '        i_clk, i_reset, i_we: mem_write,',
        '        i_addr: alu_result, i_data: reg_b_data,',
        '        i_dbg_addr: i_dbg_dm_addr, o_data: dm_out, o_dbg_data: o_dbg_dm_data,',
        '    );',
        '',
        '    // Next-PC logic:  J  has priority over  BEQ  over  PC+4',
        '    always_comb {',
        '        if jump {',
        '            next_pc = {pc_plus4[31:28], instr[25:0], 2\'b00};',
        '        } else if branch && zero {',
        '            next_pc = pc_plus4 + {ext_imm[29:0], 2\'b00};',
        '        } else {',
        '            next_pc = pc_plus4;',
        '        }',
        '    }',
        '',
        '    always_ff {',
        '        if_reset { pc = 32\'d0; }',
        '        else     { pc = next_pc; }',
        '    }',
        '}',
    ].join('\n');

    var codeBlock = document.getElementById('codeBlock');

    function loadCode(key) {
        codeBlock.textContent = SRC[key];
        codeBlock.removeAttribute('data-highlighted');
        hljs.highlightElement(codeBlock);
    }

    document.querySelectorAll('.file-tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.file-tab').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            loadCode(btn.dataset.file);
        });
    });

    loadCode('full_adder'); // default file on load
})();
