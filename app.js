/* ============================================
   STARFIELD
   ============================================ */

const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];
let animFrame;

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

    const persona = document.documentElement.getAttribute('data-persona');
    const style = getComputedStyle(document.documentElement);
    const starColorRaw = style.getPropertyValue('--star-color').trim();

    // Parse rgba
    const match = starColorRaw.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    const r = match ? match[1] : 255;
    const g = match ? match[2] : 200;
    const b = match ? match[3] : 200;

    for (const star of stars) {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
        const alpha = star.baseAlpha + twinkle * 0.25;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0, alpha)})`;
        ctx.fill();
    }

    animFrame = requestAnimationFrame(drawStars);
}

window.addEventListener('resize', () => {
    initStarfield();
});
initStarfield();
requestAnimationFrame(drawStars);


/* ============================================
   PERSONA TOGGLE
   ============================================ */

const toggle = document.getElementById('personaToggle');

toggle.addEventListener('click', () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-persona');
    const next = current === 'gothix' ? 'minxy' : 'gothix';
    html.setAttribute('data-persona', next);
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

    if (audios.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    emptyState.style.display = 'none';

    audios.forEach((a, i) => {
        const card = document.createElement('div');
        card.className = 'audio-card';
        card.style.animationDelay = `${i * 0.06}s`;

        const tagsHTML = a.tags.map(t => {
            const isPersona = (t === 'Gothix' || t === 'Minxy');
            return `<span class="card-tag${isPersona ? ' persona-tag' : ''}">${t}</span>`;
        }).join('');

        // Build links
        let linksHTML = '';
        if (a.redditLink) {
            linksHTML += `<a href="${a.redditLink}" target="_blank" class="card-link">▸ Reddit</a>`;
        }
        if (a.patreonLink) {
            linksHTML += `<a href="${a.patreonLink}" target="_blank" class="card-link">▸ Patreon</a>`;
        }
        if (a.listenLink) {
            linksHTML += `<a href="${a.listenLink}" target="_blank" class="card-link">▸ Listen</a>`;
        }

        card.innerHTML = `
            <div class="card-header">
                <span class="card-title">${a.title}</span>
                <span class="card-source ${a.source}">${a.source}</span>
            </div>
            <div class="card-tags">${tagsHTML}</div>
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

    // Source filter
    if (activeSource !== 'all') {
        audios = audios.filter(a => a.source === activeSource);
    }

    // Search filter
    const query = searchInput.value.toLowerCase().trim();
    if (query) {
        audios = audios.filter(a =>
            a.title.toLowerCase().includes(query) ||
            a.tags.some(t => t.toLowerCase().includes(query))
        );
    }

    // Sort
    const sort = sortSelect.value;
    if (sort === 'newest') {
        audios.sort((a, b) => b.date.localeCompare(a.date));
    } else if (sort === 'oldest') {
        audios.sort((a, b) => a.date.localeCompare(b.date));
    } else if (sort === 'title') {
        audios.sort((a, b) => a.title.localeCompare(b.title));
    }

    return audios;
}

function update() {
    renderCards(getFilteredSorted());
}

// Event listeners
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

// Initial render
update();
