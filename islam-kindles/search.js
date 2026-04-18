
// ══════════════════════════════════════════════════════════════
//  SEMANTIC SYNONYM MAP
//  Add more topic clusters here as your content grows.
//  Format: "canonical term": ["synonym1", "synonym2", ...]
// ══════════════════════════════════════════════════════════════
const SYNONYMS = {
    "wudu":         ["wudu","wudhu","ablution","purification","taharah","purity","cleanliness","cleanse","wash","ritual purity"],
    "prayer":       ["prayer","salah","salat","namaz","worship","praying","sujud","prostration","rakat","qibla"],
    "fasting":      ["fasting","sawm","saum","ramadan","fast","hunger","iftar","suhoor"],
    "charity":      ["charity","zakat","sadaqah","giving","donation","poor","needy","alms","zakah"],
    "pilgrimage":   ["pilgrimage","hajj","umrah","mecca","kaaba","tawaf","ihram"],
    "faith":        ["faith","iman","belief","believer","tawakkul","trust","conviction"],
    "intention":    ["intention","niyyah","niyya","purpose","motive"],
    "purification": ["purification","taharah","clean","purity","wudu","ghusl","tahara"],
    "quran":        ["quran","qur'an","recitation","tilawah","surah","ayah","verse","scripture"],
    "prophet":      ["prophet","muhammad","messenger","sunnah","hadith","pbuh","saws"],
    "repentance":   ["repentance","tawbah","forgiveness","istighfar","sin","regret","return"],
    "patience":     ["patience","sabr","steadfast","persevere","endurance","hardship"],
    "brotherhood":  ["brotherhood","unity","community","ummah","love","neighbor","others","fellow"],
    "knowledge":    ["knowledge","ilm","learning","education","seeking","wisdom","scholar"],
    "mercy":        ["mercy","rahma","compassion","kindness","forgiveness","gracious"],
    "jihad":        ["jihad","struggle","striving","effort","fighting","defence"],
    "tawhid":       ["tawhid","monotheism","oneness","allah","god","worship","shirk"],
    "death":        ["death","afterlife","akhirah","jannah","paradise","hell","jahannam","grave","resurrection"],
    "character":    ["character","akhlaq","manners","morals","ethics","behaviour","conduct"],
    "food":         ["food","halal","haram","eating","drink","meat","prohibited"]
};

// ══════════════════════════════════════════════════════════════
//  SITE CONTENT
//  Keep this in sync with your hadith/index.html and other pages.
//  Add more entries here as you fill out the site.
// ══════════════════════════════════════════════════════════════
const HADITHS = [
    {
        id: 1,
        title: "Actions are judged by intentions",
        arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
        text: "The Prophet ﷺ said: Actions are judged by intentions, and every person will get what they intended.",
        topics: ["intention","actions","fundamentals","faith","worship"],
        book: "Sahih al-Bukhari", hadithNumber: 1, grade: "Sahih",
        url: "hadith/index.html"
    },
    {
        id: 2,
        title: "Purification is half of faith",
        arabic: "الطَّهُورُ شَطْرُ الْإِيمَانِ",
        text: "The Prophet ﷺ said: Purification is half of faith. Alhamdulillah fills the scales. Prayer is a light. Charity is a proof. Patience is brightness.",
        topics: ["purification","wudu","taharah","faith","prayer","charity","patience"],
        book: "Sahih Muslim", hadithNumber: 223, grade: "Sahih",
        url: "hadith/index.html"
    },
    {
        id: 3,
        title: "Love for your brother what you love for yourself",
        arabic: "لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
        text: "The Prophet ﷺ said: None of you will truly believe until you love for your brother what you love for yourself.",
        topics: ["faith","brotherhood","character","love","community","ummah"],
        book: "Sahih al-Bukhari", hadithNumber: 13, grade: "Sahih",
        url: "hadith/index.html"
    }
];

const SURAHS = [
    { number:1,   name:"Al-Fatihah",    english:"The Opening",               topics:["prayer","worship","guidance","faith","fundamentals"] },
    { number:2,   name:"Al-Baqarah",    english:"The Cow",                   topics:["fasting","prayer","charity","wudu","purification","pilgrimage","zakat","ramadan","qibla","marriage","death","patience"] },
    { number:3,   name:"Aal-E-Imran",   english:"Family of Imran",           topics:["faith","prayer","patience","brotherhood","knowledge"] },
    { number:4,   name:"An-Nisa",       english:"The Women",                 topics:["prayer","charity","zakat","marriage","inheritance","faith"] },
    { number:5,   name:"Al-Maidah",     english:"The Table Spread",          topics:["wudu","purification","taharah","food","halal","haram","law"] },
    { number:9,   name:"At-Tawbah",     english:"The Repentance",            topics:["zakat","charity","jihad","repentance","fasting","prayer"] },
    { number:17,  name:"Al-Isra",       english:"The Night Journey",         topics:["prayer","parents","charity","character","knowledge"] },
    { number:22,  name:"Al-Hajj",       english:"The Pilgrimage",            topics:["pilgrimage","hajj","prayer","sacrifice","faith"] },
    { number:24,  name:"An-Nur",        english:"The Light",                 topics:["character","modesty","prayer","faith","purity"] },
    { number:31,  name:"Luqman",        english:"Luqman",                    topics:["knowledge","character","parents","faith","wisdom"] },
    { number:49,  name:"Al-Hujurat",    english:"The Rooms",                 topics:["brotherhood","character","community","faith","unity","ummah"] },
    { number:55,  name:"Ar-Rahman",     english:"The Beneficent",            topics:["mercy","gratitude","faith","signs","creation"] },
    { number:67,  name:"Al-Mulk",       english:"The Sovereignty",           topics:["death","afterlife","faith","creation","knowledge"] },
    { number:103, name:"Al-Asr",        english:"The Declining Day",         topics:["patience","faith","character","time","actions"] },
    { number:112, name:"Al-Ikhlas",     english:"The Sincerity",             topics:["tawhid","monotheism","faith","oneness","fundamentals"] },
    { number:114, name:"An-Nas",        english:"Mankind",                   topics:["faith","protection","prayer","fundamentals"] }
];

const DEBUNKS = [
    // Add your debunks here as you fill out the debunks page
    // { id:1, title:"...", summary:"...", topics:["..."], url:"debunks/index.html" }
];

// ══════════════════════════════════════════════════════════════
//  SEARCH ENGINE
// ══════════════════════════════════════════════════════════════

// Expand a query into all related terms using the synonym map
function expandQuery(query) {
    const words = query.toLowerCase().trim().split(/\s+/);
    const expanded = new Set(words);

    words.forEach(word => {
        // direct synonym lookup
        Object.entries(SYNONYMS).forEach(([key, syns]) => {
            if (syns.includes(word) || key === word) {
                syns.forEach(s => expanded.add(s));
                expanded.add(key);
            }
        });
        // partial match — if query contains part of a synonym cluster key
        Object.entries(SYNONYMS).forEach(([key, syns]) => {
            if (key.includes(word) || word.includes(key)) {
                syns.forEach(s => expanded.add(s));
                expanded.add(key);
            }
        });
    });

    return [...expanded];
}

// Score an item's topics + text against expanded terms
function scoreItem(topics, text, expandedTerms) {
    let score = 0;
    const textLower = text.toLowerCase();
    const topicsLower = topics.map(t => t.toLowerCase());

    expandedTerms.forEach(term => {
        // topic match = high score
        if (topicsLower.some(t => t.includes(term) || term.includes(t))) score += 10;
        // text match = medium score
        if (textLower.includes(term)) score += 4;
    });

    return score;
}

// Generate a human-readable "why this matches" string
function whyMatch(topics, expandedTerms) {
    const matched = topics.filter(t =>
        expandedTerms.some(e => t.toLowerCase().includes(e) || e.includes(t.toLowerCase()))
    );
    if (matched.length === 0) return null;
    return `Matched on: ${matched.slice(0,4).map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")}`;
}

// Build a plain-language summary
function buildSummary(query, expandedTerms, qCount, hCount, dCount) {
    const total = qCount + hCount + dCount;
    if (total === 0) return null;
    const parts = [];
    if (qCount > 0) parts.push(`${qCount} surah${qCount>1?"s":""}`);
    if (hCount > 0) parts.push(`${hCount} hadith${hCount>1?"s":""}`);
    if (dCount > 0) parts.push(`${dCount} debunk${dCount>1?"s":""}`);
    return `Found ${parts.join(", ")} related to "${query}". The search also looked for related terms: ${expandedTerms.slice(0,6).join(", ")}.`;
}

// ── MAIN SEARCH ──────────────────────────────────────────────
function runSearch() {
    const query = document.getElementById("searchInput").value.trim();
    if (!query) return;

    clearResults();

    const expanded = expandQuery(query);

    // Score everything
    const scoredSurahs = SURAHS
        .map(s => ({ ...s, score: scoreItem(s.topics, s.name + " " + s.english, expanded) }))
        .filter(s => s.score > 0)
        .sort((a,b) => b.score - a.score)
        .slice(0, 5);

    const scoredHadiths = HADITHS
        .map(h => ({ ...h, score: scoreItem(h.topics, h.text + " " + h.title, expanded) }))
        .filter(h => h.score > 0)
        .sort((a,b) => b.score - a.score);

    const scoredDebunks = DEBUNKS
        .map(d => ({ ...d, score: scoreItem(d.topics, d.title + " " + (d.summary||""), expanded) }))
        .filter(d => d.score > 0)
        .sort((a,b) => b.score - a.score);

    const total = scoredSurahs.length + scoredHadiths.length + scoredDebunks.length;

    if (total === 0) {
        document.getElementById("emptyState").style.display = "block";
        return;
    }

    // Summary
    const summary = buildSummary(query, expanded, scoredSurahs.length, scoredHadiths.length, scoredDebunks.length);
    document.getElementById("summaryText").textContent = summary;

    // Expanded terms pills
    const termsEl = document.getElementById("expandedTerms");
    termsEl.innerHTML = "Also searched: " + expanded.slice(0,10).map(t =>
        `<span class="term-pill">${t}</span>`
    ).join("");

    document.getElementById("summaryCard").style.display = "block";

    const maxScore = Math.max(
        ...scoredSurahs.map(s=>s.score),
        ...scoredHadiths.map(h=>h.score),
        1
    );

    // Quran results
    if (scoredSurahs.length) {
        document.getElementById("qHead").style.display = "block";
        scoredSurahs.forEach((s, i) => {
            const why = whyMatch(s.topics, expanded);
            const pct = Math.round((s.score / maxScore) * 100);
            const card = document.createElement("div");
            card.className = "rcard";
            card.style.display = "block";
            card.style.animationDelay = `${i * 0.07}s`;
            card.innerHTML = `
                <div class="rcard-type t-quran">📖 Quran · Surah ${s.number}</div>
                <div class="rcard-title">${s.name} — ${s.english}</div>
                <div class="rcard-text">${s.topics.slice(0,5).map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join(" · ")}</div>
                ${why ? `<div class="rcard-why">${why}</div>` : ""}
                <div class="score-bar"><div class="score-fill" style="width:${pct}%"></div></div>
                <a class="rcard-link" href="quran/surah.html?id=${s.number}">Read Surah →</a>
            `;
            document.getElementById("qCards").appendChild(card);
        });
    }

    // Hadith results
    if (scoredHadiths.length) {
        document.getElementById("hHead").style.display = "block";
        scoredHadiths.forEach((h, i) => {
            const why = whyMatch(h.topics, expanded);
            const pct = Math.round((h.score / maxScore) * 100);
            const card = document.createElement("div");
            card.className = "rcard";
            card.style.display = "block";
            card.style.animationDelay = `${i * 0.07}s`;
            card.innerHTML = `
                <div class="rcard-type t-hadith">📜 Hadith · ${h.grade}</div>
                ${h.arabic ? `<div class="rcard-arabic">${h.arabic}</div>` : ""}
                <div class="rcard-title">${h.title}</div>
                <div class="rcard-text">"${h.text}"</div>
                <div class="rcard-meta">${h.book} · #${h.hadithNumber}</div>
                ${why ? `<div class="rcard-why">${why}</div>` : ""}
                <div class="score-bar"><div class="score-fill" style="width:${pct}%"></div></div>
                <a class="rcard-link" href="${h.url}">View in Hadith →</a>
            `;
            document.getElementById("hCards").appendChild(card);
        });
    }

    // Debunk results
    if (scoredDebunks.length) {
        document.getElementById("dHead").style.display = "block";
        scoredDebunks.forEach((d, i) => {
            const why = whyMatch(d.topics, expanded);
            const pct = Math.round((d.score / maxScore) * 100);
            const card = document.createElement("div");
            card.className = "rcard";
            card.style.display = "block";
            card.style.animationDelay = `${i * 0.07}s`;
            card.innerHTML = `
                <div class="rcard-type t-debunk">💬 Debunk</div>
                <div class="rcard-title">${d.title}</div>
                <div class="rcard-text">${d.summary}</div>
                ${why ? `<div class="rcard-why">${why}</div>` : ""}
                <div class="score-bar"><div class="score-fill" style="width:${pct}%"></div></div>
                <a class="rcard-link" href="${d.url}">Read More →</a>
            `;
            document.getElementById("dCards").appendChild(card);
        });
    }
}

function clearResults() {
    ["summaryCard","qHead","hHead","dHead","emptyState"].forEach(id => {
        document.getElementById(id).style.display = "none";
    });
    ["qCards","hCards","dCards"].forEach(id => {
        document.getElementById(id).innerHTML = "";
    });
}

function go(el) {
    document.getElementById("searchInput").value = el.textContent;
    runSearch();
}

document.getElementById("searchBtn").addEventListener("click", runSearch);
document.getElementById("searchInput").addEventListener("keydown", e => {
    if (e.key === "Enter") runSearch();
});
document.getElementById("menuToggle").addEventListener("click", () => {
    document.getElementById("navLinks").classList.toggle("open");
});
