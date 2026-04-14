/* =============================================
   0. PIXEL BORDER EFFECT (random blocks, dense at edges)
   ============================================= */

const CREAM = [240, 235, 224];
const GREEN = [101, 122, 81];
const PIXEL_SIZE = 16;  // each block = 16×16 screen pixels
const BORDER_ROWS = 12; // how many pixel-rows tall the border is

function drawPixelBorder(canvas, accentColor, edge) {
    const section = canvas.parentElement;
    const cols = Math.ceil(section.offsetWidth / PIXEL_SIZE);
    canvas.width = cols;
    canvas.height = BORDER_ROWS;
    canvas.style.height = (BORDER_ROWS * PIXEL_SIZE) + 'px';

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, cols, BORDER_ROWS);

    for (let r = 0; r < BORDER_ROWS; r++) {
        // distFromEdge: 0 at the edge, 1 at the inner boundary
        const distFromEdge = edge === 'top'
            ? r / BORDER_ROWS
            : (BORDER_ROWS - 1 - r) / BORDER_ROWS;

        // Probability is high near the edge, drops off toward center
        const prob = Math.pow(1 - distFromEdge, 2.2);

        for (let c = 0; c < cols; c++) {
            if (Math.random() < prob) {
                ctx.fillStyle = `rgb(${accentColor[0]},${accentColor[1]},${accentColor[2]})`;
                ctx.fillRect(c, r, 1, 1);
            }
        }
    }
}

function addPixelBorders(section) {
    // Determine accent color from section background
    const bg = getComputedStyle(section).backgroundColor;
    // cream bg → green pixels; green bg → cream pixels
    const accentColor = bg.includes('101') ? CREAM : GREEN;

    ['top', 'bottom'].forEach(edge => {
        const canvas = document.createElement('canvas');
        canvas.className = 'pixel-border-canvas';
        canvas.style.cssText = `
            position:absolute; ${edge}:0; left:0; width:100%;
            pointer-events:none; z-index:0;
            image-rendering:pixelated; image-rendering:crisp-edges;
        `;
        section.appendChild(canvas);
        drawPixelBorder(canvas, accentColor, edge);
        window.addEventListener('resize', () => drawPixelBorder(canvas, accentColor, edge));
    });
}

// Also add pixel borders to the intro hero (green pixels at bottom)
function addHeroPixelBorder() {
    const hero = document.querySelector('.intro-hero');
    if (!hero) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'pixel-border-canvas';
    canvas.style.cssText = `
        position:absolute; bottom:0; left:0; width:100%;
        pointer-events:none; z-index:0;
        image-rendering:pixelated; image-rendering:crisp-edges;
    `;
    hero.appendChild(canvas);
    drawPixelBorder(canvas, GREEN, 'bottom');
    window.addEventListener('resize', () => drawPixelBorder(canvas, GREEN, 'bottom'));
}

document.addEventListener('DOMContentLoaded', () => {
    // Hero pixel border intentionally omitted — title page is clean
    document.querySelectorAll('.rubric-section').forEach(addPixelBorders);
});

/* =============================================
   1. INTERACTIVE ICONS LOGIC (Click to Reveal)
   ============================================= */

function toggleReveal(targetId) {
    const targetContent = document.getElementById(targetId);
    if (targetContent) {
        targetContent.classList.toggle('hidden');
    }
}

/* =============================================
   DS GAME CONTROLS (Start / Stop)
   ============================================= */

const DS_GAME_SRC = 'KNES381_Scratch_Maze_Demo.html';

function dsStartGame() {
    const iframe = document.getElementById('game-iframe') || document.querySelector('.ds-top-screen iframe');
    if (!iframe) return;
    iframe.src = DS_GAME_SRC;
}

function dsStopGame() {
    const iframe = document.getElementById('game-iframe') || document.querySelector('.ds-top-screen iframe');
    if (!iframe) return;
    iframe.src = 'about:blank';
    try { iframe.contentWindow.location.replace('about:blank'); } catch(e) {}
}

/* =============================================
   2. JS-DRIVEN SLIDE NAVIGATION
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
    const splash      = document.getElementById('splash');
    const track       = document.getElementById('slide-track');
    // Only two real slides: hero (1) and desktop (2)
    const slides      = Array.from(track ? track.querySelectorAll('.intro-hero, .desktop-slide') : []);
    const allSections = [null, ...slides]; // index 0 = splash, 1+ = track slides
    let current = 0;
    let animating = false;
    const DURATION = 750;

    // Start button bypasses the desktop lock via the force flag
    window.goToHero = function() { goTo(1, true); };

    function goTo(index, force = false) {
        if (animating) return;
        if (index < 0 || index > allSections.length - 1) return;
        if (index === current) return;
        // Desktop is a one-way destination — all backward navigation is blocked
        // unless explicitly forced (Start button only)
        if (!force && current === allSections.length - 1 && index < current) return;
        animating = true;

        if (index === 0) {
            if (splash) splash.classList.remove('slide-out');
            if (track) track.style.transform = '';
        } else {
            if (current === 0 && splash) splash.classList.add('slide-out');
            const slideIndex = index - 1;
            if (track) track.style.transform = `translateY(-${slideIndex * 100}vh)`;

            const targetSlide = allSections[index];
            if (targetSlide) showSection(targetSlide);

            // CRT boot animation when landing on the Windows desktop
            if (targetSlide && targetSlide.id === 'win-desktop') {
                runCrtBoot();
            }
        }

        current = index;
        setTimeout(() => { animating = false; }, DURATION);
    }

    // Barrel distortion: generate a displacement map via canvas, inject as SVG filter
    function injectBarrelFilter() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(size, size);
        const cx = size / 2, cy = size / 2;
        const strength = 0.12; // tweak: higher = more bulge

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const nx = (x - cx) / cx;
                const ny = (y - cy) / cy;
                const r2 = nx * nx + ny * ny;
                // Barrel distortion: pixels pushed outward from center
                const scale = strength * r2;
                const dx = nx * scale * cx + 128;
                const dy = ny * scale * cy + 128;
                const i = (y * size + x) * 4;
                imageData.data[i]     = Math.max(0, Math.min(255, dx));
                imageData.data[i + 1] = Math.max(0, Math.min(255, dy));
                imageData.data[i + 2] = 0;
                imageData.data[i + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        const dataUrl = canvas.toDataURL();

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
        svg.innerHTML = `<defs>
            <filter id="barrel" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
                <feImage href="${dataUrl}" result="map" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none"/>
                <feDisplacementMap in="SourceGraphic" in2="map" scale="30" xChannelSelector="R" yChannelSelector="G"/>
            </filter>
        </defs>`;
        document.body.appendChild(svg);

        const clip = document.getElementById('screen-clip');
        if (clip) clip.style.filter = 'url(#barrel)';
    }

    // Barrel distortion intentionally not applied to screen-clip —
    // CSS filters on a parent shift the browser's hit-test coordinates,
    // causing buttons to become unclickable after windows are dragged.
    // The CRT look is achieved via border-radius + .crt-effect overlay instead.

    // CRT boot sequence: scanline → BIOS text → desktop reveal
    function runCrtBoot() {
        const overlay  = document.getElementById('crt-boot-overlay');
        const wallpaper = document.getElementById('win95-wallpaper');
        const bar      = document.getElementById('bios-progress-bar');
        if (!overlay) return;

        // Close any open app windows before boot plays
        document.querySelectorAll('.app-frame').forEach(w => { w.style.display = 'none'; });

        // Reset state
        overlay.classList.remove('phase-1', 'phase-2', 'fade-out');
        if (wallpaper) wallpaper.classList.remove('visible');
        if (bar) bar.style.animation = 'none', void bar.offsetWidth, bar.style.animation = '';

        // Phase 1: scan-line flash (0ms)
        void overlay.offsetWidth;
        overlay.classList.add('phase-1');

        // Phase 2: BIOS text (400ms after phase 1)
        setTimeout(() => {
            overlay.classList.add('phase-2');
        }, 400);

        // Reveal desktop (BIOS done ~3.3s in, progress fills to 100% at ~3.1s)
        setTimeout(() => {
            overlay.classList.add('fade-out');
            if (wallpaper) wallpaper.classList.add('visible');
            // Auto-open About Me and Song Player after wallpaper fades in
            setTimeout(() => {
                openWindow('app-about');
                openWindow('app-music');
            }, 500);
        }, 3400);
    }

    // ── APP WINDOW MANAGEMENT ──────────────────────────────
    let zTop = 20;

    window.openWindow = function(id) {
        const win = document.getElementById(id);
        if (!win) return;
        win.style.display = 'block';
        win.style.zIndex  = ++zTop;
    };

    window.closeWindow = function(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    };

    window.minimizeWindow = function(id) {
        const win = document.getElementById(id);
        if (!win) return;
        win.classList.toggle('minimized');
    };

    window.maximizeWindow = function(id) {
        const win = document.getElementById(id);
        if (!win) return;
        if (win.classList.contains('maximized')) {
            win.classList.remove('maximized');
            // Restore saved position
            if (win._savedStyle) { win.style.cssText = win._savedStyle; }
        } else {
            win._savedStyle = win.style.cssText;
            win.classList.add('maximized');
            win.style.top  = '0';
            win.style.left = '0';
            win.style.width = '100%';
            win.style.maxWidth = '100%';
        }
        win.style.zIndex = ++zTop;
    };

    // Make all .app-frame elements draggable by their title bar
    document.querySelectorAll('.app-frame').forEach(frame => {
        const bar = frame.querySelector('.app-titlebar');
        if (!bar) return;
        let dragging = false, mx = 0, my = 0, ox = 0, oy = 0;

        bar.addEventListener('mousedown', e => {
            if (e.target.closest('.win95-controls')) return; // don't drag on buttons
            dragging = true;
            mx = e.clientX; my = e.clientY;
            const r  = frame.getBoundingClientRect();
            const pr = frame.parentElement.getBoundingClientRect();
            ox = r.left - pr.left;
            oy = r.top  - pr.top;
            frame.style.zIndex = ++zTop;
            e.preventDefault();
        });

        // Bring to front on any click
        frame.addEventListener('mousedown', () => { frame.style.zIndex = ++zTop; });

        window.addEventListener('mousemove', e => {
            if (!dragging) return;
            const parent = frame.parentElement;
            const clipW  = parent.offsetWidth;
            const clipH  = parent.offsetHeight;
            const frameW = frame.offsetWidth;
            const frameH = frame.offsetHeight;

            const newLeft = Math.max(0, Math.min(ox + e.clientX - mx, clipW - frameW));
            const newTop  = Math.max(0, Math.min(oy + e.clientY - my, clipH - frameH));

            frame.style.left = newLeft + 'px';
            frame.style.top  = newTop  + 'px';
        });

        window.addEventListener('mouseup', () => { dragging = false; });
    });

    function showSection(section) {
        section.classList.remove('hidden-section');
        section.classList.add('visible-section');
        const icon = section.querySelector('.scroll-icon');
        if (icon) icon.classList.add('show-icon');
        const sprite = section.querySelector('.kc-sprite-wrapper');
        if (sprite) sprite.classList.add('kc-visible');
    }

    // Taskbar clock
    function updateClock() {
        const el = document.getElementById('taskbar-clock');
        if (!el) return;
        const now = new Date();
        const h = now.getHours().toString().padStart(2, '0');
        const m = now.getMinutes().toString().padStart(2, '0');
        el.textContent = `${h}:${m}`;
    }
    updateClock();
    setInterval(updateClock, 30000);

    // Wheel scroll
    let wheelAccum = 0;
    const WHEEL_THRESHOLD = 60;
    window.addEventListener('wheel', (e) => {
        // If the user is scrolling inside a window body, let it scroll naturally
        const windowBody = e.target.closest('.win95-body');
        if (windowBody) {
            const atTop    = windowBody.scrollTop === 0;
            const atBottom = windowBody.scrollTop + windowBody.clientHeight >= windowBody.scrollHeight - 1;
            // Only hand off to slide nav if already at the scroll limit
            if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) return;
        }
        e.preventDefault();
        wheelAccum += e.deltaY;
        if (Math.abs(wheelAccum) >= WHEEL_THRESHOLD) {
            goTo(current + (wheelAccum > 0 ? 1 : -1));
            wheelAccum = 0;
        }
    }, { passive: false });

    // Keyboard
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goTo(current + 1); }
        if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); goTo(current - 1); }
    });

    // Touch
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchend', (e) => {
        const dy = touchStartY - e.changedTouches[0].clientY;
        if (Math.abs(dy) > 40) goTo(current + (dy > 0 ? 1 : -1));
    }, { passive: true });

    // Wire up CSV file input
    const csvInput = document.getElementById('csv-input');
    if (csvInput) {
        csvInput.addEventListener('change', handleFileSelected);
    }
});


/* =============================================
   3. PYODIDE — VO2 ANALYSIS TOOL
   ============================================= */

let pyodide = null;
let csvText = null;

// The Python analysis code — adapted from your Kaggle notebook to run in-browser.
// Uses io.StringIO instead of a file path, and returns a base64 PNG instead of saving.
const PYTHON_CODE = `
# --- Imports ---
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')   # Use non-interactive backend (required for browser/Pyodide)
import matplotlib.pyplot as plt
import io, base64

# --- Load data ---
# csv_data is passed in from JavaScript as a string.
# header=0 means the first row is the column header (TIME, VO2, FECO2, etc.)
# skiprows=[1,2,3] skips the sub-header, units, and separator rows below the header
df = pd.read_csv(io.StringIO(csv_data), header=0, skiprows=[1, 2, 3])

# --- Extract variables ---
x1 = df['TIME']   # Time in minutes (x-axis for Plot 1)
x2 = df['VO2']    # Oxygen consumption in L/min (x-axis for Plots 2 & 3)
y1 = df['VO2']    # VO2 over time (L/min)
y2 = df['FECO2']  # Fraction of expired CO2 (%) — reflects gas exchange efficiency
y3 = df['VCO2']   # CO2 production (L/min) — used to calculate respiratory exchange ratio

# --- Create figure with 3 stacked subplots ---
fig, ax = plt.subplots(3, 1, sharex=False, figsize=(8, 10))
fig.subplots_adjust(hspace=0.2)

# Plot 1: VO2 over time — shows how oxygen consumption changes during the exercise protocol
ax[0].plot(x1, y1, 'o', label=r'$\\dot{V}O_2$', c='r')
ax[0].spines[['top', 'right']].set_visible(False)
ax[0].set(ylabel='L/min', xlabel='Time (min)')

# Plot 2: FECO2 vs VO2 — as VO2 increases, expired CO2 fraction rises with metabolic demand
ax[1].plot(x2, y2, 'o', label=r'$FECO_2$', c='b')
ax[1].spines[['top', 'right', 'bottom']].set_visible(False)
ax[1].tick_params(bottom=False, labelbottom=False)
ax[1].set(ylabel='%')

# Plot 3: VCO2 vs VO2 — the slope of this relationship approximates the respiratory exchange ratio (RER)
ax[2].plot(x2, y3, 'o', label=r'$\\dot{V}CO_2$', c='g')
ax[2].spines[['top', 'right']].set_visible(False)
ax[2].set(ylabel='L/min', xlabel=r'$\\dot{V}O_2$ L/min')

# Add legend to each plot
for a in ax:
    a.legend()

# --- Export figure as base64 PNG ---
# Pyodide cannot save files to disk, so the chart is encoded as a base64 string
# and returned to JavaScript, which renders it as an <img> element.
buf = io.BytesIO()
fig.savefig(buf, format='png', dpi=150, bbox_inches='tight')
buf.seek(0)
result = base64.b64encode(buf.read()).decode('utf-8')
plt.close(fig)
result   # returned to JavaScript
`;

function setPyStatus(msg) {
    const el = document.getElementById('py-status');
    if (el) el.textContent = '>> ' + msg;
}

// Dynamically load Pyodide only when needed (it's ~10MB, no point loading on page start)
async function loadPyodideScript() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function initPyodide() {
    if (!window.loadPyodide) {
        setPyStatus('Downloading Python runtime (~10MB, one-time)...');
        await loadPyodideScript();
    }
    setPyStatus('Starting Python environment...');
    pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/'
    });
    setPyStatus('Loading packages: numpy, pandas, matplotlib...');
    await pyodide.loadPackage(['numpy', 'pandas', 'matplotlib']);
}

async function handleFileSelected(e) {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('upload-label').textContent = file.name;
    setPyStatus(`Reading ${file.name}...`);

    // Read the file and init Pyodide in parallel
    const [text] = await Promise.all([
        new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target.result);
            reader.readAsText(file);
        }),
        pyodide ? Promise.resolve() : initPyodide()
    ]);

    csvText = text;
    document.getElementById('run-btn').disabled = false;
    setPyStatus(`Ready — ${file.name} loaded. Click "Run Analysis".`);
}

async function runAnalysis() {
    if (!csvText) {
        setPyStatus('Error: No CSV file loaded.');
        return;
    }

    const runBtn = document.getElementById('run-btn');
    runBtn.disabled = true;
    setPyStatus('Running analysis...');

    try {
        if (!pyodide) {
            await initPyodide();
        }

        pyodide.globals.set('csv_data', csvText);
        const imgBase64 = await pyodide.runPythonAsync(PYTHON_CODE);

        // Show the chart in the dataviz section
        document.getElementById('plot-placeholder').style.display = 'none';
        const plotImg = document.getElementById('plot-output');
        plotImg.src = 'data:image/png;base64,' + imgBase64;
        plotImg.style.display = 'block';

        setPyStatus('Done! Charts generated.');

    } catch (err) {
        setPyStatus('Error: ' + err.message);
        console.error(err);
    }

    runBtn.disabled = false;
}

/* =============================================
   4. ABOUT ME — fetch and render About_Me.md
   ============================================= */

(function loadAboutMe() {
    // Extracts the content under a ## Heading from the markdown string
    function extractSection(md, heading) {
        const lines = md.split('\n');
        let inSection = false;
        const sectionLines = [];
        for (const line of lines) {
            if (line.match(new RegExp(`^##\\s+${heading}`, 'i'))) {
                inSection = true;
                continue;
            }
            if (inSection && line.match(/^##\s/)) break; // next section reached
            if (inSection) sectionLines.push(line);
        }
        return sectionLines.length
            ? window.marked.parse(sectionLines.join('\n').trim())
            : '<p>—</p>';
    }

    // Extracts everything before the first ## heading (the intro paragraph)
    function extractIntro(md) {
        const lines = md.split('\n');
        const introLines = [];
        for (const line of lines) {
            if (line.match(/^##\s/)) break;
            if (!line.match(/^#\s/)) introLines.push(line); // skip the h1 title
        }
        return window.marked.parse(introLines.join('\n').trim());
    }

    fetch('About_Me.md', { cache: 'no-store' })
        .then(r => {
            if (!r.ok) throw new Error('Could not load About_Me.md');
            return r.text();
        })
        .then(md => {
            const set = (id, html) => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = html;
            };
            set('about-intro',       extractIntro(md));
            set('about-edu-content', extractSection(md, 'Education'));
            set('about-int-content', extractSection(md, 'Interests'));
            set('about-spare-content', extractSection(md, 'Spare Time'));
        })
        .catch(() => {
            const el = document.getElementById('about-intro');
            if (el) el.innerHTML = '<p>Could not load About_Me.md</p>';
        });
})();

/* =============================================
   5. LIGHTBOX (project photo viewer)
   ============================================= */

window.openLightbox = function(src) {
    const lb  = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    if (!lb || !img) return;
    img.src = src;
    lb.classList.add('open');
};

window.closeLightbox = function() {
    const lb = document.getElementById('lightbox');
    if (lb) lb.classList.remove('open');
};

// Also close on Escape key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
});

/* =============================================
   6. SPRITE ANIMATION (kc_stand ↔ kc_happy)
   ============================================= */

(function initSpriteAnimation() {
    const sprites = ['sprites/kc_stand.png', 'sprites/kc_happy.png'];
    const messages = ['Nice to meet you!', 'Welcome to my portfolio!', "I'm KC!", 'Check out my work!'];
    let spriteIdx = 0;
    let msgIdx = 0;

    setInterval(() => {
        spriteIdx = (spriteIdx + 1) % sprites.length;
        const img = document.getElementById('kc-win-sprite');
        if (img) img.src = sprites[spriteIdx];

        // Rotate speech bubble text every other swap
        if (spriteIdx === 0) {
            msgIdx = (msgIdx + 1) % messages.length;
            const bubble = document.getElementById('kc-speech-bubble');
            if (bubble) bubble.textContent = messages[msgIdx];
        }
    }, 2500);
})();

/* =============================================
   5. MUSIC PLAYER
   ============================================= */

(function initMusicPlayer() {
    // ── Song config — fill these in when you have the file ──
    // To use a local file: set audioSrc to the filename, e.g. 'my_song.mp3'
    // To use a URL: paste the direct link
    const SONG = {
        src:    '',           // audio source — leave blank until ready
        artist: '—',
        title:  '—',
        art:    ''            // album art image path or URL
    };

    const audio    = document.getElementById('music-audio');
    const playBtn  = document.getElementById('music-play-btn');
    const volFill  = document.getElementById('music-vol-fill');
    const progress = document.getElementById('music-progress-thumb');
    const bar      = document.getElementById('music-progress-bar');
    const curTime  = document.getElementById('music-current-time');
    const totTime  = document.getElementById('music-total-time');
    const artistEl = document.getElementById('music-artist');
    const titleEl  = document.getElementById('music-title');
    const artImg   = document.getElementById('music-album-art');

    if (!audio) return;

    // Apply song config
    if (SONG.src)    audio.src = SONG.src;
    if (SONG.artist) artistEl.textContent = SONG.artist;
    if (SONG.title)  titleEl.textContent  = SONG.title;
    if (SONG.art && artImg) artImg.src = SONG.art;

    let volume = 0.7;
    audio.volume = volume;
    updateVolBar();

    function updateVolBar() {
        if (volFill) volFill.style.width = (volume * 100) + '%';
    }

    function formatTime(s) {
        if (!isFinite(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60).toString().padStart(2, '0');
        return `${m}:${sec}`;
    }

    // Playback toggle
    window.musicTogglePlay = function() {
        if (!audio.src || audio.src === window.location.href) {
            // No song loaded yet — flash the title text
            if (titleEl) { titleEl.textContent = 'No file loaded'; setTimeout(() => { titleEl.textContent = SONG.title || '—'; }, 1500); }
            return;
        }
        if (audio.paused) {
            audio.play();
            if (playBtn) playBtn.innerHTML = '&#9646;&#9646;'; // pause icon
        } else {
            audio.pause();
            if (playBtn) playBtn.innerHTML = '&#9654;'; // play icon
        }
    };

    // Seek relative (seconds)
    window.musicSeek = function(sec) {
        audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + sec));
    };

    // Seek by clicking the progress bar
    window.musicSeekClick = function(e) {
        if (!bar || !audio.duration) return;
        const rect = bar.getBoundingClientRect();
        const frac = (e.clientX - rect.left) / rect.width;
        audio.currentTime = frac * audio.duration;
    };

    // Volume
    window.musicVolUp = function() {
        volume = Math.min(1, volume + 0.1);
        audio.volume = volume;
        updateVolBar();
    };
    window.musicVolDown = function() {
        volume = Math.max(0, volume - 0.1);
        audio.volume = volume;
        updateVolBar();
    };

    // Update progress bar and timestamps as song plays
    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        if (progress) progress.style.left = pct + '%';
        if (curTime)  curTime.textContent  = formatTime(audio.currentTime);
    });

    audio.addEventListener('loadedmetadata', () => {
        if (totTime) totTime.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('ended', () => {
        if (playBtn) playBtn.innerHTML = '&#9654;';
        if (progress) progress.style.left = '0%';
        if (curTime)  curTime.textContent  = '0:00';
        // Auto-repeat if repeat is active
        const repeatBtn = document.getElementById('music-repeat-btn');
        if (repeatBtn && repeatBtn.classList.contains('active')) {
            audio.currentTime = 0;
            audio.play();
        }
    });
})();
