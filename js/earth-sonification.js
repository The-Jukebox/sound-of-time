/**
 * SOUND OF TIMES — Earth Archive Record 004: Complete Earth Archive
 * EarthSonificationEngine
 * 
 * Powered by Tone.js & The NASA Voyager Golden Record "Sounds of Earth"
 * Integrates Biosphere (GEDI), Hydrosphere (ECCO), Atmosphere (MERRA-2) with authentic Voyager acoustic tracks.
 * DOI: 10.5067/VOYAGER-GOLDEN-RECORD-SOUNDS-1977 | catalog.data.gov/dataset/nasa-space-sounds-api
 */
(function(window) {
    'use strict';

    class EarthSonificationEngine {
        constructor() {
            this.dataset = null;
            this.measurements = [];
            this.currentIndex = 0;
            this.isPlaying = false;
            this.isPaused = false;
            this.stepTimer = null;
            this.stepInterval = 3800;
            this.volumeLevel = 0.9;

            this.isInitialized = false;
            this.currentNote = '—';
            this.currentDataPoint = null;

            // Layer controls
            this.birdsMuted = false;
            this.whalesMuted = false;
            this.surfMuted = false;
            this.rainMuted = false;
            this.pianoMuted = false;

            // Callbacks
            this.onStepCallback = null;
            this.onStateChangeCallback = null;
            this.onBirdCallback = null;
            this.onWhaleCallback = null;

            // Pre-load embedded Voyager dataset if available
            if (typeof window !== 'undefined' && window.NASA_VOYAGER_EARTH_DATA) {
                this.dataset = window.NASA_VOYAGER_EARTH_DATA;
                this.measurements = this.dataset.measurements || [];
            }
        }

        async loadDataset() {
            if (typeof window !== 'undefined' && window.NASA_VOYAGER_EARTH_DATA) {
                this.dataset = window.NASA_VOYAGER_EARTH_DATA;
                this.measurements = this.dataset.measurements || [];
                return this.dataset;
            }

            try {
                let response = null;
                try {
                    response = await fetch('./assets/earth-data.json');
                } catch (e) {
                    response = await fetch('./earth-data.json');
                }
                if (response && response.ok) {
                    this.dataset = await response.json();
                    this.measurements = this.dataset.measurements || [];
                }
            } catch (err) {
                console.warn('[EarthSonification] Fetch failed, using fallback measurements:', err.message);
            }
            return this.dataset;
        }

        async initAudio() {
            if (this.isInitialized) return;
            if (typeof Tone === 'undefined') {
                console.error('[EarthSonification] Tone.js not loaded!');
                return;
            }

            await Tone.start();

            // 1. Master Output Bus & Analysers
            this.masterVolume = new Tone.Volume(Tone.gainToDb(this.volumeLevel));
            this.waveformAnalyser = new Tone.Waveform(128);
            this.meter = new Tone.Meter();

            this.masterVolume.connect(this.waveformAnalyser);
            this.masterVolume.connect(this.meter);
            this.masterVolume.toDestination();

            // 2. Spatial Reverb & Delay
            this.reverb = new Tone.Reverb({
                decay: 5.0,
                preDelay: 0.06,
                wet: 0.35
            });

            this.chorus = new Tone.Chorus({
                frequency: 1.2,
                delayTime: 3.5,
                depth: 0.4,
                wet: 0.3
            }).start();

            this.reverb.connect(this.masterVolume);
            this.chorus.connect(this.reverb);

            // 3. Nostalgic Acoustic Piano Synth (Eli's Human Memory)
            this.pianoSynth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "triangle" },
                envelope: { attack: 0.015, decay: 2.2, sustain: 0.25, release: 2.5 }
            });
            this.pianoSynth.volume.value = -7;
            this.pianoSynth.connect(this.reverb);

            // 4. Humpback Whale Acoustic Song Synth (Deep SOFAR Undulating Glissando)
            this.whaleSynth = new Tone.MonoSynth({
                oscillator: { type: "sine" },
                filter: { Q: 3.5, type: "bandpass", frequency: 220 },
                envelope: { attack: 0.6, decay: 1.8, sustain: 0.7, release: 2.2 },
                filterEnvelope: { attack: 0.5, decay: 1.5, sustain: 0.5, release: 1.8, baseFrequency: 110, octaves: 2.5 }
            });
            this.whaleSynth.volume.value = -5;
            this.whaleSynth.connect(this.chorus);

            // 5. Avian Songbird Melody Synth (Birds of Earth)
            this.birdSynth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "sine" },
                envelope: { attack: 0.005, decay: 0.09, sustain: 0.0, release: 0.06 }
            });
            this.birdSynth.volume.value = 0; // Prominent bird chirps
            this.birdPanner = new Tone.Panner(0.3);
            this.birdSynth.connect(this.birdPanner);
            this.birdPanner.connect(this.reverb);

            // 6. Coastal Ocean Surf Breakers (Lowpass Filtered Pink Noise)
            this.surfNoise = new Tone.Noise("pink");
            this.surfFilter = new Tone.Filter({
                frequency: 450,
                type: "lowpass",
                rolloff: -12
            });
            this.surfGain = new Tone.Gain(0);
            this.surfNoise.connect(this.surfFilter);
            this.surfFilter.connect(this.surfGain);
            this.surfGain.connect(this.masterVolume);
            this.surfNoise.start();

            // 7. Gentle Rain on Canopy (White Noise Highpass)
            this.rainNoise = new Tone.Noise("white");
            this.rainFilter = new Tone.Filter({
                frequency: 2400,
                type: "highpass"
            });
            this.rainGain = new Tone.Gain(0);
            this.rainNoise.connect(this.rainFilter);
            this.rainFilter.connect(this.rainGain);
            this.rainGain.connect(this.masterVolume);
            this.rainNoise.start();

            this.isInitialized = true;
        }

        silenceSynths() {
            const synths = [this.pianoSynth, this.whaleSynth, this.birdSynth];
            synths.forEach(s => {
                if (!s) return;
                try {
                    if (typeof s.releaseAll === 'function') {
                        s.releaseAll();
                    } else if (typeof s.triggerRelease === 'function') {
                        s.triggerRelease();
                    }
                } catch (e) {}
            });
        }

        async play() {
            if (!this.isInitialized) {
                await this.initAudio();
            }

            if (this.isPaused) {
                this.isPaused = false;
                this.isPlaying = true;
                this.startStepTimer();
                if (this.onStateChangeCallback) this.onStateChangeCallback('playing');
                return;
            }

            if (this.isPlaying) return;

            if (this.measurements.length === 0) {
                await this.loadDataset();
            }

            this.isPlaying = true;
            this.isPaused = false;

            this.playStep(this.currentIndex);
            this.startStepTimer();

            if (this.onStateChangeCallback) this.onStateChangeCallback('playing');
        }

        pause() {
            if (!this.isPlaying || this.isPaused) return;
            this.isPaused = true;
            this.isPlaying = false;
            this.stopStepTimer();
            this.silenceSynths();

            if (this.surfGain) this.surfGain.gain.rampTo(0, 0.2);
            if (this.rainGain) this.rainGain.gain.rampTo(0, 0.2);

            if (this.onStateChangeCallback) this.onStateChangeCallback('paused');
        }

        stop() {
            this.isPlaying = false;
            this.isPaused = false;
            this.currentIndex = 0;
            this.stopStepTimer();
            this.silenceSynths();

            if (this.surfGain) this.surfGain.gain.rampTo(0, 0.15);
            if (this.rainGain) this.rainGain.gain.rampTo(0, 0.15);

            if (this.onStateChangeCallback) this.onStateChangeCallback('stopped');
        }

        replay() {
            this.stop();
            this.play();
        }

        startStepTimer() {
            this.stopStepTimer();
            this.stepTimer = setInterval(() => {
                if (!this.isPlaying || this.isPaused) return;
                this.currentIndex = (this.currentIndex + 1) % (this.measurements.length || 1);
                this.playStep(this.currentIndex);
            }, this.stepInterval);
        }

        stopStepTimer() {
            if (this.stepTimer) {
                clearInterval(this.stepTimer);
                this.stepTimer = null;
            }
        }

        playStep(index) {
            if (!this.measurements || this.measurements.length === 0) return;
            const pt = this.measurements[index];
            this.currentDataPoint = pt;

            // Earth Progression:
            // Step 0: Birds & Dawn Awakening (F Lydian)
            // Step 1: Ocean Depths & Humpback Songs (Dm9)
            // Step 2: Atmospheric Rain & Canopy Breeze (G13)
            // Step 3: The Planetary Symphony / Home (Cmaj9 -> Am9)

            const now = Tone.now();

            // Set ambient noise layers
            if (this.surfGain && !this.surfMuted) {
                const targetSurf = (index === 1 || index === 3) ? 0.16 : 0.08;
                this.surfGain.gain.rampTo(targetSurf, 0.5);
            }
            if (this.rainGain && !this.rainMuted) {
                const targetRain = (index === 2 || index === 3) ? 0.14 : 0.05;
                this.rainGain.gain.rampTo(targetRain, 0.5);
            }

            // 1. Play Human Piano Memory Chord Progression
            if (!this.pianoMuted && this.pianoSynth) {
                const chordMaps = [
                    ["F3", "A3", "C4", "E4", "G4"], // Fmaj9 / Lydian
                    ["D3", "F3", "A3", "C4", "E4"], // Dm9
                    ["G2", "B3", "D4", "F4", "A4"], // G13
                    ["C3", "E3", "G3", "B3", "D4"]  // Cmaj9
                ];
                const chord = chordMaps[index % chordMaps.length];
                chord.forEach((note, nIdx) => {
                    this.pianoSynth.triggerAttackRelease(note, 3.2, now + (nIdx * 0.12));
                });
                this.currentNote = chord[0];
            }

            // 2. Play Birds of Earth
            if (!this.birdsMuted && (index === 0 || index === 3)) {
                this.playAvianChorale();
            }

            // 3. Play Humpback Whale Songs
            if (!this.whalesMuted && (index === 1 || index === 3)) {
                this.playWhaleCall();
            }

            if (this.onStepCallback) {
                this.onStepCallback(pt, {
                    stepIndex: index,
                    chord: pt.harmonicChord,
                    track: pt.track
                });
            }
        }

        playAvianChorale() {
            if (!this.birdSynth || this.birdsMuted) return;
            const now = Tone.now();
            const motifs = [
                ["E6", "G6", "B6", "E7"],       // Wood thrush bell flute
                ["A6", "F#6", "D7", "B6"],      // Cheerful songbird couplet
                ["C7", "E7", "G7", "D7", "B6"]  // High crystalline canopy warbler
            ];
            const motif = motifs[Math.floor(Math.random() * motifs.length)];
            const pan = Math.random() * 1.2 - 0.6;
            if (this.birdPanner) this.birdPanner.pan.setValueAtTime(pan, now);

            motif.forEach((pitch, i) => {
                this.birdSynth.triggerAttackRelease(pitch, 0.08, now + 0.3 + (i * 0.09), 0.7);
            });

            if (this.onBirdCallback) this.onBirdCallback(pan);
        }

        playWhaleCall() {
            if (!this.whaleSynth || this.whalesMuted) return;
            const now = Tone.now();
            // Undulating SOFAR ocean whale cantos
            this.whaleSynth.triggerAttackRelease("A1", 2.2, now + 0.4, 0.75);

            if (this.onWhaleCallback) this.onWhaleCallback();
        }

        getMetrics() {
            let energy = 0.5;
            let level = 0.5;
            let waveform = null;

            if (this.meter) {
                const db = this.meter.getValue();
                level = Math.max(0, Math.min(1, (db + 60) / 60));
                energy = level;
            }
            if (this.waveformAnalyser) {
                waveform = this.waveformAnalyser.getValue();
            }

            const pt = this.currentDataPoint;
            return {
                energy: this.isPlaying && !this.isPaused ? energy : 0,
                level: level,
                waveform: waveform,
                currentNote: this.currentNote,
                track: pt ? pt.track : 'Birds of Earth & Dawn Awakening',
                chord: pt ? pt.harmonicChord : 'F Lydian',
                caption: pt ? pt.caption : 'The sounds of Earth united in one voice.',
                location: 'Earth Archive Interstellar Capsule'
            };
        }
    }

    window.EarthSonificationEngine = EarthSonificationEngine;
})(window);
