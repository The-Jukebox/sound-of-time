/**
 * SOUND OF TIMES — NASA EARTH INFORMATION CENTER (EIC)
 * AI Visual Scanner & Real-Time Computer Vision Sonification Engine
 * 
 * Translating Sight into Sound:
 * Uses pixel-level Computer Vision to extract visual features from NASA Earth
 * observations and maps them directly to real-time procedural audio synthesis.
 * 
 * Audio Isolation & Fidelity:
 * - When opened, automatically mutes/pauses ALL background game sound
 *   (ambience, wind, piano, records) so the scanner is heard with 100% clarity.
 * - Routes directly to audioCtx.destination with independent volume control,
 *   so home page mute never breaks the scanner audio.
 * - Restores background game sound seamlessly upon closing.
 * - High-gain audible synthesizer (0.15 - 0.75 gain range).
 */

(function(window) {
    'use strict';

    class AIVisionScanner {
        constructor() {
            this.isOpen = false;
            this.isScanning = false;
            this.scanX = 0;
            this.scanSpeed = 1.6; // pixels per frame
            this.activePreset = 'nightlights';
            this.selectedScale = 'pentatonic';
            this.volume = 0.65;
            this.isMuted = false;
            this.customImageLoaded = false;
            this.customImgObj = null;

            // Audio Nodes
            this.audioCtx = null;
            this.masterGain = null;
            this.synthOsc = null;
            this.subOsc = null;
            this.filterNode = null;
            this.pannerNode = null;
            this.analyser = null;
            this.dataArray = null;

            // Background game audio state preservation
            this.savedGameAmbience = null;
            this.savedGameGainVal = 0.85;
            this.savedActiveRecord = null;

            // Display Canvas
            this.canvas = null;
            this.ctx = null;
            this.hudCanvas = null;
            this.hudCtx = null;
            this.rafId = null;

            // Pristine Offscreen Canvas (Holds clean NASA imagery, NEVER overwritten by laser)
            this.offscreenCanvas = document.createElement('canvas');
            this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });

            // Musical Scales (Frequency in Hz)
            this.scales = {
                lydian: [130.81, 146.83, 164.81, 185.00, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 369.99, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 739.99, 783.99, 880.00],
                dorian: [110.00, 123.47, 130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 783.99],
                major: [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99, 880.00],
                pentatonic: [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00]
            };

            this.presets = {
                nightlights: {
                    title: "NASA SVS 5313 — Global Change in Night Lights (2012–2023)",
                    mission: "NASA Earth Information Center / Suomi NPP VIIRS Day-Night Band",
                    description: "Tracks global human civilization & urban density. Deep contrast between dark oceans and brilliant metropolitan hubs drives melodic leaps and rhythmic city pulses.",
                    recommendedScale: 'pentatonic',
                    draw: (ctx, w, h) => this.drawNightLights(ctx, w, h)
                },
                ocean: {
                    title: "NASA SVS 3912 & SVS 5425 — Sea Surface Currents & Perpetual Ocean",
                    mission: "NASA ECCO V4r4 State Estimate & JPL Physical Oceanography DAAC",
                    description: "High-contrast thermal boundary currents and swirling eddy gyres. Flowing oceanic vector streams mapped into harmonic ambient surges and deep Dorian swells.",
                    recommendedScale: 'dorian',
                    draw: (ctx, w, h) => this.drawOceanGyres(ctx, w, h)
                },
                aerosols: {
                    title: "NASA SVS 5669 — GEOS Atmospheric Aerosols & Particulate Plumes",
                    mission: "NASA Goddard Earth Observing System (GEOS) Forward Processing",
                    description: "Multi-layered plumes of Saharan desert dust (amber), wildfire smoke (crimson), and sea salt (cyan) modulate filter resonance, warmth, and atmospheric wind sweeps.",
                    recommendedScale: 'lydian',
                    draw: (ctx, w, h) => this.drawAerosolPlumes(ctx, w, h)
                },
                lightning: {
                    title: "NASA SVS 5011 — Lightning Events Detected from ISS (2017–2023)",
                    mission: "ISS Lightning Imaging Sensor (LIS) & NASA Marshall Space Flight Center",
                    description: "High-energy electrical discharges across global thunderstorm tracks. Intense flash radiance triggers punctuated percussive strikes and brilliant high chords.",
                    recommendedScale: 'major',
                    draw: (ctx, w, h) => this.drawLightningStorm(ctx, w, h)
                }
            };

            // Metrics tracking
            this.metrics = {
                luminosity: 0,
                edgeDensity: 0,
                colorWarmth: 0,
                currentFreq: 261.63,
                noteName: 'C4',
                peakX: 0
            };

            this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

            window.addEventListener('DOMContentLoaded', () => this.bindUI());
        }

        bindUI() {
            this.modal = document.getElementById('aiScannerModal');
            this.canvas = document.getElementById('aiScanCanvas');
            this.hudCanvas = document.getElementById('aiOscilloscope');
            if (this.canvas) this.ctx = this.canvas.getContext('2d');
            if (this.hudCanvas) this.hudCtx = this.hudCanvas.getContext('2d');

            // Top dock and jukebox buttons
            const btnDock = document.getElementById('btnDockAiScanner');
            if (btnDock) {
                btnDock.onclick = (e) => {
                    e.stopPropagation();
                    this.open();
                };
            }

            const btnJukebox = document.getElementById('btnJukeboxAiScanner');
            if (btnJukebox) {
                btnJukebox.onclick = (e) => {
                    e.stopPropagation();
                    this.open();
                };
            }

            // Close button
            const btnClose = document.getElementById('btnCloseAiScanner');
            if (btnClose) btnClose.onclick = () => this.close();

            // Preset buttons
            const presetBtns = document.querySelectorAll('.ai-preset-btn');
            presetBtns.forEach(btn => {
                btn.onclick = () => {
                    presetBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.customImageLoaded = false;
                    this.customImgObj = null;
                    this.loadPreset(btn.dataset.preset);
                };
            });

            // Play / Pause Scan
            const btnPlay = document.getElementById('btnAiScanPlay');
            if (btnPlay) {
                btnPlay.onclick = () => this.toggleScan();
            }

            // Speed slider
            const sliderSpeed = document.getElementById('aiScanSpeed');
            if (sliderSpeed) {
                sliderSpeed.oninput = (e) => {
                    this.scanSpeed = parseFloat(e.target.value);
                    const lbl = document.getElementById('aiScanSpeedVal');
                    if (lbl) lbl.innerText = `${this.scanSpeed.toFixed(1)}x`;
                };
            }

            // Scale selector
            const selScale = document.getElementById('aiScaleSelect');
            if (selScale) {
                selScale.onchange = (e) => {
                    this.selectedScale = e.target.value;
                };
            }

            // Volume slider
            const sliderVol = document.getElementById('aiVolSlider');
            const volLabel = document.getElementById('aiVolLabel');
            if (sliderVol) {
                sliderVol.oninput = (e) => {
                    this.volume = parseFloat(e.target.value);
                    if (volLabel) volLabel.innerText = `${Math.round(this.volume * 100)}%`;
                    if (this.masterGain && this.audioCtx) {
                        this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
                    }
                };
            }

            // File Upload
            const fileInput = document.getElementById('aiImageUpload');
            if (fileInput) {
                fileInput.onchange = (e) => {
                    const file = e.target.files && e.target.files[0];
                    if (file) this.handleCustomImage(file);
                };
            }

            // Drag and drop onto scan canvas
            if (this.canvas) {
                this.canvas.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    this.canvas.classList.add('drag-active');
                });
                this.canvas.addEventListener('dragleave', () => {
                    this.canvas.classList.remove('drag-active');
                });
                this.canvas.addEventListener('drop', (e) => {
                    e.preventDefault();
                    this.canvas.classList.remove('drag-active');
                    const file = e.dataTransfer.files && e.dataTransfer.files[0];
                    if (file) this.handleCustomImage(file);
                });
            }

            // Keyboard shortcut ESC to close, Space to toggle scan
            window.addEventListener('keydown', (e) => {
                if (this.isOpen) {
                    if (e.key === 'Escape') {
                        this.close();
                    } else if (e.code === 'Space') {
                        e.preventDefault();
                        this.toggleScan();
                    }
                }
            });

            // Unlock audio on click if suspended
            if (this.modal) {
                this.modal.addEventListener('click', () => {
                    if (this.audioCtx && this.audioCtx.state === 'suspended') {
                        this.audioCtx.resume().catch(() => {});
                    }
                });
            }
        }

        silenceBackgroundGameAudio() {
            if (window.game && window.game.sound) {
                const s = window.game.sound;
                this.savedGameAmbience = s.currentSceneAmbience;
                this.savedActiveRecord = (window.game.jukeboxState && window.game.jukeboxState.isPlaying) ? window.game.jukeboxState.activeRecord : null;

                // Mute game master gain completely
                if (s.masterGain && s.ctx) {
                    this.savedGameGainVal = s.masterGain.gain.value;
                    s.masterGain.gain.setValueAtTime(0, s.ctx.currentTime);
                }

                // Stop active ambient nodes and timers
                if (s.stopSceneAmbience) s.stopSceneAmbience();
                if (s.stopRecord) s.stopRecord();

                // Stop sonifications
                if (window.oceanSonification && window.oceanSonification.stop) window.oceanSonification.stop();
                if (window.forestSonification && window.forestSonification.stop) window.forestSonification.stop();
                if (window.atmosphereSonification && window.atmosphereSonification.stop) window.atmosphereSonification.stop();
                if (window.earthSonification && window.earthSonification.stop) window.earthSonification.stop();
            }
        }

        restoreBackgroundGameAudio() {
            if (window.game && window.game.sound && !window.game.isAudioMuted) {
                const s = window.game.sound;
                const restoreVol = (this.savedGameGainVal !== undefined && this.savedGameGainVal > 0) ? this.savedGameGainVal : 0.85;
                if (s.masterGain && s.ctx) {
                    s.masterGain.gain.setValueAtTime(restoreVol, s.ctx.currentTime);
                }

                // Resume record or scene ambience
                if (this.savedActiveRecord && window.game.playJukebox) {
                    window.game.playJukebox();
                } else if (this.savedGameAmbience) {
                    s.startSceneAmbience(this.savedGameAmbience);
                }
            }
        }

        initAudio() {
            if (this.audioCtx) {
                if (this.audioCtx.state === 'suspended') {
                    this.audioCtx.resume().catch(() => {});
                }
                return;
            }

            // Always reuse the game's audio context if available (already unlocked by user click!)
            if (window.game && window.game.sound && window.game.sound.ctx) {
                this.audioCtx = window.game.sound.ctx;
            } else if (typeof Tone !== 'undefined' && Tone.context && Tone.context.rawContext) {
                this.audioCtx = Tone.context.rawContext;
            } else {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioCtx = new AudioContext();
            }

            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume().catch(() => {});
            }

            // Scanner Master Gain (independent volume control)
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);

            // Biquad Lowpass Filter with resonance
            this.filterNode = this.audioCtx.createBiquadFilter();
            this.filterNode.type = 'lowpass';
            this.filterNode.frequency.setValueAtTime(2200, this.audioCtx.currentTime);
            this.filterNode.Q.setValueAtTime(3.0, this.audioCtx.currentTime);

            // Stereo Panner
            this.pannerNode = this.audioCtx.createStereoPanner ? this.audioCtx.createStereoPanner() : null;

            // Analyser for real-time oscilloscope
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 256;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

            // Primary Melody Synthesizer (Triangle wave for rich analog tone)
            this.synthOsc = this.audioCtx.createOscillator();
            this.synthOsc.type = 'triangle';
            this.synthOsc.frequency.setValueAtTime(261.63, this.audioCtx.currentTime);

            this.synthGain = this.audioCtx.createGain();
            this.synthGain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);

            // Warm Harmonic Sub Oscillator (Deep fundamental)
            this.subOsc = this.audioCtx.createOscillator();
            this.subOsc.type = 'sine';
            this.subOsc.frequency.setValueAtTime(130.81, this.audioCtx.currentTime);

            this.subGain = this.audioCtx.createGain();
            this.subGain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);

            // Connect signal chain directly to audioCtx.destination
            // Bypasses game.sound.masterGain so home page mute will NEVER silence the scanner!
            this.synthOsc.connect(this.synthGain);
            this.subOsc.connect(this.subGain);

            this.synthGain.connect(this.filterNode);
            this.subGain.connect(this.filterNode);

            if (this.pannerNode) {
                this.filterNode.connect(this.pannerNode);
                this.pannerNode.connect(this.masterGain);
            } else {
                this.filterNode.connect(this.masterGain);
            }

            this.masterGain.connect(this.analyser);
            this.analyser.connect(this.audioCtx.destination);

            this.synthOsc.start();
            this.subOsc.start();
        }

        open() {
            // First: silence background game sound completely!
            this.silenceBackgroundGameAudio();

            // Next: initialize and start scanner audio
            this.initAudio();
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume().catch(() => {});
            }

            this.isOpen = true;
            if (this.modal) this.modal.style.display = 'flex';

            this.resizeCanvas();
            this.loadPreset(this.activePreset);
            this.startScan();
        }

        close() {
            this.isOpen = false;
            this.stopScan();
            if (this.modal) this.modal.style.display = 'none';

            // Silence scanner synthesizer
            if (this.synthGain && this.subGain && this.audioCtx) {
                this.synthGain.gain.setTargetAtTime(0.0001, this.audioCtx.currentTime, 0.05);
                this.subGain.gain.setTargetAtTime(0.0001, this.audioCtx.currentTime, 0.05);
            }

            // Restore background game audio
            this.restoreBackgroundGameAudio();
        }

        resizeCanvas() {
            if (!this.canvas) return;
            const rect = this.canvas.parentElement.getBoundingClientRect();
            const w = Math.min(680, Math.max(380, Math.floor(rect.width) - 20));
            const h = Math.floor(w * 0.62);
            this.canvas.width = w;
            this.canvas.height = h;

            // Sync pristine offscreen canvas to identical dimensions
            this.offscreenCanvas.width = w;
            this.offscreenCanvas.height = h;

            if (this.hudCanvas) {
                this.hudCanvas.width = 180;
                this.hudCanvas.height = 48;
            }

            // Re-render NASA visual onto pristine offscreen canvas
            if (this.customImageLoaded && this.customImgObj) {
                this.offscreenCtx.clearRect(0, 0, w, h);
                this.offscreenCtx.drawImage(this.customImgObj, 0, 0, w, h);
            } else {
                this.renderPresetToOffscreen(this.activePreset);
            }

            // Copy once to display canvas
            this.ctx.drawImage(this.offscreenCanvas, 0, 0);
        }

        renderPresetToOffscreen(presetKey) {
            const info = this.presets[presetKey];
            if (!info || !this.offscreenCtx) return;
            const w = this.offscreenCanvas.width;
            const h = this.offscreenCanvas.height;
            this.offscreenCtx.clearRect(0, 0, w, h);
            info.draw(this.offscreenCtx, w, h);
        }

        loadPreset(presetKey) {
            this.activePreset = presetKey;
            const info = this.presets[presetKey];
            if (!info) return;

            // Update metadata labels
            const titleEl = document.getElementById('aiScanTitle');
            const missionEl = document.getElementById('aiScanMission');
            const descEl = document.getElementById('aiScanDesc');
            if (titleEl) titleEl.innerText = info.title;
            if (missionEl) missionEl.innerText = info.mission;
            if (descEl) descEl.innerText = info.description;

            // Set recommended scale
            if (info.recommendedScale) {
                this.selectedScale = info.recommendedScale;
                const sel = document.getElementById('aiScaleSelect');
                if (sel) sel.value = info.recommendedScale;
            }

            // Draw clean scientific visual onto offscreen canvas
            this.renderPresetToOffscreen(presetKey);

            // Draw to visible canvas
            if (this.ctx) {
                this.ctx.drawImage(this.offscreenCanvas, 0, 0);
            }

            // Reset scan line
            this.scanX = 0;
        }

        handleCustomImage(file) {
            if (!file || !file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.customImageLoaded = true;
                    this.customImgObj = img;

                    const w = this.canvas.width;
                    const h = this.canvas.height;
                    this.offscreenCanvas.width = w;
                    this.offscreenCanvas.height = h;

                    this.offscreenCtx.clearRect(0, 0, w, h);
                    this.offscreenCtx.drawImage(img, 0, 0, w, h);

                    this.ctx.clearRect(0, 0, w, h);
                    this.ctx.drawImage(this.offscreenCanvas, 0, 0);

                    const titleEl = document.getElementById('aiScanTitle');
                    const missionEl = document.getElementById('aiScanMission');
                    const descEl = document.getElementById('aiScanDesc');
                    if (titleEl) titleEl.innerText = `CUSTOM NASA VISUAL: ${file.name.toUpperCase()}`;
                    if (missionEl) missionEl.innerText = "Direct Pixel Computer Vision Sonification";
                    if (descEl) descEl.innerText = "Real-time edge detection and spectral luminance sonification generated across uploaded image.";

                    // Unhighlight preset buttons
                    document.querySelectorAll('.ai-preset-btn').forEach(b => b.classList.remove('active'));

                    this.scanX = 0;
                    if (!this.isScanning) this.startScan();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        toggleScan() {
            if (this.isScanning) {
                this.stopScan();
            } else {
                this.startScan();
            }
        }

        startScan() {
            if (!this.audioCtx) this.initAudio();
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume().catch(() => {});
            }
            this.isScanning = true;
            const btnPlay = document.getElementById('btnAiScanPlay');
            if (btnPlay) btnPlay.innerHTML = '⏸ PAUSE SCAN';
            this.loop();
        }

        stopScan() {
            this.isScanning = false;
            const btnPlay = document.getElementById('btnAiScanPlay');
            if (btnPlay) btnPlay.innerHTML = '▶ SCAN & PLAY';
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
            // Mute synth smoothly
            if (this.synthGain && this.subGain && this.audioCtx) {
                this.synthGain.gain.setTargetAtTime(0.0001, this.audioCtx.currentTime, 0.05);
                this.subGain.gain.setTargetAtTime(0.0001, this.audioCtx.currentTime, 0.05);
            }
        }

        loop() {
            if (!this.isScanning || !this.isOpen) return;

            // 1. Advance scanline
            this.scanX += this.scanSpeed;
            if (this.scanX >= this.canvas.width) {
                this.scanX = 0;
            }

            // 2. Sample pixel column from clean offscreen canvas (100% accurate, no laser contamination!)
            this.processScanColumn();

            // 3. Render pristine visual from offscreen canvas onto visible canvas
            this.ctx.drawImage(this.offscreenCanvas, 0, 0);

            // 4. Draw glowing laser line and telemetry crosshair on top of display canvas
            this.drawScanOverlay();

            // 5. Draw live oscilloscope
            this.drawOscilloscope();

            this.rafId = requestAnimationFrame(() => this.loop());
        }

        processScanColumn() {
            if (!this.offscreenCtx || !this.canvas) return;
            const w = this.canvas.width;
            const h = this.canvas.height;
            const x = Math.min(w - 1, Math.floor(this.scanX));

            // Sample vertical column from the clean, pristine offscreen canvas
            const imgData = this.offscreenCtx.getImageData(x, 0, 1, h);
            const data = imgData.data;

            let totalLum = 0;
            let totalR = 0, totalG = 0, totalB = 0;
            let edgeSum = 0;
            let prevLum = null;

            const step = 2;
            const samples = h / step;

            for (let y = 0; y < h; y += step) {
                const idx = y * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                // Accurate perceived luminance formula (ITU-R BT.709)
                const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255.0;
                totalLum += lum;
                totalR += r;
                totalG += g;
                totalB += b;

                if (prevLum !== null) {
                    edgeSum += Math.abs(lum - prevLum);
                }
                prevLum = lum;
            }

            const avgLum = totalLum / samples;
            const avgEdge = edgeSum / samples;
            const rAvg = totalR / samples;
            const bAvg = totalB / samples;
            const warmth = (rAvg - bAvg) / 255.0;

            this.metrics.luminosity = avgLum;
            this.metrics.edgeDensity = avgEdge;
            this.metrics.colorWarmth = warmth;

            // 1. Map Luminance to Pitch across the selected scale
            const scaleNotes = this.scales[this.selectedScale] || this.scales.pentatonic;
            const noteIndex = Math.min(scaleNotes.length - 1, Math.floor(avgLum * scaleNotes.length));
            const targetFreq = scaleNotes[noteIndex];
            this.metrics.currentFreq = targetFreq;
            this.metrics.noteName = this.freqToNoteName(targetFreq);

            // 2. Modulate Web Audio Synthesizer in Real Time
            if (this.audioCtx && this.synthOsc && this.synthGain) {
                const now = this.audioCtx.currentTime;

                // Smooth frequency glide
                this.synthOsc.frequency.setTargetAtTime(targetFreq, now, 0.035);
                this.subOsc.frequency.setTargetAtTime(targetFreq * 0.5, now, 0.045);

                // Amplitude scales with luminance (Audible, rich volume range!)
                const targetAmp = Math.max(0.12, Math.min(0.65, 0.15 + avgLum * 0.55));
                this.synthGain.gain.setTargetAtTime(targetAmp, now, 0.03);
                this.subGain.gain.setTargetAtTime(targetAmp * 0.45, now, 0.04);

                // Filter cutoff opens with edge complexity (high detail = bright crisp harmonics)
                const targetCutoff = 500 + (avgLum * 2200) + (avgEdge * 4800);
                this.filterNode.frequency.setTargetAtTime(Math.min(7500, targetCutoff), now, 0.04);

                // Stereo Panning tracks horizontal visual position across frame
                if (this.pannerNode) {
                    const pan = (x / w) * 1.6 - 0.8; // -0.8 (Left) to +0.8 (Right)
                    this.pannerNode.pan.setTargetAtTime(pan, now, 0.04);
                }

                // High edge contrast generates a crisp acoustic percussive tick (e.g. city borders, lightning flashes)
                if (avgEdge > 0.08 && Math.random() < 0.32) {
                    this.playPercussiveTick(targetFreq * 2);
                }
            }

            // Update HUD text metrics
            this.updateHUDText(x, w);
        }

        playPercussiveTick(freq) {
            if (!this.audioCtx) return;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            const now = this.audioCtx.currentTime;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.2, now + 0.035);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 0.04);
        }

        freqToNoteName(freq) {
            const midi = Math.round(69 + 12 * Math.log2(freq / 440));
            const note = this.noteNames[midi % 12];
            const octave = Math.floor(midi / 12) - 1;
            return `${note}${octave}`;
        }

        drawScanOverlay() {
            if (!this.ctx || !this.canvas) return;
            const h = this.canvas.height;
            const x = this.scanX;

            this.ctx.save();

            // Glowing vertical cyan laser beam
            const grad = this.ctx.createLinearGradient(x - 8, 0, x + 8, 0);
            grad.addColorStop(0, 'rgba(71, 216, 242, 0)');
            grad.addColorStop(0.5, 'rgba(71, 216, 242, 0.85)');
            grad.addColorStop(1, 'rgba(71, 216, 242, 0)');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(x - 8, 0, 16, h);

            // Sharp core laser line
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(x - 1, 0, 2, h);

            // Leading scanning head spark
            const sparkY = (Math.sin(Date.now() * 0.005) * 0.4 + 0.5) * h;
            this.ctx.fillStyle = '#ffd15c';
            this.ctx.beginPath();
            this.ctx.arc(x, sparkY, 4, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        }

        drawOscilloscope() {
            if (!this.hudCtx || !this.hudCanvas || !this.analyser) return;
            const ctx = this.hudCtx;
            const w = this.hudCanvas.width;
            const h = this.hudCanvas.height;

            this.analyser.getByteTimeDomainData(this.dataArray);

            ctx.fillStyle = '#0a0515';
            ctx.fillRect(0, 0, w, h);

            // Neon grid line
            ctx.strokeStyle = '#1e1438';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, h / 2);
            ctx.lineTo(w, h / 2);
            ctx.stroke();

            // Oscilloscope waveform trace
            ctx.lineWidth = 2.0;
            ctx.strokeStyle = '#47d8f2';
            ctx.beginPath();

            const sliceWidth = w / this.dataArray.length;
            let x = 0;

            for (let i = 0; i < this.dataArray.length; i++) {
                const v = this.dataArray[i] / 128.0;
                const y = (v * h) / 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += sliceWidth;
            }

            ctx.lineTo(w, h / 2);
            ctx.stroke();
        }

        updateHUDText(x, w) {
            const pct = Math.round((x / w) * 100);
            const lumPct = Math.round(this.metrics.luminosity * 100);
            const edgeVal = (this.metrics.edgeDensity * 10).toFixed(1);

            const elPos = document.getElementById('aiMetricPos');
            const elLum = document.getElementById('aiMetricLum');
            const elEdge = document.getElementById('aiMetricEdge');
            const elNote = document.getElementById('aiMetricNote');
            const elBarLum = document.getElementById('aiBarLum');
            const elBarEdge = document.getElementById('aiBarEdge');

            if (elPos) elPos.innerText = `${pct}% [X: ${Math.round(x)}px]`;
            if (elLum) elLum.innerText = `${lumPct}%`;
            if (elEdge) elEdge.innerText = edgeVal;
            if (elNote) elNote.innerText = `${this.metrics.noteName} (${Math.round(this.metrics.currentFreq)} Hz)`;

            if (elBarLum) elBarLum.style.width = `${lumPct}%`;
            if (elBarEdge) elBarEdge.style.width = `${Math.min(100, Math.round(this.metrics.edgeDensity * 300))}%`;
        }

        // =========================================================================
        // PROCEDURAL NASA SCIENTIFIC VISUAL PRESETS (AUTHENTIC SVS RENDERINGS)
        // =========================================================================

        drawNightLights(ctx, w, h) {
            // NASA SVS 5313: Change in Night Lights & NASA Black Marble
            // Deep space and dark unlit ocean
            ctx.fillStyle = '#05030a';
            ctx.fillRect(0, 0, w, h);

            // Continental landmasses in dark slate
            ctx.fillStyle = '#0e091a';

            // North America
            ctx.beginPath();
            ctx.moveTo(w * 0.08, h * 0.15);
            ctx.lineTo(w * 0.38, h * 0.12);
            ctx.lineTo(w * 0.36, h * 0.45);
            ctx.lineTo(w * 0.26, h * 0.52);
            ctx.lineTo(w * 0.22, h * 0.62);
            ctx.lineTo(w * 0.12, h * 0.48);
            ctx.closePath();
            ctx.fill();

            // South America
            ctx.beginPath();
            ctx.moveTo(w * 0.25, h * 0.55);
            ctx.lineTo(w * 0.36, h * 0.60);
            ctx.lineTo(w * 0.32, h * 0.90);
            ctx.lineTo(w * 0.26, h * 0.88);
            ctx.closePath();
            ctx.fill();

            // Europe & Asia
            ctx.beginPath();
            ctx.moveTo(w * 0.46, h * 0.18);
            ctx.lineTo(w * 0.92, h * 0.15);
            ctx.lineTo(w * 0.88, h * 0.58);
            ctx.lineTo(w * 0.70, h * 0.52);
            ctx.lineTo(w * 0.58, h * 0.42);
            ctx.lineTo(w * 0.46, h * 0.35);
            ctx.closePath();
            ctx.fill();

            // Africa
            ctx.beginPath();
            ctx.moveTo(w * 0.46, h * 0.40);
            ctx.lineTo(w * 0.64, h * 0.42);
            ctx.lineTo(w * 0.58, h * 0.80);
            ctx.lineTo(w * 0.48, h * 0.72);
            ctx.closePath();
            ctx.fill();

            // Highway arterial transport ribbons
            ctx.strokeStyle = 'rgba(255, 209, 92, 0.28)';
            ctx.lineWidth = 1.2;
            const corridors = [
                [[0.14, 0.38], [0.22, 0.36], [0.32, 0.32], [0.35, 0.35]],
                [[0.48, 0.28], [0.54, 0.26], [0.60, 0.28], [0.72, 0.32], [0.82, 0.38]],
                [[0.72, 0.32], [0.76, 0.45], [0.84, 0.46]],
                [[0.50, 0.45], [0.52, 0.55], [0.54, 0.72]]
            ];
            corridors.forEach(path => {
                ctx.beginPath();
                path.forEach((pt, i) => {
                    const px = pt[0] * w;
                    const py = pt[1] * h;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                });
                ctx.stroke();
            });

            // Luminous urban metropolitan hubs (radiant gold & white incandescence)
            const cities = [
                // North America
                { x: 0.15, y: 0.38, r: 16, glow: '#ffea88' }, // Los Angeles / West
                { x: 0.24, y: 0.34, r: 18, glow: '#ffe27a' }, // Midwest / Chicago
                { x: 0.34, y: 0.32, r: 26, glow: '#ffffff' }, // East Coast / NYC / Boston
                { x: 0.32, y: 0.42, r: 18, glow: '#ffd15c' }, // Florida
                // Europe
                { x: 0.50, y: 0.26, r: 22, glow: '#ffea88' }, // London / Paris
                { x: 0.56, y: 0.28, r: 24, glow: '#ffffff' }, // Rhine Corridor / Central Europe
                { x: 0.62, y: 0.25, r: 16, glow: '#ffd15c' }, // Moscow
                // Asia
                { x: 0.70, y: 0.44, r: 24, glow: '#ffca72' }, // India / Indo-Gangetic Plain
                { x: 0.80, y: 0.34, r: 28, glow: '#ffffff' }, // Beijing / Eastern China
                { x: 0.84, y: 0.42, r: 30, glow: '#ffea88' }, // Shanghai / Yangtze Delta
                { x: 0.88, y: 0.36, r: 32, glow: '#ffffff' }, // Tokyo / Osaka Megalopolis
                // Southern Hemisphere
                { x: 0.33, y: 0.72, r: 18, glow: '#ffca72' }, // São Paulo / Rio
                { x: 0.55, y: 0.75, r: 14, glow: '#ffd15c' }, // Johannesburg
                { x: 0.86, y: 0.78, r: 18, glow: '#ffea88' }  // Sydney / Melbourne
            ];

            cities.forEach(c => {
                const cx = c.x * w;
                const cy = c.y * h;
                const rad = ctx.createRadialGradient(cx, cy, 1, cx, cy, c.r);
                rad.addColorStop(0, '#ffffff');
                rad.addColorStop(0.25, c.glow);
                rad.addColorStop(0.65, 'rgba(255, 179, 71, 0.32)');
                rad.addColorStop(1, 'rgba(255, 179, 71, 0)');
                ctx.fillStyle = rad;
                ctx.beginPath();
                ctx.arc(cx, cy, c.r, 0, Math.PI * 2);
                ctx.fill();
            });

            // Towns and regional stardust lights
            ctx.fillStyle = '#fffae0';
            for (let i = 0; i < 220; i++) {
                const sx = ((Math.sin(i * 99 + 17) * 4500 + 4500) % (w * 0.9)) + (w * 0.05);
                const sy = ((Math.cos(i * 73 + 41) * 4500 + 4500) % (h * 0.8)) + (h * 0.1);
                ctx.fillRect(sx, sy, (i % 4 === 0) ? 2 : 1, (i % 4 === 0) ? 2 : 1);
            }
        }

        drawOceanGyres(ctx, w, h) {
            // NASA SVS 3912 & SVS 5425: Sea Surface Temperature & Perpetual Ocean
            // Deep abyssal ocean background
            ctx.fillStyle = '#030814';
            ctx.fillRect(0, 0, w, h);

            // Thermal Sea Surface Temperature Gradient
            const sstGrad = ctx.createLinearGradient(0, 0, w, h);
            sstGrad.addColorStop(0, '#061a3d');   // Cold Subpolar Blue
            sstGrad.addColorStop(0.35, '#0a3c63'); // North Atlantic
            sstGrad.addColorStop(0.6, '#0f6e7d');  // Subtropical Cyan
            sstGrad.addColorStop(0.8, '#d97706');  // Warm Gulf Stream Core (Amber)
            sstGrad.addColorStop(1, '#dc2626');    // Equatorial Heat (Coral Red)
            ctx.fillStyle = sstGrad;
            ctx.fillRect(0, 0, w, h);

            // Dark continental coastlines in charcoal
            ctx.fillStyle = '#080d16';
            // Americas (Left)
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(w * 0.24, 0);
            ctx.lineTo(w * 0.28, h * 0.32);
            ctx.lineTo(w * 0.18, h * 0.55);
            ctx.lineTo(w * 0.22, h * 0.95);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fill();

            // Europe/Africa (Right)
            ctx.beginPath();
            ctx.moveTo(w, 0);
            ctx.lineTo(w * 0.82, 0);
            ctx.lineTo(w * 0.74, h * 0.38);
            ctx.lineTo(w * 0.80, h * 0.85);
            ctx.lineTo(w, h);
            ctx.closePath();
            ctx.fill();

            // Swirling ECCO current streamlines & velocity filaments
            ctx.lineWidth = 1.8;
            for (let gy = 25; gy < h; gy += 18) {
                ctx.beginPath();
                const alpha = 0.25 + (Math.sin(gy * 0.08) * 0.18 + 0.18);
                ctx.strokeStyle = `rgba(71, 216, 242, ${alpha})`;
                for (let gx = w * 0.20; gx < w * 0.80; gx += 12) {
                    const wave1 = Math.sin((gx * 0.025) + (gy * 0.035)) * 16;
                    const wave2 = Math.cos((gx * 0.045) - (gy * 0.02)) * 10;
                    const py = gy + wave1 + wave2;
                    if (gx === w * 0.20) ctx.moveTo(gx, py);
                    else ctx.lineTo(gx, py);
                }
                ctx.stroke();
            }

            // High-velocity Western Boundary Current (Gulf Stream Jet)
            ctx.lineWidth = 3.2;
            ctx.strokeStyle = '#ffd15c';
            ctx.beginPath();
            ctx.moveTo(w * 0.25, h * 0.65);
            ctx.bezierCurveTo(w * 0.32, h * 0.48, w * 0.42, h * 0.38, w * 0.68, h * 0.24);
            ctx.stroke();

            ctx.lineWidth = 2.0;
            ctx.strokeStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(w * 0.26, h * 0.64);
            ctx.bezierCurveTo(w * 0.33, h * 0.47, w * 0.43, h * 0.37, w * 0.67, h * 0.23);
            ctx.stroke();

            // Mesoscale Ocean Eddies (Circulating vortex rings)
            const eddies = [
                { x: w * 0.42, y: h * 0.48, r: 38, col: '#f43f5e' }, // Warm core ring
                { x: w * 0.54, y: h * 0.34, r: 46, col: '#47d8f2' }, // Cold core ring
                { x: w * 0.62, y: h * 0.58, r: 32, col: '#fbbf24' }  // Recirculation gyre
            ];

            eddies.forEach(ed => {
                ctx.strokeStyle = ed.col;
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.arc(ed.x, ed.y, ed.r, 0, Math.PI * 1.85);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(ed.x, ed.y, ed.r * 0.55, Math.PI * 0.4, Math.PI * 2);
                ctx.stroke();
            });
        }

        drawAerosolPlumes(ctx, w, h) {
            // NASA SVS 5669: GEOS Aerosol Optical Depth (Dust, Smoke, Sea Salt)
            ctx.fillStyle = '#060411';
            ctx.fillRect(0, 0, w, h);

            // Subtle Earth continental background
            ctx.fillStyle = '#0f0b1e';
            ctx.beginPath();
            ctx.ellipse(w * 0.25, h * 0.45, w * 0.16, h * 0.28, 0, 0, Math.PI * 2);
            ctx.ellipse(w * 0.62, h * 0.42, w * 0.22, h * 0.30, 0, 0, Math.PI * 2);
            ctx.fill();

            // 1. Marine Sea Salt Plumes (Luminous Cyan #06b6d4) over ocean tracks
            const salt = ctx.createRadialGradient(w * 0.22, h * 0.72, 10, w * 0.22, h * 0.72, 170);
            salt.addColorStop(0, 'rgba(6, 182, 212, 0.75)');
            salt.addColorStop(0.45, 'rgba(6, 182, 212, 0.28)');
            salt.addColorStop(1, 'rgba(6, 182, 212, 0)');
            ctx.fillStyle = salt;
            ctx.fillRect(0, 0, w, h);

            // 2. Saharan Mineral Dust Plumes (Desert Amber #f59e0b) sweeping west
            const dust = ctx.createRadialGradient(w * 0.52, h * 0.42, 15, w * 0.52, h * 0.42, 160);
            dust.addColorStop(0, 'rgba(245, 158, 11, 0.88)');
            dust.addColorStop(0.4, 'rgba(217, 119, 6, 0.38)');
            dust.addColorStop(1, 'rgba(217, 119, 6, 0)');
            ctx.fillStyle = dust;
            ctx.fillRect(0, 0, w, h);

            // 3. Biomass Wildfire Smoke (Fiery Crimson #ef4444) billowing north
            const smoke = ctx.createRadialGradient(w * 0.78, h * 0.46, 12, w * 0.78, h * 0.46, 145);
            smoke.addColorStop(0, 'rgba(239, 68, 68, 0.85)');
            smoke.addColorStop(0.45, 'rgba(185, 28, 28, 0.32)');
            smoke.addColorStop(1, 'rgba(185, 28, 28, 0)');
            ctx.fillStyle = smoke;
            ctx.fillRect(0, 0, w, h);

            // Atmospheric filament streamlines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
            ctx.lineWidth = 1.6;
            for (let i = 0; i < 16; i++) {
                ctx.beginPath();
                const sx = (i / 16) * w;
                ctx.moveTo(sx, 0);
                ctx.bezierCurveTo(sx + 50, h * 0.35, sx - 45, h * 0.65, sx + 65, h);
                ctx.stroke();
            }
        }

        drawLightningStorm(ctx, w, h) {
            // NASA SVS 5011: Lightning Events Detected from ISS (2017–2023)
            const sky = ctx.createLinearGradient(0, 0, 0, h);
            sky.addColorStop(0, '#050210');
            sky.addColorStop(0.5, '#120729');
            sky.addColorStop(1, '#1e0c3d');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, w, h);

            // Heavy convective anvil thunderstorm cloud decks
            ctx.fillStyle = '#180e30';
            ctx.beginPath();
            ctx.ellipse(w * 0.32, h * 0.52, w * 0.24, h * 0.28, 0, 0, Math.PI * 2);
            ctx.ellipse(w * 0.68, h * 0.48, w * 0.28, h * 0.32, 0, 0, Math.PI * 2);
            ctx.fill();

            // Flash illumination halos (Diffuse light through cloud layer)
            const flashes = [
                { x: w * 0.32, y: h * 0.38, r: 120, col: 'rgba(71, 216, 242, 0.55)' },
                { x: w * 0.68, y: h * 0.32, r: 140, col: 'rgba(255, 255, 255, 0.7)' }
            ];

            flashes.forEach(f => {
                const grad = ctx.createRadialGradient(f.x, f.y, 10, f.x, f.y, f.r);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.25, f.col);
                grad.addColorStop(1, 'rgba(71, 216, 242, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
                ctx.fill();
            });

            // Branching electric lightning bolt discharges (Crisp high-contrast lines)
            const bolts = [
                { startX: w * 0.32, startY: h * 0.18, branches: 7, color: '#47d8f2' },
                { startX: w * 0.68, startY: h * 0.14, branches: 9, color: '#ffffff' }
            ];

            bolts.forEach(b => {
                ctx.save();
                ctx.strokeStyle = b.color;
                ctx.lineWidth = 2.8;
                ctx.shadowColor = '#47d8f2';
                ctx.shadowBlur = 16;

                ctx.beginPath();
                let bx = b.startX;
                let by = b.startY;
                ctx.moveTo(bx, by);

                for (let s = 0; s < b.branches; s++) {
                    bx += (Math.sin(s * 87 + 12) * 28);
                    by += (h * 0.62) / b.branches;
                    ctx.lineTo(bx, by);
                }
                ctx.stroke();
                ctx.restore();
            });
        }
    }

    // Export singleton to global scope
    window.AIVisionScanner = AIVisionScanner;
    window.aiVisionScanner = new AIVisionScanner();

})(window);
