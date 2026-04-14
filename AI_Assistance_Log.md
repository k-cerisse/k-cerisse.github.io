# AI Assistance Log – Final Project

This document tracks the major milestones and technical assistance provided by the AI assistant throughout the development of the GitHub Pages Portfolio.

## 2026-04-01
* **Project Architecture Review**: Analyzed the project rubric and established core requirements.
* **Design & Layout**: Assisted with developing a retro 90s visual aesthetic, including establishing the layout structure, sourcing authentic asset styles, and iteratively modifying the UI based on continuous design feedback.
* **Frontend Development**: Supported the creation of the foundational `index.html`, `styles.css`, and `script.js` files to enable a dynamic, interactive web experience.

## 2026-04-14
* **Navigation Overhaul**: Replaced CSS scroll-snap with a fully JS-driven slide navigation system supporting mouse wheel, keyboard arrow keys, and touch swipe input.
* **Splash Screen**: Added a dark cinematic opening screen ("KNES 381 / Final Project") as the entry point before the hero section.
* **Windows 95 Desktop**: Built a full Windows 95-themed desktop as the final section of the site, including a boot animation (scanline flash → BIOS text → progress bar → wallpaper reveal), a desktop icon grid, and a taskbar with a live clock.
* **App Windows**: Converted all portfolio content (About Me, VO2 Analyzer, Maze Game) into draggable, closeable Win95-style app windows that open by double-clicking desktop icons.
* **CRT Monitor Effect**: Replaced a monitor frame PNG with a pure CSS/JS CRT filter — scanlines, vignette, convex glass highlight, phosphor flicker animation, rounded CRT corners, and a JS-generated SVG barrel distortion map for the screen-bulge effect.
* **Music Player Window**: Built a Win95-styled song player window with functional HTML5 audio controls — play/pause, seek, volume +/-, shuffle/repeat/heart toggles, Artist/Title fields, and a live progress bar with timestamps.
* **Sprite Animation**: Added an animated KC sprite to the About Me window that alternates between `kc_stand` and `kc_happy` every 2.5 seconds, with a rotating speech bubble. Fixed sprite cropping by using a fixed-size container with `object-fit: contain`.
* **Functional Window Controls**: Wired up minimize (`_`), maximize (`□`), and close (`X`) buttons on all four app windows.
* **Auto-open at Boot**: About Me and Song Player windows open automatically 0.5s after the boot sequence completes each time the desktop loads.
* **Wallpaper**: Applied `Sacred_Heart.jpg` as the desktop wallpaper background.
* **Cache Busting**: Added `?v=` versioning to CSS and JS links to force GitHub Pages to serve updated files after each deployment.
* **Repo Cleanup**: Reorganised repository structure — moved all images into `images/`, sprites were already in `sprites/`, removed unused `SKILL.md.Rmd`, and added `sample_vo2_data.csv` for the VO2 Analyzer tool.
* **Rubric Analysis**: Reviewed the project rubric against the current site and identified gaps in README documentation, Python code comments, and in-window explanations of the VO2 analysis tool.
