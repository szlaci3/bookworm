# How a dental technician makes a bridge

- **dental-bridge.mp4** — 30 seconds, 1280 × 720, 30 fps, stereo synthesized effects, no voiceover.
- **effects.wav** — 48 kHz stereo sound-effects master.
- **dental-bridge.html** — standalone player, with embedded fonts and scripts. Open locally; press Play. Loop defaults on.
- `scene.js`, `audio.js`, `player.js` — editable source embedded in the HTML.
- `render.mjs` — deterministic Chromium/Playwright + ffmpeg export. Run from the repository with `node explainers/dental-bridge/render.mjs`. Requires Chromium at `/usr/bin/chromium` and ffmpeg.
- `preview-*.png` — sampled review frames.

The example is a conventional three-unit, tooth-supported zirconia bridge: two retainer crowns connect to one pontic. It distinguishes the dentist's preparation, records and cementation from the technician's design, fabrication and checks. Zirconia is milled enlarged before sintering to compensate for shrinkage. The film condenses a process that takes far longer than 30 seconds. Tooth drawings are schematic cutaway elevations; internal prepared teeth are deliberately visible through the retainers.

Browser API: await `window.ready`, then call `window.seek(seconds)`. `window.DURATION`, `window.explainer`, `window.scoreSound`, and `SOUND.renderOffline` are exposed. All visual noise and audio noise are seeded.

Implementation note: the supplied H and SOUND libraries were adapted into smaller embedded versions, rather than preserved verbatim. The graphite finishing retains paper texture, pressure contours, construction guides, hatching, lifted highlights, tooth breakup, smudge offset, crumbs, lamp, grain and vignette. The scene and page-turn implementation is a new adaptation of the reference.

Validation: repeated seeks to 10 seconds produced identical canvas bytes after seeking elsewhere; embedded fonts loaded; loop starts enabled; play/pause, seek, and sound toggle completed without page errors. Browser render timings averaged 79–98 ms per frame in review. The MP4 is exported at 30 fps independent of live playback speed.
