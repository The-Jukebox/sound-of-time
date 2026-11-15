# SOUND OF TIMES
### *A little piece of Earth, far away from home.*

**Genre:** 2D Pixel-Art Narrative Exploration & Sonification Game  
**Estimated Playtime:** 6–8 minutes  
**Visual Direction:** Nostalgic, cinematic pixel art; purple cosmic landscapes, warm sunset lighting, glowing habitat windows, soft atmospheric animations  
**Core Theme:** Friendship, memory, discovery and the sounds of home  
**Technology:** 100% self-contained HTML5 Canvas 2D + Web Audio API Procedural Synthesis & NASA Data Sonification Pipeline (Zero external dependencies or server setup required)

---

## 🎮 HOW TO PLAY

1. Double-click or open [`index.html`](file:///c:/Users/Lenovo/Desktop/Sound%20of%20time/index.html) in any modern browser (**Google Chrome**, **Microsoft Edge**, **Mozilla Firefox**, **Safari**).
2. Click anywhere on the screen or press any key to initialize audio.
3. Enjoy the story and interactive Earth archive!

### Controls Reference

| Action | Controls |
|---|---|
| **Move / Walk** | <kbd>A</kbd> / <kbd>D</kbd> or <kbd>←</kbd> / <kbd>→</kbd> |
| **Inspect Object / Dig Up** | <kbd>E</kbd> / <kbd>Enter</kbd> |
| **Carry Jukebox** | Walk with <kbd>A</kbd>/<kbd>D</kbd> while holding |
| **Put Down / Drop Jukebox** | <kbd>Q</kbd> |
| **Pick Up Jukebox** | <kbd>E</kbd> |
| **Advance Dialogue** | <kbd>E</kbd>, <kbd>Enter</kbd>, <kbd>Space</kbd>, or Left-Click |
| **Select Choice** | <kbd>W</kbd>/<kbd>S</kbd> or <kbd>↑</kbd>/<kbd>↓</kbd> + <kbd>Enter</kbd> / <kbd>E</kbd> (or click option) |
| **Power On/Off Jukebox** | <kbd>P</kbd> or click **⚡ POWER** |
| **Play / Pause Record** | <kbd>Space</kbd> or click **▶ PLAY** / **⏸ PAUSE** |
| **Stop Record** | <kbd>S</kbd> or click **⏹ STOP** |
| **Replay Record** | <kbd>R</kbd> or click **🔄 REPLAY** |
| **Eject Record** | <kbd>E</kbd> or click **⏏ EJECT** |
| **Cycle Records** | <kbd>←</kbd> / <kbd>→</kbd> or keys <kbd>1</kbd>–<kbd>4</kbd> |
| **Restart Game (End Screen)**| <kbd>R</kbd> |

---

## 🌌 STORY & SCENE FLOW

### Scene 1 — A Home Far From Home
- **Setting:** Planet Erid. Wide pixel-art vista of purple mountains, glowing gas giant with rings, twin moons, and Eli's biodome habitat with an artificial beach inside.
- **Narrative:** Astronaut Eli finishes his morning routine. His alien friend Koru calls him: *"Eli! Your students are waiting."*
- **Action:** Player controls Eli walking out of the habitat toward the outdoor classroom.

### Scene 2 — The Little Rock Students
- **Setting:** Outdoor classroom with stone seating and a floating holographic projector.
- **Characters:** Little Rock 1 (curious with big glowing eyes), Little Rock 2 (stacking pebbles), Little Rock 3 (peacefully napping with floating *z Z z* particles).
- **Narrative:** Eli teaches a lesson about Earth. When the students ask *"What is a forest?"* and *"What is rain?"*, the holographic projector dynamically animates swaying green trees and falling blue water droplets.
- **The Question:** Little Rock 1 asks: *"And what does it sound like?"* Eli pauses... *"It sounds... beautiful."*

### Scene 3 — Something Between The Rocks
- **Setting:** Rocky twilight trail with glowing alien flora.
- **Discovery:** A golden light flickers between two rocks. Eli and Koru discover a strange, partially buried metallic machine.
- **Interaction & Choice 1:**
  - Eli kneels to inspect it: an antique retro jukebox with an Earth emblem.
  - **Choice A: Pick it up** — Eli lifts it; player carries it home or sets it down with <kbd>Q</kbd>.
  - **Choice B: Leave it here** — The machine emits a faint *click... crackle...* sound; Koru urges investigation, allowing the player to return and retrieve it.

### Scene 4 — The Jukebox
- **Setting:** Eli's cozy habitat interior overlooking the artificial beach and purple night sky.
- **Design:** Handcrafted pixel-art retro jukebox with rounded wooden frame, brass borders, curved viewing glass, glowing cyan and violet neon tubes, visible spinning vinyl record, and `EARTH ARCHIVE` digital display.
- **Choice 2:** Player can turn it on, inspect the records, move it closer, or leave it off.
- **Power On:** Neon tubes illuminate sequentially, relay switch thumps, display reads `EARTH ARCHIVE — 001`.

### Scene 5 — The Sound Collection
The jukebox contains 4 records with full interactive playback (Play, Pause, Stop, Replay, Eject) and live NASA data sonification:

1. **Record 001 — Forest (`FOREST / EARTH ARCHIVE`)**
   - *Sounds:* Birds chirping, leaves rustling, gentle wind.
   - *Hologram:* Floating green spore particles, miniature swaying pixel trees, flying bird silhouette.
   - *Dialogue:* Eli remembers the trees; Koru discovers birds.
2. **Record 002 — Ocean (`OCEAN / EARTH ARCHIVE`)**
   - *Sounds:* Ocean surf waves, water flowing, water spray.
   - *Hologram:* Lapping blue waves reacting in real-time to the audio energy, splash particles.
   - *Dialogue:* Eli describes oceans where you can travel for months; Koru asks if they can visit one day.
3. **Record 003 — Atmosphere (`ATMOSPHERE / EARTH ARCHIVE`)**
   - *Sounds:* Wind gusts, rain falling against the habitat window, distant rolling thunder.
   - *Hologram & FX:* Swirling purple storm cloud, raindrops sliding down the glass pane, lightning flashes.
   - *Dialogue:* Koru wonders how anyone could forget something so beautiful.
4. **Record 004 — Earth (`EARTH / COMPLETE ARCHIVE`)**
   - *Unlock Condition:* Unlocks once Forest, Ocean, and Atmosphere have been experienced.
   - *Sounds:* Master composition blending birds, waves, wind, combined NASA data, and the emotional quiet piano theme.
   - *Hologram & FX:* Spinning pixel-art Earth globe with orbiting golden stardust rings; room lighting shifts to warm Earth sunlight.
   - *Dialogue:* *"I remember now." "Remember what?" "Home."*

### Scene 6 — The Decision
- Eli gazes out of the panoramic bay window. Koru suggests traveling to Earth together.
- **Choice 3:**
  - **A. Take it with us:** Eli lifts the jukebox into the spacecraft (*"We can't leave our memories behind"*).
  - **B. Leave it at home:** Eli powers it down (*"We'll make new memories when we get there"*).

### Scene 7 — The Journey & Departure
- The exploration craft fires its thrusters on the launchpad.
- Cinematic flight sequence over purple mountain ridges; Planet Erid shrinks into the cosmos as a vibrant blue Earth appears in the starfield.
- Final composition plays with end title card:
  > *"Every sound tells a story. Every memory leads us home."*  
  > **THE JOURNEY CONTINUES...**

---

## 🔬 REAL NASA SCIENCE DATA & SONIFICATION ARCHITECTURE

All audio in **Sound of Times** is synthesized procedurally in real-time using the **Web Audio API** driven by documented NASA scientific datasets:

| Dataset | Satellite / Mission | Scientific Phenomenon | Sonification Pipeline |
|---|---|---|---|
| **MODIS NDVI** | NASA Terra & Aqua Satellites | 12-month global Normalized Difference Vegetation Index (0.312 – 0.445) | Normalized canopy greenness maps to fundamental pitches of a pentatonic C Major scale (261.6Hz – 587.3Hz) with resonant lowpass filter Q modulation reflecting photosynthetic vigor. |
| **TOPEX / Poseidon & Jason-3 SSHA & SST** | NASA/CNES Ocean Altimetry Missions | 30-year Sea Surface Height Anomalies (-18.2mm to +71.3mm) and Sea Surface Temperature (18.15°C – 18.89°C) | Sea level elevation drives sub-bass wave surge resonance (65Hz – 110Hz) while sea surface temperature modulates aquatic bell chime overtones (220Hz – 659.2Hz). |
| **MERRA-2 Aerosol Optical Depth & AIRS CO2** | NASA MERRA-2 Atmospheric Reanalysis & Aqua AIRS | Global Aerosol Optical Depth at 550nm (0.118 – 0.198) and Tropospheric CO2 Keeling Curve (410 – 421 ppm) | Atmospheric aerosol density dynamically modulates bandpass noise sweeps (wind gusts), while greenhouse gas concentrations shift the harmonic tension of an ethereal open-fifth ambient pad. |
| **Unified Earth Observation** | Integrated NASA Biosphere, Hydrosphere & Atmosphere | Multi-system planetary balance | Counterpoint sonification intertwining canopy marimba, ocean bass swells, and atmospheric pads alongside a nostalgic acoustic piano progression. |

The in-game **NASA Sonification Live HUD** features a real-time oscilloscope and 32-band spectral analyzer displaying live waveform data as each record plays.

---

## 🎨 ART & PALETTE SPECIFICATIONS

Constructed with strict adherence to the cinematic cosmic palette:
- **Deep Violet:** `#26134D` (Space backgrounds, shadow tones)
- **Midnight Purple:** `#140D2B` (Jukebox body, UI card backgrounds)
- **Electric Blue:** `#47D8F2` (Neon tubes, ocean waves, glowing alien plant caps, visor lights)
- **Warm Gold:** `#FFCA72` (Jukebox brass borders, astronaut visor, Earth archive highlights)
- **Soft Pink:** `#F28BBD` (Distant gas giant, atmospheric haze)
- **Earth Green:** `#62C98A` (Canopy foliage, Earth patch, forest hologram)

---

## 📁 PROJECT STRUCTURE

```text
Sound of time/
├── index.html          # Main HTML5 entry point with canvas, dialogue UI, jukebox deck, and HUD
├── css/
│   └── style.css       # Pixel-art UI styles, typography, scanlines, and CRT effects
├── js/
│   ├── audio.js        # Web Audio API engine, procedural synthesizers & real NASA sonification pipelines
│   ├── pixelart.js     # Pixel-art rendering engine, character sprites, environments & dynamic holograms
│   └── game.js         # Scene manager, input handler, narrative dialogue system & interactive jukebox state
└── README.md           # Game design, controls guide, and scientific documentation
```
