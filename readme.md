# KNES 381 Final Project — Kiersten Cerisse Galapati

A retro Windows 95-themed interactive portfolio built with HTML, CSS, and JavaScript, hosted on GitHub Pages.

---

## What this project is

A public-facing portfolio for KNES 381 at the University of Calgary (Exercise and Health Physiology, 2022–2026).

The site is designed as a simulated CRT monitor running Windows 95. All portfolio content is presented as draggable, interactive desktop application windows — double-click any icon on the desktop to open it.

---

## How to navigate

1. The site opens with a cinematic splash screen, then transitions to an intro hero page
2. Scroll down to reach the Windows 95 desktop (the boot animation plays automatically)
3. Double-click any desktop icon to open an app window:

| Icon | Window | Contents |
|---|---|---|
| About Me | `C:\My_Documents\About_Me.txt` | Bio, education, interests |
| Song Player | `Song` | Embedded music player |
| My Projects | `C:\My_Documents\Projects\` | Camp photos, Instagram reel |
| VO2 Analyzer | `C:\Programs\VO2_Analyzer.exe` | Python-powered metabolic analysis tool |
| Maze Game | `Scratch_Maze_Game.exe` | Scratch-based logic game |

4. Press the **Start** button on the taskbar to return to the hero page

---

## Tools used

- **HTML / CSS / JavaScript** — site structure, retro Win95 UI, animations
- **Pyodide** — runs a real Python script client-side in the browser (WebAssembly)
- **NumPy, Pandas, Matplotlib** — data processing and programmatic chart generation
- **Scratch** — maze game logic and interactivity
- **Git / GitHub Pages** — version control and static site deployment

---

## VO2 Analyzer

The VO2 Analyzer window runs a Python script directly in the browser using Pyodide (no server required). Upload a CSV exported from a metabolic cart and click **Run Analysis** to generate three programmatic plots:

1. **VO2 over time** — oxygen consumption (L/min) across the exercise protocol
2. **FECO2 vs VO2** — fraction of expired CO2 as a function of oxygen uptake
3. **VCO2 vs VO2** — CO2 production vs O2 consumption (slope ≈ respiratory exchange ratio)

### CSV format

The file must contain these column headers in row 1:

| TIME | VO2 | FECO2 | VCO2 |
|---|---|---|---|
| min | L/min | % | L/min |

Rows 2–4 may contain sub-headers, units, or separator lines — these are automatically skipped by the script.

A sample file is included in this repo: [`sample_vo2_data.csv`](sample_vo2_data.csv)

---

## Repository structure

```
images/
  projects/       — camp and event photos
  Sacred_Heart.jpg
  hero-pc.png
sprites/          — KC character sprite sheets
fonts/
index.html        — main site
styles.css
script.js
sample_vo2_data.csv
KNES381_Scratch_Maze_Demo.html
readme.md
AI_Assistance_Log.md
```

---

## AI Assistance

This project was developed with AI assistance. All prompts, decisions, and creative direction were made by Kiersten Cerisse Galapati. A full log of AI contributions is documented in [`AI_Assistance_Log.md`](AI_Assistance_Log.md).
