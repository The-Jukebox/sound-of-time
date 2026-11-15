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
The jukebox contains 4 records with full interactive playback (Play, Pause, Stop, Replay, Eject) and live NASA Earth-observation data sonification:

1. **Record 002 — Ocean (`RECORD 002: THE OCEAN`)**
   - *Dataset:* NASA ECCO (Estimating the Circulation and Climate of the Ocean) Daily Mean 0.5° (Version 4 Release 4).
   - *DOI:* `10.5067/ECG5D-OTS44` | *SVS Reference:* NASA SVS 3912 (Global Sea Surface Currents & Temperature).
   - *Sonification:* Tone.js polyphonic ocean synthesis driven by real potential temperature (`THETA`), practical salinity (`SALT`), and surface currents (`UVEL`/`VVEL`).
   - *Visuals:* NASA SVS 3912 surface current flow streamlines, temperature-reactive water color gradient, audio-reactive surging wave crests, and buoyant salinity particles.
   - *Dialogue:* Ryland explains how cold waters sing low and warm Gulf Stream waters sing high.
   - *Transparency:* Interactive scientific transparency panel documenting mathematical mappings and reanalysis attribution.

2. **Record 003 — Forest (`RECORD 003: THE FOREST`)**
   - *Primary Dataset:* NASA GEDI (Global Ecosystem Dynamics Investigation) Gridded Vegetation Structure Metrics & Biomass Density (L4B & L3 Gridded Metrics).
   - *Permanent DOI:* `10.5067/GEDI/GEDI04_B.002` | *Complementary:* NASA Terra/Aqua MODIS 16-Day NDVI (`MOD13A2`).
   - *Instrument:* High-resolution 1064nm laser altimeter aboard the International Space Station (ISS).
   - *Variables:* Canopy Height (`rh100`, m), Canopy Cover (fraction), Foliage Height Diversity (`FHD`), Plant Area Index (`PAI`), Aboveground Biomass Density (`AGBD`, Mg/ha).
   - *Sonification Engine:* Tone.js polyphonic multi-octave Earth Lydian scale where canopy height drives pitch ($rh100 \to \text{F2–C6}$), canopy closure drives harmonic filter cutoffs (600Hz–2800Hz) and chorus, foliage diversity drives multi-voice arpeggiator counterpoint, and biomass density drives resonant sub-bass foundation.
   - *Natural Soundscape Manager:* Layered procedural acoustic environmental generator for rustling leaves, canopy wind gusts, branch creaks, morning dawn bird chorus, individual avian chirps, woodpecker territorial drumming, afternoon cicadas, nocturnal crickets and frogs, flowing forest streams, and rainfall on leaves.
   - *Day & Night Modes:* Interactive soundscape & lighting modes:
     - 🌅 **DAWN (Morning):** Fresh golden dawn sky, vibrant avian dawn chorus, light dew, gentle breeze.
     - ☀️ **DAY (Afternoon):** Solar azure sky, cicadas stridulating, warm rustling canopy, bright god rays.
     - 🌇 **DUSK (Evening):** Violet/amber twilight sky, twilight thrushes and owls, crickets beginning.
     - 🌙 **NIGHT:** Deep starlit cosmic sky, moonlit branches, choir of crickets and tree frogs, nocturnal calls, glowing fireflies!
   - *Visuals:* Full transformation of the panoramic habitat window into a living ancient forest with layered parallax depth, audio-reactive swaying branches, flowing crystal brook, sunbeams (crepuscular rays), fluttering birds, drifting leaf flakes, and fireflies.
   - *Controls:* Dedicated toolbar with Day/Night mode selector (<kbd>M</kbd>), layer mute buttons (🎵 Music, 🍃 Canopy, 🐦 Birds, 💧 Stream), ambience slider, and scientific transparency panel (`HOW DOES THE FOREST BECOME MUSIC?`).

3. **Record 001 — Atmosphere (`RECORD 001: THE ATMOSPHERE`)**
   - *Dataset:* NASA MERRA-2 Aerosol Optical Depth & AIRS CO2
   - *Sounds:* Rain falling on glass, thunder rumbling, atmospheric wind sweeps.
   - *Visuals:* Rainfall on the panoramic window, lightning flashes, misty atmosphere.

4. **Record 004 — Earth (`RECORD 004: COMPLETE EARTH ARCHIVE`)**
   - *Unlocked:* Automatically unlocked after experiencing the archive records!
   - *Sounds:* Full Earth symphony uniting biosphere, hydrosphere, and atmosphere with nostalgic piano memories.
   - *Visuals:* Rotating high-detail pixel-art Earth hologram and warm golden ambient room lighting.
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

## 🏛️ NASA EARTH INFORMATION CENTER (EIC) — CHALLENGE ALIGNMENT

> *"NASA’s Earth Information Center (EIC) produces stunning visualizations of our changing planet, but presenting Earth science through visualization alone limits who can reach it. We invite you to make this complex Earth science accessible, engaging, and multi-sensory by translating sight into sound. Your challenge is to build an 'Earth Jukebox'—an interface, script, or application that pairs EIC visual frames with dynamic sonifications generated in real time."*

**Sound of Times** directly addresses this challenge by creating an **Earth Jukebox** that bridges the visual exhibits of NASA's Earth Information Center with real-time procedural sonification:

1. **Translating Sight into Sound (Real-Time Sonification Engine):**
   - **Ocean Circulation Visual Frames (SVS 3912 & ECCO V4r4):** Sea surface temperature color ramps and vector streamlines become pitch contours, FM timbre modulations, and stereo panning surges.
   - **Biosphere 3D Canopy Visual Frames (GEDI L4B/L3):** High-resolution orbital lidar profiles of global forests become notes across an Earth Lydian scale, with canopy density governing harmonic filter cutoffs.
   - **Atmospheric Weather Visual Frames (MERRA-2 & GPM IMERG SVS 4252):** Precipitation hyperwall animations directly drive physical rain droplet synthesis, barometric drone pitches, and convective thunder rolls.

2. **The "Earth Jukebox" Multi-Sensory Interface:**
   - **Physical Tactile Controls:** 4 curated vinyl records (Atmosphere 001, Ocean 002, Forest 003, Earth Complete Archive 004), transport buttons (Power, Play, Pause, Stop, Replay, Eject), master volume, and stem mute controls.
   - **Visual Frame Synchronization:** The habitat panoramic bay window transforms with audio-reactive parallax visuals (surging wave crests, swaying trees, rain streaking down glass, lightning flashes, day/night cycles).
   - **Full HD Slow-Mo Memory Cinema:** Curated photographic visual frames with interactive slow-motion rates (0.2×, 0.35×, 1.0×) paired with real-time acoustic soundscapes.

3. **AI Computer Vision "NASA Visual Scanner" Engine:**
   - **Direct Pixel Sonification:** Uses computer-vision pixel sampling (ITU-R BT.709 perceived luminance, edge gradient Sobel kernels, and RGB spectral warmth) to translate visual frames into multi-octave musical notes, filter cutoffs, and rhythmic percussion in real time.
   - **Interactive SVS Presets & Drag-and-Drop Upload:** Features preloaded high-contrast visual models from NASA SVS (*Night Lights SVS 5313*, *Perpetual Ocean SVS 3912*, *GEOS Aerosols SVS 5669*, *ISS Lightning SVS 5011*) plus custom drag-and-drop file uploading for any NASA satellite photo or imagery.
   - **Live Scanner Laser Beam & AI Telemetry HUD:** Displays real-time scanhead position, luminance %, edge complexity, musical note readout, and live oscilloscope waveform analysis.

4. **Inclusivity & Accessibility:**
   - **Dual Sensory Redundancy:** Translates visual data into acoustic music and soundscapes for blind and low-vision audiences, while providing real-time waveform oscilloscopes, numeric telemetry HUDs, and on-screen captions for deaf and hard-of-hearing audiences.
   - **Full Keyboard & Click Accessibility:** Playable via keyboard shortcuts or mouse clicks.

---

## 🔬 REAL NASA SCIENCE DATA & SONIFICATION ARCHITECTURE

All audio in **Sound of Times** is synthesized procedurally in real-time using **Tone.js** and the **Web Audio API** driven by documented NASA scientific datasets:

| Record | Dataset | Source Archive & Instrument | Variables & Physical Range | Sonification & Soundscape Pipeline |
|---|---|---|---|---|
| **002: Ocean** | **NASA ECCO V4r4** | NASA JPL / PO.DAAC (DOI: `10.5067/ECG5D-OTS44`) | Potential Temp (`THETA`, 4°C–28°C), Salinity (`SALT`, 33–37 PSU), Current Velocity (`UVEL`/`VVEL`) | Potential temperature maps to pitch across an oceanic Dorian scale; $\Delta T$ controls melodic variation; salinity modulates FM overtone brightness; current vectors control stereo panning and wave surge. |
| **003: Forest** | **NASA GEDI (L4B & L3)** | NASA Goddard / LP DAAC (DOI: `10.5067/GEDI/GEDI04_B.002`) & MODIS NDVI | Canopy Height (`rh100`, 8m–68m), Canopy Cover (0.0–1.0), PAI ($m^2/m^2$), FHD (1.2–3.8), Biomass (`AGBD`, Mg/ha) | Canopy height maps to multi-octave Earth Lydian pitch; canopy closure opens filter cutoffs (600Hz–2800Hz) and chorus; FHD diversity drives multi-voice arpeggio counterpoint; biomass density triggers deep sub-bass foundation; procedural soundscape models rustling leaves, wind gusts, avian dawn chorus, woodpeckers, cicadas, crickets, frogs, and streams across 4 Day/Night modes. |
| **001: Atmosphere** | **MERRA-2 & AIRS** | NASA MERRA-2 & Aqua AIRS | Aerosol Optical Depth (0.118–0.198) and CO2 Keeling Curve (410–421 ppm) | Atmospheric aerosol density modulates bandpass noise sweeps (wind gusts), while greenhouse gas concentrations shift the harmonic tension of an ethereal open-fifth ambient pad. |
| **004: Complete Earth** | **Integrated NASA Biosphere & Hydrosphere** | NASA Earth Observatory Multidisciplinary Composite | Planetary coupled ecological balance | Counterpoint sonification intertwining canopy marimba, ocean bass swells, and atmospheric pads alongside a nostalgic acoustic piano progression. |

The in-game **NASA Sonification Live HUD** features a real-time oscilloscope displaying live Tone.js audio waveform analysis as each record plays.

---

## 🧪 AUTOMATED QA TEST SUITES

The project includes 4 comprehensive automated test suites running unit, mathematical mapping, and end-to-end integration tests:

1. **[`test-forest-sonification.html`](file:///c:/Users/Lenovo/Desktop/Sound%20of%20time/test-forest-sonification.html)** (45 Tests):
   - Validates NASA GEDI L4B/L3 dataset schema, variables (`rh100`, `canopyCover`, `pai`, `fhd`, `biomass`), and units.
   - Tests deterministic mathematical sonification mappings (Height $\to$ Pitch, Cover $\to$ Filter/Chorus, FHD $\to$ Arpeggio, Biomass $\to$ Sub-Bass).
   - Validates `ForestSoundscapeManager` modes (Dawn, Day, Dusk, Night), layer mutes, and volume scaling.
   - Tests missing data / water body mask handling.
2. **[`test-forest-game-e2e.html`](file:///c:/Users/Lenovo/Desktop/Sound%20of%20time/test-forest-game-e2e.html)** (50 Tests):
   - Full end-to-end game integration test of Record 003 insertion in Scene 5.
   - Validates Ryland's narrative dialogue triggers and NASA GEDI mentions.
   - Tests all interactive transport controls (Play, Pause, Resume, Stop, Replay, Eject, Volume).
   - Tests Soundscape mode switching buttons and layer mute toggles.
   - Tests record switching isolation between Ocean Record 002 and Forest Record 003 (zero audio overlap or bleed).
3. **[`test-ocean-sonification.html`](file:///c:/Users/Lenovo/Desktop/Sound%20of%20time/test-ocean-sonification.html)** (43 Tests):
   - NASA ECCO Ocean unit and mathematical sonification test suite.
4. **[`test-game-e2e.html`](file:///c:/Users/Lenovo/Desktop/Sound%20of%20time/test-game-e2e.html)** (31 Tests):
   - Ocean Record 002 end-to-end integration test runner.

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
├── index.html                    # Main HTML5 entry point with responsive canvas, jukebox dashboard, and NASA HUD
├── forest-data.json              # Verified NASA GEDI L4B/L3 canopy structure & biomass measurements
├── ocean-data.json               # Verified NASA ECCO V4r4 ocean temperature & salinity measurements
├── audio-manifest.json           # Natural forest sound library & acoustic attribution manifest
├── test-forest-sonification.html # Forest sonification & soundscape unit test suite (45/45 passing)
├── test-forest-game-e2e.html     # Forest Record 003 end-to-end integration test suite (50/50 passing)
├── test-ocean-sonification.html  # Ocean sonification unit test suite (43/43 passing)
├── test-game-e2e.html            # Ocean Record 002 end-to-end integration test suite (31/31 passing)
├── css/
│   └── style.css                 # Pixel-art UI styles, jukebox layout, mode toolbars & CRT scanlines
└── js/
    ├── forest-data-source.js     # Embedded NASA GEDI data provider for offline & file:/// resilience
    ├── ocean-data-source.js      # Embedded NASA ECCO data provider for offline & file:/// resilience
    ├── tone.js                   # Tone.js v14.8.49 audio framework
    ├── forest-sonification.js    # ForestSonificationEngine & ForestSoundscapeManager (Tone.js)
    ├── ocean-sonification.js     # OceanSonificationEngine (Tone.js)
    ├── audio.js                  # Base Web Audio API synthesizer engine & scene ambiences
    ├── pixelart.js               # Pixel art renderer: audio-reactive forest, god rays, fluttering birds, & holograms
    └── game.js                   # Scene manager, dialogue controller, HUD streaming & jukebox integration
```
