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
