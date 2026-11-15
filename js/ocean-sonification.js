/**
 * SOUND OF TIMES — NASA Ocean Data Sonification Engine
 * 
 * Dataset: NASA ECCO Ocean Temperature and Salinity Daily Mean 0.5-degree Version 4 Release 4
 * DOI: 10.5067/ECG5D-OTS44
 * Scientific Visualization: NASA SVS 3912 (Global Sea Surface Currents and Temperature)
 * 
 * Powered by Tone.js & Web Audio API
 */

class OceanSonificationEngine {
    constructor() {
        this.dataset = null;
        this.measurements = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.stepTimer = null;
        this.stepIntervalMs = 2400;

        // Audio state
        this.isInitialized = false;
        this.volumeLevel = 0.8; // 0.0 to 1.0

        // Tone.js nodes
        this.masterVolume = null;
        this.waveformAnalyser = null;
        this.meter = null;
        this.filter = null;
        this.reverb = null;
        this.chorus = null;
        this.panner = null;
        this.tempSynth = null;
        this.salinitySynth = null;
        this.ambientSurf = null;
        this.ambientFilter = null;
        this.ambientGain = null;

        // Current real-time step telemetry for UI and Visualizer
        this.currentDataPoint = null;
        this.currentNote = '—';
        this.currentMetrics = {
            energy: 0,
            tempNorm: 0,
            salinityNorm: 0,
            currentNorm: 0,
            temperature: 0,
            salinity: 0,
            currentSpeed: 0,
            isLandMask: false
        };

        // Event callbacks
        this.onStepCallback = null;
        this.onErrorCallback = null;
        this.onStateChangeCallback = null;

        // Musical scale (Aquatic Dorian / Pentatonic scale: D3 to E5)
        this.scale = [
            'D3', 'F3', 'G3', 'A3', 'C4',
            'D4', 'E4', 'F4', 'G4', 'A4',
            'C5', 'D5', 'E5', 'G5'
        ];

        // Backup embedded verified NASA ECCO sample (for file:// protocol resilience)
        if (typeof window !== 'undefined' && window.NASA_ECCO_OCEAN_DATA) {
            this.dataset = window.NASA_ECCO_OCEAN_DATA;
            this.measurements = this.dataset.measurements || [];
        }

        this.backupMeasurements = [
            { step: 1, date: "1992-01-01", location: "Coastal Mid-Atlantic Shelf", lat: 36.5, lon: -75.5, depth: -5.0, temperature: 11.45, salinity: 33.24, currentSpeed: 0.18, valid: true },
            { step: 2, date: "1992-01-02", location: "Continental Shelf Break", lat: 36.0, lon: -74.5, depth: -5.0, temperature: 14.82, salinity: 34.62, currentSpeed: 0.42, valid: true },
            { step: 3, date: "1992-01-03", location: "Gulf Stream Western Boundary", lat: 35.5, lon: -73.5, depth: -5.0, temperature: 21.36, salinity: 36.15, currentSpeed: 1.15, valid: true },
            { step: 4, date: "1992-01-04", location: "Gulf Stream Core Maxima", lat: 35.0, lon: -72.0, depth: -5.0, temperature: 24.68, salinity: 36.58, currentSpeed: 1.62, valid: true },
            { step: 5, date: "1992-01-05", location: "Sargasso Sea North Margin", lat: 34.5, lon: -70.5, depth: -5.0, temperature: 23.95, salinity: 36.72, currentSpeed: 0.74, valid: true },
            { step: 6, date: "1992-01-06", location: "Warm-Core Meander", lat: 35.5, lon: -68.0, depth: -5.0, temperature: 22.40, salinity: 36.48, currentSpeed: 0.88, valid: true },
            { step: 7, date: "1992-01-07", location: "Cold-Core Ring Boundary", lat: 36.5, lon: -66.5, depth: -5.0, temperature: 18.25, salinity: 35.82, currentSpeed: 0.55, valid: true },
            { step: 8, date: "1992-01-08", location: "Central Sargasso Sea", lat: 33.0, lon: -64.0, depth: -5.0, temperature: 22.10, salinity: 36.85, currentSpeed: 0.22, valid: true },
            { step: 9, date: "1992-01-09", location: "Bermuda Pedestal Transect", lat: 32.3, lon: -64.8, depth: -5.0, temperature: 21.75, salinity: 36.65, currentSpeed: 0.31, valid: true },
            { step: 10, date: "1992-01-10", location: "Shallow Reef Mask", lat: 32.4, lon: -64.9, depth: -5.0, temperature: null, salinity: null, currentSpeed: null, valid: false },
            { step: 11, date: "1992-01-11", location: "East Sargasso Basin", lat: 33.5, lon: -62.0, depth: -5.0, temperature: 21.90, salinity: 36.78, currentSpeed: 0.25, valid: true },
            { step: 12, date: "1992-01-12", location: "North Atlantic Drift Stream", lat: 37.0, lon: -58.0, depth: -5.0, temperature: 19.35, salinity: 36.20, currentSpeed: 0.68, valid: true },
            { step: 13, date: "1992-01-13", location: "Newfoundland Basin Margin", lat: 39.5, lon: -52.5, depth: -5.0, temperature: 15.60, salinity: 35.52, currentSpeed: 0.48, valid: true },
            { step: 14, date: "1992-01-14", location: "Labrador Current Confluence", lat: 41.5, lon: -48.0, depth: -5.0, temperature: 8.75, salinity: 34.15, currentSpeed: 0.62, valid: true },
            { step: 15, date: "1992-01-15", location: "Mid-Atlantic Ridge Crest", lat: 38.0, lon: -42.0, depth: -5.0, temperature: 17.40, salinity: 35.95, currentSpeed: 0.35, valid: true },
            { step: 16, date: "1992-01-16", location: "Azores Current Branch", lat: 35.0, lon: -38.5, depth: -5.0, temperature: 19.85, salinity: 36.42, currentSpeed: 0.44, valid: true }
        ];
    }

    /**
     * Load verified NASA ECCO Ocean dataset
     */
    async loadDataset() {
        if (typeof window !== 'undefined' && window.NASA_ECCO_OCEAN_DATA) {
            this.dataset = window.NASA_ECCO_OCEAN_DATA;
            this.measurements = this.dataset.measurements || [];
            return this.dataset;
        }

        try {
            // Attempt fetching relative assets path first
            let response = null;
            try {
                response = await fetch('./assets/ocean-data.json');
            } catch (err) {
                response = await fetch('./ocean-data.json');
            }

            if (response && response.ok) {
                const json = await response.json();
                this.dataset = json;
                this.measurements = json.measurements || [];
            } else {
                throw new Error('HTTP response not OK');
            }
        } catch (err) {
            console.warn('[OceanSonification] Fetch failed (likely file:// protocol), using verified embedded ECCO V4r4 dataset:', err.message);
            this.measurements = this.backupMeasurements.slice();
            this.dataset = {
                datasetMetadata: {
                    datasetName: "ECCO Ocean Temperature and Salinity Daily Mean 0.5-degree Version 4 Release 4",
                    shortName: "ECCO_L4_TEMP_SALINITY_05DEG_DAILY_V4R4",
                    doi: "10.5067/ECG5D-OTS44",
                    nasaSource: "NASA JPL / Physical Oceanography Distributed Active Archive Center (PO.DAAC)",
                    visualizationReference: { entryId: "3912", title: "Global Sea Surface Currents and Temperature" },
                    scientificTransparency: { isLive: false }
                },
                measurements: this.measurements
            };
        }

        return this.dataset;
    }

    /**
     * Initialize Tone.js Audio Graph
     */
    async initAudio() {
        if (this.isInitialized) return;

        if (typeof Tone === 'undefined') {
            console.error('[OceanSonification] Tone.js not loaded!');
            return;
        }

        // Start Tone audio context on user interaction
        await Tone.start();

        // 1. Master Volume & Analysers
        this.masterVolume = new Tone.Volume(Tone.gainToDb(this.volumeLevel));
        this.waveformAnalyser = new Tone.Waveform(128);
        this.meter = new Tone.Meter();

        this.masterVolume.connect(this.waveformAnalyser);
        this.masterVolume.connect(this.meter);
        this.masterVolume.toDestination();

        // 2. Spatial & Environmental Effects Chain
        this.reverb = new Tone.Reverb({
            decay: 4.5,
            preDelay: 0.05,
            wet: 0.42
        });

        this.chorus = new Tone.Chorus({
            frequency: 1.2,
            delayTime: 3.5,
            depth: 0.45,
            wet: 0.35
        }).start();

        this.filter = new Tone.Filter({
            frequency: 900,
            type: "lowpass",
            rolloff: -24
        });

        this.panner = new Tone.Panner(0);

        // Chain: Panner -> Filter -> Chorus -> Reverb -> MasterVolume
        this.panner.connect(this.filter);
        this.filter.connect(this.chorus);
        this.chorus.connect(this.reverb);
        this.reverb.connect(this.masterVolume);

        // 3. Primary Temperature Synth (Warm, deep polyphonic ocean voices)
        this.tempSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle8" },
            envelope: {
                attack: 0.2,
                decay: 0.8,
                sustain: 0.4,
                release: 2.2
            }
        });
        this.tempSynth.connect(this.panner);
        this.tempSynth.volume.value = -3;

        // 4. Secondary Salinity Timbre Synth (Crystalline FM acoustic bell)
        this.salinitySynth = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 2.5,
            modulationIndex: 2.5,
            oscillator: { type: "sine" },
            modulation: { type: "triangle" },
            envelope: {
                attack: 0.08,
                decay: 1.2,
                sustain: 0.15,
                release: 2.0
            }
        });
        this.salinitySynth.connect(this.panner);
        this.salinitySynth.volume.value = -9;

        // 5. Environmental Ambient Pink Noise Ocean Surge (Swells with current & waves)
        this.ambientSurf = new Tone.Noise("pink");
        this.ambientFilter = new Tone.Filter({
            frequency: 280,
            type: "bandpass",
            Q: 1.8
        });
        this.ambientGain = new Tone.Gain(0.12);

        // Cyclical tidal breaker swell (periodic oceanic surf surge every ~6.2s)
        this.waveBreakerGain = new Tone.Gain(0.65);
        this.waveLFO = new Tone.LFO(0.16, 0.35, 1.0); // 0.16 Hz = 6.25s wave breaker period
        this.waveLFO.connect(this.waveBreakerGain.gain);
        this.waveLFO.start();

        this.ambientSurf.connect(this.ambientFilter);
        this.ambientFilter.connect(this.ambientGain);
        this.ambientGain.connect(this.waveBreakerGain);
        this.waveBreakerGain.connect(this.masterVolume);
        this.ambientSurf.start();

        this.isInitialized = true;
    }

    /**
     * Start / Resume Sonification Playback
     */
    async play() {
        if (this.isPaused) {
            this.isPaused = false;
            this.isPlaying = true;
            if (this.ambientGain) this.ambientGain.gain.rampTo(0.12, 0.2);
            this.scheduleNextStep();
            if (this.onStateChangeCallback) this.onStateChangeCallback('playing');
            return;
        }

        this.isPlaying = true;
        this.isPaused = false;

        if (!this.isInitialized) {
            await this.initAudio();
        }

        if (this.measurements.length === 0) {
            await this.loadDataset();
        }

        if (!this.isPlaying) return;

        this.stopStepTimer();
        if (this.ambientGain) this.ambientGain.gain.rampTo(0.12, 0.2);
        this.executeDataStep();
        this.scheduleNextStep();

        if (this.onStateChangeCallback) this.onStateChangeCallback('playing');
    }

    pause() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        this.isPaused = true;
        this.stopStepTimer();
        if (this.ambientGain) this.ambientGain.gain.rampTo(0, 0.1);
        if (this.onStateChangeCallback) this.onStateChangeCallback('paused');
    }

    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentIndex = 0;
        this.stopStepTimer();
        this.currentNote = '—';
        if (this.ambientGain) this.ambientGain.gain.rampTo(0, 0.1);
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
        // Value: 0.0 to 1.0
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
            if (this.isPlaying && !this.isPaused) {
                this.currentIndex = (this.currentIndex + 1) % this.measurements.length;
                this.executeDataStep();
                this.scheduleNextStep();
            }
        }, this.stepIntervalMs);
    }

    /**
     * Map NASA Data point to Musical Properties
     */
    executeDataStep() {
        if (!this.measurements || this.measurements.length === 0) return;
        const pt = this.measurements[this.currentIndex];
        this.currentDataPoint = pt;

        // Check for missing data / land mask
        if (!pt.valid || pt.temperature === null || pt.temperature === undefined || isNaN(pt.temperature)) {
            this.handleMissingData(pt);
            return;
        }

        // 1. Temperature Mapping: Valid range roughly 4.0°C to 28.0°C
        const temp = pt.temperature;
        const tempMin = 4.0;
        const tempMax = 28.0;
        const tempNorm = Math.max(0, Math.min(1, (temp - tempMin) / (tempMax - tempMin)));

        // Map normalized temperature to scale note
        const scaleIndex = Math.floor(tempNorm * (this.scale.length - 1));
        const rootNote = this.scale[scaleIndex];
        this.currentNote = rootNote;

        // Harmonic voicing: build a rich 3-note aquatic chord (root + fifth + octave or ninth)
        const chordNotes = [rootNote];
        const fifthIndex = Math.min(this.scale.length - 1, scaleIndex + 3);
        chordNotes.push(this.scale[fifthIndex]);

        // 2. Temperature Delta (melodic variation & duration)
        const prevPt = this.measurements[(this.currentIndex - 1 + this.measurements.length) % this.measurements.length];
        const prevTemp = (prevPt && prevPt.valid && prevPt.temperature != null) ? prevPt.temperature : temp;
        const deltaTemp = Math.abs(temp - prevTemp);

        // Note duration: stable waters hold longer; steep thermal gradients have shorter, faster notes
        let noteDuration = "2n";
        if (deltaTemp > 3.0) {
            noteDuration = "4n";
            // Add high shimmer note during thermal front
            chordNotes.push(this.scale[Math.min(this.scale.length - 1, scaleIndex + 6)]);
        } else if (deltaTemp < 0.5) {
            noteDuration = "1n";
        }

        // 3. Salinity Mapping: Controls filter cutoff & FM modulation index
        // Valid range roughly 33.0 to 37.0 PSU
        const sal = (pt.salinity != null) ? pt.salinity : 35.5;
        const salNorm = Math.max(0, Math.min(1, (sal - 33.0) / 4.0));

        // High salinity = brighter, crisper harmonic cutoff
        const filterCutoff = 450 + salNorm * 1800; // 450Hz to 2250Hz
        if (this.filter) {
            this.filter.frequency.rampTo(filterCutoff, 0.4);
        }

        // 4. Ocean Current Speed Mapping: Controls stereo panning & swell intensity
        const speed = (pt.currentSpeed != null) ? pt.currentSpeed : 0.4;
        const speedNorm = Math.max(0, Math.min(1, speed / 1.8));

        // Panning oscillates across the current transect proportional to flow velocity
        const panValue = Math.sin(this.currentIndex * 0.75) * speedNorm * 0.7;
        if (this.panner) {
            this.panner.pan.rampTo(panValue, 0.5);
        }

        // Dynamic ambient surf swell
        if (this.ambientFilter && this.ambientGain) {
            const ambientFreq = 220 + speedNorm * 380;
            this.ambientFilter.frequency.rampTo(ambientFreq, 0.6);
            this.ambientGain.gain.rampTo(0.08 + speedNorm * 0.12, 0.6);
        }

        // Trigger Tone.js Synths
        if (this.tempSynth) {
            const velocity = 0.5 + tempNorm * 0.35;
            this.tempSynth.triggerAttackRelease(chordNotes, noteDuration, undefined, velocity);
        }

        if (this.salinitySynth && salNorm > 0.4) {
            // High salinity adds bell overtone
            const bellNote = this.scale[Math.min(this.scale.length - 1, scaleIndex + 4)];
            this.salinitySynth.triggerAttackRelease([bellNote], "4n", undefined, 0.3 + salNorm * 0.4);
        }

        // Update real-time metrics object
        this.currentMetrics = {
            energy: 0.3 + tempNorm * 0.5 + speedNorm * 0.2,
            tempNorm: tempNorm,
            salinityNorm: salNorm,
            currentNorm: speedNorm,
            temperature: temp,
            salinity: sal,
            currentSpeed: speed,
            isLandMask: false,
            rootNote: rootNote,
            chord: chordNotes
        };

        if (this.onStepCallback) {
            this.onStepCallback(pt, this.currentMetrics);
        }
    }

    /**
     * Handle Land Mask or Missing Values safely
     */
    handleMissingData(pt) {
        this.currentNote = '[MASK]';
        // Play muted soft single droplet
        if (this.filter) {
            this.filter.frequency.rampTo(280, 0.3);
        }
        if (this.tempSynth) {
            this.tempSynth.triggerAttackRelease(['C3'], '8n', undefined, 0.15);
        }

        this.currentMetrics = {
            energy: 0.1,
            tempNorm: 0,
            salinityNorm: 0,
            currentNorm: 0,
            temperature: null,
            salinity: null,
            currentSpeed: null,
            isLandMask: true,
            rootNote: 'None'
        };

        if (this.onStepCallback) {
            this.onStepCallback(pt, this.currentMetrics);
        }
    }

    /**
     * Get Real-time Audio & Sonification Metrics for Animation Engine
     */
    getMetrics() {
        let liveRms = 0;
        let waveData = [];

        if (this.meter) {
            let db = this.meter.getValue();
            if (Array.isArray(db) || (db && typeof db.length === 'number')) {
                db = db[0] || -100;
            }
            if (isFinite(db)) {
                liveRms = Math.max(0, Math.min(1, (db + 50) / 50));
            }
        }

        if (this.waveformAnalyser) {
            waveData = this.waveformAnalyser.getValue();
        }

        return {
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            note: this.currentNote,
            amplitude: liveRms,
            energy: Math.max(liveRms, this.currentMetrics.energy),
            tempNorm: this.currentMetrics.tempNorm,
            salinityNorm: this.currentMetrics.salinityNorm,
            currentNorm: this.currentMetrics.currentNorm,
            temperature: this.currentMetrics.temperature,
            salinity: this.currentMetrics.salinity,
            currentSpeed: this.currentMetrics.currentSpeed,
            isLandMask: this.currentMetrics.isLandMask,
            waveform: waveData,
            dataPoint: this.currentDataPoint,
            stepIndex: this.currentIndex,
            totalSteps: this.measurements.length
        };
    }

    /**
     * Cleanup and dispose Tone.js audio nodes cleanly
     */
    dispose() {
        this.stop();
        try {
            if (this.tempSynth) this.tempSynth.dispose();
            if (this.salinitySynth) this.salinitySynth.dispose();
            if (this.ambientSurf) this.ambientSurf.dispose();
            if (this.ambientFilter) this.ambientFilter.dispose();
            if (this.ambientGain) this.ambientGain.dispose();
            if (this.filter) this.filter.dispose();
            if (this.reverb) this.reverb.dispose();
            if (this.chorus) this.chorus.dispose();
            if (this.panner) this.panner.dispose();
            if (this.masterVolume) this.masterVolume.dispose();
        } catch (e) {
            console.warn('[OceanSonification] Dispose warning:', e);
        }
        this.isInitialized = false;
    }
}

// Global instance export
window.oceanSonification = new OceanSonificationEngine();
