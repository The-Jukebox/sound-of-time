/**
 * SOUND OF TIMES - Main Game Engine, Scene Management & Narrative State
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new PixelRenderer(this.canvas);
        this.sound = window.soundEngine;

        // Game resolution
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Current scene: 'scene1', 'scene2', 'scene3', 'scene4', 'scene5', 'scene6', 'scene7', 'credits'
        this.currentScene = 'scene1';
        this.sceneTime = 0;

        // Characters
        this.eli = {
            x: 90,
            y: this.height * 0.74,
            state: 'idle', // 'idle', 'walk', 'kneel'
            facing: 1,
            speed: 90,
            isCarrying: false
        };

        this.koru = {
            x: 140,
            y: this.height * 0.74,
            state: 'idle',
            facing: -1,
            speed: 80
        };

        // Camera
        this.cameraX = 0;

        // Input
        this.keys = {};
        this.setupInput();

        // Dialogue System
        this.dialogueQueue = [];
        this.currentDialogue = null;
        this.dialogueCharIndex = 0;
        this.dialogueTextTimer = 0;
        this.isTyping = false;

        // Choice Menu System
        this.activeChoice = null; // { title, options: [{text, action}], selectedIndex }

        // Jukebox State
        this.jukeboxState = {
            isPowered: false,
            isPlaying: false,
            isPaused: false,
            activeRecord: null,
            unlockedRecords: {
                forest: true,
                ocean: true,
                atmosphere: true,
                earth: false // unlocked after playing 1, 2, 3
            },
            playedRecords: new Set(),
            inspectionStep: 0,
            takenToShip: true
        };

        // Classroom state
        this.classroomBoard = 'earth';

        // Scene 7 Flight progress
        this.flightProgress = 0;

        // UI elements
        this.ui = {
            dialogueBox: document.getElementById('dialogueBox'),
            speakerName: document.getElementById('speakerName'),
            dialogueText: document.getElementById('dialogueText'),
            continuePrompt: document.getElementById('continuePrompt'),
            choiceBox: document.getElementById('choiceBox'),
            choiceTitle: document.getElementById('choiceTitle'),
            choiceOptions: document.getElementById('choiceOptions'),
            jukeboxPanel: document.getElementById('jukeboxPanel'),
            nasaHud: document.getElementById('nasaHud'),
            hudMetric: document.getElementById('hudMetric'),
            hudValue: document.getElementById('hudValue'),
            hudDesc: document.getElementById('hudDesc'),
            screenPrompt: document.getElementById('screenPrompt'),
            sceneOverlay: document.getElementById('sceneOverlay'),
            overlayTitle: document.getElementById('overlayTitle'),
            overlaySubtitle: document.getElementById('overlaySubtitle')
        };

        // Global NASA Data callback
        window.onNasaDataPoint = (type, dataPoint, norm) => {
            this.updateNasaHud(type, dataPoint, norm);
        };
        window.onThunderFlash = () => {
            this.renderer.triggerFlash();
        };

        // Start animation loop
        this.lastTime = performance.now();
        this.initScene('scene1');
        requestAnimationFrame((t) => this.loop(t));
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.sound.resume();
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;

            // Dialogue continue / Choice select
            if (e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.code === 'Space') {
                if (this.currentDialogue) {
                    this.advanceDialogue();
                    e.preventDefault();
                    return;
                }
            }

            // Choice navigation
            if (this.activeChoice) {
                if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                    this.navigateChoice(-1);
                    e.preventDefault();
                } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                    this.navigateChoice(1);
                    e.preventDefault();
                } else if (e.key === 'Enter' || e.key === 'e' || e.key === 'E' || e.code === 'Space') {
                    this.confirmChoice();
                    e.preventDefault();
                }
                return;
            }

            // Power button toggle shortcut
            if (this.currentScene === 'scene5' || this.currentScene === 'scene4') {
                if (e.key === 'p' || e.key === 'P') {
                    this.toggleJukeboxPower();
                    e.preventDefault();
                }
            }

            // Jukebox Shortcuts (When in scene 5)
            if (this.currentScene === 'scene5') {
                if (e.code === 'Space') {
                    this.toggleJukeboxPlayPause();
                    e.preventDefault();
                } else if (e.key === 's' || e.key === 'S') {
                    this.stopJukebox();
                    e.preventDefault();
                } else if (e.key === 'r' || e.key === 'R') {
                    this.replayJukebox();
                    e.preventDefault();
                } else if (e.key === 'e' || e.key === 'E') {
                    this.ejectJukebox();
                    e.preventDefault();
                } else if (e.key === '1') {
                    this.selectJukeboxRecord('forest');
                } else if (e.key === '2') {
                    this.selectJukeboxRecord('ocean');
                } else if (e.key === '3') {
                    this.selectJukeboxRecord('atmosphere');
                } else if (e.key === '4') {
                    if (this.jukeboxState.unlockedRecords.earth) {
                        this.selectJukeboxRecord('earth');
                    }
                } else if (e.key === 'ArrowLeft') {
                    this.cycleRecord(-1);
                } else if (e.key === 'ArrowRight') {
                    this.cycleRecord(1);
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });

        // Click on canvas to resume sound or advance dialogue
        this.canvas.addEventListener('click', () => {
            this.sound.resume();
            if (this.currentDialogue) {
                this.advanceDialogue();
            }
        });
    }

    // ----------------------------------------------------
    // SCENE INITIALIZATION & TRANSITIONS
    // ----------------------------------------------------

    initScene(sceneName) {
        this.currentScene = sceneName;
        this.sceneTime = 0;
        this.clearPrompt();

        // Close UI overlays
        this.ui.jukeboxPanel.style.display = 'none';
        this.ui.nasaHud.style.display = 'none';
        this.hideChoice();

        switch (sceneName) {
            case 'scene1':
                this.initScene1();
                break;
            case 'scene2':
                this.initScene2();
                break;
            case 'scene3':
                this.initScene3();
                break;
            case 'scene4':
                this.initScene4();
                break;
            case 'scene5':
                this.initScene5();
                break;
            case 'scene6':
                this.initScene6();
                break;
            case 'scene7':
                this.initScene7();
                break;
            case 'credits':
                this.initCredits();
                break;
        }
    }

    showSceneOverlay(title, subtitle, duration = 3500) {
        this.ui.overlayTitle.innerText = title;
        this.ui.overlaySubtitle.innerText = subtitle;
        this.ui.sceneOverlay.style.opacity = '1';
        this.ui.sceneOverlay.style.pointerEvents = 'auto';

        setTimeout(() => {
            this.ui.sceneOverlay.style.opacity = '0';
            this.ui.sceneOverlay.style.pointerEvents = 'none';
        }, duration);
    }

    // SCENE 1 — A HOME FAR FROM HOME
    initScene1() {
        this.sound.startSceneAmbience('alien_landscape');
        this.showSceneOverlay('SOUND OF TIMES', 'ERID — SOME TIME AFTER THE JOURNEY', 3200);

        this.eli.x = 95;
        this.eli.y = this.height * 0.74;
        this.eli.facing = 1;
        this.eli.state = 'idle';
        this.eli.isCarrying = false;

        this.koru.x = 165;
        this.koru.y = this.height * 0.74;
        this.koru.facing = -1;

        // Opening dialogue
        setTimeout(() => {
            this.queueDialogues([
                { speaker: 'KORU', text: 'Eli! Your students are waiting.' },
                { speaker: 'ELI', text: 'Already? I thought I had another five minutes.' },
                { speaker: 'KORU', text: 'Your five minutes are always longer than our five minutes.' },
                { speaker: 'ELI', text: '(laughs) Come on, let\'s go teach them something.' }
            ], () => {
                this.showPrompt('[A/D] or [←/→] WALK TOWARDS THE CLASSROOM');
            });
        }, 1800);
    }

    // SCENE 2 — THE LITTLE ROCK STUDENTS
    initScene2() {
        this.sound.startSceneAmbience('classroom');
        this.classroomBoard = 'earth';

        this.eli.x = 80;
        this.eli.facing = 1;
        this.koru.x = 420;
        this.koru.facing = -1;

        this.queueDialogues([
            {
                speaker: 'ELI',
                text: 'Okay, everyone. Today we\'re going to talk about something very special. A planet called Earth.'
            },
            {
                speaker: 'LITTLE ROCK 1',
                text: 'Is Earth made of rocks?'
            },
            {
                speaker: 'ELI',
                text: 'Well... partly! But it also has forests, oceans, mountains and so many living things.'
            },
            {
                speaker: 'LITTLE ROCK 2',
                text: 'What is a forest?'
            },
            {
                speaker: 'ELI',
                text: 'A place filled with trees. Imagine thousands of them, all moving gently in the wind.',
                onShow: () => { this.classroomBoard = 'forest'; }
            },
            {
                speaker: 'LITTLE ROCK 3',
                text: 'What is rain?'
            },
            {
                speaker: 'ELI',
                text: 'Water falling from the sky.',
                onShow: () => { this.classroomBoard = 'rain'; }
            },
            {
                speaker: 'LITTLE ROCK 1',
                text: 'And what does it sound like?'
            },
            {
                speaker: 'ELI',
                text: '...'
            },
            {
                speaker: 'ELI',
                text: 'It sounds... beautiful.'
            },
            {
                speaker: 'KORU',
                text: 'You talk about Earth quite often.'
            },
            {
                speaker: 'ELI',
                text: 'I suppose I do.'
            }
        ], () => {
            this.showPrompt('CLASS DISMISSED. WALKING HOME TOGETHER...');
            setTimeout(() => {
                this.initScene('scene3');
            }, 2000);
        });
    }

    // SCENE 3 — SOMETHING BETWEEN THE ROCKS
    initScene3() {
        this.sound.startSceneAmbience('trail');
        this.eli.x = 100;
        this.eli.facing = 1;
        this.eli.state = 'walk';
        this.eli.isCarrying = false;

        this.koru.x = 60;
        this.koru.facing = 1;
        this.koru.state = 'walk';

        this.queueDialogues([
            { speaker: 'KORU', text: 'Your students seem to like Earth.' },
            { speaker: 'ELI', text: 'I think they like the idea of somewhere different.' },
            { speaker: 'KORU', text: 'Is Earth really as beautiful as you say?' },
            { speaker: 'ELI', text: 'More beautiful.' }
        ], () => {
            this.queueDialogues([
                {
                    speaker: 'ELI',
                    text: 'Wait. What\'s that?',
                    onShow: () => {
                        this.eli.state = 'idle';
                        this.koru.state = 'idle';
                    }
                }
            ], () => {
                this.showPrompt('[WALK TO THE GOLDEN LIGHT AND PRESS E TO INSPECT]');
            });
        });
    }

    // SCENE 4 — THE JUKEBOX
    initScene4() {
        this.sound.startSceneAmbience('home_interior');
        this.sound.init();

        this.eli.x = 220;
        this.eli.facing = 1;
        this.eli.state = 'idle';
        this.eli.isCarrying = false;

        this.koru.x = 420;
        this.koru.facing = -1;
        this.koru.state = 'idle';

        this.queueDialogues([
            { speaker: 'ELI', text: 'Let\'s see what you\'ve got.' }
        ], () => {
            this.showChoiceMenu('CHOICE 2 — What should we do with the jukebox?', [
                {
                    text: '1. TURN IT ON',
                    action: () => this.powerOnJukebox()
                },
                {
                    text: '2. INSPECT THE RECORDS',
                    action: () => this.inspectRecordsDialogue()
                },
                {
                    text: '3. MOVE IT CLOSER',
                    action: () => this.moveJukeboxDialogue()
                },
                {
                    text: '4. LEAVE IT OFF',
                    action: () => this.leaveOffDialogue()
                }
            ]);
        });
    }

    inspectRecordsDialogue() {
        this.queueDialogues([
            { speaker: 'ELI', text: 'There are four distinct slots. Etched with intricate magnetic grooves.' },
            { speaker: 'KORU', text: 'Does it play music?' },
            { speaker: 'ELI', text: 'Let\'s turn it on to find out.' }
        ], () => {
            this.powerOnJukebox();
        });
    }

    moveJukeboxDialogue() {
        this.queueDialogues([
            { speaker: 'ELI', text: 'Careful... it\'s heavier than it looks. Brass and solid Earth oak.' },
            { speaker: 'KORU', text: 'It has made a long voyage across the stars.' }
        ], () => {
            this.powerOnJukebox();
        });
    }

    leaveOffDialogue() {
        this.queueDialogues([
            { speaker: 'KORU', text: 'Aren\'t you curious, Eli? It came all the way from your world.' },
            { speaker: 'ELI', text: 'You\'re right, Koru. Let\'s see what it has.' }
        ], () => {
            this.powerOnJukebox();
        });
    }

    powerOnJukebox() {
        this.sound.playRelayClickSfx();
        this.sound.playNeonHumSfx(3.0);
        this.jukeboxState.isPowered = true;

        this.queueDialogues([
            { speaker: 'SYSTEM', text: '*BZZT... CLICK... HUM...*' },
            { speaker: 'SYSTEM', text: 'DISPLAY: [ EARTH ARCHIVE — 001 ]' },
            { speaker: 'ELI', text: 'Earth archive? Wait... these are sounds from Earth.' },
            { speaker: 'KORU', text: 'It remembers your planet?' },
            { speaker: 'ELI', text: 'I think it does.' }
        ], () => {
            this.initScene('scene5');
        });
    }

    // SCENE 5 — THE SOUND COLLECTION
    initScene5() {
        this.sound.startSceneAmbience('home_interior');
        this.ui.jukeboxPanel.style.display = 'flex';
        this.ui.nasaHud.style.display = 'block';

        this.setupJukeboxUI();
        this.showPrompt('[CLICK JUKEBOX CONTROLS OR USE KEYS: SPACE=PLAY/PAUSE | S=STOP | R=REPLAY | E=EJECT | 1-4=RECORDS]');

        // Auto-select Forest record first
        this.selectJukeboxRecord('forest');
    }

    // SCENE 6 — THE DECISION
    initScene6() {
        this.sound.stopRecord();
        this.ui.jukeboxPanel.style.display = 'none';
        this.ui.nasaHud.style.display = 'none';
        this.sound.startSceneAmbience('home_interior');

        this.eli.x = 240;
        this.eli.facing = 1;
        this.koru.x = 380;
        this.koru.facing = -1;

        this.queueDialogues([
            { speaker: 'KORU', text: 'You miss it.' },
            { speaker: 'ELI', text: 'Every day.' },
            { speaker: 'KORU', text: 'Then why didn\'t you tell me?' },
            { speaker: 'ELI', text: 'I didn\'t realise how much I missed it until I heard it again.' },
            { speaker: 'KORU', text: 'Could we go there?' },
            { speaker: 'ELI', text: 'You mean... Earth?' },
            { speaker: 'KORU', text: 'You showed me its forests. Its oceans. Its rain. I want to hear them for real.' },
            { speaker: 'ELI', text: 'Then what are we waiting for?' }
        ], () => {
            this.showChoiceMenu('CHOICE 3 — What do we do with the jukebox?', [
                {
                    text: 'A. TAKE IT WITH US',
                    action: () => {
                        this.jukeboxState.takenToShip = true;
                        this.queueDialogues([
                            { speaker: 'ELI', text: 'We can\'t leave our memories behind.' },
                            { speaker: 'KORU', text: 'We\'ll listen to it while we fly across the stars.' }
                        ], () => {
                            this.initScene('scene7');
                        });
                    }
                },
                {
                    text: 'B. LEAVE IT AT HOME',
                    action: () => {
                        this.jukeboxState.takenToShip = false;
                        this.queueDialogues([
                            { speaker: 'ELI', text: 'We\'ll make new memories when we get there.' },
                            { speaker: 'KORU', text: 'Then let\'s make some.' }
                        ], () => {
                            this.initScene('scene7');
                        });
                    }
                }
            ]);
        });
    }

    // SCENE 7 — THE JOURNEY & SPACESHIP DEPARTURE
    initScene7() {
        this.sound.stopSceneAmbience();
        this.sound.startSceneAmbience('spaceship_flight');

        this.flightProgress = 0;

        this.queueDialogues([
            { speaker: 'KORU', text: 'Eli?' },
            { speaker: 'ELI', text: 'Yes?' },
            { speaker: 'KORU', text: 'What does Earth smell like?' },
            { speaker: 'ELI', text: '(laughs) That\'s a story for another day.' }
        ], () => {
            // Start flight progress animation
            const flightInterval = setInterval(() => {
                this.flightProgress += 0.005;
                if (this.flightProgress >= 1.0) {
                    clearInterval(flightInterval);
                    setTimeout(() => {
                        this.initScene('credits');
                    }, 2000);
                }
            }, 30);
        });
    }

    // CREDITS & ENDING SCREEN
    initCredits() {
        this.sound.startEarthSoundscape();
        this.showSceneOverlay(
            'SOUND OF TIMES',
            'Every sound tells a story. Every memory leads us home.\n\nTHE JOURNEY CONTINUES...',
            100000
        );

        this.showPrompt('[PRESS R TO RESTART THE GAME]');
    }

    // ----------------------------------------------------
    // JUKEBOX INTERACTIVE UI & CONTROLS
    // ----------------------------------------------------

    setupJukeboxUI() {
        const recordBtns = document.querySelectorAll('.record-btn');
        recordBtns.forEach(btn => {
            btn.onclick = () => {
                const rec = btn.getAttribute('data-record');
                if (rec === 'earth' && !this.jukeboxState.unlockedRecords.earth) {
                    return;
                }
                this.selectJukeboxRecord(rec);
            };
        });

        document.getElementById('btnPower').onclick = () => this.toggleJukeboxPower();
        document.getElementById('btnPlay').onclick = () => this.playJukebox();
        document.getElementById('btnPause').onclick = () => this.pauseJukebox();
        document.getElementById('btnStop').onclick = () => this.stopJukebox();
        document.getElementById('btnReplay').onclick = () => this.replayJukebox();
        document.getElementById('btnEject').onclick = () => this.ejectJukebox();
        document.getElementById('btnProceed').onclick = () => {
            this.initScene('scene6');
        };
    }

    toggleJukeboxPower() {
        if (this.jukeboxState.isPowered) {
            this.stopJukebox();
            this.jukeboxState.isPowered = false;
            this.sound.playRelayClickSfx();
            const pwrBtn = document.getElementById('btnPower');
            if (pwrBtn) pwrBtn.classList.remove('primary');
            this.queueDialogues([
                { speaker: 'SYSTEM', text: '*CLICK... HUM FADES...*' },
                { speaker: 'SYSTEM', text: '[ JUKEBOX POWERED OFF ]' }
            ]);
        } else {
            this.powerOnJukebox();
            const pwrBtn = document.getElementById('btnPower');
            if (pwrBtn) pwrBtn.classList.add('primary');
        }
    }

    selectJukeboxRecord(recordKey) {
        this.jukeboxState.activeRecord = recordKey;
        this.sound.selectRecord(recordKey);

        // Update button active state
        document.querySelectorAll('.record-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-record') === recordKey);
        });

        // Automatically start playback
        this.playJukebox();
    }

    cycleRecord(direction) {
        const records = ['forest', 'ocean', 'atmosphere'];
        if (this.jukeboxState.unlockedRecords.earth) {
            records.push('earth');
        }
        let curIdx = records.indexOf(this.jukeboxState.activeRecord);
        if (curIdx === -1) curIdx = 0;
        let nextIdx = (curIdx + direction + records.length) % records.length;
        this.selectJukeboxRecord(records[nextIdx]);
    }

    playJukebox() {
        if (!this.jukeboxState.activeRecord) return;
        this.jukeboxState.isPlaying = true;
        this.jukeboxState.isPaused = false;
        this.sound.playRecord();

        const rec = this.jukeboxState.activeRecord;
        this.jukeboxState.playedRecords.add(rec);

        // Trigger record-specific narrative dialogue
        this.triggerRecordDialogue(rec);

        // Check if all 3 played to unlock Earth record
        if (this.jukeboxState.playedRecords.has('forest') &&
            this.jukeboxState.playedRecords.has('ocean') &&
            this.jukeboxState.playedRecords.has('atmosphere') &&
            !this.jukeboxState.unlockedRecords.earth) {
            
            this.jukeboxState.unlockedRecords.earth = true;
            const earthBtn = document.getElementById('btnRecEarth');
            if (earthBtn) {
                earthBtn.classList.remove('locked');
                earthBtn.innerHTML = '✨ 004 EARTH (UNLOCKED)';
            }

            setTimeout(() => {
                this.queueDialogues([
                    { speaker: 'SYSTEM', text: '[EARTH ARCHIVE — COMPLETE RECORD UNLOCKED]' },
                    { speaker: 'ELI', text: 'This one... this must be everything together.' }
                ]);
            }, 8000);
        }

        // Show Proceed button once player has experienced the records
        if (this.jukeboxState.playedRecords.size >= 3) {
            document.getElementById('btnProceed').style.display = 'block';
        }
    }

    pauseJukebox() {
        this.jukeboxState.isPlaying = false;
        this.jukeboxState.isPaused = true;
        this.sound.pauseRecord();

        this.queueDialogues([
            { speaker: 'ELI', text: 'Wait... don\'t stop. I want to hear that again.' }
        ]);
    }

    stopJukebox() {
        this.jukeboxState.isPlaying = false;
        this.jukeboxState.isPaused = false;
        this.sound.stopRecord();
    }

    replayJukebox() {
        this.stopJukebox();
        this.playJukebox();
    }

    ejectJukebox() {
        this.stopJukebox();
        this.sound.ejectRecord();
        this.jukeboxState.activeRecord = null;
        document.querySelectorAll('.record-btn').forEach(btn => btn.classList.remove('active'));
    }

    toggleJukeboxPlayPause() {
        if (this.jukeboxState.isPlaying) {
            this.pauseJukebox();
        } else {
            this.playJukebox();
        }
    }

    triggerRecordDialogue(recordKey) {
        if (recordKey === 'forest') {
            this.queueDialogues([
                { speaker: 'ELI', text: 'The trees... I remember these.' },
                { speaker: 'KORU', text: 'Those little sounds are alive?' },
                { speaker: 'ELI', text: 'Yes. They\'re birds.' },
                { speaker: 'KORU', text: 'I like the birds.' }
            ]);
        } else if (recordKey === 'ocean') {
            this.queueDialogues([
                { speaker: 'ELI', text: 'The ocean. It\'s enormous. You could travel for months and still see nothing but water.' },
                { speaker: 'KORU', text: 'Can we visit it?' },
                { speaker: 'ELI', text: 'Maybe one day.' },
                { speaker: 'KORU', text: 'I would like that.' }
            ]);
        } else if (recordKey === 'atmosphere') {
            this.queueDialogues([
                { speaker: 'KORU', text: 'Your planet makes all these sounds?' },
                { speaker: 'ELI', text: 'Every day. Sometimes we don\'t even notice them.' },
                { speaker: 'KORU', text: 'How can you forget something so beautiful?' },
                { speaker: 'ELI', text: '...' }
            ]);
        } else if (recordKey === 'earth') {
            this.queueDialogues([
                { speaker: 'ELI', text: 'I remember now.' },
                { speaker: 'KORU', text: 'Remember what?' },
                { speaker: 'ELI', text: 'Home.' }
            ]);
        }
    }

    updateNasaHud(type, dataPoint, norm) {
        if (type === 'forest') {
            this.ui.hudMetric.innerText = `NASA MODIS NDVI (Canopy Greenness) [${dataPoint.month}]`;
            this.ui.hudValue.innerText = `Index: ${dataPoint.ndvi.toFixed(3)} | Harmonics: ${(norm * 100).toFixed(0)}%`;
            this.ui.hudDesc.innerText = `${dataPoint.label}. Real 12-month Terra/Aqua vegetation cycle mapped to resonant pentatonic acoustic synthesis.`;
        } else if (type === 'ocean') {
            this.ui.hudMetric.innerText = `NOAA/NASA TOPEX & Jason-3 Sea Surface Altimetry [${dataPoint.year}]`;
            this.ui.hudValue.innerText = `SSHA: ${dataPoint.ssha > 0 ? '+' : ''}${dataPoint.ssha}mm | SST: ${dataPoint.sst}°C`;
            this.ui.hudDesc.innerText = `${dataPoint.label}. Satellite sea level rise trajectory driving sub-bass resonance & aquatic bell harmonics.`;
        } else if (type === 'atmosphere') {
            this.ui.hudMetric.innerText = `NASA MERRA-2 Aerosol Optical Depth & AIRS CO2 [${dataPoint.season}]`;
            this.ui.hudValue.innerText = `AOD (550nm): ${dataPoint.aod} | CO2: ${dataPoint.co2} ppm`;
            this.ui.hudDesc.innerText = `${dataPoint.label}. Global atmospheric optical depth and greenhouse gas oscillation mapped to wind sweep filters.`;
        } else if (type === 'earth') {
            this.ui.hudMetric.innerText = `NASA EARTH OBSERVATION INTEGRATED SONIFICATION`;
            this.ui.hudValue.innerText = `MODIS Canopy + TOPEX Altimetry + MERRA-2 Atmosphere`;
            this.ui.hudDesc.innerText = `Full Earth multi-system harmonic synthesis uniting biosphere, hydrosphere and atmosphere with piano memories.`;
        }
    }

    // ----------------------------------------------------
    // DIALOGUE SYSTEM
    // ----------------------------------------------------

    queueDialogues(dialogues, onComplete = null) {
        this.dialogueQueue = dialogues.slice();
        this.dialogueOnComplete = onComplete;
        if (!this.currentDialogue && this.dialogueQueue.length > 0) {
            this.showNextDialogue();
        }
    }

    showNextDialogue() {
        if (this.dialogueQueue.length === 0) {
            this.currentDialogue = null;
            this.ui.dialogueBox.style.display = 'none';
            if (this.dialogueOnComplete) {
                const cb = this.dialogueOnComplete;
                this.dialogueOnComplete = null;
                cb();
            }
            return;
        }

        this.currentDialogue = this.dialogueQueue.shift();
        this.dialogueCharIndex = 0;
        this.dialogueTextTimer = 0;
        this.isTyping = true;

        this.ui.dialogueBox.style.display = 'block';
        this.ui.speakerName.innerText = this.currentDialogue.speaker;
        this.ui.dialogueText.innerText = '';
        this.ui.continuePrompt.style.display = 'none';

        // Speaker color styling
        if (this.currentDialogue.speaker === 'ELI') {
            this.ui.speakerName.style.color = '#ffca72';
        } else if (this.currentDialogue.speaker === 'KORU') {
            this.ui.speakerName.style.color = '#47d8f2';
        } else if (this.currentDialogue.speaker.startsWith('LITTLE')) {
            this.ui.speakerName.style.color = '#62c98a';
        } else {
            this.ui.speakerName.style.color = '#f28bbd';
        }

        if (this.currentDialogue.onShow) {
            this.currentDialogue.onShow();
        }
    }

    advanceDialogue() {
        if (!this.currentDialogue) return;
        if (this.isTyping) {
            // Immediately reveal all text
            this.dialogueCharIndex = this.currentDialogue.text.length;
            this.ui.dialogueText.innerText = this.currentDialogue.text;
            this.isTyping = false;
            this.ui.continuePrompt.style.display = 'block';
        } else {
            // Next dialogue
            this.showNextDialogue();
        }
    }

    // ----------------------------------------------------
    // CHOICE MENU SYSTEM
    // ----------------------------------------------------

    showChoiceMenu(title, options) {
        this.activeChoice = {
            title,
            options,
            selectedIndex: 0
        };

        this.ui.choiceTitle.innerText = title;
        this.ui.choiceOptions.innerHTML = '';

        options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn' + (idx === 0 ? ' selected' : '');
            btn.innerText = opt.text;
            btn.onclick = () => {
                this.activeChoice.selectedIndex = idx;
                this.confirmChoice();
            };
            this.ui.choiceOptions.appendChild(btn);
        });

        this.ui.choiceBox.style.display = 'block';
    }

    navigateChoice(dir) {
        if (!this.activeChoice) return;
        const total = this.activeChoice.options.length;
        this.activeChoice.selectedIndex = (this.activeChoice.selectedIndex + dir + total) % total;

        const btns = this.ui.choiceOptions.querySelectorAll('.choice-btn');
        btns.forEach((btn, idx) => {
            btn.classList.toggle('selected', idx === this.activeChoice.selectedIndex);
        });
        this.sound.playButtonSfx(480, 0.04);
    }

    confirmChoice() {
        if (!this.activeChoice) return;
        const selected = this.activeChoice.options[this.activeChoice.selectedIndex];
        this.hideChoice();
        this.sound.playButtonSfx(680, 0.07);
        if (selected.action) {
            selected.action();
        }
    }

    hideChoice() {
        this.activeChoice = null;
        this.ui.choiceBox.style.display = 'none';
    }

    showPrompt(text) {
        this.ui.screenPrompt.innerText = text;
        this.ui.screenPrompt.style.display = 'block';
    }

    clearPrompt() {
        this.ui.screenPrompt.innerText = '';
        this.ui.screenPrompt.style.display = 'none';
    }

    // ----------------------------------------------------
    // MAIN UPDATE & RENDER LOOP
    // ----------------------------------------------------

    loop(timestamp) {
        const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
        this.lastTime = timestamp;

        this.update(dt);
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.sceneTime += dt;
        this.renderer.update(dt);

        // Update typewriter dialogue
        if (this.currentDialogue && this.isTyping) {
            this.dialogueTextTimer += dt;
            if (this.dialogueTextTimer > 0.025) {
                this.dialogueTextTimer = 0;
                this.dialogueCharIndex++;
                this.ui.dialogueText.innerText = this.currentDialogue.text.substring(0, this.dialogueCharIndex);
                if (this.dialogueCharIndex >= this.currentDialogue.text.length) {
                    this.isTyping = false;
                    this.ui.continuePrompt.style.display = 'block';
                }
            }
        }

        // Scene-specific updates
        switch (this.currentScene) {
            case 'scene1':
                this.updateScene1(dt);
                break;
            case 'scene3':
                this.updateScene3(dt);
                break;
            case 'credits':
                if (this.keys['r'] || this.keys['R']) {
                    this.initScene('scene1');
                }
                break;
        }
    }

    updateScene1(dt) {
        // Player controls Eli walking towards the classroom on the right
        if (!this.currentDialogue && !this.activeChoice) {
            let moving = false;
            if (this.keys['arrowright'] || this.keys['d']) {
                this.eli.x += this.eli.speed * dt;
                this.eli.facing = 1;
                this.eli.state = 'walk';
                moving = true;
            } else if (this.keys['arrowleft'] || this.keys['a']) {
                this.eli.x -= this.eli.speed * dt;
                this.eli.facing = -1;
                this.eli.state = 'walk';
                moving = true;
            }

            if (!moving) {
                this.eli.state = 'idle';
            }

            // Koru follows along
            if (this.eli.x > this.koru.x + 35) {
                this.koru.x += this.koru.speed * dt;
                this.koru.facing = 1;
                this.koru.state = 'walk';
            } else {
                this.koru.state = 'idle';
            }

            // Reached classroom on right edge
            if (this.eli.x > this.width - 60) {
                this.initScene('scene2');
            }
        }
    }

    updateScene3(dt) {
        // Walking down rocky pathway towards buried or carried jukebox
        if (!this.currentDialogue && !this.activeChoice) {
            let moving = false;
            if (this.keys['arrowright'] || this.keys['d']) {
                this.eli.x += this.eli.speed * dt;
                this.eli.facing = 1;
                this.eli.state = 'walk';
                moving = true;
            } else if (this.keys['arrowleft'] || this.keys['a']) {
                this.eli.x -= this.eli.speed * dt;
                this.eli.facing = -1;
                this.eli.state = 'walk';
                moving = true;
            }

            if (!moving) {
                this.eli.state = 'idle';
            }

            // Koru accompanies
            if (this.eli.x > this.koru.x + 35) {
                this.koru.x += this.koru.speed * dt;
                this.koru.facing = 1;
                this.koru.state = 'walk';
            } else if (this.eli.x < this.koru.x - 35) {
                this.koru.x -= this.koru.speed * dt;
                this.koru.facing = -1;
                this.koru.state = 'walk';
            } else {
                this.koru.state = 'idle';
            }

            // Case A: Carrying the jukebox
            if (this.eli.isCarrying) {
                this.showPrompt('[A/D] CARRY JUKEBOX TO HABITAT (RIGHT) | [Q] SET DOWN');

                // Drop/set down with Q
                if (this.keys['q'] || this.keys['Q']) {
                    this.keys['q'] = false;
                    this.keys['Q'] = false;
                    this.eli.isCarrying = false;
                    this.jukeboxDroppedX = this.eli.x + 18;
                    this.sound.playRelayClickSfx();
                    this.showPrompt('[E] PICK UP JUKEBOX | [A/D] WALK');
                }

                // Reached right edge to enter habitat
                if (this.eli.x > this.width - 50) {
                    this.initScene('scene4');
                }
            } 
            // Case B: Jukebox was set down on ground
            else if (this.jukeboxDugUp) {
                const targetX = this.jukeboxDroppedX || 410;
                const dist = Math.abs(this.eli.x - targetX);
                if (dist < 40) {
                    this.showPrompt('[E] PICK UP JUKEBOX');
                    if (this.keys['e'] || this.keys['E'] || this.keys['Enter']) {
                        this.keys['e'] = false;
                        this.keys['E'] = false;
                        this.eli.isCarrying = true;
                        this.sound.playRelayClickSfx();
                    }
                } else {
                    this.showPrompt('[A/D] WALK NEAR JUKEBOX TO PICK UP');
                }
            }
            // Case C: Jukebox still buried at x = 422
            else {
                const distToJukebox = Math.abs(this.eli.x - 410);
                if (distToJukebox < 40) {
                    this.showPrompt('[E] INSPECT OBJECT');
                    if (this.keys['e'] || this.keys['E'] || this.keys['Enter']) {
                        this.keys['e'] = false;
                        this.keys['E'] = false;
                        this.inspectJukeboxScene3();
                    }
                } else {
                    this.showPrompt('[A/D] WALK TOWARDS THE GOLDEN LIGHT');
                }
            }
        }
    }

    inspectJukeboxScene3() {
        this.eli.state = 'kneel';
        this.clearPrompt();

        this.queueDialogues([
            { speaker: 'ELI', text: 'That definitely wasn\'t here yesterday.' },
            { speaker: 'ELI', text: 'A music player? Out here?' },
            { speaker: 'KORU', text: 'It looks old.' },
            { speaker: 'ELI', text: 'Very old.' }
        ], () => {
            this.showChoiceMenu('CHOICE 1 — What should we do?', [
                {
                    text: 'A. PICK IT UP',
                    action: () => {
                        this.eli.state = 'idle';
                        this.eli.isCarrying = true;
                        this.jukeboxDugUp = true;
                        this.queueDialogues([
                            { speaker: 'ELI', text: 'I don\'t know what this is, but I want to find out.' },
                            { speaker: 'KORU', text: 'Let\'s take it back to your habitat and clean it up.' }
                        ], () => {
                            this.showPrompt('[A/D] CARRY JUKEBOX TO HABITAT (RIGHT) | [Q] SET DOWN');
                        });
                    }
                },
                {
                    text: 'B. LEAVE IT HERE',
                    action: () => {
                        this.eli.state = 'idle';
                        this.queueDialogues([
                            { speaker: 'ELI', text: 'Maybe it\'s better left alone.' },
                            { speaker: 'SYSTEM', text: '*Click... crackle...*' },
                            { speaker: 'KORU', text: 'Eli. Did you hear that? It\'s making sounds!' },
                            { speaker: 'ELI', text: 'Wait... that crackle... that sounds like Earth.' }
                        ], () => {
                            this.showChoiceMenu('Go back and pick it up?', [
                                {
                                    text: 'PICK UP THE JUKEBOX',
                                    action: () => {
                                        this.eli.isCarrying = true;
                                        this.jukeboxDugUp = true;
                                        this.queueDialogues([
                                            { speaker: 'ELI', text: 'We have to know where it came from.' }
                                        ], () => {
                                            this.showPrompt('[A/D] CARRY JUKEBOX TO HABITAT (RIGHT) | [Q] SET DOWN');
                                        });
                                    }
                                }
                            ]);
                        });
                    }
                }
            ]);
        });
    }

    // ----------------------------------------------------
    // RENDERING PIPELINE
    // ----------------------------------------------------

    render() {
        const r = this.renderer;
        const audioMetrics = this.sound.getAudioMetrics();

        switch (this.currentScene) {
            case 'scene1':
                r.drawAlienPlanetBackground(this.cameraX);
                r.drawHabitatExterior(10, this.height * 0.74);
                r.drawKoru(this.koru.x, this.koru.y, this.koru.state, this.koru.facing);
                r.drawEli(this.eli.x, this.eli.y, this.eli.state, this.eli.facing, this.eli.isCarrying);
                break;

            case 'scene2':
                r.drawClassroom(this.classroomBoard);
                r.drawLittleOnes(this.sceneTime);
                r.drawKoru(this.koru.x, this.koru.y, this.koru.state, this.koru.facing);
                r.drawEli(this.eli.x, this.eli.y, this.eli.state, this.eli.facing, this.eli.isCarrying);
                break;

            case 'scene3':
                r.drawRockyPathway(!this.jukeboxDugUp, this.cameraX);
                if (this.jukeboxDugUp && !this.eli.isCarrying) {
                    const dropX = this.jukeboxDroppedX || 410;
                    r.drawJukebox(dropX, this.height * 0.74, {
                        isPowered: false,
                        isPlaying: false
                    });
                }
                r.drawKoru(this.koru.x, this.koru.y, this.koru.state, this.koru.facing);
                r.drawEli(this.eli.x, this.eli.y, this.eli.state, this.eli.facing, this.eli.isCarrying);
                break;

            case 'scene4':
            case 'scene5':
            case 'scene6':
                r.drawHomeInterior(this.jukeboxState.activeRecord, audioMetrics);
                r.drawJukebox(320, this.height * 0.70 - 28, {
                    isPowered: this.jukeboxState.isPowered,
                    isPlaying: this.jukeboxState.isPlaying,
                    isPaused: this.jukeboxState.isPaused,
                    activeRecord: this.jukeboxState.activeRecord,
                    audioMetrics: audioMetrics
                });
                r.drawEli(this.eli.x, this.eli.y, this.eli.state, this.eli.facing, this.eli.isCarrying);
                r.drawKoru(this.koru.x, this.koru.y, this.koru.state, this.koru.facing);
                if (this.currentScene === 'scene5') {
                    this.drawNasaWaveform();
                }
                break;

            case 'scene7':
                r.drawSpaceDeparture(this.flightProgress);
                break;

            case 'credits':
                r.drawSpaceDeparture(1.0);
                break;
        }

        // Draw overlay particles
        r.renderParticles();
    }

    drawNasaWaveform() {
        const canvas = document.getElementById('nasaWaveform');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.fillStyle = '#090514';
        ctx.fillRect(0, 0, w, h);

        const metrics = this.sound.getAudioMetrics();
        const timeData = metrics.rawTime;
        const freqData = metrics.rawFreq;

        // Active theme color
        let strokeColor = '#47d8f2';
        if (this.jukeboxState.activeRecord === 'forest') strokeColor = '#62c98a';
        else if (this.jukeboxState.activeRecord === 'ocean') strokeColor = '#47d8f2';
        else if (this.jukeboxState.activeRecord === 'atmosphere') strokeColor = '#f28bbd';
        else if (this.jukeboxState.activeRecord === 'earth') strokeColor = '#ffca72';

        // Frequency bars in background
        if (freqData && freqData.length > 0) {
            ctx.fillStyle = strokeColor;
            ctx.globalAlpha = 0.22;
            const barCount = 32;
            const barW = w / barCount;
            for (let i = 0; i < barCount; i++) {
                const barH = (freqData[i] / 255) * (h - 4);
                ctx.fillRect(i * barW, h - barH, barW - 1, barH);
            }
            ctx.globalAlpha = 1.0;
        }

        // Oscilloscope waveform line
        if (timeData && timeData.length > 0) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const sliceW = w / timeData.length;
            let x = 0;
            for (let i = 0; i < timeData.length; i++) {
                const v = timeData[i] / 128.0;
                const y = (v * h) / 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += sliceW;
            }
            ctx.stroke();
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
