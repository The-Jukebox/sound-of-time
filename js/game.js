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
            overlaySubtitle: document.getElementById('overlaySubtitle'),
            btnFullscreen: document.getElementById('btnFullscreen')
        };

        this.setupInput();

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

            // Fullscreen toggle shortcut (F)
            if (e.key === 'f' || e.key === 'F') {
                this.toggleFullscreen();
                e.preventDefault();
                return;
            }

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
                } else if (e.key === 'b' || e.key === 'B') {
                    if (window.forestSonification && window.forestSonification.soundscape) {
                        const res = window.forestSonification.soundscape.callBird('random');
                        if (res) {
                            this.showPrompt(`[ 🐦 BIRD CALLED: ${res.species.toUpperCase()} SINGING IN CANOPY ]`);
                        }
                    }
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

        // Fullscreen button click handler
        if (this.ui && this.ui.btnFullscreen) {
            this.ui.btnFullscreen.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFullscreen();
            });
        }

        // Fullscreen change events to update button state & layout
        const onFsChange = () => this.updateFullscreenUI();
        document.addEventListener('fullscreenchange', onFsChange);
        document.addEventListener('webkitfullscreenchange', onFsChange);
    }

    toggleFullscreen() {
        this.sound.resume();
        const isNativeFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
        const isWindowFs = document.body.classList.contains('is-fullscreen');

        if (!isNativeFs && !isWindowFs) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {
                    document.body.classList.toggle('is-fullscreen');
                    this.updateFullscreenUI();
                });
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
            } else {
                document.body.classList.toggle('is-fullscreen');
                this.updateFullscreenUI();
            }
        } else {
            if (isNativeFs) {
                if (document.exitFullscreen) {
                    document.exitFullscreen().catch(() => { });
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            }
            document.body.classList.remove('is-fullscreen');
            this.updateFullscreenUI();
        }
    }

    updateFullscreenUI() {
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.body.classList.contains('is-fullscreen'));
        document.body.classList.toggle('is-fullscreen', isFs);
        if (this.ui.btnFullscreen) {
            const fsText = this.ui.btnFullscreen.querySelector('.fs-text');
            const fsIcon = this.ui.btnFullscreen.querySelector('.fs-icon');
            if (fsText) fsText.textContent = isFs ? 'EXIT' : 'FULLSCREEN';
            if (fsIcon) fsIcon.textContent = isFs ? '✖' : '⛶';
            this.ui.btnFullscreen.setAttribute('title', isFs ? 'Exit Fullscreen (F / Esc)' : 'Toggle Fullscreen (F)');
        }
    }

    // ----------------------------------------------------
    // SCENE INITIALIZATION & TRANSITIONS
    // ----------------------------------------------------

    initScene(sceneName) {
        this.currentScene = sceneName;
        this.sceneTime = 0;
        this.clearPrompt();

        // Close UI overlays
        if (this.ui && this.ui.jukeboxPanel) this.ui.jukeboxPanel.style.display = 'none';
        if (this.ui && this.ui.nasaHud) this.ui.nasaHud.style.display = 'none';
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
        if (!this.ui || !this.ui.overlayTitle || !this.ui.overlaySubtitle || !this.ui.sceneOverlay) return;
        this.ui.overlayTitle.innerText = title;
        this.ui.overlaySubtitle.innerText = subtitle;
        this.ui.sceneOverlay.style.opacity = '1';
        this.ui.sceneOverlay.style.pointerEvents = 'auto';

        setTimeout(() => {
            if (this.ui && this.ui.sceneOverlay) {
                this.ui.sceneOverlay.style.opacity = '0';
                this.ui.sceneOverlay.style.pointerEvents = 'none';
            }
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
        this.arrivalPhase = false;

        this.queueDialogues([
            { speaker: 'ROCKY', text: 'Ryan?' },
            { speaker: 'RYAN', text: 'Yes, Rocky?' },
            { speaker: 'ROCKY', text: 'What does Earth smell like?' },
            { speaker: 'RYAN', text: 'Cold pine trees and snow, Rocky. You\'ll see in just a moment.' }
        ], () => {
            // Start flight progress animation
            const flightInterval = setInterval(() => {
                this.flightProgress += 0.007;
                if (this.flightProgress >= 1.0) {
                    clearInterval(flightInterval);
                    setTimeout(() => {
                        this.initEarthArrival();
                    }, 1000);
                }
            }, 30);
        });
    }

    // FINAL ARRIVAL: EARTH & THE GEODESIC XENONITE DOME (Project Hail Mary Arrival)
    initEarthArrival() {
        this.arrivalPhase = true;
        this.sound.stopSceneAmbience();
        this.sound.startEarthSoundscape();

        // Ryan in astronaut suit standing in the snow beside the geodesic dome
        this.eli.x = 345;
        this.eli.y = this.height * 0.72 + 8;
        this.eli.facing = -1; // looking at Rocky inside the dome
        this.eli.state = 'idle';

        this.rockyInsideState = 'hands';

        this.queueDialogues([
            { speaker: 'ROCKY', text: 'Ryan! Look! Cold white crystals falling from the sky! Is this... snow?' },
            { speaker: 'RYAN', text: 'Yes, Rocky. This is Earth. This is snow.' },
            { speaker: 'ROCKY', text: 'Amaze! Amaze! Amaze! The air inside my xenonite ball is warm, but outside looks just like the record!' },
            { speaker: 'RYAN', text: 'We made it, buddy. You\'re finally hearing Earth for real.' },
            { speaker: 'ROCKY', text: 'I am glad I came with you, Ryan.' },
            { speaker: 'RYAN', text: 'Me too, Rocky. Me too.' }
        ], () => {
            this.showPrompt('[A/D] WALK IN SNOW | [PRESS R TO RESTART THE GAME]');
        });
    }

    // CREDITS & ENDING SCREEN
    initCredits() {
        this.initEarthArrival();
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

        const btnMemory = document.getElementById('btnMemoryVision');
        if (btnMemory) {
            btnMemory.onclick = () => this.openMemoryVision();
        }

        document.getElementById('btnProceed').onclick = () => {
            this.initScene('scene6');
        };

        // Volume control slider (Requirement 6)
        const volSlider = document.getElementById('volSlider');
        const volLabel = document.getElementById('volLabel');
        const volIcon = document.getElementById('volIcon');

        if (volSlider) {
            volSlider.oninput = (e) => {
                const val = parseFloat(e.target.value) / 100;
                if (volLabel) volLabel.innerText = `${Math.round(val * 100)}%`;
                if (window.oceanSonification) {
                    window.oceanSonification.setVolume(val);
                }
                if (window.forestSonification) {
                    window.forestSonification.setVolume(val);
                }
                if (window.atmosphereSonification) {
                    window.atmosphereSonification.volumeLevel = val;
                }
                if (window.earthSonification) {
                    window.earthSonification.volumeLevel = val;
                }
                if (this.sound && this.sound.masterGain) {
                    const t = this.sound.ctx ? this.sound.ctx.currentTime : 0;
                    this.sound.masterGain.gain.setValueAtTime(val * 0.85, t);
                }
                if (volIcon) {
                    volIcon.innerText = val === 0 ? '🔇' : (val < 0.4 ? '🔉' : '🔊');
                }
            };
        }

        // Scientific transparency toggle button
        const btnTransparency = document.getElementById('btnTransparency');
        if (btnTransparency) {
            btnTransparency.onclick = () => {
                let targetId = 'oceanSciencePanel';
                if (this.jukeboxState.activeRecord === 'forest') targetId = 'forestSciencePanel';
                else if (this.jukeboxState.activeRecord === 'atmosphere') targetId = 'atmosphereSciencePanel';
                else if (this.jukeboxState.activeRecord === 'earth') targetId = 'earthSciencePanel';
                const pnl = document.getElementById(targetId);
                if (pnl) {
                    pnl.style.display = (pnl.style.display === 'none' || pnl.style.display === '') ? 'block' : 'none';
                }
            };
        }

        // Initialize Ocean Sonification engine if not present
        if (typeof OceanSonificationEngine !== 'undefined' && !window.oceanSonification) {
            window.oceanSonification = new OceanSonificationEngine();
        }
        if (window.oceanSonification) {
            window.oceanSonification.onStepCallback = (pt, metrics) => {
                if (this.jukeboxState.activeRecord === 'ocean') {
                    this.updateNasaHud('ocean', pt, metrics.tempNorm);
                }
            };
            window.oceanSonification.loadDataset();
        }

        // Initialize Forest Sonification engine if not present
        if (typeof ForestSonificationEngine !== 'undefined' && !window.forestSonification) {
            window.forestSonification = new ForestSonificationEngine();
        }
        if (window.forestSonification) {
            window.forestSonification.onStepCallback = (pt, metrics) => {
                if (this.jukeboxState.activeRecord === 'forest') {
                    this.updateNasaHud('forest', pt, metrics.heightNorm);
                }
            };
            window.forestSonification.loadDataset();

            // Wire Day/Night Mode buttons
            const modeBtns = {
                morning: document.getElementById('btnModeMorning'),
                afternoon: document.getElementById('btnModeAfternoon'),
                evening: document.getElementById('btnModeEvening'),
                night: document.getElementById('btnModeNight')
            };

            Object.keys(modeBtns).forEach(modeKey => {
                const btn = modeBtns[modeKey];
                if (btn) {
                    btn.onclick = () => {
                        window.forestSonification.soundscape.setMode(modeKey);
                        Object.values(modeBtns).forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                    };
                }
            });

            // Wire Layer Mute buttons
            const btnMuteMusic = document.getElementById('btnMuteMusic');
            if (btnMuteMusic) {
                btnMuteMusic.onclick = () => {
                    const isMuted = window.forestSonification.soundscape.toggleMusicMute();
                    btnMuteMusic.classList.toggle('muted', isMuted);
                };
            }
            const btnMuteCanopy = document.getElementById('btnMuteCanopy');
            if (btnMuteCanopy) {
                btnMuteCanopy.onclick = () => {
                    const isMuted = window.forestSonification.soundscape.toggleCanopyMute();
                    btnMuteCanopy.classList.toggle('muted', isMuted);
                };
            }
            const btnMuteWildlife = document.getElementById('btnMuteWildlife');
            if (btnMuteWildlife) {
                btnMuteWildlife.onclick = () => {
                    const isMuted = window.forestSonification.soundscape.toggleWildlifeMute();
                    btnMuteWildlife.classList.toggle('muted', isMuted);
                };
            }
            const btnMuteWater = document.getElementById('btnMuteWater');
            if (btnMuteWater) {
                btnMuteWater.onclick = () => {
                    const isMuted = window.forestSonification.soundscape.toggleWaterMute();
                    btnMuteWater.classList.toggle('muted', isMuted);
                };
            }

            // Wire Call Bird Button
            const btnCallBird = document.getElementById('btnCallBird');
            if (btnCallBird) {
                btnCallBird.onclick = () => {
                    if (window.forestSonification && window.forestSonification.soundscape) {
                        const res = window.forestSonification.soundscape.callBird('random');
                        if (res) {
                            this.showPrompt(`[ 🐦 BIRD CALLED: ${res.species.toUpperCase()} SINGING IN CANOPY ]`);
                        }
                    }
                };
            }

            // Wire Ambience Slider
            const ambSlider = document.getElementById('ambienceSlider');
            const ambLabel = document.getElementById('ambLabel');
            if (ambSlider) {
                ambSlider.oninput = (e) => {
                    const val = parseFloat(e.target.value) / 100;
                    if (ambLabel) ambLabel.innerText = `${Math.round(val * 100)}%`;
                    window.forestSonification.soundscape.setCanopyVolume(val);
                    window.forestSonification.soundscape.setWildlifeVolume(val * 0.95);
                    window.forestSonification.soundscape.setWaterVolume(val * 0.85);
                };
            }
        }

        // Wire Atmosphere Sonification telemetry (Record 001)
        if (typeof AtmosphereSonificationEngine !== 'undefined' && !window.atmosphereSonification) {
            window.atmosphereSonification = new AtmosphereSonificationEngine();
        }
        if (window.atmosphereSonification) {
            window.atmosphereSonification.onStepCallback = (pt, metrics) => {
                if (this.jukeboxState.activeRecord === 'atmosphere') {
                    this.updateNasaHud('atmosphere', pt, metrics.rainNorm);
                }
            };
            window.atmosphereSonification.loadDataset();
        }

        // Wire Earth Sonification telemetry (Record 004)
        if (typeof EarthSonificationEngine !== 'undefined' && !window.earthSonification) {
            window.earthSonification = new EarthSonificationEngine();
        }
        if (window.earthSonification) {
            window.earthSonification.onStepCallback = (pt, metrics) => {
                if (this.jukeboxState.activeRecord === 'earth') {
                    this.updateNasaHud('earth', pt, metrics.stepIndex / 4);
                }
            };
            window.earthSonification.loadDataset();
        }
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

        const oceanPnl = document.getElementById('oceanSciencePanel');
        const forestPnl = document.getElementById('forestSciencePanel');
        const atmPnl = document.getElementById('atmosphereSciencePanel');
        const earthPnl = document.getElementById('earthSciencePanel');
        const forestToolbar = document.getElementById('forestToolbar');

        if (oceanPnl) oceanPnl.style.display = (recordKey === 'ocean') ? 'block' : 'none';
        if (forestPnl) forestPnl.style.display = (recordKey === 'forest') ? 'block' : 'none';
        if (atmPnl) atmPnl.style.display = (recordKey === 'atmosphere') ? 'block' : 'none';
        if (earthPnl) earthPnl.style.display = (recordKey === 'earth') ? 'block' : 'none';
        if (forestToolbar) forestToolbar.style.display = (recordKey === 'forest') ? 'flex' : 'none';

        // Stop all other audio engines cleanly
        if (recordKey !== 'ocean' && window.oceanSonification) window.oceanSonification.stop();
        if (recordKey !== 'forest' && window.forestSonification) window.forestSonification.stop();
        if (recordKey !== 'atmosphere' && window.atmosphereSonification) window.atmosphereSonification.stop();
        if (recordKey !== 'earth' && window.earthSonification) window.earthSonification.stop();
        this.sound.stopRecord();

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
        this.updateJukeboxButtonStates('playing');

        const rec = this.jukeboxState.activeRecord;

        // Route audio based on active record
        if (rec === 'ocean') {
            this.sound.stopRecord();
            if (window.forestSonification) window.forestSonification.stop();
            if (window.atmosphereSonification) window.atmosphereSonification.stop();
            if (window.earthSonification) window.earthSonification.stop();
            if (window.oceanSonification) window.oceanSonification.play();
        } else if (rec === 'forest') {
            this.sound.stopRecord();
            if (window.oceanSonification) window.oceanSonification.stop();
            if (window.atmosphereSonification) window.atmosphereSonification.stop();
            if (window.earthSonification) window.earthSonification.stop();
            if (window.forestSonification) window.forestSonification.play();
        } else if (rec === 'atmosphere') {
            this.sound.stopRecord();
            if (window.oceanSonification) window.oceanSonification.stop();
            if (window.forestSonification) window.forestSonification.stop();
            if (window.earthSonification) window.earthSonification.stop();
            if (window.atmosphereSonification) {
                window.atmosphereSonification.play();
            } else {
                this.sound.playRecord();
            }
        } else if (rec === 'earth') {
            this.sound.stopRecord();
            if (window.oceanSonification) window.oceanSonification.stop();
            if (window.forestSonification) window.forestSonification.stop();
            if (window.atmosphereSonification) window.atmosphereSonification.stop();
            if (window.earthSonification) {
                window.earthSonification.play();
            } else {
                this.sound.playRecord();
            }
        } else {
            this.sound.playRecord();
        }

        this.jukeboxState.playedRecords.add(rec);

        // Only trigger narrative dialogue once per record upon insertion to prevent spamming
        if (!this.jukeboxState.dialoguesPlayed) {
            this.jukeboxState.dialoguesPlayed = new Set();
        }
        if (!this.jukeboxState.dialoguesPlayed.has(rec)) {
            this.jukeboxState.dialoguesPlayed.add(rec);
            this.triggerRecordDialogue(rec);
        }

        this.showPrompt(`[ PLAYING ${rec.toUpperCase()} RECORD — SPACE: PAUSE | Z: MEMORY VISION ]`);

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
        if (!this.jukeboxState.activeRecord) return;
        this.jukeboxState.isPlaying = false;
        this.jukeboxState.isPaused = true;
        this.updateJukeboxButtonStates('paused');

        if (this.jukeboxState.activeRecord === 'ocean' && window.oceanSonification) {
            window.oceanSonification.pause();
        } else if (this.jukeboxState.activeRecord === 'forest' && window.forestSonification) {
            window.forestSonification.pause();
        } else if (this.jukeboxState.activeRecord === 'atmosphere' && window.atmosphereSonification) {
            window.atmosphereSonification.pause();
        } else if (this.jukeboxState.activeRecord === 'earth' && window.earthSonification) {
            window.earthSonification.pause();
        } else {
            this.sound.pauseRecord();
        }

        this.showPrompt('[ RECORD PAUSED — PRESS PLAY OR SPACE TO RESUME ]');
    }

    stopJukebox() {
        this.jukeboxState.isPlaying = false;
        this.jukeboxState.isPaused = false;
        this.updateJukeboxButtonStates('stopped');

        if (window.oceanSonification) window.oceanSonification.stop();
        if (window.forestSonification) window.forestSonification.stop();
        if (window.atmosphereSonification) window.atmosphereSonification.stop();
        if (window.earthSonification) window.earthSonification.stop();
        this.sound.stopRecord();
        this.showPrompt('[ RECORD STOPPED — PRESS PLAY OR SELECT A RECORD ]');
    }

    replayJukebox() {
        this.stopJukebox();
        if (this.jukeboxState.activeRecord === 'forest' && window.forestSonification) {
            window.forestSonification.currentIndex = 0;
        } else if (this.jukeboxState.activeRecord === 'ocean' && window.oceanSonification) {
            window.oceanSonification.currentIndex = 0;
        } else if (this.jukeboxState.activeRecord === 'atmosphere' && window.atmosphereSonification) {
            window.atmosphereSonification.currentIndex = 0;
        } else if (this.jukeboxState.activeRecord === 'earth' && window.earthSonification) {
            window.earthSonification.currentIndex = 0;
        }
        this.playJukebox();
        this.showPrompt('[ REPLAYING RECORD FROM START ]');
    }

    ejectJukebox() {
        this.stopJukebox();
        if (window.oceanSonification) {
            window.oceanSonification.eject();
        }
        if (window.forestSonification) {
            window.forestSonification.eject();
        }
        if (window.atmosphereSonification) {
            window.atmosphereSonification.stop();
        }
        if (window.earthSonification) {
            window.earthSonification.stop();
        }
        this.sound.ejectRecord();
        this.jukeboxState.activeRecord = null;
        document.querySelectorAll('.record-btn').forEach(btn => btn.classList.remove('active'));
        this.updateJukeboxButtonStates('ejected');

        const oceanPnl = document.getElementById('oceanSciencePanel');
        if (oceanPnl) oceanPnl.style.display = 'none';
        const forestPnl = document.getElementById('forestSciencePanel');
        if (forestPnl) forestPnl.style.display = 'none';
        const atmPnl = document.getElementById('atmosphereSciencePanel');
        if (atmPnl) atmPnl.style.display = 'none';
        const earthPnl = document.getElementById('earthSciencePanel');
        if (earthPnl) earthPnl.style.display = 'none';
        const forestToolbar = document.getElementById('forestToolbar');
        if (forestToolbar) forestToolbar.style.display = 'none';
        this.showPrompt('[ RECORD EJECTED — SELECT A RECORD TO INSERT ]');
    }

    updateJukeboxButtonStates(state) {
        const btnPlay = document.getElementById('btnPlay');
        const btnPause = document.getElementById('btnPause');
        const btnStop = document.getElementById('btnStop');
        const btnReplay = document.getElementById('btnReplay');

        [btnPlay, btnPause, btnStop, btnReplay].forEach(b => {
            if (b) b.classList.remove('primary', 'active', 'btn-playing', 'btn-paused', 'btn-stopped');
        });

        if (state === 'playing') {
            if (btnPlay) btnPlay.classList.add('primary', 'active', 'btn-playing');
        } else if (state === 'paused') {
            if (btnPause) btnPause.classList.add('primary', 'active', 'btn-paused');
        } else if (state === 'stopped') {
            if (btnStop) btnStop.classList.add('active', 'btn-stopped');
        }
    }

    openMemoryVision(visionKey = null) {
        if (window.memoryCinema) {
            window.memoryCinema.open(visionKey);
        }
    }

    closeMemoryVision() {
        if (window.memoryCinema) {
            window.memoryCinema.close();
        }
    }

    toggleMemoryVision() {
        if (window.memoryCinema) {
            window.memoryCinema.toggle();
        }
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
                { speaker: 'RYLAND', text: 'Record 003: The Forest... NASA GEDI lidar structure and biomass archive.' },
                { speaker: 'KORU', text: 'Listen... are those living leaves moving in the air?' },
                { speaker: 'RYLAND', text: 'Yes, Koru. Earth has vast living canopies rising sixty meters high. This laser sensor mapped their height, density, and biomass from orbit.' },
                { speaker: 'KORU', text: 'And those little voices calling from the branches?' },
                { speaker: 'RYLAND', text: 'Those are birds welcoming the morning sun.' },
                { speaker: 'KORU', text: 'It feels like we are standing right inside a forest.' }
            ], null, true);
        } else if (recordKey === 'ocean') {
            this.queueDialogues([
                { speaker: 'RYLAND', text: 'Record 002: The Ocean... NASA ECCO daily temperature and salinity archive.' },
                { speaker: 'KORU', text: 'Those deep, singing chords... what are they?' },
                { speaker: 'RYLAND', text: 'Those are real ocean temperatures recorded by Earth satellites. Cold subpolar waters sing low and deep, and the warm Gulf Stream sings high.' },
                { speaker: 'KORU', text: 'The water has its own voice. Can we visit it one day?' },
                { speaker: 'RYLAND', text: 'Maybe one day, Koru.' },
                { speaker: 'KORU', text: 'I would like that.' }
            ], null, true);
        } else if (recordKey === 'atmosphere') {
            this.queueDialogues([
                { speaker: 'KORU', text: 'Your planet makes all these sounds?' },
                { speaker: 'ELI', text: 'Every day. Sometimes we don\'t even notice them.' },
                { speaker: 'KORU', text: 'How can you forget something so beautiful?' },
                { speaker: 'ELI', text: '...' }
            ], null, true);
        } else if (recordKey === 'earth') {
            this.queueDialogues([
                { speaker: 'ELI', text: 'I remember now.' },
                { speaker: 'KORU', text: 'Remember what?' },
                { speaker: 'ELI', text: 'Home.' }
            ], null, true);
        }
    }

    updateNasaHud(type, dataPoint, norm) {
        if (!this.ui || !this.ui.hudMetric) return;
        if (type === 'forest') {
            this.ui.hudMetric.innerText = `NASA GEDI L4B/L3 3D Canopy Structure [${dataPoint.location || 'Transect ' + dataPoint.step}]`;
            const hStr = (dataPoint.canopyHeight != null) ? `${dataPoint.canopyHeight.toFixed(1)}m` : 'N/A';
            const cStr = (dataPoint.canopyCover != null) ? `${(dataPoint.canopyCover * 100).toFixed(0)}%` : 'N/A';
            const bStr = (dataPoint.biomass != null) ? `${dataPoint.biomass.toFixed(1)} Mg/ha` : 'N/A';
            this.ui.hudValue.innerText = `Height: ${hStr} | Cover: ${cStr} | Biomass: ${bStr}`;
            this.ui.hudDesc.innerText = `NASA GEDI High-Resolution Spaceborne Lidar (DOI: 10.5067/GEDI/GEDI04_B.002). Waveform laser return converted into multi-octave Lydian pitch, canopy density chorus, and sub-bass biomass resonance. Biome: ${dataPoint.biome || 'Temperate Rainforest'}.`;
        } else if (type === 'ocean') {
            this.ui.hudMetric.innerText = `NASA ECCO V4r4 Ocean Temp & Salinity [${dataPoint.date || 'Day ' + dataPoint.step}]`;
            const tempStr = (dataPoint.temperature != null) ? `${dataPoint.temperature.toFixed(2)}°C` : 'N/A (Reef/Land Mask)';
            const salStr = (dataPoint.salinity != null) ? `${dataPoint.salinity.toFixed(2)} PSU` : 'N/A';
            const speedStr = (dataPoint.currentSpeed != null) ? `${dataPoint.currentSpeed.toFixed(2)} m/s` : 'N/A';
            this.ui.hudValue.innerText = `Temp: ${tempStr} | Salt: ${salStr} | Current: ${speedStr}`;
            this.ui.hudDesc.innerText = `NASA ECCO 0.5° Daily Mean (DOI: 10.5067/ECG5D-OTS44) & SVS 3912. Potential temperature mapped to pitch, salinity to overtone timbre, and current flow to stereo panning. Location: ${dataPoint.location} (${dataPoint.lat}°N, ${Math.abs(dataPoint.lon)}°W).`;
        } else if (type === 'atmosphere') {
            this.ui.hudMetric.innerText = `NASA MERRA-2 & GPM IMERG Precipitation [${dataPoint.location || 'Station ' + dataPoint.step}]`;
            const rainStr = (dataPoint.precipitationRate != null) ? `${dataPoint.precipitationRate.toFixed(1)} mm/hr` : '0 mm/hr';
            const windStr = (dataPoint.windSpeed != null) ? `${dataPoint.windSpeed.toFixed(1)} m/s` : 'N/A';
            const pStr = (dataPoint.barometricPressure != null) ? `${dataPoint.barometricPressure.toFixed(1)} hPa` : 'N/A';
            this.ui.hudValue.innerText = `Rain: ${rainStr} | Wind: ${windStr} | Pressure: ${pStr}`;
            this.ui.hudDesc.innerText = `NASA MERRA-2 Global Meteorological Reanalysis (DOI: 10.5067/95140KBM4KUS) & GPM IMERG. Surface precipitation rate controls dynamic rain cascades, wind speed controls aerodynamic filter cutoffs, and pressure maps to harmonic Dorian pitches. Location: ${dataPoint.location || 'Global Front'}.`;
        } else if (type === 'earth') {
            this.ui.hudMetric.innerText = `NASA VOYAGER GOLDEN RECORD 'SOUNDS OF EARTH'`;
            this.ui.hudValue.innerText = `${dataPoint.track || 'Track ' + dataPoint.step} | Chord: ${dataPoint.harmonicChord || 'F Lydian'}`;
            this.ui.hudDesc.innerText = `NASA Voyager 1 & 2 Interstellar Time Capsule (DOI: 10.5067/VOYAGER-GOLDEN-RECORD-SOUNDS-1977). ${dataPoint.caption || 'The planetary symphony uniting biosphere, ocean, and atmosphere with human piano memory.'}`;
        }
    }

    // ----------------------------------------------------
    // DIALOGUE SYSTEM
    // ----------------------------------------------------

    queueDialogues(dialogues, onComplete = null, forceImmediate = false) {
        this.dialogueQueue = dialogues.slice();
        this.dialogueOnComplete = onComplete;
        if ((forceImmediate || !this.currentDialogue) && this.dialogueQueue.length > 0) {
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

        if (this.ui && this.ui.dialogueBox) this.ui.dialogueBox.style.display = 'block';
        let speakerDisplay = this.currentDialogue.speaker;
        if (speakerDisplay === 'KORU') speakerDisplay = 'ROCKY';
        if (this.ui && this.ui.speakerName) this.ui.speakerName.innerText = speakerDisplay;
        if (this.ui && this.ui.dialogueText) this.ui.dialogueText.innerText = '';
        if (this.ui && this.ui.continuePrompt) this.ui.continuePrompt.style.display = 'none';

        // Speaker color styling
        if (this.ui && this.ui.speakerName) {
            if (this.currentDialogue.speaker === 'ELI') {
                this.ui.speakerName.style.color = '#ffca72';
            } else if (this.currentDialogue.speaker === 'KORU' || this.currentDialogue.speaker === 'ROCKY') {
                this.ui.speakerName.style.color = '#47d8f2';
            } else if (this.currentDialogue.speaker.startsWith('LITTLE')) {
                this.ui.speakerName.style.color = '#62c98a';
            } else {
                this.ui.speakerName.style.color = '#f28bbd';
            }
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
        if (this.ui && this.ui.choiceBox) {
            this.ui.choiceBox.style.display = 'none';
        }
    }

    showPrompt(text) {
        if (this.ui && this.ui.screenPrompt) {
            this.ui.screenPrompt.innerText = text;
            this.ui.screenPrompt.textContent = text;
            this.ui.screenPrompt.style.display = 'block';
        }
    }

    clearPrompt() {
        if (this.ui && this.ui.screenPrompt) {
            this.ui.screenPrompt.innerText = '';
            this.ui.screenPrompt.textContent = '';
            this.ui.screenPrompt.style.display = 'none';
        }
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
            case 'scene7':
                this.updateScene7(dt);
                break;
            case 'credits':
                if (this.keys['r'] || this.keys['R']) {
                    this.initScene('scene1');
                }
                break;
        }
    }

    updateScene7(dt) {
        if (this.keys['r'] || this.keys['R']) {
            this.initScene('scene1');
        }
        if (this.arrivalPhase && !this.currentDialogue && !this.activeChoice) {
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
            // Clamp on screen in snow
            this.eli.x = Math.max(285, Math.min(610, this.eli.x));
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
        const isRyanSpeaking = !!(this.currentDialogue && (this.currentDialogue.speaker === 'RYAN' || this.currentDialogue.speaker === 'ELI'));
        const isKoruSpeaking = !!(this.currentDialogue && (this.currentDialogue.speaker === 'KORU' || this.currentDialogue.speaker === 'ROCKY'));

        switch (this.currentScene) {
            case 'scene1':
                r.drawAlienPlanetBackground(this.cameraX);
                r.drawHabitatExterior(10, this.height * 0.74);
                r.drawKoru(this.koru.x, this.koru.y, this.koru.state, this.koru.facing, isKoruSpeaking);
                r.drawEli(this.eli.x, this.eli.y, this.eli.state, this.eli.facing, this.eli.isCarrying, isRyanSpeaking);
                break;

            case 'scene2':
                r.drawClassroom(this.classroomBoard);
                r.drawLittleOnes(this.sceneTime);
                r.drawKoru(this.koru.x, this.koru.y, this.koru.state, this.koru.facing, isKoruSpeaking);
                r.drawEli(this.eli.x, this.eli.y, this.eli.state, this.eli.facing, this.eli.isCarrying, isRyanSpeaking);
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
                r.drawKoru(this.koru.x, this.koru.y, this.koru.state, this.koru.facing, isKoruSpeaking);
                r.drawEli(this.eli.x, this.eli.y, this.eli.state, this.eli.facing, this.eli.isCarrying, isRyanSpeaking);
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
                r.drawEli(this.eli.x, this.eli.y, this.eli.state, this.eli.facing, this.eli.isCarrying, isRyanSpeaking);
                r.drawKoru(this.koru.x, this.koru.y, this.koru.state, this.koru.facing, isKoruSpeaking);
                if (this.currentScene === 'scene5') {
                    this.drawNasaWaveform();
                }
                break;

            case 'scene7':
                if (this.arrivalPhase) {
                    r.drawGeodesicDomeScene(this.eli.x, this.eli.y, this.eli.facing, this.eli.state, isRyanSpeaking, isKoruSpeaking, this.rockyInsideState || 'hands');
                } else {
                    r.drawSpaceDeparture(this.flightProgress);
                }
                break;

            case 'credits':
                r.drawGeodesicDomeScene(this.eli.x, this.eli.y, this.eli.facing, this.eli.state, isRyanSpeaking, isKoruSpeaking, 'hands');
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

        // Real-time Tone.js Waveform for Ocean Record
        if (this.jukeboxState.activeRecord === 'ocean' && window.oceanSonification) {
            const oceanMetrics = window.oceanSonification.getMetrics();
            const oceanWave = oceanMetrics.waveform;

            if (oceanWave && oceanWave.length > 0) {
                // Background amplitude energy bar
                ctx.fillStyle = 'rgba(71, 216, 242, 0.22)';
                const energyH = oceanMetrics.energy * (h - 4);
                ctx.fillRect(0, h - energyH, w, energyH);

                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                const sliceW = w / oceanWave.length;
                let x = 0;
                for (let i = 0; i < oceanWave.length; i++) {
                    const v = oceanWave[i]; // -1.0 to 1.0
                    const y = (h * 0.5) + (v * h * 0.42);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                    x += sliceW;
                }
                ctx.stroke();
                return;
            }
        }

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
