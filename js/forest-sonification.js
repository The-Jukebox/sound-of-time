/**
 * SOUND OF TIMES — Earth Archive Record 003: The Forest
 * ForestSonificationEngine & ForestSoundscapeManager
 * 
 * Powered by Tone.js & Real NASA GEDI (L4B/L3) Lidar Canopy Structure Data
 * Combines deterministic scientific data sonification with procedural natural soundscapes.
 */
(function(window) {
    'use strict';

    // Pentatonic / Lydian Earth scale spanning 4 octaves
    const SCALE_DEGREES = [
        "F2", "G2", "A2", "C3", "D3",
        "F3", "G3", "A3", "C4", "D4",
        "F4", "G4", "A4", "C5", "D5",
        "F5", "G5", "A5", "C6"
    ];

    const BASS_DEGREES = [
        "F1", "G1", "A1", "C2", "D2", "F2"
    ];

    class ForestSonificationEngine {
        constructor() {
            this.dataset = null;
            this.measurements = [];
            this.currentIndex = 0;
            this.isPlaying = false;
            this.isPaused = false;
            this.stepTimer = null;
            this.stepInterval = 3200; // 3.2 seconds per NASA transect
            this.volumeLevel = 0.8;

            this.isInitialized = false;
            this.currentNote = '—';
            this.currentDataPoint = null;

            // Callbacks
            this.onStepCallback = null;
            this.onStateChangeCallback = null;
            this.onBirdChirpCallback = null;

            // Environmental Soundscape Manager
            this.soundscape = new ForestSoundscapeManager(this);

            // Pre-load embedded GEDI data if available
            if (typeof window !== 'undefined' && window.NASA_GEDI_FOREST_DATA) {
                this.dataset = window.NASA_GEDI_FOREST_DATA;
                this.measurements = this.dataset.measurements || [];
            }
        }

        async loadDataset() {
            if (typeof window !== 'undefined' && window.NASA_GEDI_FOREST_DATA) {
                this.dataset = window.NASA_GEDI_FOREST_DATA;
                this.measurements = this.dataset.measurements || [];
                return this.dataset;
            }

            try {
                let response = null;
                try {
                    response = await fetch('./assets/forest-data.json');
                } catch (e) {
                    response = await fetch('./forest-data.json');
                }
                if (response && response.ok) {
                    this.dataset = await response.json();
                    this.measurements = this.dataset.measurements || [];
                }
            } catch (err) {
                console.warn('[ForestSonification] Fetch failed, using fallback measurements:', err.message);
            }
            return this.dataset;
        }

        async initAudio() {
            if (this.isInitialized) return;
            if (typeof Tone === 'undefined') {
                console.error('[ForestSonification] Tone.js not loaded!');
                return;
            }

            await Tone.start();

            // 1. Master Volume & Analysers
            this.masterVolume = new Tone.Volume(Tone.gainToDb(this.volumeLevel));
            this.waveformAnalyser = new Tone.Waveform(128);
            this.meter = new Tone.Meter();

            this.masterVolume.connect(this.waveformAnalyser);
            this.masterVolume.connect(this.meter);
            this.masterVolume.toDestination();

            // 2. Spatial Effects Chain (Forest Cathedral Acoustic Reverb)
            this.reverb = new Tone.Reverb({
                decay: 3.2,
                preDelay: 0.04,
                wet: 0.28
            });

            this.chorus = new Tone.Chorus({
                frequency: 1.8,
                delayTime: 3.0,
                depth: 0.35,
                wet: 0.25
            }).start();

            this.forestFilter = new Tone.Filter({
                frequency: 2400,
                type: "lowpass",
                rolloff: -12
            });

            this.panner = new Tone.Panner(0);

            // Connect Musical Bus: Panner -> Filter -> Chorus -> Reverb -> MasterVolume
            this.panner.connect(this.forestFilter);
            this.forestFilter.connect(this.chorus);
            this.chorus.connect(this.reverb);
            this.reverb.connect(this.masterVolume);

            // 3. Primary Canopy Height: Acoustic Rosewood Marimba (Percussive wooden acoustic bars)
            this.canopySynth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "sine" },
                envelope: {
                    attack: 0.002, // Ultra snappy mallet strike
                    decay: 0.38,   // Organic rosewood bar decay
                    sustain: 0.0,  // Zero sustain (percussive acoustic instrument!)
                    release: 0.24
                }
            });
            this.canopySynth.connect(this.panner);
            this.canopySynth.volume.value = 0;

            // Rosewood Harmonic Overtone Layer (4th harmonic chime for woody strike transient)
            this.marimbaOvertones = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "triangle" },
                envelope: {
                    attack: 0.001,
                    decay: 0.12,
                    sustain: 0.0,
                    release: 0.08
                }
            });
            this.marimbaOvertones.connect(this.panner);
            this.marimbaOvertones.volume.value = -8;

            // 4. Foliage Diversity: Bamboo Kalimba / Thumb Piano Plucks
            this.diversitySynth = new Tone.PolySynth(Tone.FMSynth, {
                harmonicity: 3.2,
                modulationIndex: 1.6,
                oscillator: { type: "sine" },
                modulation: { type: "triangle" },
                envelope: {
                    attack: 0.003, // Snappy tine pluck
                    decay: 0.22,
                    sustain: 0.0,  // Zero sustain!
                    release: 0.16
                }
            });
            this.diversitySynth.connect(this.panner);
            this.diversitySynth.volume.value = -4;

            // 5. Biomass Density: Acoustic Upright Double-Bass Pizzicato
            this.biomassSynth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "triangle" },
                envelope: {
                    attack: 0.006, // Wooden string pluck transient
                    decay: 0.75,   // Acoustic double-bass string ring-down
                    sustain: 0.02,
                    release: 0.40
                }
            });
            this.biomassSynth.connect(this.forestFilter);
            this.biomassSynth.volume.value = -2;

            // Initialize Environmental Soundscape Audio Graph
            try {
                await this.soundscape.initAudio(this.masterVolume);
            } catch (err) {
                console.error('[ForestSoundscape initAudio ERROR]:', err);
            }

            this.isInitialized = true;
        }

        async play() {
            if (this.isPaused) {
                this.isPaused = false;
                this.isPlaying = true;
                if (this.masterVolume) this.masterVolume.mute = false;
                this.soundscape.resume();
                this.scheduleNextStep();
                if (this.onStateChangeCallback) this.onStateChangeCallback('playing');
                return;
            }

            this.isPlaying = true;
            this.isPaused = false;

            if (!this.isInitialized) {
                await this.initAudio();
            }

            if (this.masterVolume) this.masterVolume.mute = false;

            if (this.measurements.length === 0) {
                await this.loadDataset();
            }

            if (!this.isPlaying) return;

            this.soundscape.start();
            this.stopStepTimer();
            this.executeDataStep();
            this.scheduleNextStep();

            if (this.onStateChangeCallback) this.onStateChangeCallback('playing');
        }

        silenceSynths() {
            const synths = [this.canopySynth, this.diversitySynth, this.biomassSynth, this.marimbaOvertones];
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

        pause() {
            if (!this.isPlaying) return;
            this.isPlaying = false;
            this.isPaused = true;
            this.stopStepTimer();
            this.soundscape.pause();
            this.silenceSynths();
            if (this.masterVolume) this.masterVolume.mute = true;
            if (this.onStateChangeCallback) this.onStateChangeCallback('paused');
        }

        stop() {
            this.isPlaying = false;
            this.isPaused = false;
            this.currentIndex = 0;
            this.stopStepTimer();
            this.currentNote = '—';
            this.soundscape.stop();
            this.silenceSynths();
            if (this.masterVolume) this.masterVolume.mute = true;
            if (this.onStateChangeCallback) this.onStateChangeCallback('stopped');
        }

        replay() {
            this.stop();
            this.play();
        }

        eject() {
            this.stop();
            this.currentDataPoint = null;
            if (this.onStateChangeCallback) this.onStateChangeCallback('ejected');
        }

        setVolume(value) {
            this.volumeLevel = Math.max(0, Math.min(1, value));
            if (this.masterVolume) {
                if (this.volumeLevel === 0) {
                    this.masterVolume.mute = true;
                } else {
                    this.masterVolume.mute = false;
                    this.masterVolume.volume.rampTo(Tone.gainToDb(this.volumeLevel), 0.1);
                }
            }
        }

        stopStepTimer() {
            if (this.stepTimer) {
                clearTimeout(this.stepTimer);
                this.stepTimer = null;
            }
        }

        scheduleNextStep() {
            this.stopStepTimer();
            if (!this.isPlaying || this.isPaused) return;

            this.stepTimer = setTimeout(() => {
                if (!this.isPlaying || this.isPaused) return;
                this.currentIndex = (this.currentIndex + 1) % Math.max(1, this.measurements.length);
                this.executeDataStep();
                this.scheduleNextStep();
            }, this.stepInterval);
        }

        /**
         * Mathematical Sonification Mapping Core
         */
        executeDataStep() {
            if (!this.measurements || this.measurements.length === 0) return;
            const pt = this.measurements[this.currentIndex];
            this.currentDataPoint = pt;

            // Handle invalid / water mask data gracefully
            if (pt.canopyHeight == null || pt.canopyCover == null) {
                this.currentNote = 'N/A (Water Mask)';
                if (this.onStepCallback) {
                    this.onStepCallback(pt, {
                        heightNorm: 0,
                        coverNorm: 0,
                        fhdNorm: 0,
                        biomassNorm: 0,
                        energy: 0.15,
                        note: 'N/A'
                    });
                }
                return;
            }

            // Normalization against documented GEDI bounds
            // Canopy Height: 0m to 70m
            const heightNorm = Math.max(0, Math.min(1, pt.canopyHeight / 70.0));
            // Canopy Cover: 0.0 to 1.0
            const coverNorm = Math.max(0, Math.min(1, pt.canopyCover));
            // Foliage Height Diversity: 0.0 to 4.0
            const fhdNorm = Math.max(0, Math.min(1, (pt.fhd || 2.0) / 4.0));
            // Biomass Density: 0 to 550 Mg/ha
            const biomassNorm = Math.max(0, Math.min(1, (pt.biomass || 200) / 550.0));

            // 1. Canopy Height -> Musical Pitch
            const noteIdx = Math.floor(heightNorm * (SCALE_DEGREES.length - 1));
            const primaryNote = SCALE_DEGREES[noteIdx];
            this.currentNote = primaryNote;

            // 2. Canopy Cover -> Filter Cutoff & Chorus Richness
            if (this.forestFilter && this.forestFilter.frequency) {
                const targetCutoff = 600 + coverNorm * 2200; // 600Hz to 2800Hz
                this.forestFilter.frequency.rampTo(targetCutoff, 0.4);
            }
            if (this.chorus && this.chorus.wet) {
                if (typeof this.chorus.wet.rampTo === 'function') {
                    this.chorus.wet.rampTo(0.2 + coverNorm * 0.45, 0.4);
                } else if ('value' in this.chorus.wet) {
                    this.chorus.wet.value = 0.2 + coverNorm * 0.45;
                }
            }

            // 3. Biomass -> Sub-Bass Tone
            const bassIdx = Math.floor(biomassNorm * (BASS_DEGREES.length - 1));
            const bassNote = BASS_DEGREES[bassIdx];

            // 4. Stereo Panning by geographical longitude
            if (this.panner && pt.lon != null) {
                // Longitude -180 to 180 mapped to -0.6 to 0.6
                const panVal = Math.max(-0.6, Math.min(0.6, pt.lon / 180.0));
                this.panner.pan.rampTo(panVal, 0.5);
            }

            // Play Primary Canopy Voice (Acoustic Rosewood Marimba)
            if (this.canopySynth && !this.soundscape.musicMuted) {
                this.canopySynth.triggerAttackRelease(primaryNote, 0.42);
                if (this.marimbaOvertones) {
                    this.marimbaOvertones.triggerAttackRelease(primaryNote, 0.15);
                }

                // If canopy is high & dense, strike upper acoustic fifth
                if (coverNorm > 0.75 && noteIdx + 4 < SCALE_DEGREES.length) {
                    const harmNote = SCALE_DEGREES[noteIdx + 4];
                    this.canopySynth.triggerAttackRelease(harmNote, 0.38, Tone.now() + 0.14);
                    if (this.marimbaOvertones) {
                        this.marimbaOvertones.triggerAttackRelease(harmNote, 0.12, Tone.now() + 0.14);
                    }
                }
            }

            // Play FHD Diversity Arpeggio Sequence (Bamboo Kalimba Tines)
            if (this.diversitySynth && !this.soundscape.musicMuted) {
                const arpCount = Math.floor(2 + fhdNorm * 4); // 2 to 6 arpeggio notes
                for (let a = 0; a < arpCount; a++) {
                    const offsetIdx = (noteIdx + a * 2) % SCALE_DEGREES.length;
                    const arpNote = SCALE_DEGREES[offsetIdx];
                    const timeOffset = Tone.now() + (a * 0.16);
                    this.diversitySynth.triggerAttackRelease(arpNote, 0.18, timeOffset, 0.5 + (fhdNorm * 0.3));
                }
            }

            // Play Biomass Acoustic Upright Double-Bass Pluck
            if (this.biomassSynth && !this.soundscape.musicMuted) {
                this.biomassSynth.triggerAttackRelease(bassNote, 0.75, Tone.now() + 0.04, 0.5 + biomassNorm * 0.4);
            }

            // Inform Soundscape Manager of environmental parameters
            this.soundscape.onDataStep(pt, {
                heightNorm,
                coverNorm,
                fhdNorm,
                biomassNorm
            });

            // HUD / UI Telemetry Callback
            if (this.onStepCallback) {
                this.onStepCallback(pt, {
                    heightNorm,
                    coverNorm,
                    fhdNorm,
                    biomassNorm,
                    energy: 0.35 + (heightNorm * 0.35) + (coverNorm * 0.3),
                    note: primaryNote
                });
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
                canopyHeight: pt ? pt.canopyHeight : null,
                canopyCover: pt ? pt.canopyCover : null,
                fhd: pt ? pt.fhd : null,
                biomass: pt ? pt.biomass : null,
                ndvi: pt ? pt.ndvi : null,
                biome: pt ? pt.biome : 'Temperate Rainforest',
                location: pt ? pt.location : 'Hoh Rainforest',
                soundscape: this.soundscape.getMetrics()
            };
        }
    }

    /**
     * ForestSoundscapeManager
     * High-fidelity procedural acoustic generation for leaves, wind, birds, insects, water, and weather.
     */
    class ForestSoundscapeManager {
        constructor(engine) {
            this.engine = engine;
            this.mode = 'morning'; // 'morning', 'afternoon', 'evening', 'night'
            this.isInitialized = false;
            this.isActive = false;

            // Layer volumes
            this.musicVolume = 0.8;
            this.canopyVolume = 0.75;
            this.wildlifeVolume = 0.88; // Vivid wildlife & avian chorus
            this.waterVolume = 0.65;

            // Layer mute states
            this.musicMuted = false;
            this.canopyMuted = false;
            this.wildlifeMuted = false;
            this.waterMuted = false;

            // Interval timers
            this.wildlifeTimer = null;
            this.dawnChorusTimer = null;
            this.gustTimer = null;
            this.thunderTimer = null;

            // Environmental telemetry
            this.windIntensity = 0.4;
            this.birdActivity = 0.7;
            this.streamIntensity = 0.5;
            this.rainIntensity = 0.0; // 0.0 to 1.0
            this.lastBirdChirpTime = 0;
        }

        async initAudio(destination) {
            if (this.isInitialized) return;

            // 1. Environmental Sub-Busses
            this.canopyBus = new Tone.Volume(Tone.gainToDb(this.canopyVolume)).connect(destination);
            this.wildlifeBus = new Tone.Volume(Tone.gainToDb(this.wildlifeVolume)).connect(destination);
            this.waterBus = new Tone.Volume(Tone.gainToDb(this.waterVolume)).connect(destination);

            // 2. Crisp Leaf Rustling Generator (High-frequency papery friction noise)
            this.leafNoise = new Tone.Noise("white");
            this.leafFilter = new Tone.Filter({
                frequency: 3800,
                type: "bandpass",
                Q: 2.2
            });
            this.leafGain = new Tone.Gain(0.14);
            this.leafPan = new Tone.Panner(0);

            // Tremolo LFO for fluttering leaves in breeze
            this.leafLFO = new Tone.LFO(8.5, 0.06, 0.22);
            this.leafLFO.connect(this.leafGain.gain);
            this.leafLFO.start();

            this.leafNoise.connect(this.leafFilter);
            this.leafFilter.connect(this.leafGain);
            this.leafGain.connect(this.leafPan);
            this.leafPan.connect(this.canopyBus);

            // 3. Gentle Canopy Breath Wind (Whispering through tree crowns)
            this.windNoise = new Tone.Noise("pink");
            this.windFilter = new Tone.Filter({
                frequency: 1100,
                type: "bandpass",
                Q: 1.4
            });
            this.windGain = new Tone.Gain(0.08);
            this.windPan = new Tone.Panner(0);

            this.windNoise.connect(this.windFilter);
            this.windFilter.connect(this.windGain);
            this.windGain.connect(this.windPan);
            this.windPan.connect(this.canopyBus);

            // 4. Black Forest Wutach Stream Flow & Bubbling Brook (Pink noise body + dual eddy filters + liquid gurgles)
            this.streamNoise = new Tone.Noise("pink");
            this.streamFilter = new Tone.Filter({
                frequency: 520,
                type: "lowpass",
                rolloff: -12
            });
            this.streamEddyFilter = new Tone.Filter({
                frequency: 1380,
                type: "bandpass",
                Q: 1.4
            });
            this.streamFoamFilter = new Tone.Filter({
                frequency: 2200,
                type: "bandpass",
                Q: 2.0
            });
            this.streamGain = new Tone.Gain(0.14);
            this.streamPan = new Tone.Panner(-0.35);

            // Connect pink noise body, eddy wash, and foam shimmer
            this.streamNoise.connect(this.streamFilter);
            this.streamNoise.connect(this.streamEddyFilter);
            this.streamNoise.connect(this.streamFoamFilter);

            this.streamFilter.connect(this.streamGain);
            this.streamEddyFilter.connect(this.streamGain);
            this.streamFoamFilter.connect(this.streamGain);

            this.streamGain.connect(this.streamPan);
            this.streamPan.connect(this.waterBus);

            // Subtle eddy swirl LFO modulating water wash
            this.streamEddyLFO = new Tone.LFO(0.12, 1150, 1650);
            this.streamEddyLFO.connect(this.streamEddyFilter.frequency);
            this.streamEddyLFO.start();

            // Stream Bubble Droplet Synth (Resonant liquid bubble pops)
            this.streamBubbleSynth = new Tone.MembraneSynth({
                pitchDecay: 0.012,
                octaves: 1.6,
                oscillator: { type: "sine" },
                envelope: { attack: 0.001, decay: 0.042, sustain: 0, release: 0.025 }
            });
            this.streamBubbleSynth.volume.value = -10;
            this.streamBubbleSynth.connect(this.streamPan);

            // Liquid Stream Gurgle Synth (Water tumbling into moss rock crevices)
            this.streamGurgleSynth = new Tone.Synth({
                oscillator: { type: "sine" },
                envelope: { attack: 0.002, decay: 0.045, sustain: 0, release: 0.02 }
            });
            this.streamGurgleFilter = new Tone.Filter(850, "lowpass");
            this.streamGurgleSynth.connect(this.streamGurgleFilter);
            this.streamGurgleFilter.connect(this.streamPan);
            this.streamGurgleSynth.volume.value = -8;

            // 5. Avian Songbird Melody Generator (Multi-Voice Polyphonic Flute & Warbler)
            this.birdSynth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "sine" },
                envelope: { attack: 0.005, decay: 0.08, sustain: 0.0, release: 0.05 }
            });
            this.birdFilter = new Tone.Filter(5200, "lowpass");
            this.birdPanner = new Tone.Panner(0.25);
            this.birdReverb = new Tone.FeedbackDelay("16n", 0.24);
            this.birdSynth.connect(this.birdFilter);
            this.birdFilter.connect(this.birdPanner);
            this.birdPanner.connect(this.birdReverb);
            this.birdReverb.connect(this.wildlifeBus);
            this.birdSynth.volume.value = 1.0; // Sweet, warm acoustic birdsong

            // 6. Woodpecker Hollow Bark Taps
            this.woodpeckerSynth = new Tone.MembraneSynth({
                pitchDecay: 0.012,
                octaves: 1.8,
                oscillator: { type: "sine" },
                envelope: { attack: 0.001, decay: 0.045, sustain: 0, release: 0.03 }
            });
            this.woodpeckerPanner = new Tone.Panner(-0.35);
            this.woodpeckerSynth.connect(this.woodpeckerPanner);
            this.woodpeckerPanner.connect(this.canopyBus);
            this.woodpeckerSynth.volume.value = -8;

            // 7. Frogs (Guttural croaks in night mode)
            this.frogSynth = new Tone.Synth({
                oscillator: { type: "sawtooth" },
                envelope: { attack: 0.01, decay: 0.09, sustain: 0, release: 0.04 }
            });
            this.frogFilter = new Tone.Filter(480, "lowpass");
            this.frogPanner = new Tone.Panner(-0.25);
            this.frogSynth.connect(this.frogFilter);
            this.frogFilter.connect(this.frogPanner);
            this.frogPanner.connect(this.wildlifeBus);
            this.frogSynth.volume.value = -10;

            // 8. Insects & Crickets Generator
            this.cricketOsc = new Tone.Oscillator(4700, "triangle");
            this.cricketGain = new Tone.Gain(0);
            this.cricketPan = new Tone.Panner(0.4);
            this.cricketOsc.connect(this.cricketGain);
            this.cricketGain.connect(this.cricketPan);
            this.cricketPan.connect(this.wildlifeBus);
            this.cricketOsc.start();

            // 9. Authentic Canopy Rain Generator (Pink Noise Body + Pitter-Patter Droplets + Leaf Drips)
            this.rainNoise = new Tone.Noise("pink");
            this.rainFilter = new Tone.Filter({
                frequency: 1400,
                type: "bandpass",
                Q: 1.2
            });
            this.rainGain = new Tone.Gain(0.0);
            this.rainPan = new Tone.Panner(-0.15);
            this.rainNoise.connect(this.rainFilter);
            this.rainFilter.connect(this.rainGain);
            this.rainGain.connect(this.rainPan);
            this.rainPan.connect(this.waterBus);

            // Realistic Pitter-Patter Water Droplet Impact Synth (Foliage & Window Collisions)
            this.rainDropletSynth = new Tone.Synth({
                oscillator: { type: "sine" },
                envelope: { attack: 0.001, decay: 0.022, sustain: 0, release: 0.015 }
            });
            this.rainDropletFilter = new Tone.Filter(2600, "bandpass");
            this.rainDropletPan = new Tone.Panner(0);
            this.rainDropletSynth.connect(this.rainDropletFilter);
            this.rainDropletFilter.connect(this.rainDropletPan);
            this.rainDropletPan.connect(this.waterBus);
            this.rainDropletSynth.volume.value = -12;

            // Canopy Leaf Drip / Water Puddle Splash Synth (Liquid Resonant Plop)
            this.leafDripSynth = new Tone.MembraneSynth({
                pitchDecay: 0.014,
                octaves: 1.4,
                oscillator: { type: "sine" },
                envelope: { attack: 0.001, decay: 0.048, sustain: 0, release: 0.03 }
            });
            this.leafDripPan = new Tone.Panner(0.2);
            this.leafDripSynth.connect(this.leafDripPan);
            this.leafDripPan.connect(this.waterBus);
            this.leafDripSynth.volume.value = -10;

            // Distant Rolling Thunder Rumbler
            this.thunderSynth = new Tone.MembraneSynth({
                pitchDecay: 0.08,
                octaves: 2.8,
                oscillator: { type: "sine" },
                envelope: { attack: 0.01, decay: 1.8, sustain: 0.05, release: 1.4 }
            });
            this.thunderFilter = new Tone.Filter(180, "lowpass");
            this.thunderSynth.connect(this.thunderFilter);
            this.thunderFilter.connect(this.canopyBus);
            this.thunderSynth.volume.value = -6;

            // Start ambient base noise generators
            this.leafNoise.start();
            this.windNoise.start();
            this.streamNoise.start();
            this.rainNoise.start();

            this.isInitialized = true;
        }

        start() {
            this.isActive = true;
            this.applyMode(this.mode);
            this.scheduleWindGusts();
            this.scheduleWildlifeEvents();
            this.scheduleDawnChorus();
            this.scheduleStreamBubbles();
            this.scheduleRainDroplets();
        }

        pause() {
            this.isActive = false;
            this.clearTimers();
            if (this.leafGain) this.leafGain.gain.rampTo(0, 0.05);
            if (this.windGain) this.windGain.gain.rampTo(0, 0.05);
            if (this.streamGain) this.streamGain.gain.rampTo(0, 0.05);
            if (this.cricketGain) this.cricketGain.gain.rampTo(0, 0.05);
            if (this.rainGain) this.rainGain.gain.rampTo(0, 0.05);
            if (this.rainDropletSynth && typeof Tone !== 'undefined') {
                try { this.rainDropletSynth.triggerRelease(); } catch(e) {}
            }
        }

        resume() {
            this.isActive = true;
            this.applyMode(this.mode);
            this.scheduleWindGusts();
            this.scheduleWildlifeEvents();
            this.scheduleDawnChorus();
            this.scheduleStreamBubbles();
            this.scheduleRainDroplets();
        }

        stop() {
            this.isActive = false;
            this.clearTimers();
            if (this.leafGain) this.leafGain.gain.rampTo(0, 0.05);
            if (this.windGain) this.windGain.gain.rampTo(0, 0.05);
            if (this.streamGain) this.streamGain.gain.rampTo(0, 0.05);
            if (this.cricketGain) this.cricketGain.gain.rampTo(0, 0.05);
            if (this.rainGain) this.rainGain.gain.rampTo(0, 0.05);
            if (this.rainDropletSynth && typeof Tone !== 'undefined') {
                try { this.rainDropletSynth.triggerRelease(); } catch(e) {}
            }
        }


        clearTimers() {
            if (this.wildlifeTimer) clearTimeout(this.wildlifeTimer);
            if (this.dawnChorusTimer) clearTimeout(this.dawnChorusTimer);
            if (this.gustTimer) clearTimeout(this.gustTimer);
            if (this.bubbleTimer) clearTimeout(this.bubbleTimer);
            if (this.thunderTimer) clearTimeout(this.thunderTimer);
            if (this.dropletTimer) clearTimeout(this.dropletTimer);
            this.dropletTimer = null;
            this.wildlifeTimer = null;
            this.dawnChorusTimer = null;
            this.gustTimer = null;
            this.bubbleTimer = null;
            this.thunderTimer = null;
        }

        setRainGain(vol) {
            this.rainIntensity = Math.max(0, Math.min(1, vol));
            if (!this.isActive || !this.isInitialized || this.waterMuted) {
                if (this.rainGain) this.rainGain.gain.rampTo(0, 0.05);
                if (this.dropletTimer) {
                    clearTimeout(this.dropletTimer);
                    this.dropletTimer = null;
                }
                return;
            }
            if (this.rainGain) {
                const targetGain = this.rainIntensity * 0.22;
                this.rainGain.gain.rampTo(targetGain, 0.2);
            }
            if (this.rainIntensity > 0.02 && !this.dropletTimer) {
                this.scheduleRainDroplets();
            }
        }

        scheduleRainDroplets() {
            if (!this.isActive || this.waterMuted || this.rainIntensity <= 0.02) {
                if (this.dropletTimer) {
                    clearTimeout(this.dropletTimer);
                    this.dropletTimer = null;
                }
                return;
            }

            const interval = 35 + Math.random() * 60; // 35ms - 95ms rapid pitter-patter
            this.dropletTimer = setTimeout(() => {
                if (!this.isActive || this.waterMuted || this.rainIntensity <= 0.02) return;

                if (this.rainDropletSynth && typeof Tone !== 'undefined') {
                    const pitches = ["A6", "B6", "C7", "D7", "E7", "F#7", "G7", "A7"];
                    const note = pitches[Math.floor(Math.random() * pitches.length)];
                    const pan = (Math.random() * 1.6) - 0.8;
                    const vel = 0.2 + (Math.random() * 0.45) * this.rainIntensity;

                    try {
                        if (this.rainDropletPan) this.rainDropletPan.pan.setValueAtTime(pan, Tone.now());
                        this.rainDropletSynth.triggerAttackRelease(note, 0.018, Tone.now(), vel);
                    } catch (e) {}
                }

                // Resonant leaf drip
                if (Math.random() < 0.20 * this.rainIntensity) {
                    this.playCanopyLeafDrip();
                }

                this.scheduleRainDroplets();
            }, interval);
        }

        playCanopyLeafDrip() {
            if (!this.leafDripSynth || this.waterMuted || typeof Tone === 'undefined') return;
            const dripNotes = ["F4", "G4", "A4", "C5", "D5", "E5"];
            const note = dripNotes[Math.floor(Math.random() * dripNotes.length)];
            const pan = (Math.random() * 1.4) - 0.7;
            try {
                if (this.leafDripPan) this.leafDripPan.pan.setValueAtTime(pan, Tone.now());
                this.leafDripSynth.triggerAttackRelease(note, 0.045, Tone.now(), 0.55);
            } catch (e) {}
        }

        playThunderRumble() {
            if (!this.thunderSynth || typeof Tone === 'undefined') return;
            const now = Tone.now();
            try {
                this.thunderSynth.triggerAttackRelease("C1", 1.8, now, 0.85);
                this.thunderSynth.triggerAttackRelease("G0", 2.2, now + 0.35, 0.7);
            } catch (e) {}
        }

        setMode(mode) {
            const valid = ['morning', 'afternoon', 'evening', 'night'];
            if (!valid.includes(mode)) return;
            this.mode = mode;
            this.applyMode(mode);
        }

        applyMode(mode) {
            if (mode === 'morning') {
                // Morning: Fresh breeze, lively birdsong chorus, quiet insects, prominent soothing stream
                this.windIntensity = 0.32;
                this.birdActivity = 0.95;
                this.streamIntensity = 0.70;
                this.rainIntensity = 0.05; // Light morning dew / mist

                if (this.isActive && this.isInitialized) {
                    this.setWindGain(0.12);
                    this.setStreamGain(0.16); // Prominent, continuous, soothing mountain stream
                    this.setCricketGain(0.0);
                }
            } else if (mode === 'afternoon') {
                // Afternoon: Warmer gusty wind, cicadas buzzing, moderate birds, vibrant stream
                this.windIntensity = 0.55;
                this.birdActivity = 0.45;
                this.streamIntensity = 0.65;
                this.rainIntensity = 0.0;

                if (this.isActive && this.isInitialized) {
                    this.setWindGain(0.16);
                    this.setStreamGain(0.15);
                    this.setCricketGain(0.08); // Afternoon cicada shimmer
                }
            } else if (mode === 'evening') {
                // Evening: Gentle calming breeze, twilight thrushes and owls, crickets waking
                this.windIntensity = 0.30;
                this.birdActivity = 0.60;
                this.streamIntensity = 0.65;
                this.rainIntensity = 0.15; // Soft evening shower

                if (this.isActive && this.isInitialized) {
                    this.setWindGain(0.12);
                    this.setStreamGain(0.15);
                    this.setCricketGain(0.12);
                }
            } else if (mode === 'night') {
                // Night: Soft mysterious wind, quiet owls, vibrant cricket and frog chorus
                this.windIntensity = 0.25;
                this.birdActivity = 0.25;
                this.streamIntensity = 0.55;
                this.rainIntensity = 0.0;

                if (this.isActive && this.isInitialized) {
                    this.setWindGain(0.10);
                    this.setStreamGain(0.13);
                    this.setCricketGain(0.20); // Night cricket choir
                }
            }
        }

        setWindGain(val) {
            if (this.canopyMuted) return;
            if (this.windGain) this.windGain.gain.rampTo(val, 0.4);
            if (this.leafGain) this.leafGain.gain.rampTo(val * 1.25, 0.4);
        }

        setStreamGain(val) {
            if (this.waterMuted) return;
            if (this.streamGain) this.streamGain.gain.rampTo(val, 0.4);
        }

        setCricketGain(val) {
            if (this.wildlifeMuted) return;
            if (this.cricketGain) this.cricketGain.gain.rampTo(val, 0.5);
        }

        playStreamGurgle() {
            if (!this.streamGurgleSynth || this.waterMuted || typeof Tone === 'undefined') return;
            const pitches = ["D4", "E4", "G4", "A4", "C5", "D5"];
            const note = pitches[Math.floor(Math.random() * pitches.length)];
            const now = Tone.now();
            const pan = -0.35 + (Math.random() * 0.4 - 0.2);
            try {
                if (this.streamPan) this.streamPan.pan.setValueAtTime(pan, now);
                this.streamGurgleSynth.triggerAttackRelease(note, 0.045, now, 0.7);
            } catch (e) {}
        }

        // Scheduled Natural Bubbling Stream Droplets & Liquid Gurgling
        scheduleStreamBubbles() {
            if (!this.isActive) return;

            // Rapid organic liquid cascade (140ms - 320ms) mimicking continuous running brook
            const delay = 140 + Math.random() * 180;
            this.bubbleTimer = setTimeout(() => {
                if (!this.isActive) return;

                if (!this.waterMuted && this.streamBubbleSynth && typeof Tone !== 'undefined') {
                    const dropletPitches = ["G3", "A3", "C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5"];
                    const pitch = dropletPitches[Math.floor(Math.random() * dropletPitches.length)];
                    const pan = -0.35 + (Math.random() * 0.4 - 0.2);
                    if (this.streamPan) {
                        try { this.streamPan.pan.setValueAtTime(pan, Tone.now()); } catch(e) {}
                    }

                    const vel = 0.28 + Math.random() * 0.42;
                    try {
                        this.streamBubbleSynth.triggerAttackRelease(pitch, 0.038, Tone.now(), vel);
                    } catch(e) {}
                }

                // Stochastic water gurgle into stone crevices
                if (Math.random() < 0.26) {
                    this.playStreamGurgle();
                }

                this.scheduleStreamBubbles();
            }, delay);
        }

        // Scheduled Natural Bird Song & Wildlife Events
        scheduleWildlifeEvents() {
            if (!this.isActive) return;

            // Cadence depends on day/night mode
            const baseDelay = this.mode === 'morning' ? 1800 : (this.mode === 'night' ? 5000 : 3200);
            const randomJitter = Math.random() * 2000;

            this.wildlifeTimer = setTimeout(() => {
                if (!this.isActive) return;

                if (!this.wildlifeMuted) {
                    if (this.mode === 'night') {
                        // Night: frogs, owls, rare nocturnal chirp
                        const roll = Math.random();
                        if (roll < 0.45) {
                            this.playFrogCroak();
                        } else if (roll < 0.8) {
                            this.playOwlHoot();
                        } else {
                            this.playBirdChirp();
                        }
                    } else if (this.mode === 'afternoon') {
                        // Afternoon: woodpeckers, cicadas, moderate songbird
                        if (Math.random() < 0.4) {
                            this.playWoodpeckerTaps();
                        } else {
                            this.playBirdChirp();
                        }
                    } else {
                        // Morning / Evening: Rich melodic birdsong choruses
                        this.playBirdChirp();
                        if (Math.random() < 0.35) {
                            setTimeout(() => this.playBirdChirp(), 450);
                        }
                    }
                }

                this.scheduleWildlifeEvents();
            }, baseDelay + randomJitter);
        }

        callBird(species = 'random') {
            if (this.wildlifeMuted) return null;

            const legacySpecies = ['thrush', 'robin', 'warbler', 'hummingbird'];
            const targetSpecies = species === 'random' ? legacySpecies[Math.floor(Math.random() * legacySpecies.length)] : species;

            let motif = [];
            let duration = 0.08;
            let interval = 0.09;
            let pan = (Math.random() * 1.4) - 0.7;

            if (targetSpecies === 'thrush') {
                // European Song Thrush: Ascending harmonic flute tones with ringing overtones
                motif = ["E6", "G6", "B6", "E7", "G7"];
                duration = 0.12;
                interval = 0.11;
            } else if (targetSpecies === 'robin') {
                // American Robin: Bright two-tone cheerful couplet whistle (4 notes)
                motif = ["A6", "F#6", "B6", "G6"];
                duration = 0.09;
                interval = 0.12;
            } else if (targetSpecies === 'european_robin') {
                // European Robin: Silvery liquid cascading warble
                motif = ["G6", "B6", "D7", "E7", "D7", "B6", "A6"];
                duration = 0.075;
                interval = 0.08;
            } else if (targetSpecies === 'blackbird') {
                // European Blackbird: Warm, fluty, contemplative woodland melody echoing through pines
                motif = ["D5", "F#5", "A5", "C6", "A5", "D6"];
                duration = 0.14;
                interval = 0.13;
            } else if (targetSpecies === 'chiffchaff') {
                // Common Chiffchaff: Sweet alternating couplet across Wutach Creek
                motif = ["E6", "B5", "E6", "B5", "E6"];
                duration = 0.08;
                interval = 0.10;
            } else if (targetSpecies === 'blackcap') {
                // Blackcap: Pure crystal woodland warble
                motif = ["F#6", "A6", "C#7", "B6", "A6", "F#6"];
                duration = 0.07;
                interval = 0.075;
            } else if (targetSpecies === 'warbler') {
                // Yellow Warbler: Cascading high-speed ornamental trill
                motif = ["D7", "C7", "B6", "A6", "G6", "E6"];
                duration = 0.055;
                interval = 0.065;
            } else if (targetSpecies === 'hummingbird') {
                // Hummingbird: Crystalline micro-chirps + high-pitch clicks
                motif = ["G7", "B7", "D8", "B7"];
                duration = 0.035;
                interval = 0.045;
                if (this.woodpeckerSynth && typeof Tone !== 'undefined') {
                    try { this.woodpeckerSynth.triggerAttackRelease("A1", 0.08, Tone.now(), 0.3); } catch (e) {}
                }
            } else if (targetSpecies === 'dove') {
                // Mourning Dove: Deep soothing gentle coo
                motif = ["D5", "G4", "F#4", "D4"];
                duration = 0.28;
                interval = 0.32;
            } else if (targetSpecies === 'chickadee') {
                // Black-capped Chickadee: Cheerful two-tone whistle + "chick-a-dee-dee"
                motif = ["E7", "B6", "G7", "G7", "G7"];
                duration = 0.07;
                interval = 0.085;
            } else if (targetSpecies === 'nightingale') {
                // Common Nightingale: Virtuoso liquid warbling trill
                motif = ["C7", "E7", "G7", "D8", "B7", "A7"];
                duration = 0.06;
                interval = 0.07;
            } else if (targetSpecies === 'woodpecker') {
                this.playWoodpeckerTaps();
                return { species: 'woodpecker', pan: 0 };
            } else if (targetSpecies === 'owl') {
                this.playOwlHoot();
                return { species: 'owl', pan: 0 };
            } else {
                motif = ["E6", "G6", "B6", "D7"];
            }

            if (this.birdPanner && typeof Tone !== 'undefined') {
                try { this.birdPanner.pan.setValueAtTime(pan, Tone.now()); } catch (e) {}
            }

            if (this.birdSynth && typeof Tone !== 'undefined') {
                const now = Tone.now();
                motif.forEach((pitch, i) => {
                    const noteTime = now + (i * interval);
                    try {
                        this.birdSynth.triggerAttackRelease(pitch, duration, noteTime, 0.75 + Math.random() * 0.25);
                    } catch (e) {}
                });
            }

            this.lastBirdChirpTime = performance.now();
            if (this.engine.onBirdChirpCallback) {
                this.engine.onBirdChirpCallback(pan, targetSpecies);
            }

            return { species: targetSpecies, motif, pan };
        }

        playBirdChirp() {
            return this.callBird('random');
        }

        // Continuous Subtle Dawn Chorus Bed
        scheduleDawnChorus() {
            if (!this.isActive) return;

            const interval = this.mode === 'morning' ? (1200 + Math.random() * 1600) : (2400 + Math.random() * 2600);
            this.dawnChorusTimer = setTimeout(() => {
                if (!this.isActive) return;
                if (!this.wildlifeMuted && (this.mode === 'morning' || this.mode === 'afternoon')) {
                    const softMotifs = [
                        ["F#6", "A6"],
                        ["B6", "G6"],
                        ["E7", "C7"]
                    ];
                    const motif = softMotifs[Math.floor(Math.random() * softMotifs.length)];
                    const pan = Math.random() * 1.6 - 0.8;
                    if (this.birdPanner) this.birdPanner.pan.setValueAtTime(pan, Tone.now());
                    const now = Tone.now();
                    motif.forEach((pitch, i) => {
                        try {
                            this.birdSynth.triggerAttackRelease(pitch, 0.05, now + (i * 0.08), 0.4);
                        } catch (e) {}
                    });
                }
                this.scheduleDawnChorus();
            }, interval);
        }

        playFrogCroak() {
            if (!this.frogSynth || this.wildlifeMuted) return;

            const now = Tone.now();
            const pan = -0.3 + (Math.random() * 0.4 - 0.2);
            if (this.frogPanner) this.frogPanner.pan.setValueAtTime(pan, now);

            // Resonant low double-pulse frog croak
            this.frogSynth.triggerAttackRelease("E2", 0.06, now, 0.6);
            this.frogSynth.triggerAttackRelease("D2", 0.08, now + 0.11, 0.5);
        }

        playWoodpeckerTaps() {
            if (!this.woodpeckerSynth || this.canopyMuted || typeof Tone === 'undefined') return;

            const baseTime = Tone.now() + 0.05;
            const pan = Math.random() * 0.8 - 0.4;
            try {
                if (this.woodpeckerPanner) this.woodpeckerPanner.pan.setValueAtTime(pan, baseTime);
            } catch (e) {}

            for (let i = 0; i < 5; i++) {
                const noteTime = baseTime + (i * 0.085);
                try {
                    this.woodpeckerSynth.triggerAttackRelease("C3", 0.035, noteTime);
                } catch (e) {}
            }
        }

        playOwlHoot() {
            if (!this.birdSynth || this.wildlifeMuted || typeof Tone === 'undefined') return;

            const baseTime = Tone.now() + 0.05;
            try {
                if (this.birdPanner) this.birdPanner.pan.setValueAtTime(Math.random() * 0.6 - 0.3, baseTime);
                this.birdSynth.triggerAttackRelease("G4", 0.35, baseTime);
                this.birdSynth.triggerAttackRelease("D4", 0.45, baseTime + 0.45);
            } catch (e) {}
        }

        // Scheduled Wind Gusts
        scheduleWindGusts() {
            if (!this.isActive) return;

            const delay = 6000 + Math.random() * 8000;
            this.gustTimer = setTimeout(() => {
                if (!this.isActive) return;

                if (!this.canopyMuted && this.windFilter) {
                    const peakFreq = 700 + Math.random() * 800;
                    this.windFilter.frequency.rampTo(peakFreq, 2.0);
                    setTimeout(() => {
                        if (this.windFilter) this.windFilter.frequency.rampTo(420, 3.5);
                    }, 2400);
                }

                this.scheduleWindGusts();
            }, delay);
        }

        onDataStep(pt, metrics) {
            // Adjust environmental balance based on real NASA GEDI vegetation metrics
            if (pt.canopyCover != null) {
                this.windIntensity = 0.2 + pt.canopyCover * 0.6;
            }
            if (pt.streamPresent != null) {
                const targetStream = pt.streamPresent ? 0.14 : 0.04;
                if (this.streamGain && !this.waterMuted) {
                    this.streamGain.gain.rampTo(targetStream, 0.8);
                }
            }
        }

        // Layer Volume Controls
        setMusicVolume(val) {
            this.musicVolume = Math.max(0, Math.min(1, val));
        }
        setCanopyVolume(val) {
            this.canopyVolume = Math.max(0, Math.min(1, val));
            if (this.canopyBus && typeof Tone !== 'undefined') {
                this.canopyBus.volume.rampTo(Tone.gainToDb(Math.max(0.0001, this.canopyVolume)), 0.1);
            }
        }
        setWildlifeVolume(val) {
            this.wildlifeVolume = Math.max(0, Math.min(1, val));
            if (this.wildlifeBus && typeof Tone !== 'undefined') {
                this.wildlifeBus.volume.rampTo(Tone.gainToDb(Math.max(0.0001, this.wildlifeVolume)), 0.1);
            }
        }
        setWaterVolume(val) {
            this.waterVolume = Math.max(0, Math.min(1, val));
            if (this.waterBus && typeof Tone !== 'undefined') {
                this.waterBus.volume.rampTo(Tone.gainToDb(Math.max(0.0001, this.waterVolume)), 0.1);
            }
        }

        // Layer Mute Toggles
        toggleMusicMute() {
            this.musicMuted = !this.musicMuted;
            return this.musicMuted;
        }
        toggleCanopyMute() {
            this.canopyMuted = !this.canopyMuted;
            if (this.canopyBus) {
                this.canopyBus.mute = this.canopyMuted;
            }
            return this.canopyMuted;
        }
        toggleWildlifeMute() {
            this.wildlifeMuted = !this.wildlifeMuted;
            if (this.wildlifeBus) {
                this.wildlifeBus.mute = this.wildlifeMuted;
            }
            return this.wildlifeMuted;
        }
        toggleWaterMute() {
            this.waterMuted = !this.waterMuted;
            if (this.waterBus) {
                this.waterBus.mute = this.waterMuted;
            }
            return this.waterMuted;
        }

        getMetrics() {
            return {
                mode: this.mode,
                windIntensity: this.windIntensity,
                birdActivity: this.birdActivity,
                streamIntensity: this.streamIntensity,
                rainIntensity: this.rainIntensity,
                lastBirdChirpTime: this.lastBirdChirpTime,
                musicMuted: this.musicMuted,
                canopyMuted: this.canopyMuted,
                wildlifeMuted: this.wildlifeMuted,
                waterMuted: this.waterMuted
            };
        }
    }

    // Export singleton instance to window
    if (typeof window !== 'undefined') {
        window.ForestSonificationEngine = ForestSonificationEngine;
        window.ForestSoundscapeManager = ForestSoundscapeManager;
        window.forestSonification = new ForestSonificationEngine();
    }

})(typeof window !== 'undefined' ? window : global);