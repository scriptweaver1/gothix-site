/* ============================================
   STARFIELD
   ============================================ */

const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];

function initStarfield() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const count = Math.floor((canvas.width * canvas.height) / 3500);
    stars = [];
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.4 + 0.3,
            baseAlpha: Math.random() * 0.6 + 0.2,
            twinkleSpeed: Math.random() * 0.015 + 0.005,
            twinkleOffset: Math.random() * Math.PI * 2
        });
    }
}

function drawStars(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const style = getComputedStyle(document.documentElement);
    const raw = style.getPropertyValue('--star-color').trim();
    const m = raw.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    const [r, g, b] = m ? [m[1], m[2], m[3]] : [255, 200, 200];

    for (const s of stars) {
        const twinkle = Math.sin(time * s.twinkleSpeed + s.twinkleOffset);
        const alpha = Math.max(0, s.baseAlpha + twinkle * 0.25);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();
    }
    requestAnimationFrame(drawStars);
}

window.addEventListener('resize', initStarfield);
initStarfield();
requestAnimationFrame(drawStars);


/* ============================================
   3-POSITION PERSONA SWITCH
   ============================================ */

const switchEl = document.getElementById('personaSwitch');
const options = switchEl.querySelectorAll('.switch-option');
const indicator = switchEl.querySelector('.switch-indicator');

function setPersona(persona) {
    document.documentElement.setAttribute('data-persona', persona);

    options.forEach(o => {
        o.classList.toggle('active', o.dataset.persona === persona);
    });

    // Position the sliding indicator behind the active button
    const activeBtn = switchEl.querySelector(`.switch-option[data-persona="${persona}"]`);
    if (activeBtn) {
        const switchRect = switchEl.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        indicator.style.left = (btnRect.left - switchRect.left) + 'px';
        indicator.style.width = btnRect.width + 'px';
    }

    // Re-render cards since filter might change
    update();
}

options.forEach(o => {
    o.addEventListener('click', () => setPersona(o.dataset.persona));
});

// Initial position (need a frame for layout)
requestAnimationFrame(() => setPersona('both'));
window.addEventListener('resize', () => {
    const current = document.documentElement.getAttribute('data-persona');
    setPersona(current);
});


/* ============================================
   SAMPLE DATA
   ============================================ */

const SAMPLE_AUDIOS = [
    {
        title: "You Thought You Could Leave Me?",
        source: "reddit",
        tags: ["Yandere", "F4M", "Possessive", "Whisper"],
        persona: "Gothix",
        date: "2026-03-28",
        duration: "18:42",
        redditLink: "#",
        listenLink: "#"
    },
    {
        title: "Stargazing on the Rooftop with You",
        source: "patreon",
        tags: ["Comfort", "F4A", "Gentle", "GFE", "Stars"],
        persona: "Minxy",
        date: "2026-03-25",
        duration: "24:10",
        patreonLink: "#",
        listenLink: "#"
    },
    {
        title: "I Won't Let Anyone Else Have You",
        source: "reddit",
        tags: ["Yandere", "F4M", "Obsessive", "Dark"],
        persona: "Gothix",
        date: "2026-03-20",
        duration: "15:33",
        redditLink: "#",
        listenLink: "#"
    },
    {
        title: "Falling Asleep in My Arms",
        source: "reddit",
        tags: ["Comfort", "F4A", "Soft", "Sleep Aid"],
        persona: "Minxy",
        date: "2026-03-18",
        duration: "31:05",
        redditLink: "#",
        listenLink: "#"
    },
    {
        title: "You're Mine. Say It.",
        source: "patreon",
        tags: ["Possessive", "F4M", "Intense", "Whisper"],
        persona: "Gothix",
        date: "2026-03-12",
        duration: "12:20",
        patreonLink: "#",
        listenLink: "#"
    },
    {
        title: "Let Me Hold You Through the Storm",
        source: "reddit",
        tags: ["Comfort", "F4A", "Rain Sounds", "Tender"],
        persona: "Minxy",
        date: "2026-03-08",
        duration: "27:45",
        redditLink: "#",
        listenLink: "#"
    },
    {
        title: "Don't Look at Anyone But Me",
        source: "patreon",
        tags: ["Yandere", "F4M", "Jealousy", "Dark"],
        persona: "Gothix",
        date: "2026-02-28",
        duration: "20:18",
        patreonLink: "#",
        listenLink: "#"
    },
    {
        title: "Counting Stars Until You Fall Asleep",
        source: "reddit",
        tags: ["ASMR", "F4A", "Soft Spoken", "Cozy"],
        persona: "Minxy",
        date: "2026-02-20",
        duration: "35:00",
        redditLink: "#",
        listenLink: "#"
    }
];


/* ============================================
   RENDERING
   ============================================ */

const grid = document.getElementById('audioGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
let activeSource = 'all';

function renderCards(audios) {
    grid.innerHTML = '';
    if (audios.length === 0) { emptyState.style.display = 'block'; return; }
    emptyState.style.display = 'none';

    audios.forEach((a, i) => {
        const card = document.createElement('div');
        card.className = 'audio-card';
        card.style.animationDelay = `${i * 0.06}s`;

        const tagsHTML = a.tags.map(t =>
            `<span class="card-tag">${t}</span>`
        ).join('');

        // Persona tag with correct color class
        const personaClass = a.persona === 'Gothix' ? 'persona-gothix' : 'persona-minxy';
        const personaTag = `<span class="card-tag ${personaClass}">${a.persona}</span>`;

        let linksHTML = '';
        if (a.redditLink) linksHTML += `<a href="${a.redditLink}" target="_blank" class="card-link">▸ Reddit</a>`;
        if (a.patreonLink) linksHTML += `<a href="${a.patreonLink}" target="_blank" class="card-link">▸ Patreon</a>`;
        if (a.listenLink) linksHTML += `<a href="${a.listenLink}" target="_blank" class="card-link">▸ Listen</a>`;

        card.innerHTML = `
            <div class="card-header">
                <span class="card-title">${a.title}</span>
                <span class="card-source ${a.source}">${a.source}</span>
            </div>
            <div class="card-tags">${personaTag}${tagsHTML}</div>
            <div class="card-meta">
                <span>✦ ${a.date}</span>
                <span>⏱ ${a.duration}</span>
            </div>
            <div class="card-links">${linksHTML}</div>
        `;
        grid.appendChild(card);
    });
}

function getFilteredSorted() {
    let audios = [...SAMPLE_AUDIOS];

    // Persona filter — gothix/minxy only show their side, "both" shows all
    const persona = document.documentElement.getAttribute('data-persona');
    if (persona === 'gothix') {
        audios = audios.filter(a => a.persona === 'Gothix');
    } else if (persona === 'minxy') {
        audios = audios.filter(a => a.persona === 'Minxy');
    }

    // Source filter
    if (activeSource !== 'all') {
        audios = audios.filter(a => a.source === activeSource);
    }

    // Search
    const query = searchInput.value.toLowerCase().trim();
    if (query) {
        audios = audios.filter(a =>
            a.title.toLowerCase().includes(query) ||
            a.tags.some(t => t.toLowerCase().includes(query))
        );
    }

    // Sort
    const sort = sortSelect.value;
    if (sort === 'newest') audios.sort((a, b) => b.date.localeCompare(a.date));
    else if (sort === 'oldest') audios.sort((a, b) => a.date.localeCompare(b.date));
    else if (sort === 'title') audios.sort((a, b) => a.title.localeCompare(b.title));

    return audios;
}

function update() {
    renderCards(getFilteredSorted());
}

searchInput.addEventListener('input', update);
sortSelect.addEventListener('change', update);

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeSource = tab.dataset.source;
        update();
    });
});
