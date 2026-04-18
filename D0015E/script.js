document.addEventListener('DOMContentLoaded', () => {
    hljs.highlightAll();
    algoRun();
});

function toggleCode(btn) {
    const card = btn.closest('.project-card');
    const body = card.querySelector('.code-body');
    const isOpen = body.classList.contains('open');
    body.classList.toggle('open', !isOpen);
    btn.classList.toggle('open', !isOpen);
    if(!btn.dataset.origLabel) btn.dataset.origLabel = btn.textContent;
    btn.textContent = isOpen ? (btn.dataset.origLabel || 'View Code') : 'Hide';
}

function switchCodeTab(btn, targetId) {
    const card = btn.closest('.project-card');
    card.querySelectorAll('.code-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    card.querySelectorAll('.code-body > div[id]').forEach(el => el.classList.add('hidden'));
    document.getElementById(targetId).classList.remove('hidden');
}

// ══════════ HAMMURABI ════════════════════════════════════
let H = {};

function hammStart() {
    H = {
        year: 1, pop: 100, grain: 2800, acres: 1000,
        starvedTotal: 0, pctStarvedMax: 0,
        rng: (a,b) => Math.floor(Math.random()*(b-a+1))+a
    };
    document.getElementById('hammDisplay').style.display = 'none';
    document.getElementById('hammStats').style.display  = 'flex';
    hammShowYear();
}

function hammShowYear() {
    const price = H.rng(17, 26);
    H.price = price;
    document.getElementById('hammYearBadge').textContent = `Year ${H.year} of 10`;
    document.getElementById('hsPop').textContent   = H.pop;
    document.getElementById('hsGrain').textContent = H.grain + ' bu';
    document.getElementById('hsAcres').textContent = H.acres + ' ac';
    document.getElementById('hsPrice').textContent = price + ' bu/ac';
    document.getElementById('hsStarved').textContent = H.lastStarved ?? 0;
    document.getElementById('hsImmig').textContent   = H.lastImmig  ?? 0;
    document.getElementById('hBuy').value   = 0;
    document.getElementById('hFeed').value  = H.pop * 20;
    document.getElementById('hPlant').value = Math.min(H.acres, Math.floor(H.grain / 2));
    document.getElementById('hammReport').innerHTML = H.report || '';
    document.getElementById('hammInputSection').style.display = 'flex';
}

function hammTurn() {
    const buy   = parseInt(document.getElementById('hBuy').value)   || 0;
    const feed  = parseInt(document.getElementById('hFeed').value)  || 0;
    const plant = parseInt(document.getElementById('hPlant').value) || 0;
    let g = H.grain;

    // Buy/sell land
    const cost = buy * H.price;
    if (cost > g) return hammMsg('Not enough grain to buy that much land!', 'error');
    if (-buy > H.acres) return hammMsg("You don't own that many acres!", 'error');
    H.acres += buy; g -= cost;

    // Feed
    if (feed > g) return hammMsg("Not enough grain to feed that many people!", 'error');
    g -= feed;

    // Plant
    const maxPlant = Math.min(H.acres, Math.floor(g), H.pop * 10);
    const actualPlant = Math.min(plant, maxPlant);
    if (actualPlant < plant) hammMsg(`Can only plant ${actualPlant} acres (limited by grain/people/land).`, 'warn');
    g -= actualPlant;

    // Harvest
    const yield_ = H.rng(1, 7);
    g += actualPlant * yield_;

    // Rats
    const rats = H.rng(0, 7);
    const eaten = Math.floor(g * rats / 100);
    g -= eaten;

    // Plague (10% chance)
    let plague = false;
    if (Math.random() < 0.10) { H.pop = Math.floor(H.pop / 2); plague = true; }

    // Starve
    const fed = Math.floor(feed / 20);
    const starved = Math.max(0, H.pop - fed);
    const pctStarved = H.pop > 0 ? starved / H.pop : 0;
    if (pctStarved > 0.45) return hammEnd(false, `${Math.round(pctStarved*100)}% of your people starved — you were overthrown!`);
    H.starvedTotal += starved;
    H.pctStarvedMax = Math.max(H.pctStarvedMax, pctStarved);

    // Immigration
    const immigrants = Math.floor((20 * H.acres + g) / (100 * H.pop) * 5);
    H.pop = fed + immigrants;
    H.lastStarved = starved;
    H.lastImmig = immigrants;
    H.grain = g;

    H.report = `
        <div class="hamm-event ${starved>0?'hamm-bad':''}">Year ${H.year} report: ${starved} starved, ${immigrants} arrived. Harvest: ${yield_} bu/acre. Rats ate ${eaten} bu.${plague?' 🦠 Plague halved population!':''}</div>`;

    H.year++;
    if (H.year > 10) return hammEnd(true);
    hammShowYear();
}

function hammMsg(msg, type) {
    const el = document.getElementById('hammReport');
    el.innerHTML = `<div class="hamm-event hamm-${type}">${msg}</div>`;
}

function hammEnd(won, reason) {
    document.getElementById('hammInputSection').style.display = 'none';
    const acresPerPerson = H.acres / H.pop;
    const avgStarved = H.starvedTotal / 10;
    let rank, rankClass;
    if (!won) { rank = reason; rankClass = 'hamm-bad'; }
    else if (avgStarved < 3 && acresPerPerson > 10) { rank = '🏆 Hammurabi himself would be proud! A truly magnificent reign.'; rankClass = 'hamm-good'; }
    else if (avgStarved < 10 && acresPerPerson > 8) { rank = '👑 A competent and just ruler. History will remember you well.'; rankClass = ''; }
    else if (avgStarved < 33) { rank = '⚔ Your rule was adequate — not great, not terrible.'; rankClass = ''; }
    else { rank = '☠ A dismal performance. You are responsible for undue suffering.'; rankClass = 'hamm-bad'; }
    document.getElementById('hammReport').innerHTML = `
        <div class="hamm-event ${rankClass}" style="font-size:0.9rem;line-height:1.6">
            <strong>10 Year Summary</strong><br>
            Population: ${H.pop} · Acres: ${H.acres} · Acres/person: ${acresPerPerson.toFixed(1)}<br>
            Total starved: ${H.starvedTotal} · Avg per year: ${avgStarved.toFixed(1)}<br><br>
            ${rank}
        </div>
        <button class="demo-btn" onclick="hammStart()" style="margin-top:12px">Reign Again</button>`;
}


// ══════════ ALGORITHM DEMO ════════════════════════════════
function algoRandom() {
    const n = 10 + Math.floor(Math.random() * 8);
    const arr = Array.from({length:n}, () => Math.floor(Math.random()*21) - 10);
    document.getElementById('algoInput').value = arr.join(', ');
    algoRun();
}

let algoTimer = null;
function algoRunDebounced() {
    clearTimeout(algoTimer);
    algoTimer = setTimeout(algoRun, 400);
}

function algoRun() {
    const raw = document.getElementById('algoInput').value;
    const arr = raw.split(',').map(s => parseInt(s.trim())).filter(x => !isNaN(x));
    if (arr.length === 0) return;
    // Flash clear so user sees the update happened
    const vis = document.getElementById('algoArrayVis');
    const res = document.getElementById('algoResults');
    vis.innerHTML = ''; res.innerHTML = '';

    // Cubic O(n³) — init to -Infinity so all-negative arrays work
    let maxC=-Infinity, bestC={i:0,j:0}, stepsC=0;
    for (let i=0;i<arr.length;i++) for (let j=i;j<arr.length;j++) {
        let s=0; for (let k=i;k<=j;k++){s+=arr[k];stepsC++;}
        if(s>maxC){maxC=s;bestC={i,j};}
    }

    // Quadratic 1 O(n²)
    let maxQ1=-Infinity, bestQ1={i:0,j:0}, stepsQ1=0;
    for (let i=0;i<arr.length;i++){let s=0;for(let j=i;j<arr.length;j++){s+=arr[j];stepsQ1++;if(s>maxQ1){maxQ1=s;bestQ1={i,j};}}}

    // Prefix sum O(n²)
    let pre=[0]; for(let i=0;i<arr.length;i++) pre.push(pre[i]+arr[i]);
    let maxP=-Infinity, bestP={i:0,j:0}, stepsP=0;
    for(let i=0;i<arr.length;i++) for(let j=i+1;j<=arr.length;j++){stepsP++;const s=pre[j]-pre[i];if(s>maxP){maxP=s;bestP={i,j:j-1};}}

    // Render array
    document.getElementById('algoArrayLabel').style.display = 'block';
    document.getElementById('algoArrayVis').innerHTML = arr.map((v,i) => {
        const inSub = i >= bestC.i && i <= bestC.j;
        return `<div class="algo-cell ${inSub?'algo-cell-hl':''} ${v<0?'algo-cell-neg':''}">
            <span class="algo-cell-idx">${i}</span>
            <span class="algo-cell-val">${v}</span>
        </div>`;
    }).join('');

    // Render results
    const n = arr.length;
    const subArr = arr.slice(bestC.i, bestC.j+1).join(' + ');
    document.getElementById('algoResults').innerHTML = `
        <div class="algo-answer-banner">
            Maximum subarray sum = <strong>${maxC}</strong>
            &nbsp;·&nbsp; subarray: [${subArr}]
            &nbsp;·&nbsp; indices ${bestC.i} to ${bestC.j}
        </div>
        <div class="algo-result">
            <span class="algo-name">O(n³) Cubic</span>
            <span class="algo-ans">${stepsC.toLocaleString()} operations (n³÷6 ≈ ${Math.round(n**3/6)})</span>
        </div>
        <div class="algo-result">
            <span class="algo-name">O(n²) Quadratic</span>
            <span class="algo-ans">${stepsQ1.toLocaleString()} operations (n²÷2 ≈ ${Math.round(n**2/2)}) — ${Math.round(stepsC/stepsQ1)}× faster</span>
        </div>
        <div class="algo-result">
            <span class="algo-name">O(n²) Prefix sum</span>
            <span class="algo-ans">${stepsP.toLocaleString()} operations — same O but with prefix array precomputation</span>
        </div>
        <div class="algo-complexity">
            <div class="algo-bar-row"><span>O(n³)</span><div class="algo-bar"><div style="width:100%;background:#ef4444"></div></div><span>${stepsC}</span></div>
            <div class="algo-bar-row"><span>O(n²)</span><div class="algo-bar"><div style="width:${Math.min(100,stepsQ1/stepsC*100)}%;background:#f59e0b"></div></div><span>${stepsQ1}</span></div>
            <div class="algo-bar-row"><span>Prefix</span><div class="algo-bar"><div style="width:${Math.min(100,stepsP/stepsC*100)}%;background:#34d399"></div></div><span>${stepsP}</span></div>
        </div>`;
}

// Scroll tabs
function initScrollTabs() {
    document.querySelectorAll('.code-tabs').forEach(tabs => {
        const wrap = document.createElement('div');
        wrap.className = 'code-tabs-wrap';
        tabs.parentNode.insertBefore(wrap, tabs);
        wrap.appendChild(tabs);
        const btnL = document.createElement('button');
        btnL.className = 'tab-scroll-btn tab-scroll-left';
        btnL.innerHTML = '&#8249;';
        btnL.onclick = () => tabs.scrollBy({left:-160,behavior:'smooth'});
        wrap.prepend(btnL);
        const btnR = document.createElement('button');
        btnR.className = 'tab-scroll-btn tab-scroll-right';
        btnR.innerHTML = '&#8250;';
        btnR.onclick = () => tabs.scrollBy({left:160,behavior:'smooth'});
        wrap.appendChild(btnR);
        function upd() {
            const atStart = tabs.scrollLeft <= 4;
            const atEnd   = tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 4;
            btnL.style.opacity = atStart ? '0' : '1';
            btnL.style.pointerEvents = atStart ? 'none' : 'auto';
            btnR.style.opacity = atEnd ? '0' : '1';
            btnR.style.pointerEvents = atEnd ? 'none' : 'auto';
            wrap.style.webkitMaskImage = atEnd ? 'none' : 'linear-gradient(to right,black 70%,transparent 100%)';
            wrap.style.maskImage       = atEnd ? 'none' : 'linear-gradient(to right,black 70%,transparent 100%)';
        }
        tabs.addEventListener('scroll', upd);
        setTimeout(upd, 50);
        const toggle = tabs.closest('.project-card')?.querySelector('.code-toggle');
        if (toggle) toggle.addEventListener('click', () => setTimeout(upd, 50));
    });
}
document.addEventListener('DOMContentLoaded', initScrollTabs);
