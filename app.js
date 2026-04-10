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
const personaOptions = switchEl.querySelectorAll('.switch-option');
const indicator = switchEl.querySelector('.switch-indicator');

function setPersona(persona) {
    document.documentElement.setAttribute('data-persona', persona);
    personaOptions.forEach(o => o.classList.toggle('active', o.dataset.persona === persona));

    const activeBtn = switchEl.querySelector(`.switch-option[data-persona="${persona}"]`);
    if (activeBtn) {
        const switchRect = switchEl.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        indicator.style.left = (btnRect.left - switchRect.left) + 'px';
        indicator.style.width = btnRect.width + 'px';
    }
    update();
}

personaOptions.forEach(o => o.addEventListener('click', () => setPersona(o.dataset.persona)));
requestAnimationFrame(() => setPersona('both'));
window.addEventListener('resize', () => {
    setPersona(document.documentElement.getAttribute('data-persona'));
});


/* ============================================
   SIDEBAR TOGGLE (mobile)
   ============================================ */

const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');

// Create backdrop element for mobile
const backdrop = document.createElement('div');
backdrop.className = 'sidebar-backdrop';
document.body.appendChild(backdrop);

sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    backdrop.classList.toggle('visible');
});
backdrop.addEventListener('click', () => {
    sidebar.classList.remove('open');
    backdrop.classList.remove('visible');
});


/* ============================================
   SAMPLE DATA
   ============================================ */

const SAMPLE_AUDIOS = [
    {
        title: "You Thought You Could Leave Me?",
        source: "reddit",
        tags: ["Yandere", "F4M", "Possessive", "Whisper"],
        category: "yandere",
        persona: "Gothix",
        date: "2026-03-28",
        duration: "18:42",
        redditLink: "#"
    },
    {
        title: "Stargazing on the Rooftop with You",
        source: "patreon",
        tags: ["Comfort", "F4A", "Gentle", "GFE", "Stars"],
        category: "comfort",
        persona: "Minxy",
        date: "2026-03-25",
        duration: "24:10",
        patreonLink: "#"
    },
    {
        title: "I Won't Let Anyone Else Have You",
        source: "reddit",
        tags: ["Yandere", "F4M", "Obsessive", "Dark"],
        category: "yandere",
        persona: "Gothix",
        date: "2026-03-20",
        duration: "15:33",
        redditLink: "#"
    },
    {
        title: "Falling Asleep in My Arms",
        source: "reddit",
        tags: ["Comfort", "F4A", "Soft", "Sleep Aid"],
        category: "sleep-aid",
        persona: "Minxy",
        date: "2026-03-18",
        duration: "31:05",
        redditLink: "#"
    },
    {
        title: "You're Mine. Say It.",
        source: "patreon",
        tags: ["Possessive", "F4M", "Intense", "Whisper"],
        category: "yandere",
        persona: "Gothix",
        date: "2026-03-12",
        duration: "12:20",
        patreonLink: "#"
    },
    {
        title: "Let Me Hold You Through the Storm",
        source: "reddit",
        tags: ["Comfort", "F4A", "Rain Sounds", "Tender"],
        category: "comfort",
        persona: "Minxy",
        date: "2026-03-08",
        duration: "27:45",
        redditLink: "#"
    },
    {
        title: "Don't Look at Anyone But Me",
        source: "patreon",
        tags: ["Yandere", "F4M", "Jealousy", "Dark"],
        category: "yandere",
        persona: "Gothix",
        date: "2026-02-28",
        duration: "20:18",
        patreonLink: "#",
        redditLink: "#"
    },
    {
        title: "Counting Stars Until You Fall Asleep",
        source: "reddit",
        tags: ["ASMR", "F4A", "Soft Spoken", "Cozy"],
        category: "asmr",
        persona: "Minxy",
        date: "2026-02-20",
        duration: "35:00",
        redditLink: "#"
    },
    {
        title: "The Space Between Us",
        source: "patreon",
        tags: ["Sci-Fi", "F4A", "Adventure", "Stars"],
        category: "sci-fi",
        persona: "Minxy",
        date: "2026-02-15",
        duration: "22:30",
        patreonLink: "#"
    },
    {
        title: "Dancing Under Neon Lights",
        source: "reddit",
        tags: ["Romance", "F4M", "Date Night", "Flirty"],
        category: "romance",
        persona: "Minxy",
        date: "2026-02-10",
        duration: "19:15",
        redditLink: "#"
    },
    {
        title: "You Ran. That Was a Mistake.",
        source: "patreon",
        tags: ["Yandere", "F4M", "Chase", "Dark"],
        category: "yandere",
        persona: "Gothix",
        date: "2026-02-05",
        duration: "16:40",
        patreonLink: "#"
    },
    {
        title: "Whispered Goodnight from the Stars",
        source: "reddit",
        tags: ["ASMR", "F4A", "Whisper", "Sleep Aid"],
        category: "asmr",
        persona: "Minxy",
        date: "2026-01-30",
        duration: "40:00",
        redditLink: "#"
    }
];


/* ============================================
   STATE
   ============================================ */

let activeSource = 'all';
let activeCategory = 'all';
const TEXT_SIZES = ['text-size-12', 'text-size-14', 'text-size-16', 'text-size-18'];


/* ============================================
   RENDERING
   ============================================ */

const grid = document.getElementById('audioGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');

const redditIcon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>`;
const patreonIcon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M14.82 2.41c3.96 0 7.18 3.24 7.18 7.21 0 3.96-3.22 7.18-7.18 7.18-3.97 0-7.21-3.22-7.21-7.18 0-3.97 3.24-7.21 7.21-7.21M2 21.6h3.5V2.41H2V21.6z"/></svg>`;

function buildCardInner(a) {
    const tagsHTML = a.tags.map(t => `<span class="card-tag">${t}</span>`).join('');
    let linksHTML = '';
    if (a.redditLink) linksHTML += `<a href="${a.redditLink}" target="_blank" class="card-link link-reddit" title="View on Reddit">${redditIcon}</a>`;
    if (a.patreonLink) linksHTML += `<a href="${a.patreonLink}" target="_blank" class="card-link link-patreon" title="View on Patreon">${patreonIcon}</a>`;

    return `
        <div class="card-header">
            <span class="card-title">${a.title}</span>
        </div>
        <div class="card-tags">${tagsHTML}</div>
        <div class="card-meta">
            <span>✦ ${a.date}</span>
            <span>⏱ ${a.duration}</span>
        </div>
        <div class="card-links">${linksHTML}</div>
    `;
}

// Persistent card slot elements
let cardSlots = [];
let isTransitioning = false;
let pendingUpdate = false;
const FADE_MS = 300;

function createCardSlot() {
    const card = document.createElement('div');
    card.className = 'audio-card';
    const inner = document.createElement('div');
    inner.className = 'card-inner';
    card.appendChild(inner);
    return card;
}

function update() {
    if (isTransitioning) { pendingUpdate = true; return; }

    const audios = getFilteredSorted();

    // If no results at all, fade out everything then show empty state
    if (audios.length === 0 && cardSlots.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    isTransitioning = true;
    emptyState.style.display = 'none';

    // Phase 1: Fade out all existing card content
    cardSlots.forEach(card => {
        const inner = card.querySelector('.card-inner');
        if (inner) inner.classList.add('fade-out');
    });

    setTimeout(() => {
        const needed = audios.length;
        const current = cardSlots.length;

        // Shrink: fade out and remove extra slots
        if (needed < current) {
            const extras = cardSlots.splice(needed);
            extras.forEach(card => {
                card.classList.add('exiting');
            });
            setTimeout(() => {
                extras.forEach(card => card.remove());
                if (needed === 0) emptyState.style.display = 'block';
            }, FADE_MS);
        }

        // Grow: add new empty slots
        if (needed > current) {
            for (let i = current; i < needed; i++) {
                const card = createCardSlot();
                card.style.opacity = '0';
                grid.appendChild(card);
                cardSlots.push(card);
                // Trigger entrance
                requestAnimationFrame(() => {
                    card.style.transition = `opacity 0.4s ease, transform 0.4s ease`;
                    card.style.opacity = '1';
                });
            }
        }

        // Phase 2: Swap content into all active slots
        audios.forEach((a, i) => {
            const inner = cardSlots[i].querySelector('.card-inner');
            if (inner) {
                inner.innerHTML = buildCardInner(a);
                inner.classList.add('fade-out'); // start hidden
            }
        });

        // Phase 3: Fade in new content
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                cardSlots.forEach(card => {
                    const inner = card.querySelector('.card-inner');
                    if (inner) {
                        inner.classList.remove('fade-out');
                    }
                });
            });
        });

        setTimeout(() => {
            isTransitioning = false;
            if (pendingUpdate) { pendingUpdate = false; update(); }
        }, FADE_MS + 100);

    }, FADE_MS);
}

function getFilteredSorted() {
    let audios = [...SAMPLE_AUDIOS];

    const persona = document.documentElement.getAttribute('data-persona');
    if (persona === 'gothix') audios = audios.filter(a => a.persona === 'Gothix');
    else if (persona === 'minxy') audios = audios.filter(a => a.persona === 'Minxy');

    if (activeSource !== 'all') audios = audios.filter(a => a.source === activeSource);
    if (activeCategory !== 'all') audios = audios.filter(a => a.category === activeCategory);

    const query = searchInput.value.toLowerCase().trim();
    if (query) {
        audios = audios.filter(a =>
            a.title.toLowerCase().includes(query) ||
            a.tags.some(t => t.toLowerCase().includes(query))
        );
    }

    const sort = sortSelect.value;
    if (sort === 'newest') audios.sort((a, b) => b.date.localeCompare(a.date));
    else if (sort === 'oldest') audios.sort((a, b) => a.date.localeCompare(b.date));
    else if (sort === 'title') audios.sort((a, b) => a.title.localeCompare(b.title));

    return audios;
}

// Initial render — build slots immediately, no transition
function initialRender() {
    const audios = getFilteredSorted();
    if (audios.length === 0) { emptyState.style.display = 'block'; return; }

    audios.forEach((a, i) => {
        const card = createCardSlot();
        card.classList.add('entering');
        card.style.animationDelay = `${i * 0.06}s`;

        const inner = card.querySelector('.card-inner');
        inner.innerHTML = buildCardInner(a);

        grid.appendChild(card);
        cardSlots.push(card);
    });

    setTimeout(() => {
        grid.querySelectorAll('.entering').forEach(c => c.classList.remove('entering'));
    }, 600);
}


/* ============================================
   EVENT LISTENERS
   ============================================ */

searchInput.addEventListener('input', update);
sortSelect.addEventListener('change', update);

// Category buttons
document.querySelectorAll('#categoryList .category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#categoryList .category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.category;
        update();
    });
});

// Source buttons (sidebar)
document.querySelectorAll('#sourceList .category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#sourceList .category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeSource = btn.dataset.source;
        update();
    });
});

// Cards per row
document.querySelectorAll('.cpr-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.cpr-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        grid.className = 'audio-grid cols-' + btn.dataset.cols;
        update();
    });
});
// Set default
grid.classList.add('cols-2');

// Accessibility widget
const a11yToggle = document.getElementById('a11yToggle');
const a11yMenu = document.getElementById('a11yMenu');

a11yToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    a11yMenu.classList.toggle('open');
});

document.addEventListener('click', (e) => {
    if (!document.getElementById('a11yWidget').contains(e.target)) {
        a11yMenu.classList.remove('open');
    }
});

document.querySelectorAll('.a11y-size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.a11y-size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.body.classList.remove(...TEXT_SIZES);
        document.body.classList.add(TEXT_SIZES[btn.dataset.size]);
    });
});
// Default: 14 (index 1)
document.body.classList.add('text-size-14');

// Initial render
initialRender();
