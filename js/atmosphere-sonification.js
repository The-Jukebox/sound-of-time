/**
 * SOUND OF TIMES — Earth Archive Record 001: The Atmosphere
 * AtmosphereSonificationEngine
 * 
 * Powered by Tone.js & Real NASA MERRA-2 Atmospheric Assimilation & GPM Precipitation Data
 * DOI: 10.5067/95140KBM4KUS | NASA SVS 4252
 */
(function(window) {
    'use strict';

    // Atmosphere Pentatonic / Dorian Scale spanning 4 octaves (Eb Aeolian / Dorian)
    const ATMOSPHERE_SCALE = [
        "Eb2", "F2", "G2", "Bb2", "C3",
        "Eb3", "F3", "G3", "Bb3", "C4",
        "Eb4", "F4", "G4", "Bb4", "C5",
        "Eb5", "F5", "G5", "Bb5"
    ];

    const ATMOSPHERE_BASS = [
        "Eb1", "F1", "G1", "Bb1", "C2", "Eb2"
    ];

    class AtmosphereSonificationEngine {
        constructor() {
            this.dataset = null;
            this.measurements = [];
            this.currentIndex = 0;
            this.isPlaying = false;
            this.isPaused = false;
            this.stepTimer = null;
            this.stepInterval = 3200; // 3.2 seconds per NASA station
            this.volumeLevel = 0.85;

            this.isInitialized = false;
            this.currentNote = '—';
            this.currentDataPoint = null;

            // Environmental sub-layers
            this.rainMuted = false;
            this.windMuted = false;
            this.thunderMuted = false;
            this.musicMuted = false;

            // Callbacks
            this.onStepCallback = null;
            this.onStateChangeCallback = null;
            this.onThunderCallback = null;

            // Pre-load embedded MERRA-2 dataset if available
            if (typeof window !== 'undefined' && window.NASA_MERRA2_ATMOSPHERE_DATA) {
                this.dataset = window.NASA_MERRA2_ATMOSPHERE_DATA;
                this.measurements = this.dataset.measurements || [];
            }
        }

        async loadDataset() {
            if (typeof window !== 'undefined' && window.NASA_MERRA2_ATMOSPHERE_DATA) {
                this.dataset = window.NASA_MERRA2_ATMOSPHERE_DATA;
                this.measurements = this.dataset.measurements || [];
                return this.dataset;
            }

            try {
                let response = null;
                try {
                    response = await fetch('./assets/atmosphere-data.json');
                } catch (e) {
                    response = await fetch('./atmosphere-data.json');
                }
                if (response && response.ok) {
                    this.dataset = await response.json();
                    this.measurements = this.dataset.measurements || [];
                }
            } catch (err) {
                console.warn('[AtmosphereSonification] Fetch failed, using fallback measurements:', err.message);
            }
            return this.dataset;
        }

        async initAudio() {
            if (this.isInitialized) return;
            if (typeof Tone === 'undefined') {
                console.error('[AtmosphereSonification] Tone.js not loaded!');
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

            // 2. Spatial Effects Chain (Atmospheric Cathedral Reverb & Stereo Delay)
            this.reverb = new Tone.Reverb({
                decay: 4.5,
                preDelay: 0.05,
                wet: 0.32
            });

            this.delay = new Tone.FeedbackDelay({
                delayTime: "8n.",
                feedback: 0.28,
                wet: 0.22
            });

            this.pressureFilter = new Tone.Filter({
                frequency: 1800,
                type: "lowpass",
                rolloff: -12
            });

            this.panner = new Tone.Panner(0);

            // Connect Musical Bus: Panner -> Filter -> Delay -> Reverb -> MasterVolume
            this.panner.connect(this.pressureFilter);
            this.pressureFilter.connect(this.delay);
            this.delay.connect(this.reverb);
            this.reverb.connect(this.masterVolume);

            // 3. Pressure Harmony Synth (Warm Barometric Pad)
            this.pressureSynth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "sawtooth" },
                envelope: {
                    attack: 0.45,
                    decay: 1.2,
                    sustain: 0.65,
                    release: 1.8
                }
            });
            this.pressureSynth.volume.value = -9;
            this.pressureSynth.connect(this.panner);

            // 4. Cloud Aerosol Shimmer Synth (High Crystal Harmonics)
            this.aerosolSynth = new Tone.Synth({
                oscillator: { type: "sine" },
                envelope: {
                    attack: 0.12,
                    decay: 0.8,
                    sustain: 0.3,
                    release: 1.4
                }
            });
            this.aerosolSynth.volume.value = -12;
            this.aerosolSynth.connect(this.panner);

            // 5. Convective Sub-Bass Synth
            this.subBassSynth = new Tone.MonoSynth({
                oscillator: { type: "sine" },
                filter: { Q: 2, type: "lowpass", frequency: 180 },
                envelope: { attack: 0.08, decay: 0.6, sustain: 0.4, release: 0.9 },
                filterEnvelope: { attack: 0.04, decay: 0.5, sustain: 0.3, release: 0.8, baseFrequency: 80, octaves: 2.2 }
            });
            this.subBassSynth.volume.value = -6;
            this.subBassSynth.connect(this.panner);

            // 6. Thunder Rumbler Synth (Low-frequency rolling discharge)
            this.thunderSynth = new Tone.MembraneSynth({
                pitchDecay: 0.04,
                octaves: 4.5,
                oscillator: { type: "sine" },
                envelope: { attack: 0.005, decay: 3.2, sustain: 0.1, release: 2.5 }
            });
            this.thunderSynth.volume.value = -3;
            this.thunderSynth.connect(this.reverb);

            // 7. Authentic Continuous Rain Sound Generator (Pink Noise Body + Pitter-Patter Droplets)
            this.rainNoise = new Tone.Noise("pink");
            this.rainFilter = new Tone.Filter({
                frequency: 1450,
                type: "bandpass",
                Q: 1.2
            });
            this.rainGain = new Tone.Gain(0);
            this.rainPan = new Tone.Panner(-0.2);

            this.rainNoise.connect(this.rainFilter);
            this.rainFilter.connect(this.rainGain);
            this.rainGain.connect(this.rainPan);
            this.rainPan.connect(this.masterVolume);
            this.rainNoise.start();

            // Pitter-Patter Water Droplet Impact Synthesizer
            this.rainDropletSynth = new Tone.Synth({
                oscillator: { type: "sine" },
                envelope: { attack: 0.001, decay: 0.024, sustain: 0, release: 0.015 }
            });
            this.rainDropletPan = new Tone.Panner(0);
            this.rainDropletSynth.connect(this.rainDropletPan);
            this.rainDropletPan.connect(this.masterVolume);
            this.rainDropletSynth.volume.value = -11;

            // 8. Dynamic Atmospheric Wind Generator (Pink Noise Bandpass Sweeps)
            this.windNoise = new Tone.Noise("pink");
            this.windFilter = new Tone.Filter({
                frequency: 450,
                type: "lowpass",
                rolloff: -24
            });
            this.windGain = new Tone.Gain(0);
            this.windPan = new Tone.Panner(0.15);

            this.windNoise.connect(this.windFilter);
            this.windFilter.connect(this.windGain);
            this.windGain.connect(this.windPan);
            this.windPan.connect(this.masterVolume);
            this.windNoise.start();

            this.isInitialized = true;
        }

        silenceSynths() {
            const synths = [this.pressureSynth, this.aerosolSynth, this.subBassSynth, this.thunderSynth];
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

        scheduleRainDroplets() {
            if (!this.isPlaying || this.isPaused || this.rainMuted) {
                if (this.dropletTimer) {
                    clearTimeout(this.dropletTimer);
                    this.dropletTimer = null;
                }
                return;
            }

            const interval = 40 + Math.random() * 65;
            this.dropletTimer = setTimeout(() => {
                if (!this.isPlaying || this.isPaused || this.rainMuted) return;

                if (this.rainDropletSynth && typeof Tone !== 'undefined') {
                    const pitches = ["A6", "B6", "C7", "D7", "E7", "G7", "A7"];
                    const note = pitches[Math.floor(Math.random() * pitches.length)];
                    const pan = (Math.random() * 1.6) - 0.8;
                    try {
                        if (this.rainDropletPan) this.rainDropletPan.pan.setValueAtTime(pan, Tone.now());
                        this.rainDropletSynth.triggerAttackRelease(note, 0.018, Tone.now(), 0.35 + Math.random() * 0.4);
                    } catch (e) {}
                }
                this.scheduleRainDroplets();
            }, interval);
        }

        async play() {
            if (!this.isInitialized) {
                await this.initAudio();
            }

            if (this.isPaused) {
                this.isPaused = false;
                this.isPlaying = true;
                this.startStepTimer();
            this.scheduleRainDroplets();
            if (this.masterVolume) this.masterVolume.mute = false;
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
            this.scheduleRainDroplets();
            if (this.masterVolume) this.masterVolume.mute = false;

            if (this.onStateChangeCallback) this.onStateChangeCallback('playing');
        }

        pause() {
            if (!this.isPlaying || this.isPaused) return;
            this.isPaused = true;
            this.isPlaying = false;
            this.stopStepTimer();
            if (this.dropletTimer) {
                clearTimeout(this.dropletTimer);
                this.dropletTimer = null;
            }
            this.silenceSynths();

            if (this.rainGain) this.rainGain.gain.rampTo(0, 0.05);
            if (this.windGain) this.windGain.gain.rampTo(0, 0.05);
            if (this.masterVolume) this.masterVolume.mute = true;

            if (this.onStateChangeCallback) this.onStateChangeCallback('paused');
        }

        stop() {
            this.isPlaying = false;
            this.isPaused = false;
            this.currentIndex = 0;
            this.stopStepTimer();
            if (this.dropletTimer) {
                clearTimeout(this.dropletTimer);
                this.dropletTimer = null;
            }
            this.silenceSynths();

            if (this.rainGain) this.rainGain.gain.rampTo(0, 0.05);
            if (this.windGain) this.windGain.gain.rampTo(0, 0.05);
            if (this.masterVolume) this.masterVolume.mute = true;

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

            // Normalize variables
            // 1. Precipitation Rate (0.0 to 30.0 mm/hr)
            const rainRate = pt.precipitationRate !== undefined ? pt.precipitationRate : 2.0;
            const rainNorm = Math.max(0, Math.min(1, rainRate / 25.0));

            // 2. Wind Speed (0.0 to 35.0 m/s)
            const windSpeed = pt.windSpeed !== undefined ? pt.windSpeed : 6.0;
            const windNorm = Math.max(0, Math.min(1, windSpeed / 30.0));

            // 3. Barometric Pressure (970 to 1035 hPa)
            const pressure = pt.barometricPressure !== undefined ? pt.barometricPressure : 1013.25;
            const pressureNorm = Math.max(0, Math.min(1, (pressure - 970) / 65.0));

            // 4. Aerosol Optical Depth (0.02 to 0.50)
            const aod = pt.aod550 !== undefined ? pt.aod550 : 0.10;
            const aodNorm = Math.max(0, Math.min(1, (aod - 0.02) / 0.40));

            // 5. Lightning Density
            const lightning = pt.lightningDensity !== undefined ? pt.lightningDensity : 0;

            // Map Pressure -> Pitch Scale Note
            const noteIdx = Math.floor(pressureNorm * (ATMOSPHERE_SCALE.length - 1));
            const primaryNote = ATMOSPHERE_SCALE[noteIdx];
            const bassNote = ATMOSPHERE_BASS[Math.floor(pressureNorm * (ATMOSPHERE_BASS.length - 1))];
            this.currentNote = primaryNote;

            // Modulate Environmental Noise
            if (this.rainGain && !this.rainMuted) {
                const targetRainGain = 0.04 + rainNorm * 0.22;
                this.rainGain.gain.rampTo(targetRainGain, 0.4);
                if (this.rainFilter) {
                    this.rainFilter.frequency.rampTo(1200 + rainNorm * 2200, 0.4);
                }
            }

            if (this.windGain && !this.windMuted) {
                const targetWindGain = 0.05 + windNorm * 0.25;
                this.windGain.gain.rampTo(targetWindGain, 0.4);
                if (this.windFilter) {
                    this.windFilter.frequency.rampTo(300 + windNorm * 1200, 0.4);
                }
            }

            // Musical Synthesizer Voice
            if (!this.musicMuted && this.pressureSynth) {
                // Play warm harmonic chord
                const chordNotes = [primaryNote];
                if (noteIdx + 2 < ATMOSPHERE_SCALE.length) chordNotes.push(ATMOSPHERE_SCALE[noteIdx + 2]);
                if (noteIdx + 4 < ATMOSPHERE_SCALE.length) chordNotes.push(ATMOSPHERE_SCALE[noteIdx + 4]);

                this.pressureSynth.triggerAttackRelease(chordNotes, 2.4, Tone.now());
            }

            if (!this.musicMuted && this.subBassSynth) {
                this.subBassSynth.triggerAttackRelease(bassNote, 1.8, Tone.now() + 0.08);
            }

            if (!this.musicMuted && this.aerosolSynth && aodNorm > 0.3) {
                const shimmerNote = ATMOSPHERE_SCALE[(noteIdx + 5) % ATMOSPHERE_SCALE.length];
                this.aerosolSynth.triggerAttackRelease(shimmerNote, 0.8, Tone.now() + 0.35, 0.4 + aodNorm * 0.4);
            }

            // Convective Lightning & Thunder Trigger
            if (!this.thunderMuted && (lightning > 12 || rainNorm > 0.65)) {
                this.playThunderClap(lightning);
            }

            // Callback
            if (this.onStepCallback) {
                this.onStepCallback(pt, {
                    rainNorm,
                    windNorm,
                    pressureNorm,
                    aodNorm,
                    note: primaryNote
                });
            }
        }

        playThunderClap(intensity = 20) {
            if (!this.thunderSynth || this.thunderMuted) return;
            const now = Tone.now();
            const vel = Math.max(0.4, Math.min(1.0, intensity / 40));
            this.thunderSynth.triggerAttackRelease("C1", 2.8, now, vel);

            if (this.onThunderCallback) {
                this.onThunderCallback(intensity);
            }
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
                precipitationRate: pt ? pt.precipitationRate : null,
                windSpeed: pt ? pt.windSpeed : null,
                barometricPressure: pt ? pt.barometricPressure : null,
                aod550: pt ? pt.aod550 : null,
                temperature: pt ? pt.temperature : null,
                lightningDensity: pt ? pt.lightningDensity : null,
                atmosphereType: pt ? pt.atmosphereType : 'Coastal Rain Front',
                location: pt ? pt.location : 'Pacific Northwest Coast'
            };
        }
    }

    window.AtmosphereSonificationEngine = AtmosphereSonificationEngine;
})(window);
