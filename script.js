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

    function goTo(index) {
        if (animating) return;
        if (index < 0 || index > allSections.length - 1) return;
        if (index === current) return;
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

    // Position the screen-clip to the monitor's screen area.
    // SL/ST/SR/SB = fractions of viewport size for each edge.
    // The monitor-frame-img uses object-fit:fill so it exactly maps to the viewport.
    const SL = 0.11, ST = 0.08, SR = 0.11, SB = 0.21;

    function positionDesktopScreen() {
        const clip  = document.getElementById('screen-clip');
        const slide = document.getElementById('win-desktop');
        if (!clip || !slide) return;
        const w = slide.offsetWidth;
        const h = slide.offsetHeight;
        clip.style.left   = (w * SL) + 'px';
        clip.style.top    = (h * ST) + 'px';
        clip.style.right  = (w * SR) + 'px';
        clip.style.bottom = (h * SB) + 'px';
    }

    // Run on load, after images settle, and on resize
    window.addEventListener('resize', positionDesktopScreen);
    if (document.querySelector('.monitor-frame-img')) {
        document.querySelector('.monitor-frame-img').addEventListener('load', positionDesktopScreen);
    }
    setTimeout(positionDesktopScreen, 200);

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
            frame.style.left = (ox + e.clientX - mx) + 'px';
            frame.style.top  = (oy + e.clientY - my) + 'px';
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
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io, base64

df = pd.read_csv(io.StringIO(csv_data), header=0, skiprows=[1, 2, 3])

x1 = df['TIME']
x2 = df['VO2']
y1 = df['VO2']
y2 = df['FECO2']
y3 = df['VCO2']

fig, ax = plt.subplots(3, 1, sharex=False, figsize=(8, 10))
fig.subplots_adjust(hspace=0.2)

ax[0].plot(x1, y1, 'o', label=r'$\\dot{V}O_2$', c='r')
ax[0].spines[['top', 'right']].set_visible(False)
ax[0].set(ylabel='L/min', xlabel='Time (min)')

ax[1].plot(x2, y2, 'o', label=r'$FECO_2$', c='b')
ax[1].spines[['top', 'right', 'bottom']].set_visible(False)
ax[1].tick_params(bottom=False, labelbottom=False)
ax[1].set(ylabel='%')

ax[2].plot(x2, y3, 'o', label=r'$\\dot{V}CO_2$', c='g')
ax[2].spines[['top', 'right']].set_visible(False)
ax[2].set(ylabel='L/min', xlabel=r'$\\dot{V}O_2$ L/min')

for a in ax:
    a.legend()

buf = io.BytesIO()
fig.savefig(buf, format='png', dpi=150, bbox_inches='tight')
buf.seek(0)
result = base64.b64encode(buf.read()).decode('utf-8')
plt.close(fig)
result
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
