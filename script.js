const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const heroCanvas = document.querySelector('.hero-canvas');
let scrollFrame = null;

function updateBanner() {
    scrollFrame = null;
    if (!heroCanvas) return;
    const amount = reducedMotion.matches ? 0 : window.scrollY;
    heroCanvas.style.backgroundPosition = `center, calc(50% + ${amount * 0.2}px) center`;
    heroCanvas.style.setProperty('--scroll-amount', amount);
}
document.addEventListener('scroll', () => {
    if (!reducedMotion.matches && scrollFrame === null) {
        scrollFrame = requestAnimationFrame(updateBanner);
    }
}, { passive: true });
reducedMotion.addEventListener('change', updateBanner);
updateBanner();

const creditCards = document.querySelectorAll('.credit-card');
if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => entry.target.classList.toggle('in-view', entry.isIntersecting));
    }, { threshold: 0.2 });
    creditCards.forEach(card => observer.observe(card));
} else {
    creditCards.forEach(card => card.classList.add('in-view'));
}

const header = document.querySelector('.hero-header');
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#section-nav');
const compactNavigation = window.matchMedia('(max-width: 960px)');
function closeMenu(restoreFocus = false) {
    header.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) menuToggle.focus();
}
header.classList.add('has-menu');
menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    header.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
});
navigation.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    closeMenu();
    // Move keyboard focus to the destination when the compact menu disappears.
    const section = document.querySelector(link.hash);
    section.setAttribute('tabindex', '-1');
    section.focus({ preventScroll: true });
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) closeMenu(true);
});
document.addEventListener('click', event => {
    if (!navigation.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
});
header.addEventListener('focusout', event => {
    if (!header.contains(event.relatedTarget)) closeMenu();
});
compactNavigation.addEventListener('change', () => closeMenu());

const tagline = document.querySelector('.tagline');
const taglinePause = document.querySelector('.tagline-pause');
tagline.classList.add('is-animated');
taglinePause.addEventListener('click', () => {
    const paused = tagline.classList.toggle('is-paused');
    taglinePause.setAttribute('aria-pressed', String(paused));
    taglinePause.setAttribute('aria-label', `${paused ? 'Resume' : 'Pause'} tagline animation`);
    taglinePause.firstElementChild.textContent = paused ? '▶' : 'Ⅱ';
});

// Only canonical Spotify track URLs can create an embedded player.
function spotifyTrackId(value) {
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.hostname !== 'open.spotify.com') return null;
        return url.pathname.match(/^\/(?:intl-[a-z]+\/)?track\/([a-zA-Z0-9]{22})\/?$/)?.[1] || null;
    } catch {
        return null;
    }
}

const players = [];
creditCards.forEach(card => {
    const artist = card.querySelector('h3').textContent;
    const track = window.portfolioTracks?.[card.dataset.artist] || {};
    const spotifyId = spotifyTrackId(track.spotifyUrl);
    const face = card.querySelector('.credit-face');
    const panel = document.createElement('div');
    panel.className = 'track-player';
    panel.id = `track-${card.dataset.artist}`;
    panel.hidden = true;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', `Featured track by ${artist}`);

    // One entry point per card. The same control closes the active player.
    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'track-play';
    play.innerHTML = '<span aria-hidden="true">▶</span>';
    play.disabled = !track.audioSrc && !spotifyId;
    const defaultLabel = track.audioSrc ? `Play snippet by ${artist}` : spotifyId ? `Open player for ${artist}` : `Preview unavailable for ${artist}`;
    play.setAttribute('aria-controls', panel.id);
    face.append(play);
    card.append(panel);
    card.classList.add('is-interactive');

    function addText(tag, text) {
        const element = document.createElement(tag);
        element.textContent = text;
        panel.append(element);
        return element;
    }
    // Spotify already includes the title and artist. Local snippets need their own metadata.
    if (track.audioSrc) addText('h4', track.title || 'Featured track');
    if (track.release) addText('p', track.release);
    if (track.description) addText('p', track.description);
    const status = addText('p', '');
    status.className = 'track-status';
    status.setAttribute('role', 'status');
    let audio = null;
    let iframe = null;
    const state = { close };
    players.push(state);

    function updateControl() {
        const label = panel.hidden ? defaultLabel : `Close player for ${artist}`;
        play.firstElementChild.textContent = panel.hidden ? '▶' : '×';
        play.setAttribute('aria-expanded', String(!panel.hidden));
        play.setAttribute('aria-label', label);
        play.title = label;
    }
    function close() {
        audio?.pause();
        iframe?.remove();
        iframe = null;
        panel.hidden = true;
        card.classList.remove('is-open');
        updateControl();
    }
    function open() {
        players.forEach(other => { if (other !== state) other.close(); });
        panel.hidden = false;
        card.classList.add('is-open');
        updateControl();
    }
    updateControl();
    card.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !panel.hidden) {
            close();
            play.focus();
        }
    });

    // Prefer the local snippet when both sources are configured; never show two players.
    if (track.audioSrc) {
        audio = document.createElement('audio');
        audio.controls = true;
        audio.preload = 'none';
        audio.src = track.audioSrc;
        audio.setAttribute('aria-label', `Audio snippet by ${artist}`);
        panel.append(audio);
        audio.addEventListener('play', () => {
            open();
            status.textContent = '';
        });
        audio.addEventListener('error', () => {
            status.textContent = 'The audio preview could not be loaded. Please try again later.';
        });
    }
    play.addEventListener('click', async () => {
        if (!panel.hidden) {
            close();
            play.focus({ preventScroll: true });
            return;
        }
        open();
        if (audio) {
            try {
                await audio.play();
            } catch (error) {
                if (error.name === 'AbortError') return;
                status.textContent = 'The preview could not start. Try the audio controls below.';
            }
        } else if (spotifyId) {
            iframe = document.createElement('iframe');
            iframe.title = `${track.title || artist} — Spotify player`;
            iframe.src = `https://open.spotify.com/embed/track/${spotifyId}`;
            iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
            iframe.height = '152';
            panel.append(iframe);
        }
        if (!panel.hidden) card.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    });
});
