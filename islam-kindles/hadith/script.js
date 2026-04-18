
// ══════════════════════════════════════════════════════════
//  HADITHS DATA
//  To add more: copy one object, increment the id, fill in
//  your content, and add it to this array.
// ══════════════════════════════════════════════════════════
const HADITHS = [
  {
    id: 1,
    arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
    text: "The Prophet ﷺ said: 'Actions are judged by intentions, and every person will get what they intended. Whoever emigrated for the sake of Allah and His Messenger, his emigration was for Allah and His Messenger. Whoever emigrated to get something worldly or to marry a woman, then his emigration was for whatever he emigrated for.'",
    grade: "Sahih",
    topics: ["Intention", "Actions", "Fundamentals"],
    book: "Sahih al-Bukhari",
    author: "Imam al-Bukhari",
    volume: 1,
    hadithNumber: 1,
    chapter: "How the Revelation Started",
    chain: [
      { name: "Imam al-Bukhari", role: "Compiler" },
      { name: "al-Humaydi Abd ibn Zubayr", role: "Narrator" },
      { name: "Sufyan ibn Uyaynah", role: "Narrator" },
      { name: "Yahya ibn Said al-Ansari", role: "Narrator" },
      { name: "Muhammad ibn Ibrahim al-Taymi", role: "Narrator" },
      { name: "Alqamah ibn Waqqas al-Laythi", role: "Narrator" },
      { name: "Umar ibn al-Khattab (رضي الله عنه)", role: "Companion" },
      { name: "Prophet Muhammad ﷺ", role: "Source" }
    ]
  },
  {
    id: 2,
    arabic: "الطَّهُورُ شَطْرُ الْإِيمَانِ",
    text: "The Prophet ﷺ said: 'Purification (Taharah) is half of faith. Alhamdulillah fills the scales. SubhanAllah and Alhamdulillah fill what is between the heavens and the earth. Prayer is a light. Charity is a proof. Patience is brightness. The Quran is an argument for or against you. Every person starts the morning as a vendor of his soul, either freeing it or bringing about its ruin.'",
    grade: "Sahih",
    topics: ["Purification", "Wudu", "Faith", "Prayer"],
    book: "Sahih Muslim",
    author: "Imam Muslim",
    volume: 1,
    hadithNumber: 223,
    chapter: "The Virtue of Wudu",
    chain: [
      { name: "Imam Muslim", role: "Compiler" },
      { name: "Yahya ibn Yahya al-Tamimi", role: "Narrator" },
      { name: "Simak ibn Harb", role: "Narrator" },
      { name: "Mus'ab ibn Sa'd", role: "Narrator" },
      { name: "Abu Malik al-Ashari (رضي الله عنه)", role: "Companion" },
      { name: "Prophet Muhammad ﷺ", role: "Source" }
    ]
  },
  {
    id: 3,
    arabic: "لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    text: "The Prophet ﷺ said: 'None of you will truly believe until you love for your brother what you love for yourself.'",
    grade: "Sahih",
    topics: ["Faith", "Brotherhood", "Character"],
    book: "Sahih al-Bukhari",
    author: "Imam al-Bukhari",
    volume: 1,
    hadithNumber: 13,
    chapter: "From Faith is to Love for Your Brother What You Love for Yourself",
    chain: [
      { name: "Imam al-Bukhari", role: "Compiler" },
      { name: "Musaddad", role: "Narrator" },
      { name: "Yahya ibn Said", role: "Narrator" },
      { name: "Shu'bah", role: "Narrator" },
      { name: "Qatadah", role: "Narrator" },
      { name: "Anas ibn Malik (رضي الله عنه)", role: "Companion" },
      { name: "Prophet Muhammad ﷺ", role: "Source" }
    ]
  }
];

// ── RENDER ─────────────────────────────────────────────────
const list      = document.getElementById("hadithList");
const noResults = document.getElementById("noResults");
const filterRow = document.getElementById("filterRow");

// collect all unique topics
const allTopics = [...new Set(HADITHS.flatMap(h => h.topics))].sort();
allTopics.forEach(topic => {
    const btn = document.createElement("button");
    btn.className = "filter-pill";
    btn.dataset.filter = topic;
    btn.textContent = topic;
    filterRow.appendChild(btn);
});

let activeFilter = "all";
let searchQuery  = "";

function gradeClass(grade) {
    if (grade === "Sahih") return "grade-sahih";
    if (grade === "Hasan") return "grade-hasan";
    return "grade-daif";
}

function renderHadiths() {
    const q = searchQuery.toLowerCase();
    const filtered = HADITHS.filter(h => {
        const matchFilter = activeFilter === "all" || h.topics.includes(activeFilter);
        const matchSearch = !q ||
            h.text.toLowerCase().includes(q) ||
            h.arabic.toLowerCase().includes(q) ||
            h.topics.some(t => t.toLowerCase().includes(q)) ||
            h.book.toLowerCase().includes(q) ||
            h.chain.some(c => c.name.toLowerCase().includes(q)) ||
            h.chapter.toLowerCase().includes(q);
        return matchFilter && matchSearch;
    });

    list.innerHTML = "";
    noResults.style.display = filtered.length === 0 ? "block" : "none";

    filtered.forEach(h => {
        const card = document.createElement("div");
        card.className = "hadith-card";
        card.innerHTML = `
            <div class="hadith-card-top">
                <div class="hadith-tags">
                    <span class="hadith-grade ${gradeClass(h.grade)}">${h.grade}</span>
                    ${h.topics.map(t => `<span class="hadith-topic">${t}</span>`).join("")}
                </div>
                ${h.arabic ? `<div class="hadith-arabic">${h.arabic}</div>` : ""}
                <p class="hadith-text">${h.text}</p>
            </div>

            <button class="hadith-chain-toggle" onclick="toggleChain(this)">
                <span>Chain of Narrators (${h.chain.length})</span>
                <span class="chain-icon">▾</span>
            </button>
            <div class="hadith-chain-body">
                <div class="chain-flow">
                    ${h.chain.map(c => `
                        <div class="chain-step">
                            <div class="chain-dot"><div class="chain-dot-inner"></div></div>
                            <div class="chain-info">
                                <div class="chain-name">${c.name}</div>
                                <div class="chain-role">${c.role}</div>
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>

            <div class="hadith-source">
                <div class="source-item">
                    <span class="source-label">Book</span>
                    <span class="source-value">${h.book}</span>
                </div>
                <div class="source-item">
                    <span class="source-label">Author</span>
                    <span class="source-value">${h.author}</span>
                </div>
                <div class="source-item">
                    <span class="source-label">Hadith No.</span>
                    <span class="source-value">${h.hadithNumber}</span>
                </div>
                <div class="source-item">
                    <span class="source-label">Chapter</span>
                    <span class="source-value">${h.chapter}</span>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

function toggleChain(btn) {
    const body = btn.nextElementSibling;
    const isOpen = btn.classList.contains("open");
    btn.classList.toggle("open", !isOpen);
    body.style.display = isOpen ? "none" : "block";
}

// filter pills
filterRow.addEventListener("click", e => {
    const pill = e.target.closest(".filter-pill");
    if (!pill) return;
    document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    activeFilter = pill.dataset.filter;
    renderHadiths();
});

// search
document.getElementById("searchBar").addEventListener("input", function() {
    searchQuery = this.value.trim();
    renderHadiths();
});

document.getElementById("menuToggle").addEventListener("click", () => {
    document.getElementById("navLinks").classList.toggle("open");
});

renderHadiths();
