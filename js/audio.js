/**
 * SOUND OF TIMES - Audio Engine & NASA Science Data Sonification Pipeline
 * Built using Web Audio API for 100% self-contained procedural synthesis and data sonification.
 */

// NASA Scientific Datasets used for sonification
const NASA_DATA = {
    // 1. Forest: NASA MODIS Global Terra/Aqua Normalized Difference Vegetation Index (NDVI)
    // 12 monthly global mean canopy greenness index values [Jan - Dec]
    forestNDVI: [
        { month: 'Jan', ndvi: 0.312, label: 'Boreal Winter / Austral Summer Greenness' },
        { month: 'Feb', ndvi: 0.318, label: 'Late Winter Dormancy' },
        { month: 'Mar', ndvi: 0.335, label: 'Equatorial Greening' },
        { month: 'Apr', ndvi: 0.362, label: 'Northern Spring Awakening' },
        { month: 'May', ndvi: 0.405, label: 'Canopy Expansion' },
        { month: 'Jun', ndvi: 0.438, label: 'Peak Northern Photosynthesis' },
        { month: 'Jul', ndvi: 0.445, label: 'Midsummer Boreal Maximum' },
        { month: 'Aug', ndvi: 0.430, label: 'Late Summer Maturity' },
        { month: 'Sep', ndvi: 0.395, label: 'Autumn Chlorophyll Decline' },
        { month: 'Oct', ndvi: 0.358, label: 'Foliage Transition' },
        { month: 'Nov', ndvi: 0.330, label: 'Pre-Winter Shedding' },
        { month: 'Dec', ndvi: 0.315, label: 'Winter Solstice Minimum' }
    ],

    // 2. Ocean: NASA TOPEX/Poseidon & Jason-3 Sea Surface Height Anomalies (mm) & OISST Global SST (°C)
    oceanData: [
        { year: '1993', ssha: -18.2, sst: 18.15, label: 'Baseline Satellite Altimetry' },
        { year: '1997', ssha: -7.5, sst: 18.32, label: 'Super El Niño Sea Elevation' },
        { year: '2001', ssha: 3.1, sst: 18.28, label: 'Post-Milennium Current Redistribution' },
        { year: '2005', ssha: 14.8, sst: 18.39, label: 'Mid-Decade Thermal Expansion' },
        { year: '2010', ssha: 26.4, sst: 18.46, label: 'La Niña Dynamic Modulation' },
        { year: '2015', ssha: 44.9, sst: 18.62, label: 'Pacific Decadal Oscillation Peak' },
        { year: '2019', ssha: 58.7, sst: 18.73, label: 'Global Marine Heatwave Phase' },
        { year: '2023', ssha: 71.3, sst: 18.89, label: 'Modern Sea Surface Maximum' }
    ],

    // 3. Atmosphere: NASA MERRA-2 Aerosol Optical Depth (AOD 550nm) & AIRS Global CO2 (ppm)
    atmosphereData: [
        { season: 'Winter', aod: 0.118, co2: 412.4, label: 'Polar Vortex Dry Stratification' },
        { season: 'Spring', aod: 0.165, co2: 416.8, label: 'Global Dust Transport & Biosphere Cycle' },
        { season: 'Summer', aod: 0.182, co2: 410.2, label: 'Wildfire Aerosol & Convective Storms' },
        { season: 'Autumn', aod: 0.134, co2: 411.9, label: 'Atmospheric Aerosol Dissipation' },
        { season: 'Annual Peak', aod: 0.198, co2: 421.1, label: 'Keeling Curve Extreme Amplitude' }
    ]
};

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.analyser = null;
        this.isInitialized = false;

        // Active procedural sources & nodes
        this.ambientNodes = [];
        this.recordNodes = [];
        this.pianoTimer = null;
        this.chimesTimer = null;
        this.birdsTimer = null;
        this.thunderTimer = null;
        this.dataSonificationTimer = null;

        // Playback state
        this.currentRecord = null; // 'forest', 'ocean', 'atmosphere', 'earth'
        this.isPlaying = false;
        this.isPaused = false;
        this.pauseTimeOffset = 0;
        this.playStartTime = 0;

        // Vinyl crackle node
        this.crackleNode = null;

        // FFT analysis array for audio-reactive visuals
        this.freqData = new Uint8Array(64);
        this.timeData = new Uint8Array(64);
        this.currentSceneAmbience = null;
    }

    init() {
        if (this.isInitialized && this.ctx) {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            return;
        }
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

            this.analyser = this.ctx.createAnalyser();
            this.analyser.fftSize = 128;
            this.analyser.smoothingTimeConstant = 0.8;

            this.masterGain.connect(this.analyser);
            this.analyser.connect(this.ctx.destination);

            this.isInitialized = true;

            if (this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }

            if (this.currentSceneAmbience && this.ambientNodes.length === 0 && !this.isPlaying) {
                this.startSceneAmbience(this.currentSceneAmbience);
            }
        } catch (e) {
            console.warn('AudioContext initialization error:', e);
        }
    }

    resume() {
        if (!this.isInitialized) {
            this.init();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        if (this.isInitialized && this.currentSceneAmbience && this.ambientNodes.length === 0 && !this.isPlaying) {
            this.startSceneAmbience(this.currentSceneAmbience);
        }
    }

    getAudioMetrics() {
        if (!this.analyser) return { energy: 0, bass: 0, treble: 0, waveform: [] };
        this.analyser.getByteFrequencyData(this.freqData);
        this.analyser.getByteTimeDomainData(this.timeData);

        let sum = 0, bassSum = 0, trebleSum = 0;
        for (let i = 0; i < this.freqData.length; i++) {
            sum += this.freqData[i];
            if (i < 8) bassSum += this.freqData[i];
            if (i > 32) trebleSum += this.freqData[i];
        }

        const energy = sum / (this.freqData.length * 255);
        const bass = bassSum / (8 * 255);
        const treble = trebleSum / (32 * 255);

        return {
            energy,
            bass,
            treble,
            rawFreq: this.freqData,
            rawTime: this.timeData
        };
    }

    // ----------------------------------------------------
    // UI SFX: Mechanical Jukebox Sounds, Clicks & Relays
    // ----------------------------------------------------

    playButtonSfx(freq = 600, duration = 0.08) {
        if (!this.isInitialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.4, this.ctx.currentTime + duration);

        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playRelayClickSfx() {
        if (!this.isInitialized) return;
        // Mechanical heavy relay switch (BZZT... CLICK)
        const t = this.ctx.currentTime;
        const noise = this.createNoiseBuffer(0.04);
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = noise;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, t);
        filter.Q.setValueAtTime(4, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        noiseSource.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noiseSource.start(t);

        // Low clunk
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
        oscGain.gain.setValueAtTime(0.4, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.12);
    }

    playNeonHumSfx(duration = 2.0) {
        if (!this.isInitialized) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, t); // 60Hz harmonic hum
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(60, t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, t);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.3);
        gain.gain.linearRampToValueAtTime(0.02, t + duration - 0.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc2.start(t);
        osc.stop(t + duration);
        osc2.stop(t + duration);
    }

    playVinylCrackle(enable = true) {
        if (!this.isInitialized) return;
        if (!enable) {
            if (this.crackleNode) {
                try {
                    this.crackleNode.stop();
                    this.crackleNode.disconnect();
                } catch (e) {}
                this.crackleNode = null;
            }
            return;
        }

        if (this.crackleNode) return;

        // Procedural 33 RPM vinyl surface crackle & micro-pops
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            // Sparse dust pops
            if (Math.random() < 0.0004) {
                data[i] = (Math.random() * 2 - 1) * 0.4;
            } else if (Math.random() < 0.002) {
                data[i] = (Math.random() * 2 - 1) * 0.12;
            } else {
                data[i] = (Math.random() * 2 - 1) * 0.015;
            }
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        source.start();
        this.crackleNode = source;
    }

    // ----------------------------------------------------
    // Atmospheric Scene Ambience & Quiet Piano Theme
    // ----------------------------------------------------

    startSceneAmbience(sceneName) {
        this.currentSceneAmbience = sceneName;
        this.stopSceneAmbience();
        if (!this.isInitialized) return;

        if (sceneName === 'alien_landscape' || sceneName === 'classroom') {
            // Gentle alien wind + low spaceship hum
            const wind = this.createWindGenerator(0.12, 350);
            const hum = this.createSpaceshipHum(0.04);
            this.ambientNodes.push(wind, hum);

            // Start soft melancholic piano theme
            this.startPianoTheme();
        } else if (sceneName === 'trail') {
            // Deeper cosmic wind + resonant crystal shimmer
            const wind = this.createWindGenerator(0.16, 280);
            this.ambientNodes.push(wind);
            this.startCrystalChimes();
        } else if (sceneName === 'home_interior') {
            // Warm cozy room tone + artificial beach water waves in background
            const roomTone = this.createWindGenerator(0.05, 200);
            const gentleBeach = this.createGentleWaves(0.08);
            this.ambientNodes.push(roomTone, gentleBeach);
        } else if (sceneName === 'spaceship_flight') {
            // Thrusters and cosmic velocity
            const thrusters = this.createSpaceshipLaunch(0.3);
            this.ambientNodes.push(thrusters);
        } else if (sceneName === 'earth_beach' || sceneName === 'coastal_ocean') {
            // Gentle rolling ocean waves surf + coastal sea breeze on Earth
            const oceanWaves = this.createGentleWaves(0.18);
            const seaBreeze = this.createWindGenerator(0.08, 550);
            this.ambientNodes.push(oceanWaves, seaBreeze);
            this.startPianoTheme();
        }
    }

    stopSceneAmbience() {
        this.ambientNodes.forEach(node => {
            try {
                if (node.stop) node.stop();
                if (node.disconnect) node.disconnect();
            } catch (e) {}
        });
        this.ambientNodes = [];

        if (this.pianoTimer) {
            clearInterval(this.pianoTimer);
            this.pianoTimer = null;
        }
        if (this.chimesTimer) {
            clearInterval(this.chimesTimer);
            this.chimesTimer = null;
        }
    }

    // Procedural Wind Generator
    createWindGenerator(baseGain = 0.1, cutoff = 400) {
        const noise = this.createNoiseBuffer(4);
        const source = this.ctx.createBufferSource();
        source.buffer = noise;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(cutoff, this.ctx.currentTime);

        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime); // slow swell

        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(150, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(baseGain, this.ctx.currentTime);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        source.start();
        lfo.start();

        return {
            stop: () => {
                try {
                    source.stop();
                    lfo.stop();
                    source.disconnect();
                    lfo.disconnect();
                } catch (e) {}
            }
        };
    }

    createSpaceshipHum(volume = 0.05) {
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(110, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(140, this.ctx.currentTime);

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);

        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc2.start();

        return {
            stop: () => {
                try {
                    osc.stop();
                    osc2.stop();
                    osc.disconnect();
                    osc2.disconnect();
                } catch (e) {}
            }
        };
    }

    createGentleWaves(volume = 0.1) {
        const noise = this.createNoiseBuffer(5);
        const source = this.ctx.createBufferSource();
        source.buffer = noise;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(320, this.ctx.currentTime);
        filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

        // LFO for wave ebb and flow
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime); // 5 second wave cycle

        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);

        lfo.connect(gain.gain);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        source.start();
        lfo.start();

        return {
            stop: () => {
                try {
                    source.stop();
                    lfo.stop();
                    source.disconnect();
                    lfo.disconnect();
                } catch (e) {}
            }
        };
    }

    createSpaceshipLaunch(volume = 0.35) {
        const noise = this.createNoiseBuffer(8);
        const source = this.ctx.createBufferSource();
        source.buffer = noise;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 10);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 3);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        source.start();

        // Sub rumble
        const sub = this.ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(40, this.ctx.currentTime);
        sub.frequency.linearRampToValueAtTime(75, this.ctx.currentTime + 8);
        const subGain = this.ctx.createGain();
        subGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

        sub.connect(subGain);
        subGain.connect(this.masterGain);
        sub.start();

        return {
            stop: () => {
                try {
                    source.stop();
                    sub.stop();
                    source.disconnect();
                    sub.disconnect();
                } catch (e) {}
            }
        };
    }

    startCrystalChimes() {
        if (this.chimesTimer) return;
        const notes = [440, 554.37, 659.25, 830.61, 987.77]; // A major pentatonic crystal chime
        this.chimesTimer = setInterval(() => {
            if (Math.random() < 0.6) {
                const note = notes[Math.floor(Math.random() * notes.length)];
                this.playTone(note, 1.8, 'sine', 0.08);
            }
        }, 2200);
    }

    // Procedural Piano Synthesizer for "Sound of Times" quiet theme
    startPianoTheme() {
        if (this.pianoTimer) return;

        // Warm, nostalgic chord progression in C#m / E major:
        // [C#m9 - Aadd9 - E - Bsus4]
        const chords = [
            // C#m9: C#3, G#3, D#4, E4
            [138.59, 207.65, 311.13, 329.63],
            // Aadd9: A2, E3, B3, C#4
            [110.00, 164.81, 246.94, 277.18],
            // Emaj: E2, B2, G#3, B3
            [82.41, 123.47, 207.65, 246.94],
            // Bsus4: B2, F#3, B3, E4
            [123.47, 185.00, 246.94, 329.63]
        ];

        let chordIndex = 0;
        const playChord = () => {
            const chord = chords[chordIndex];
            chord.forEach((freq, idx) => {
                setTimeout(() => {
                    this.playPianoNote(freq, 3.5, 0.075);
                }, idx * 140); // Arpeggiated gentle roll
            });
            chordIndex = (chordIndex + 1) % chords.length;
        };

        playChord();
        this.pianoTimer = setInterval(playChord, 5200);
    }

    playPianoNote(freq, decay = 3.0, velocity = 0.1) {
        if (!this.isInitialized) return;
        const t = this.ctx.currentTime;

        // Rich multi-harmonic piano model: fundamental + 2nd + 3rd harmonic
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const osc3 = this.ctx.createOscillator();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, t);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2.002, t); // slight detune

        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(freq * 3.004, t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 4.5, t);
        filter.frequency.exponentialRampToValueAtTime(freq * 1.5, t + decay);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(velocity, t + 0.02); // quick hammer strike
        gain.gain.exponentialRampToValueAtTime(velocity * 0.4, t + 0.35); // initial sustain
        gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

        osc1.connect(filter);
        osc2.connect(filter);
        osc3.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(t);
        osc2.start(t);
        osc3.start(t);
        osc1.stop(t + decay);
        osc2.stop(t + decay);
        osc3.stop(t + decay);
    }

    playTone(freq, duration = 1.0, type = 'sine', volume = 0.1) {
        if (!this.isInitialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // ----------------------------------------------------
    // JUKEBOX RECORD CONTROLS (PLAY, PAUSE, STOP, REPLAY, EJECT)
    // ----------------------------------------------------

    selectRecord(recordKey) {
        if (this.currentRecord === recordKey && (this.isPlaying || this.isPaused)) {
            return;
        }
        this.stopRecord();
        this.currentRecord = recordKey;
        this.isPaused = false;
        this.playButtonSfx(520, 0.05);
    }

    playRecord() {
        if (!this.currentRecord) return;
        this.init();
        this.resume();

        if (this.isPaused) {
            this.isPaused = false;
            this.isPlaying = true;
            this.playVinylCrackle(true);
            this.resumeSoundscape(this.currentRecord);
            return;
        }

        this.stopRecordNodes();
        this.isPlaying = true;
        this.isPaused = false;
        this.playStartTime = this.ctx ? this.ctx.currentTime : 0;
        this.playRelayClickSfx();
        this.playVinylCrackle(true);

        this.startSoundscape(this.currentRecord);
    }

    pauseRecord() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        this.isPaused = true;
        this.playButtonSfx(420, 0.06);
        this.playVinylCrackle(false);
        this.stopRecordNodes();
    }

    stopRecord() {
        this.isPlaying = false;
        this.isPaused = false;
        this.pauseTimeOffset = 0;
        this.playVinylCrackle(false);
        this.stopRecordNodes();
    }

    replayRecord() {
        this.stopRecord();
        this.playRecord();
    }

    ejectRecord() {
        this.stopRecord();
        this.playRelayClickSfx();
        this.currentRecord = null;
    }

    // ----------------------------------------------------
    // JUKEBOX MECHANICAL SOUND EFFECTS
    // ----------------------------------------------------

    playTurntableSpinupSfx() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(45, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.55);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, now);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.66);
    }

    playNeedleDropSfx() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // 1. Bass contact thud
        const thudOsc = this.ctx.createOscillator();
        const thudGain = this.ctx.createGain();
        thudOsc.type = 'sine';
        thudOsc.frequency.setValueAtTime(80, now);
        thudOsc.frequency.exponentialRampToValueAtTime(35, now + 0.08);
        thudGain.gain.setValueAtTime(0.12, now);
        thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        thudOsc.connect(thudGain);
        thudGain.connect(this.masterGain);
        thudOsc.start(now);
        thudOsc.stop(now + 0.1);

        // 2. Vinyl stylus friction pop
        const noise = this.createNoiseBuffer(0.12);
        const nSrc = this.ctx.createBufferSource();
        nSrc.buffer = noise;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.05, now + 0.04);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        const nFilter = this.ctx.createBiquadFilter();
        nFilter.type = 'bandpass';
        nFilter.frequency.setValueAtTime(1600, now + 0.04);
        nSrc.connect(nFilter);
        nFilter.connect(nGain);
        nGain.connect(this.masterGain);
        nSrc.start(now + 0.04);
        nSrc.stop(now + 0.13);
    }

    playRecordCarouselSfx() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Mechanical gear sliding and metallic ratchet clunk
        [0, 0.075].forEach((offset, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(idx === 0 ? 1150 : 780, now + offset);
            osc.frequency.exponentialRampToValueAtTime(320, now + offset + 0.045);
            gain.gain.setValueAtTime(0.08, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.05);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + offset);
            osc.stop(now + offset + 0.06);
        });
    }

    playNeedleLiftSfx() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1750, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    stopRecordNodes() {
        this.recordNodes.forEach(node => {
            try {
                if (node.stop) node.stop();
                if (node.disconnect) node.disconnect();
            } catch (e) {}
        });
        this.recordNodes = [];

        if (this.dataSonificationTimer) {
            clearInterval(this.dataSonificationTimer);
            this.dataSonificationTimer = null;
        }
        if (this.birdsTimer) {
            clearInterval(this.birdsTimer);
            this.birdsTimer = null;
        }
        if (this.thunderTimer) {
            clearInterval(this.thunderTimer);
            this.thunderTimer = null;
        }
    }

    // ----------------------------------------------------
    // NASA SCIENCE SONIFICATION & ENVIRONMENTAL SOUNDSCAPES
    // ----------------------------------------------------

    startSoundscape(key) {
        switch (key) {
            case 'forest':
                this.startForestSoundscape();
                break;
            case 'ocean':
                this.startOceanSoundscape();
                break;
            case 'atmosphere':
                this.startAtmosphereSoundscape();
                break;
            case 'earth':
                this.startEarthSoundscape();
                break;
        }
    }

    resumeSoundscape(key) {
        // Resuming is starting active nodes again smoothly
        this.startSoundscape(key);
    }

    // 1. FOREST SOUNDSCAPE
    // Environmental: Birds chirping, leaves rustling, gentle wind
    // NASA Science: MODIS Global NDVI cycle driving harmonic acoustic chimes
    startForestSoundscape() {
        // Leaves rustle & wind
        const wind = this.createWindGenerator(0.18, 550);
        this.recordNodes.push(wind);

        // Birds chirping loop
        this.birdsTimer = setInterval(() => {
            if (this.isPlaying && Math.random() < 0.75) {
                this.playBirdChirp();
            }
        }, 1100);

        // NASA MODIS NDVI Data Sonification Pipeline
        // Map 12 monthly NDVI values (0.312 -> 0.445) to pentatonic frequencies & brightness
        let dataIndex = 0;
        const playDataStep = () => {
            if (!this.isPlaying) return;
            const dataPoint = NASA_DATA.forestNDVI[dataIndex];
            
            // Sonification Mapping:
            // Base scale: Pentatonic C Major (C4, D4, E4, G4, A4, C5, D5)
            // Normalized NDVI: (ndvi - 0.3) / 0.15 => [0.0, 1.0]
            const norm = Math.max(0, Math.min(1, (dataPoint.ndvi - 0.31) / 0.14));
            const pentatonicFrequencies = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
            const noteIdx = Math.floor(norm * (pentatonicFrequencies.length - 1));
            const freq = pentatonicFrequencies[noteIdx];

            // Play acoustic marimba/synth sonification note
            this.playSonificationNote(freq, 1.2, 0.14, 'triangle', norm);

            // Trigger visual data packet event
            if (window.onNasaDataPoint) {
                window.onNasaDataPoint('forest', dataPoint, norm);
            }

            dataIndex = (dataIndex + 1) % NASA_DATA.forestNDVI.length;
        };

        playDataStep();
        this.dataSonificationTimer = setInterval(playDataStep, 1800);
    }

    playBirdChirp() {
        if (!this.isInitialized) return;
        const t = this.ctx.currentTime;
        const baseFreq = 1800 + Math.random() * 1200;
        const chirpCount = 1 + Math.floor(Math.random() * 3);

        for (let i = 0; i < chirpCount; i++) {
            const startT = t + i * 0.12;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseFreq, startT);
            osc.frequency.exponentialRampToValueAtTime(baseFreq + 800, startT + 0.05);
            osc.frequency.exponentialRampToValueAtTime(baseFreq - 300, startT + 0.09);

            gain.gain.setValueAtTime(0.001, startT);
            gain.gain.linearRampToValueAtTime(0.06, startT + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, startT + 0.09);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(startT);
            osc.stop(startT + 0.1);
        }
    }

    // 2. OCEAN SOUNDSCAPE
    // Environmental: Ocean waves, water flowing, gentle wind
    // NASA Science: TOPEX/Poseidon Sea Surface Height Anomaly & OISST Temperature Sonification
    startOceanSoundscape() {
        // Deep rhythmic ocean surf waves
        const wave1 = this.createOceanWave(0.25, 0.15); // primary surf
        const wave2 = this.createOceanWave(0.18, 0.22); // secondary swell
        this.recordNodes.push(wave1, wave2);

        // NASA Ocean Data Sonification Pipeline
        let oceanIdx = 0;
        const playOceanDataStep = () => {
            if (!this.isPlaying) return;
            const dataPoint = NASA_DATA.oceanData[oceanIdx];

            // Mapping: SSHA (-18mm to +71mm) maps to sub-bass resonance & melodic water chime
            // SST (18.15°C to 18.89°C) maps to chime timbre and filter cutoff
            const sshaNorm = (dataPoint.ssha + 20) / 95; // 0 to 1
            const sstNorm = (dataPoint.sst - 18.1) / 0.8; // 0 to 1

            // Sub bass wave surge
            const bassFreq = 65 + sshaNorm * 45;
            this.playSubBassSurge(bassFreq, 3.2, 0.15);

            // Water chime
            const chimeScale = [220, 277.18, 329.63, 440, 554.37, 659.25];
            const chimeFreq = chimeScale[Math.floor(sstNorm * (chimeScale.length - 1))];
            this.playSonificationNote(chimeFreq, 2.5, 0.12, 'sine', sstNorm);

            if (window.onNasaDataPoint) {
                window.onNasaDataPoint('ocean', dataPoint, sshaNorm);
            }

            oceanIdx = (oceanIdx + 1) % NASA_DATA.oceanData.length;
        };

        playOceanDataStep();
        this.dataSonificationTimer = setInterval(playOceanDataStep, 2400);
    }

    createOceanWave(volume = 0.2, cycleSpeed = 0.18) {
        const noise = this.createNoiseBuffer(6);
        const source = this.ctx.createBufferSource();
        source.buffer = noise;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, this.ctx.currentTime);

        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(cycleSpeed, this.ctx.currentTime);

        const lfoFilterGain = this.ctx.createGain();
        lfoFilterGain.gain.setValueAtTime(380, this.ctx.currentTime);
        lfo.connect(lfoFilterGain);
        lfoFilterGain.connect(filter.frequency);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume * 0.4, this.ctx.currentTime);

        const lfoAmpGain = this.ctx.createGain();
        lfoAmpGain.gain.setValueAtTime(volume * 0.6, this.ctx.currentTime);
        lfo.connect(lfoAmpGain);
        lfoAmpGain.connect(gain.gain);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        source.start();
        lfo.start();

        return {
            stop: () => {
                try {
                    source.stop();
                    lfo.stop();
                    source.disconnect();
                    lfo.disconnect();
                } catch (e) {}
            }
        };
    }

    playSubBassSurge(freq, duration = 3.0, volume = 0.15) {
        if (!this.isInitialized) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.linearRampToValueAtTime(freq * 0.85, t + duration);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(volume, t + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + duration);
    }

    // 3. ATMOSPHERE SOUNDSCAPE
    // Environmental: Wind, rainfall, distant thunder
    // NASA Science: MERRA-2 Aerosol Optical Depth (AOD) & AIRS CO2 sonification
    startAtmosphereSoundscape() {
        // Continuous rain & wind
        const rain = this.createRainGenerator(0.22);
        const wind = this.createWindGenerator(0.20, 480);
        this.recordNodes.push(rain, wind);

        // Thunder rumbler timer
        this.thunderTimer = setInterval(() => {
            if (this.isPlaying && Math.random() < 0.4) {
                this.playThunderClap();
            }
        }, 5500);

        // NASA MERRA-2 Atmosphere Data Sonification
        let atmIdx = 0;
        const playAtmStep = () => {
            if (!this.isPlaying) return;
            const dataPoint = NASA_DATA.atmosphereData[atmIdx];

            // AOD (0.118 to 0.198) modulates atmospheric tension chord
            // CO2 (410 to 421 ppm) modulates ethereal high harmonics
            const aodNorm = (dataPoint.aod - 0.11) / 0.09;
            const co2Norm = (dataPoint.co2 - 410) / 11;

            // Atmospheric pad chord (Ethereal open fifths)
            const rootFreq = 174.61; // F3
            const fifthFreq = 261.63; // C4
            const octaveFreq = 349.23 * (1 + co2Norm * 0.05);

            this.playSonificationNote(rootFreq, 3.2, 0.08, 'sawtooth', aodNorm);
            this.playSonificationNote(fifthFreq, 3.5, 0.06, 'triangle', co2Norm);
            this.playSonificationNote(octaveFreq, 4.0, 0.05, 'sine', co2Norm);

            if (window.onNasaDataPoint) {
                window.onNasaDataPoint('atmosphere', dataPoint, aodNorm);
            }

            atmIdx = (atmIdx + 1) % NASA_DATA.atmosphereData.length;
        };

        playAtmStep();
        this.dataSonificationTimer = setInterval(playAtmStep, 3200);
    }

    createRainGenerator(volume = 0.2) {
        const noise = this.createNoiseBuffer(3);
        const source = this.ctx.createBufferSource();
        source.buffer = noise;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        source.start();

        return {
            stop: () => {
                try {
                    source.stop();
                    source.disconnect();
                } catch (e) {}
            }
        };
    }

    playThunderClap() {
        if (!this.isInitialized) return;
        const t = this.ctx.currentTime;
        const noise = this.createNoiseBuffer(2.5);
        const source = this.ctx.createBufferSource();
        source.buffer = noise;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, t);
        filter.frequency.exponentialRampToValueAtTime(60, t + 2.5);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.38, t + 0.15); // sharp rumble
        gain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        source.start(t);

        // Sub bass shockwave
        const sub = this.ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(50, t);
        sub.frequency.exponentialRampToValueAtTime(25, t + 2.0);
        const subGain = this.ctx.createGain();
        subGain.gain.setValueAtTime(0.3, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);

        sub.connect(subGain);
        subGain.connect(this.masterGain);
        sub.start(t);
        sub.stop(t + 2.0);

        // Flash event callback if attached
        if (window.onThunderFlash) {
            window.onThunderFlash();
        }
    }

    // 4. EARTH (COMPLETE ARCHIVE)
    // Master composition: Combining Forest, Ocean, Atmosphere data sonifications
    // into an overarching harmonious counterpoint along with the quiet nostalgic piano theme
    startEarthSoundscape() {
        // Combined environmental layer: Gentle waves + light rain + soft wind
        const wind = this.createWindGenerator(0.12, 400);
        const waves = this.createOceanWave(0.14, 0.15);
        this.recordNodes.push(wind, waves);

        // Occasional distant bird
        this.birdsTimer = setInterval(() => {
            if (this.isPlaying && Math.random() < 0.6) {
                this.playBirdChirp();
            }
        }, 2200);

        // Emotional Earth counterpoint combining MODIS, TOPEX, MERRA-2
        let step = 0;
        const playEarthCombinedStep = () => {
            if (!this.isPlaying) return;

            const forestPt = NASA_DATA.forestNDVI[step % NASA_DATA.forestNDVI.length];
            const oceanPt = NASA_DATA.oceanData[step % NASA_DATA.oceanData.length];
            const atmPt = NASA_DATA.atmosphereData[step % NASA_DATA.atmosphereData.length];

            // Harmonic Earth chords:
            // Progression: Dm9 -> G13 -> Cmaj9 -> Am9 (The circle of Earth's seasons)
            const progressionNotes = [
                [293.66, 349.23, 440.00, 523.25, 659.25], // Dm9
                [196.00, 246.94, 329.63, 392.00, 523.25], // G13
                [261.63, 329.63, 392.00, 493.88, 587.33], // Cmaj9
                [220.00, 261.63, 329.63, 440.00, 523.25]  // Am9
            ];

            const currentChord = progressionNotes[step % progressionNotes.length];
            currentChord.forEach((freq, idx) => {
                setTimeout(() => {
                    this.playPianoNote(freq, 4.0, 0.08);
                }, idx * 160);
            });

            // NASA Sonification chime highlighting combined Earth stability
            const chimeFreq = 523.25 + (forestPt.ndvi * 400);
            this.playSonificationNote(chimeFreq, 2.2, 0.09, 'sine', 0.8);

            if (window.onNasaDataPoint) {
                window.onNasaDataPoint('earth', {
                    ndvi: forestPt,
                    ocean: oceanPt,
                    atmosphere: atmPt,
                    label: 'Unified Earth Observation Sonification'
                }, 1.0);
            }

            step++;
        };

        playEarthCombinedStep();
        this.dataSonificationTimer = setInterval(playEarthCombinedStep, 3800);
    }

    playSonificationNote(freq, duration = 1.5, volume = 0.1, type = 'triangle', brightness = 0.5) {
        if (!this.isInitialized) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * (1.5 + brightness * 3.5), t);
        filter.Q.setValueAtTime(2.0, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(volume, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + duration);
    }

    createNoiseBuffer(seconds = 3) {
        const bufferSize = this.ctx.sampleRate * seconds;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }
}

// Global singleton instance
window.soundEngine = new SoundEngine();
