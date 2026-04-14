/* =============================================
   0. PIXEL DITHER GRADIENT (cream → Nokia green)
   ============================================= */

function renderDitherGradient() {
    const canvas = document.getElementById('pixel-gradient-canvas');
    if (!canvas) return;

    // Bayer 8×8 ordered dithering matrix (values 0–63)
    const BAYER = [
        [ 0, 32,  8, 40,  2, 34, 10, 42],
        [48, 16, 56, 24, 50, 18, 58, 26],
        [12, 44,  4, 36, 14, 46,  6, 38],
        [60, 28, 52, 20, 62, 30, 54, 22],
        [ 3, 35, 11, 43,  1, 33,  9, 41],
        [51, 19, 59, 27, 49, 17, 57, 25],
        [15, 47,  7, 39, 13, 45,  5, 37],
        [63, 31, 55, 23, 61, 29, 53, 21]
    ];

    const PIXEL = 6;          // screen pixels per "pixel unit"
    const ROWS  = 36;         // pixel-unit rows tall
    const colorA = [240, 235, 224];   // cream  #f0ebe0
    const colorB = [ 58, 125,  38];   // Nokia green #3a7d26

    function draw() {
        const cols = Math.ceil(window.innerWidth / PIXEL);
        canvas.width  = cols;
        canvas.height = ROWS;
        canvas.style.height = (ROWS * PIXEL) + 'px';

        const ctx = canvas.getContext('2d');
        for (let r = 0; r < ROWS; r++) {
            // t: 0 = full cream, 1 = full Nokia green
            const t = r / (ROWS - 1);
            for (let c = 0; c < cols; c++) {
                const threshold = BAYER[r % 8][c % 8] / 64;
                const col = t > threshold ? colorB : colorA;
                ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
                ctx.fillRect(c, r, 1, 1);
            }
        }
    }

    draw();
    window.addEventListener('resize', draw);
}

document.addEventListener('DOMContentLoaded', renderDitherGradient);

/* =============================================
   1. INTRO PARALLAX
   ============================================= */

const introComputer = document.getElementById('intro-computer');
const introTitle    = document.getElementById('intro-title');

window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (introComputer) introComputer.style.transform = `translateY(${y * 0.55}px)`;
    if (introTitle)    introTitle.style.transform    = `translateY(${y * 0.3}px)`;
}, { passive: true });

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
    const iframe = document.querySelector('.ds-top-screen iframe');
    if (!iframe) return;
    // If already running, do nothing
    if (iframe.src && !iframe.src.endsWith('about:blank') && iframe.src !== '') return;
    iframe.src = DS_GAME_SRC;
}

function dsStopGame() {
    const iframe = document.querySelector('.ds-top-screen iframe');
    if (!iframe) return;
    iframe.src = 'about:blank';
}


/* =============================================
   2. SCROLLING ANIMATIONS (IntersectionObserver)
   ============================================= */

const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            showSection(entry.target);
        }
    });
}, observerOptions);

function showSection(section) {
    section.classList.remove('hidden-section');
    section.classList.add('visible-section');
    const icon = section.querySelector('.scroll-icon');
    if (icon) icon.classList.add('show-icon');
    const sprite = section.querySelector('.kc-sprite-wrapper');
    if (sprite) sprite.classList.add('kc-visible');
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.rubric-section').forEach(section => {
        sectionObserver.observe(section);
        // Immediately show sections already in the viewport (don't wait for scroll)
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            showSection(section);
        }
    });

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
