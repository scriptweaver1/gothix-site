/* ============================================
   STARFIELD
   ============================================ */

const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];
let starRGB = [255, 200, 200]; // cached; refreshed only on persona change

function refreshStarColor() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--star-color').trim();
    const m = raw.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) starRGB = [m[1], m[2], m[3]];
}

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
    const [r, g, b] = starRGB;

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
refreshStarColor();
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
    refreshStarColor();

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
   DATA  (loaded from audios.json at runtime)
   ============================================ */

let AUDIOS = [];


/* ============================================
   STATE
   ============================================ */

let activeSource = 'all';
let activeCategory = 'all';
const TEXT_SIZES = ['text-size-12', 'text-size-14', 'text-size-16', 'text-size-18'];
const MAX_TAGS_SHOWN = 10;


/* ============================================
   RENDERING
   ============================================ */

const grid = document.getElementById('audioGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');

const redditIcon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>`;
const patreonIcon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M14.82 2.41c3.96 0 7.18 3.24 7.18 7.21 0 3.96-3.22 7.18-7.18 7.18-3.97 0-7.21-3.22-7.21-7.18 0-3.97 3.24-7.21 7.21-7.21M2 21.6h3.5V2.41H2V21.6z"/></svg>`;

function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function buildCardInner(a) {
    const tags = a.tags || [];
    const shown = tags.slice(0, MAX_TAGS_SHOWN);
    const extra = tags.length - shown.length;
    let tagsHTML = shown.map(t => `<span class="card-tag">${escapeHtml(t)}</span>`).join('');
    if (extra > 0) tagsHTML += `<span class="card-tag card-tag-more">+${extra}</span>`;

    // Category badge
    const categoryHTML = a.category
        ? `<div class="card-category">${escapeHtml(a.category)}</div>` : '';

    // Synopsis / description
    const synopsisHTML = a.synopsis
        ? `<p class="card-synopsis">${escapeHtml(a.synopsis)}</p>` : '';

    // Credits: writer, script, collab, editor
    const credits = [];
    if (a.writer) {
        credits.push(`<div class="credit-row"><span class="credit-label">Writer</span><span class="credit-value">${escapeHtml(a.writer)}</span></div>`);
    }
    if (a.scriptLink) {
        credits.push(`<div class="credit-row"><span class="credit-label">Script</span><a class="credit-value" href="${escapeHtml(a.scriptLink)}" target="_blank" rel="noopener">View script</a></div>`);
    }
    if (a.collabPartner) {
        credits.push(`<div class="credit-row"><span class="credit-label">Collab</span><span class="credit-value">${escapeHtml(a.collabPartner)}</span></div>`);
    }
    if (a.editor) {
        credits.push(`<div class="credit-row"><span class="credit-label">Editor</span><span class="credit-value">${escapeHtml(a.editor)}</span></div>`);
    }
    const creditsHTML = credits.length ? `<div class="card-credits">${credits.join('')}</div>` : '';

    // Source buttons with icon + label
    let linksHTML = '';
    if (a.redditLink) linksHTML += `<a href="${escapeHtml(a.redditLink)}" target="_blank" rel="noopener" class="card-link link-reddit" title="View on Reddit">${redditIcon}<span>Reddit</span></a>`;
    if (a.patreonLink) linksHTML += `<a href="${escapeHtml(a.patreonLink)}" target="_blank" rel="noopener" class="card-link link-patreon" title="View on Patreon">${patreonIcon}<span>Patreon</span></a>`;

    const meta = [];
    if (a.date) meta.push(`<span>✦ ${escapeHtml(a.date)}</span>`);
    if (a.duration) meta.push(`<span>⏱ ${escapeHtml(a.duration)}</span>`);
    const metaHTML = meta.length ? `<div class="card-meta">${meta.join('')}</div>` : '';

    return `
        ${categoryHTML}
        <div class="card-header">
            <span class="card-title">${escapeHtml(a.title)}</span>
        </div>
        ${synopsisHTML}
        <div class="card-tags">${tagsHTML}</div>
        ${metaHTML}
        ${creditsHTML}
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

    if (audios.length === 0 && cardSlots.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    isTransitioning = true;
    emptyState.style.display = 'none';

    cardSlots.forEach(card => {
        const inner = card.querySelector('.card-inner');
        if (inner) inner.classList.add('fade-out');
    });

    setTimeout(() => {
        const needed = audios.length;
        const current = cardSlots.length;

        if (needed < current) {
            const extras = cardSlots.splice(needed);
            extras.forEach(card => card.classList.add('exiting'));
            setTimeout(() => {
                extras.forEach(card => card.remove());
                if (needed === 0) emptyState.style.display = 'block';
            }, FADE_MS);
        }

        if (needed > current) {
            for (let i = current; i < needed; i++) {
                const card = createCardSlot();
                card.style.opacity = '0';
                grid.appendChild(card);
                cardSlots.push(card);
                requestAnimationFrame(() => {
                    card.style.transition = `opacity 0.4s ease, transform 0.4s ease`;
                    card.style.opacity = '1';
                });
            }
        }

        audios.forEach((a, i) => {
            const inner = cardSlots[i].querySelector('.card-inner');
            if (inner) {
                inner.innerHTML = buildCardInner(a);
                inner.classList.add('fade-out');
            }
        });

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                cardSlots.forEach(card => {
                    const inner = card.querySelector('.card-inner');
                    if (inner) inner.classList.remove('fade-out');
                });
            });
        });

        setTimeout(() => {
            isTransitioning = false;
            if (pendingUpdate) { pendingUpdate = false; update(); }
        }, FADE_MS + 100);

    }, FADE_MS);
}

/* ============================================
   SMART TAG SEARCH
   Layer 1 — normalization: "Deep Throat", "Deep-Throat" and "Deepthroat"
   all become "deepthroat", so spelling/punctuation never matters.
   Layer 2 — concept groups: different words for the same idea (BJ ↔
   Blowjob, Tits ↔ Breasts ↔ Boobs...) match each other. Groups are
   built from the actual tag corpus used across the masterlist.
   ============================================ */

function normTag(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Each group is a list of NORMALIZED terms that mean the same concept.
const CONCEPT_GROUPS = [
    ['bj', 'blowjob', 'cocksucking', 'suckingyourcock', 'glucks', 'sloppybj'],
    ['hj', 'handjob', 'strokeit', 'fuckmyhand', 'reacharound'],
    ['deepthroat', 'throatfuck', 'fuckmymouth', 'facefuck', 'gluck'],
    ['cim', 'cuminmouth', 'cumswallow', 'swallowing', 'multipleswallows', 'fedcum', 'mouthfullocum'],
    ['fdom', 'femdom', 'domme', 'mommydom', 'mommydomme', 'mistress', 'girlboss', 'dominating'],
    ['fsub', 'submissive', 'subby', 'sublistener', 'usemе', 'useme'],
    ['mdom', 'daddydom', 'daddy', 'master', 'sir'],
    ['msub', 'sublistener', 'subbylistener'],
    ['creampie', 'breed', 'breeding', 'breedme', 'cuminside', 'cuminmywomb', 'analcreampie'],
    ['gfe', 'girlfriend', 'girlfriendexperience', 'needygf', 'lovinggf'],
    ['bfe', 'boyfriend', 'boyfriendexperience'],
    ['boobjob', 'breastjob', 'tittyfuck', 'titjob', 'titfuck', 'oiledboobjob'],
    ['boobs', 'breasts', 'tits', 'titties', 'bigboobs', 'bigbreasts', 'bigtits', 'cleavage'],
    ['ass', 'booty', 'bigass', 'butt'],
    ['pegging', 'strapon', 'strapon', 'girlcock', 'girldick', 'doubleendeddildo'],
    ['anal', 'assplay', 'buttplug', 'analplay', 'fingermyass'],
    ['cnc', 'dubcon', 'noncon', 'rape', 'coercion', 'consensualnonconsent'],
    ['freeuse', 'freeusе'],
    ['joi', 'jill', 'guidedmasturbation', 'jerkoffinstructions', 'countdown'],
    ['somno', 'somnophilia', 'sleepplay', 'whileasleep', 'somnooral'],
    ['cunnilingus', 'pussyeating', 'eatingout', 'eatingher', 'goingdown', 'ridingyourface', 'facesitting', 'anilingus'],
    ['edging', 'edge', 'orgasmcontrol', 'orgasmdenial', 'denial'],
    ['overstim', 'overstimulation'],
    ['lbomb', 'lbombs', 'lovebombs', 'iloveyou', 'l0x3'],
    ['goodboy', 'goodboys', 'babyboy'],
    ['goodgirl', 'goodgirls', 'babygirl'],
    ['praise', 'praisekink', 'listenerpraise', 'bodypraise', 'appreciation', 'bodyappreciation', 'validation', 'encouragement'],
    ['degradation', 'namecalling', 'mocking', 'condescending', 'humiliation'],
    ['wetsounds', 'wetsound', 'wetnoises', 'slurping', 'slurps', 'sloppy'],
    ['monstergirl', 'monstergirls', 'succubus', 'catgirl', 'puppygirl', 'bunnygirl', 'demon', 'imp'],
    ['scent', 'sniff', 'sniffs', 'sniffing', 'smell', 'musk', 'scentfetish', 'scentplay', 'pussyscent'],
    ['4thwallbreak', '4thwallbreaks', 'fourthwallbreak', 'fourthwall'],
    ['improv', 'improvised', 'improvadded'],
    ['scriptfill', 'script'],
    ['ramblefap', 'ramble', 'rambles', 'fap', 'ramblefapinmyears'],
    ['orgasm', 'orgasms', 'mutualo', 'listenero', 'speakero', 'multipleos', 'multipleorgasms', 'listenerorgasm', 'speakerorgasm', '2listenero', 'cumwithme', 'climax'],
    ['precum', 'precumobsessed', 'precumobsession', 'precumtasting', 'precumfeeding', 'eatyourprecum'],
    ['frenulum', 'frenulumworship', 'frenulumteasing', 'frenulumlicks', 'frenulumlove', 'frenulumobsessed'],
    ['spit', 'spitting', 'spitaslube', 'drooling', 'drool'],
    ['kissing', 'kisses', 'makingout', 'makeout', 'cumkiss', 'cumswapping'],
    ['cuddles', 'cuddling', 'cuddle', 'cozy', 'snuggle', 'holding'],
    ['sleepaid', 'sleep', 'goodnight', 'bedtime', 'putsyoutobed', 'fallingasleep'],
    ['comfort', 'reassurance', 'mentalhealth', 'wholesome', 'aftercare', 'checkins', 'consentchecks'],
    ['sfw', 'safeforwork', 'nonsexual'],
    ['asmr', 'softspoken', 'whisper', 'whispers', 'whispering', 'pillowtalk'],
    ['teasing', 'tease', 'playfulteasing', 'taunting'],
    ['possessive', 'yandere', 'obsessive', 'jealous', 'youremine', 'youreminenow', 'stalker'],
    ['exhibitionism', 'publicplay', 'semipublic', 'voyeur', 'voyeurism', 'almostcaught', 'holdthemoan'],
    ['grinding', 'clitgrinding', 'cockgrinding', 'dryhumping', 'thighfucking', 'thighjob'],
    ['fingering', 'fingersinmouth', 'fingermyass'],
    ['dildo', 'dildos', 'vibrator', 'toy', 'toys', 'clitsucker'],
    ['spanking', 'spanks', 'spank'],
    ['bondage', 'restrained', 'cuffed', 'handcuffs', 'tiedup', 'blindfold'],
    ['petplay', 'collar', 'leash', 'puppy', 'kitten', 'bunny'],
    ['marking', 'hickies', 'hickeys', 'biting', 'neckplay', 'necknibbles'],
    ['cowgirl', 'riding', 'ridemе', 'rideme'],
    ['virgin', 'firsttime', 'inexperienced'],
    ['milf', 'mommy', 'mature'],
    ['collab', 'collaboration', 'featuring', 'duo', 'threesome', 'mmf', 'ffm', '3some'],
    ['scifi', 'sciencefiction', 'starwars', 'cyberpunk', 'space', 'alien', 'robot', 'android', 'vr'],
    ['fantasy', 'magic', 'mythology', 'dnd', 'rpg', 'warhammer', 'elf', 'witch'],
];

// term -> set of group indices (a term can appear in several groups)
const TERM_INDEX = new Map();
CONCEPT_GROUPS.forEach((terms, gi) => {
    terms.forEach(t => {
        if (!TERM_INDEX.has(t)) TERM_INDEX.set(t, new Set());
        TERM_INDEX.get(t).add(gi);
    });
});

// Which concept groups does a normalized string belong to?
function conceptsOf(norm) {
    const out = new Set();
    if (!norm) return out;
    for (const [term, groups] of TERM_INDEX) {
        // tag contains the term, or (for queries) the term starts with the query
        if (norm.includes(term) || (norm.length >= 3 && term.startsWith(norm))) {
            groups.forEach(g => out.add(g));
        }
    }
    return out;
}

// Does one search token match an audio? (uses precomputed norms)
function tokenMatches(audio, token) {
    const nq = normTag(token);
    if (!nq) return true;
    // plain text match on title/synopsis
    if ((audio.title || '').toLowerCase().includes(token)) return true;
    if ((audio.synopsis || '').toLowerCase().includes(token)) return true;
    // normalized substring match on tags (Deep-Throat vs Deepthroat etc.)
    if (audio._normTags.some(nt => nt.includes(nq))) return true;
    // concept-group match (BJ vs Blowjob etc.)
    const qGroups = conceptsOf(nq);
    if (qGroups.size) {
        for (const g of audio._tagGroups) if (qGroups.has(g)) return true;
    }
    return false;
}

// Precompute per-audio normalized tags + concept groups (called once after load)
function indexAudios() {
    AUDIOS.forEach(a => {
        a._normTags = (a.tags || []).map(normTag);
        const groups = new Set();
        a._normTags.forEach(nt => conceptsOf(nt).forEach(g => groups.add(g)));
        // category counts as a searchable concept too
        conceptsOf(normTag(a.category)).forEach(g => groups.add(g));
        a._tagGroups = groups;
    });
}

function getFilteredSorted() {
    let audios = [...AUDIOS];

    const persona = document.documentElement.getAttribute('data-persona');
    if (persona === 'gothix') audios = audios.filter(a => a.persona === 'Gothix');
    else if (persona === 'minxy') audios = audios.filter(a => a.persona === 'Minxy');

    // Source is derived from which links an audio actually has
    if (activeSource === 'reddit') audios = audios.filter(a => a.redditLink);
    else if (activeSource === 'patreon') audios = audios.filter(a => a.patreonLink);

    if (activeCategory !== 'all') audios = audios.filter(a => a.category === activeCategory);

    const query = searchInput.value.toLowerCase().trim();
    if (query) {
        // Try the whole query as one phrase first (handles "deep throat"),
        // otherwise every word must match somewhere (handles "succubus creampie").
        audios = audios.filter(a => {
            if (tokenMatches(a, query)) return true;
            const words = query.split(/\s+/).filter(w => w.length > 1);
            return words.length > 1 && words.every(w => tokenMatches(a, w));
        });
    }

    const sort = sortSelect.value;
    if (sort === 'newest') audios.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    else if (sort === 'oldest') audios.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    else if (sort === 'title') audios.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

    return audios;
}

function initialRender() {
    const audios = getFilteredSorted();
    if (audios.length === 0) { emptyState.style.display = 'block'; return; }

    audios.forEach((a, i) => {
        const card = createCardSlot();
        card.classList.add('entering');
        card.style.animationDelay = `${Math.min(i, 20) * 0.05}s`;
        card.querySelector('.card-inner').innerHTML = buildCardInner(a);
        grid.appendChild(card);
        cardSlots.push(card);
    });

    setTimeout(() => {
        grid.querySelectorAll('.entering').forEach(c => c.classList.remove('entering'));
    }, 800);
}


/* ============================================
   DYNAMIC CATEGORY BUTTONS
   ============================================ */

function buildCategoryButtons() {
    const list = document.getElementById('categoryList');
    // Remove any pre-existing category buttons except "All"
    list.querySelectorAll('.category-btn:not([data-category="all"])').forEach(b => b.remove());

    const cats = [...new Set(AUDIOS.map(a => a.category).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b));

    cats.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.dataset.category = cat;
        btn.textContent = cat;
        list.appendChild(btn);
    });

    list.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            list.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.dataset.category;
            update();
        });
    });
}


/* ============================================
   DATA LOADING
   ============================================ */

async function loadAudios() {
    try {
        // Cache-bust so Cloudflare never serves a stale catalog after a rebuild
        const resp = await fetch(`audios.json?v=${Date.now()}`, { cache: 'no-store' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        AUDIOS = await resp.json();
    } catch (e) {
        console.error('Could not load audios.json:', e);
        AUDIOS = [];
        emptyState.textContent = 'Could not load audios.';
        emptyState.style.display = 'block';
    }
    buildCategoryButtons();
    initialRender();
}


/* ============================================
   EVENT LISTENERS
   ============================================ */

searchInput.addEventListener('input', update);
sortSelect.addEventListener('change', update);

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
document.body.classList.add('text-size-14');

// Font choice (default / OpenDyslexic / Arial / Atkinson)
const FONT_CLASSES = ['font-opendyslexic', 'font-arial', 'font-atkinson'];
const FONT_MAP = {
    opendyslexic: 'font-opendyslexic',
    arial: 'font-arial',
    atkinson: 'font-atkinson',
    default: null,
};
document.querySelectorAll('.a11y-font-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.a11y-font-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.body.classList.remove(...FONT_CLASSES);
        const cls = FONT_MAP[btn.dataset.font];
        if (cls) document.body.classList.add(cls);
    });
});

// Kick everything off
loadAudios();

/* ============================================
   CINEMATIC MODE
   ============================================ */

const cinematicToggle = document.getElementById('cinematicToggle');
cinematicToggle.addEventListener('click', () => {
    const on = document.body.classList.toggle('cinematic');
    cinematicToggle.title = on ? 'Exit cinematic mode' : 'Cinematic mode';
    cinematicToggle.setAttribute('aria-label', cinematicToggle.title);
    // close the a11y menu if it was open
    if (on) a11yMenu.classList.remove('open');
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.body.classList.remove('cinematic');
});
