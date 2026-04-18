
// ══════════════════════════════════════════════════════════════
//  DEBUNKS DATA
//  To add: copy the template above, increment id, fill in your
//  content, and add it to this array.
// ══════════════════════════════════════════════════════════════
const DEBUNKS = [
    {
        id: 1,
        category: "Common Question",
        topics: ["Prayer", "Purification"],
        question: "Do I have to perform wudu before every prayer even if I haven't done anything to break it?",
        answer: `No — you do not need to repeat wudu before every prayer if your previous wudu is still valid. Wudu remains valid until something breaks it.

Things that break wudu include: using the toilet, passing wind, falling asleep (lying down), losing consciousness, and certain other conditions. If none of these have occurred since your last wudu, you may pray with it.

This is agreed upon by all four major schools of Islamic jurisprudence (Hanafi, Maliki, Shafi'i, and Hanbali). In fact, the Prophet ﷺ sometimes prayed multiple prayers with a single wudu.

It is however recommended (mustahabb) to renew wudu before each prayer if it is easy to do so, as it brings additional reward — but it is not obligatory unless your wudu has been broken.`,
        references: [
            { source: "Surah Al-Maidah 5:6", note: "The Quranic verse on wudu and its conditions" },
            { source: "Sahih Muslim 277", note: "The Prophet ﷺ prayed multiple prayers with one wudu" }
        ]
    },
    {
        id: 2,
        category: "Misconception",
        topics: ["Faith", "Character"],
        question: "Is Islam only about rituals like prayer and fasting?",
        answer: `This is a common misunderstanding. While prayer (salah), fasting (sawm), and other acts of worship are pillars of Islam, the religion addresses every aspect of life — including how you treat people, conduct business, raise a family, and interact with society.

The Prophet ﷺ said: "The best of you are those who are best in character." (Sahih al-Bukhari) This shows that personal conduct and moral character are central to being a good Muslim — not just performing rituals.

Islam covers ethics, justice, family relations, economic dealings, environmental responsibility, and more. The Quran itself dedicates large portions to stories of the prophets, lessons on human nature, and guidance for social life.

Rituals like prayer are the foundation — but they are meant to build a person who then acts righteously in the world. As Surah Al-Ankabut (29:45) states: "Indeed, prayer prohibits immorality and wrongdoing."`,
        references: [
            { source: "Sahih al-Bukhari 3559", note: "Hadith on the best of people being best in character" },
            { source: "Surah Al-Ankabut 29:45", note: "Prayer as a means of preventing wrongdoing" },
            { source: "Surah Al-Baqarah 2:177", note: "A comprehensive definition of righteousness in Islam" }
        ]
    },
    {
        id: 3,
        category: "Historical",
        topics: ["Knowledge", "History"],
        question: "Did Islam spread only by the sword?",
        answer: `This claim does not hold up to historical scrutiny. The spread of Islam was driven primarily by trade, migration, scholarship, and the persuasive nature of its message — not forced conversion.

Large Muslim populations exist in Indonesia, Malaysia, West Africa, and parts of East Africa — regions that were never conquered by Muslim armies. Islam reached these areas through merchants, scholars, and Sufi missionaries.

The Quran explicitly states: "There is no compulsion in religion. The right course has become clear from the wrong." (Al-Baqarah 2:256). Forced conversion is not permissible in Islamic law.

Historically, non-Muslim communities (Jews, Christians, Zoroastrians) lived under Muslim rule for centuries with their own legal systems, places of worship, and religious freedom as protected peoples (dhimmi). This was not a perfect system, but it was remarkably different from forced conversion.

Academic historians — including non-Muslim scholars — largely reject the "spread by the sword" narrative as an oversimplification that ignores the complex social, economic, and intellectual factors behind Islam's growth.`,
        references: [
            { source: "Surah Al-Baqarah 2:256", note: "No compulsion in religion" },
            { source: "Surah Al-Kafirun 109:6", note: "To you your religion, to me mine" }
        ]
    }
];

// ── RENDER ──────────────────────────────────────────────────
const listEl    = document.getElementById("debunkList");
const noResults = document.getElementById("noResults");
const filterRow = document.getElementById("filterRow");

// Build topic filter pills from data
const allTopics = [...new Set(DEBUNKS.flatMap(d => d.topics))].sort();
allTopics.forEach(topic => {
    const btn = document.createElement("button");
    btn.className = "filter-pill";
    btn.dataset.filter = topic;
    btn.textContent = topic;
    filterRow.appendChild(btn);
});

let activeFilter = "all";
let searchQuery  = "";

function renderDebunks() {
    const q = searchQuery.toLowerCase();

    const filtered = DEBUNKS.filter(d => {
        const matchFilter = activeFilter === "all" || d.topics.includes(activeFilter);
        const matchSearch = !q ||
            d.question.toLowerCase().includes(q) ||
            d.answer.toLowerCase().includes(q) ||
            d.topics.some(t => t.toLowerCase().includes(q)) ||
            d.category.toLowerCase().includes(q);
        return matchFilter && matchSearch;
    });

    listEl.innerHTML = "";
    noResults.style.display = filtered.length === 0 ? "block" : "none";

    filtered.forEach(d => {
        const card = document.createElement("div");
        card.className = "debunk-card";

        const refsHTML = d.references?.length ? `
            <div class="debunk-refs">
                <span class="debunk-refs-label">References</span>
                ${d.references.map(r => `
                    <div class="debunk-ref-item">
                        <span>→</span>${r.source}${r.note ? ` — ${r.note}` : ""}
                    </div>
                `).join("")}
            </div>
        ` : "";

        card.innerHTML = `
            <button class="debunk-question-row" onclick="toggleDebunk(this)">
                <div class="debunk-q-left">
                    <div class="debunk-tags">
                        <span class="debunk-category">${d.category}</span>
                        ${d.topics.map(t => `<span class="debunk-topic-tag">${t}</span>`).join("")}
                    </div>
                    <div class="debunk-question">${d.question}</div>
                </div>
                <span class="debunk-toggle-icon">+</span>
            </button>
            <div class="debunk-answer-body">
                <div class="debunk-answer-label">Answer</div>
                <div class="debunk-answer">${escapeHTML(d.answer)}</div>
                ${refsHTML}
            </div>
        `;

        listEl.appendChild(card);
    });
}

function toggleDebunk(btn) {
    const body   = btn.nextElementSibling;
    const isOpen = btn.classList.contains("open");

    // close all others
    document.querySelectorAll(".debunk-question-row.open").forEach(b => {
        b.classList.remove("open");
        b.nextElementSibling.style.display = "none";
    });

    if (!isOpen) {
        btn.classList.add("open");
        body.style.display = "block";
        body.style.animation = "none";
        void body.offsetWidth;
        body.style.animation = "";
    }
}

function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// filter pills
filterRow.addEventListener("click", e => {
    const pill = e.target.closest(".filter-pill");
    if (!pill) return;
    document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    activeFilter = pill.dataset.filter;
    renderDebunks();
});

// search
document.getElementById("searchBar").addEventListener("input", function() {
    searchQuery = this.value.trim();
    renderDebunks();
});

document.getElementById("menuToggle").addEventListener("click", () => {
    document.getElementById("navLinks").classList.toggle("open");
});

renderDebunks();
