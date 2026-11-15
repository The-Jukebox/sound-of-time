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

        // Audio Permission State
        this.hasAudioPermission = false;
        this.isAudioMuted = false;
        this.audioPermissionOverlay = document.getElementById('audioPermissionOverlay');
        this.btnAllowAudio = document.getElementById('btnAllowAudio');
        this.btnMuteAudio = document.getElementById('btnMuteAudio');
        this.btnAudioToggle = document.getElementById('btnAudioToggle');
        this.audioIcon = document.getElementById('audioIcon');
        this.audioText = document.getElementById('audioText');

        this.setupAudioPermission();
        this.setupInput();

        // Direct EIC Navigation Buttons
        const btnJumpJukebox = document.getElementById('btnJumpJukebox');
        if (btnJumpJukebox) {
            btnJumpJukebox.onclick = () => {
                this.sound.stopSceneAmbience();
                this.sound.currentSceneAmbience = null;
                this.sound.init();
                this.sound.resume();
                if (typeof Tone !== 'undefined' && Tone.start) {
                    Tone.start().catch(() => {});
                }
                this.hasAudioPermission = true;
                if (this.audioPermissionOverlay) {
                    this.audioPermissionOverlay.style.display = 'none';
                }
                this.initScene('scene5');
            };
        }
        const btnStoryMode = document.getElementById('btnStoryMode');
        if (btnStoryMode) {
            btnStoryMode.onclick = () => {
                this.sound.init();
                this.sound.resume();
                if (typeof Tone !== 'undefined' && Tone.start) {
                    Tone.start().catch(() => {});
                }
                this.hasAudioPermission = true;
                if (this.audioPermissionOverlay) {
                    this.audioPermissionOverlay.style.display = 'none';
                }
                this.initScene('scene1');
            };
        }
        const btnJumpDeparture = document.getElementById('btnJumpDeparture');
        if (btnJumpDeparture) {
            btnJumpDeparture.onclick = () => {
                this.sound.stopSceneAmbience();
                this.sound.currentSceneAmbience = null;
                this.sound.init();
                this.sound.resume();
                if (typeof Tone !== 'undefined' && Tone.start) {
                    Tone.start().catch(() => {});
                }
                this.hasAudioPermission = true;
                if (this.audioPermissionOverlay) {
                    this.audioPermissionOverlay.style.display = 'none';
                }
                this.initScene('scene6');
            };
        }

        // Global NASA Data callback
        window.onNasaDataPoint = (type, dataPoint, norm) => {
            this.updateNasaHud(type, dataPoint, norm);
        };
        window.onThunderFlash = () => {
            this.renderer.triggerFlash();
        };

        // Start animation loop
        this.lastTime = performance.now();
        if (!this.audioPermissionOverlay) {
            this.hasAudioPermission = true;
            this.initScene('scene1');
        }
        requestAnimationFrame((t) => this.loop(t));
    }

    setupAudioPermission() {
        if (!this.audioPermissionOverlay) {
            this.hasAudioPermission = true;
            return;
        }

        const grantAudio = (enableSound) => {
            if (this.hasAudioPermission) return;
            this.hasAudioPermission = true;
            this.isAudioMuted = !enableSound;

            if (enableSound) {
                this.sound.init();
                this.sound.resume();
                if (typeof Tone !== 'undefined' && Tone.start) {
                    Tone.start().catch(() => {});
                }
            } else {
                if (this.sound && this.sound.masterGain) {
                    this.sound.masterGain.gain.setValueAtTime(0, this.sound.ctx ? this.sound.ctx.currentTime : 0);
                }
            }

            this.updateAudioToggleUI();

            // Smooth fade out of permission dialog
            this.audioPermissionOverlay.style.transition = 'opacity 0.25s ease';
            this.audioPermissionOverlay.style.opacity = '0';
            setTimeout(() => {
                this.audioPermissionOverlay.style.display = 'none';
                this.initScene('scene1');
            }, 250);
        };

        if (this.btnAllowAudio) {
            this.btnAllowAudio.onclick = (e) => {
                e.stopPropagation();
                grantAudio(true);
            };
        }

        if (this.btnMuteAudio) {
            this.btnMuteAudio.onclick = (e) => {
                e.stopPropagation();
                grantAudio(false);
            };
        }

        if (this.btnAudioToggle) {
            this.btnAudioToggle.onclick = (e) => {
                e.stopPropagation();
                this.toggleAudioMute();
            };
        }
    }

    toggleAudioMute() {
        this.isAudioMuted = !this.isAudioMuted;
        if (this.isAudioMuted) {
            if (this.sound && this.sound.masterGain) {
                this.sound.masterGain.gain.setValueAtTime(0, this.sound.ctx ? this.sound.ctx.currentTime : 0);
            }
            if (typeof Tone !== 'undefined' && Tone.Destination) {
                Tone.Destination.mute = true;
            }
        } else {
            this.sound.init();
            this.sound.resume();
            if (typeof Tone !== 'undefined' && Tone.start) {
                Tone.start().catch(() => {});
                Tone.Destination.mute = false;
            }
            const vol = 0.85;
            if (this.sound && this.sound.masterGain) {
                this.sound.masterGain.gain.setValueAtTime(vol, this.sound.ctx ? this.sound.ctx.currentTime : 0);
            }
        }
        this.updateAudioToggleUI();
    }

    updateAudioToggleUI() {
        if (!this.btnAudioToggle) return;
        if (this.isAudioMuted) {
            if (this.audioIcon) this.audioIcon.innerText = '🔇';
            if (this.audioText) this.audioText.innerText = 'SOUND: OFF';
            this.btnAudioToggle.style.color = '#a89fb8';
            this.btnAudioToggle.style.borderColor = '#47365a';
        } else {
            if (this.audioIcon) this.audioIcon.innerText = '🔊';
            if (this.audioText) this.audioText.innerText = 'SOUND: ON';
            this.btnAudioToggle.style.color = '#ffd166';
            this.btnAudioToggle.style.borderColor = '#63431d';
        }
    }

    clearActionKeys() {
        this.keys['enter'] = false;
        this.keys['Enter'] = false;
        this.keys['e'] = false;
        this.keys['E'] = false;
        this.keys[' '] = false;
        this.keys['Space'] = false;
        this.keys['q'] = false;
        this.keys['Q'] = false;
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            // Audio Permission Dialog keyboard response
            if (!this.hasAudioPermission && this.audioPermissionOverlay && this.audioPermissionOverlay.style.display !== 'none') {
                if (e.key === 'Enter' || e.code === 'Space') {
                    e.preventDefault();
                    if (this.btnAllowAudio) this.btnAllowAudio.click();
                    return;
                } else if (e.key === 'm' || e.key === 'M' || e.key === 'Escape') {
                    e.preventDefault();
                    if (this.btnMuteAudio) this.btnMuteAudio.click();
                    return;
                }
                return;
            }

            // Keyboard shortcut M for mute/unmute
            if (e.key === 'm' || e.key === 'M') {
                this.toggleAudioMute();
                e.preventDefault();
                return;
            }

            if (!this.isAudioMuted) {
                this.sound.resume();
            }
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;

            // Fullscreen toggle shortcut (F)
            if (e.key === 'f' || e.key === 'F') {
                this.toggleFullscreen();
                e.preventDefault();
                return;
            }

            // SCENE 5 JUKEBOX, HABITAT & MEMORY CONTROLS (Strictly Arrow Keys & Enter)
            if (this.currentScene === 'scene5') {
                if (e.key === 'Enter') {
                    if (window.memoryCinema && window.memoryCinema.isOpen) {
                        window.memoryCinema.close();
                    } else if (this.jukeboxState.activeRecord) {
                        this.dismissDialogue();
                        this.openMemoryVision();
                    }
                    e.preventDefault();
                    return;
                } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    this.cycleRecord(1);
                    e.preventDefault();
                    return;
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    this.cycleRecord(-1);
                    e.preventDefault();
                    return;
                } else if (e.code === 'Space') {
                    this.toggleJukeboxPlayPause();
                    e.preventDefault();
                    return;
                } else if (e.key === 's' || e.key === 'S') {
                    this.stopJukebox();
                    e.preventDefault();
                    return;
                } else if (e.key === 'r' || e.key === 'R') {
                    this.replayJukebox();
                    e.preventDefault();
                    return;
                } else if (e.key === 'e' || e.key === 'E') {
                    this.ejectJukebox();
                    e.preventDefault();
                    return;
                } else if (e.key === '1') {
                    this.selectJukeboxRecord('forest');
                } else if (e.key === '2') {
                    this.selectJukeboxRecord('ocean');
                } else if (e.key === '3') {
                    this.selectJukeboxRecord('atmosphere');
                } else if (e.key === '4') {
                    this.unlockEarthRecord();
                    this.selectJukeboxRecord('earth');
                } else if (e.key === 'p' || e.key === 'P') {
                    if (window.memoryCinema && window.memoryCinema.isOpen) {
                        window.memoryCinema.togglePixelMode();
                    } else {
                        this.initScene('scene6');
                    }
                    e.preventDefault();
                    return;
                }
            }

            // SCENE 7 & 8 WHOLE EARTH VIEWPORT CINEMA CONTROLS
            if (this.currentScene === 'scene7' || this.currentScene === 'scene8') {
                if (e.key === 'Enter') {
                    if (window.memoryCinema && window.memoryCinema.isOpen) {
                        window.memoryCinema.close();
                        e.preventDefault();
                        return;
                    }
                    if (!this.currentDialogue) {
                        this.openMemoryVision('earth');
                        e.preventDefault();
                        return;
                    }
                }
            }

            // Dialogue continue / Choice select
            if (e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.code === 'Space') {
                if (this.currentDialogue) {
                    this.advanceDialogue();
                    this.clearActionKeys();
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
                    this.clearActionKeys();
                    e.preventDefault();
                }
                return;
            }

            // Power button toggle shortcut & failsafe advance in Scene 4
            if (this.currentScene === 'scene4') {
                if (e.key === 'p' || e.key === 'P' || e.key === 'Enter' || e.code === 'Space' || e.key === 'e' || e.key === 'E') {
                    if (!this.currentDialogue && !this.activeChoice) {
                        this.powerOnJukebox(true);
                        e.preventDefault();
                    }
                }
            }
        });


        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });

        // Click on canvas to resume sound, zoom into memory bubble, or advance dialogue
        this.canvas.addEventListener('click', (e) => {
            if (!this.isAudioMuted) {
                this.sound.resume();
            }
            if (this.currentScene === 'scene4' && !this.currentDialogue && !this.activeChoice) {
                this.powerOnJukebox(true);
                return;
            }
            if (this.currentScene === 'scene5' && this.jukeboxState.activeRecord) {
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;
                const clickX = (e.clientX - rect.left) * scaleX;
                const clickY = (e.clientY - rect.top) * scaleY;
                const bx = this.eli.x + 35;
                const by = this.eli.y - 105;
                if (Math.abs(clickX - bx) < 85 && Math.abs(clickY - by) < 65) {
                    this.dismissDialogue();
                    this.openMemoryVision();
                    return;
                }
            }
            if (this.currentScene === 'scene7') {
                const rect = this.canvas.getBoundingClientRect();
                const scaleY = this.canvas.height / rect.height;
                const clickY = (e.clientY - rect.top) * scaleY;
                if (clickY < this.canvas.height * 0.72) {
                    this.openMemoryVision('earth');
                    return;
                }
            }
            if (this.currentDialogue) {
                this.advanceDialogue();
                return;
            }
        });

        // Fullscreen button click handler
        if (this.ui && this.ui.btnFullscreen) {
            this.ui.btnFullscreen.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFullscreen();
            });
        }

        // Screen prompt click to proceed to departure in Scene 5
        if (this.ui && this.ui.screenPrompt) {
            this.ui.screenPrompt.style.cursor = 'pointer';
            this.ui.screenPrompt.addEventListener('click', () => {
                if (this.currentScene === 'scene5') {
                    this.initScene('scene6');
                }
            });
        }

        // Fullscreen change events to update button state & layout
        const onFsChange = () => this.updateFullscreenUI();
        document.addEventListener('fullscreenchange', onFsChange);
        document.addEventListener('webkitfullscreenchange', onFsChange);
    }

    enterFullscreen() {
        const isNativeFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
        const isWindowFs = document.body.classList.contains('is-fullscreen');
        if (isNativeFs || isWindowFs) return;

        const target = document.documentElement;
        if (target.requestFullscreen) {
            target.requestFullscreen().catch(() => {
                document.body.classList.add('is-fullscreen');
                this.updateFullscreenUI();
            });
        } else if (target.webkitRequestFullscreen) {
            target.webkitRequestFullscreen();
        } else {
            document.body.classList.add('is-fullscreen');
            this.updateFullscreenUI();
        }
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

        // Update EIC Nav Dock Buttons
        const btnJumpJukebox = document.getElementById('btnJumpJukebox');
        const btnStoryMode = document.getElementById('btnStoryMode');
        if (btnJumpJukebox && btnStoryMode) {
            if (sceneName === 'scene5') {
                btnJumpJukebox.classList.add('active');
                btnStoryMode.classList.remove('active');
            } else {
                btnJumpJukebox.classList.remove('active');
                btnStoryMode.classList.add('active');
            }
        }

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
            case 'scene8':
                this.initScene8();
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

        // Opening dialogue (Project Hail Mary tone)
        setTimeout(() => {
            this.queueDialogues([
                { speaker: 'ROCKY', text: 'Grace! Your students are waiting! Little ones vibrate with anticipation.' },
                { speaker: 'RYAN', text: 'Already? I thought I had another five minutes.' },
                { speaker: 'ROCKY', text: 'Question: Why is human five minutes always longer than Eridian five minutes? Human math is broken!' },
                { speaker: 'RYAN', text: '(laughs) That\'s teacher time, Rocky. Come on, let\'s go teach them some science.' }
            ], () => {
                this.showPrompt('[A/D] or [ARROWS] WALK TOWARDS THE CLASSROOM | OR CLICK "LAUNCH EARTH JUKEBOX" ABOVE');
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
                speaker: 'RYAN',
                text: 'All right, everyone! Today we\'re going to talk about something very special: planetary atmospheres and oceans.'
            },
            {
                speaker: 'LITTLE ROCK 1',
                text: 'Question: Is Earth made of rocks like Erid?'
            },
            {
                speaker: 'RYAN',
                text: 'Partly! But on Earth, nitrogen and oxygen scatter sunlight to turn the whole sky brilliant blue. And seventy percent is liquid water!'
            },
            {
                speaker: 'LITTLE ROCK 2',
                text: 'Question: What is a forest?'
            },
            {
                speaker: 'RYAN',
                text: 'Vast living canopies of trees. Millions of them swaying in the wind, hosting singing organisms in the branches.',
                onShow: () => { this.classroomBoard = 'forest'; }
            },
            {
                speaker: 'LITTLE ROCK 3',
                text: '*Soft snoring whistles... Zzz*'
            },
            {
                speaker: 'RYAN',
                text: 'Haha, wake up back there! Science waits for no one!'
            },
            {
                speaker: 'RYAN',
                text: 'And rain: fresh liquid water falling gently from clouds in the sky.',
                onShow: () => { this.classroomBoard = 'rain'; }
            },
            {
                speaker: 'LITTLE ROCK 1',
                text: 'Question: What does falling water sound like?'
            },
            {
                speaker: 'RYAN',
                text: 'It sounds... like peace. Like home.'
            },
            {
                speaker: 'ROCKY',
                text: 'Question: Does your world truly have acoustic harmonies everywhere in nature?'
            },
            {
                speaker: 'RYAN',
                text: 'Everywhere, Rocky. Wind, water, birds... nature\'s own living synthesizer.'
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
        this.jukeboxDugUp = false;
        this.jukeboxDroppedX = null;

        this.koru.x = 60;
        this.koru.facing = 1;
        this.koru.state = 'walk';

        this.queueDialogues([
            { speaker: 'ROCKY', text: 'Question: Did the little ones understand the concept of singing trees?' },
            { speaker: 'RYAN', text: 'I think they loved it, Rocky. Kids love imagining worlds different from their own.' },
            { speaker: 'ROCKY', text: 'Good. Proud. I like to hear you speak of your world.' },
            { speaker: 'RYAN', text: 'More than anything, Rocky.' }
        ], () => {
            this.queueDialogues([
                {
                    speaker: 'RYAN',
                    text: 'Wait... Rocky, look down there. In the regolith!',
                    onShow: () => {
                        this.eli.state = 'idle';
                        this.koru.state = 'idle';
                    }
                }
            ], () => {
                this.showPrompt('[WALK TO THE GOLDEN LIGHT AND PRESS ENTER TO EXAMINE]');
            });
        });
    }

    // SCENE 4 — THE JUKEBOX
    initScene4() {
        this.sound.stopRecord();
        if (window.oceanSonification) window.oceanSonification.stop();
        if (window.forestSonification) window.forestSonification.stop();
        if (window.atmosphereSonification) window.atmosphereSonification.stop();
        if (window.earthSonification) window.earthSonification.stop();
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
            { speaker: 'RYAN', text: 'Let\'s see what you\'ve got.' }
        ], () => {
            this.showChoiceMenu('CHOICE 2 — What should we do with the jukebox?', [
                {
                    text: '1. TURN IT ON',
                    action: () => this.powerOnJukebox(true)
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
            { speaker: 'RYAN', text: 'Look at this, Rocky. Four distinct archive cylinders. Etched with intricate magnetic grooves.' },
            { speaker: 'ROCKY', text: 'Question: Does the machine produce audio waves? Does it sing?' },
            { speaker: 'RYAN', text: 'Let\'s turn it on to find out!' }
        ], () => {
            this.powerOnJukebox(true);
        });
    }

    moveJukeboxDialogue() {
        this.queueDialogues([
            { speaker: 'RYAN', text: 'Careful, Rocky... it\'s heavy. Solid Earth oak and brass.' },
            { speaker: 'ROCKY', text: 'Amaze! Very dense! Machine has made a long voyage across the stars!' }
        ], () => {
            this.powerOnJukebox(true);
        });
    }

    leaveOffDialogue() {
        this.queueDialogues([
            { speaker: 'ROCKY', text: 'Question: Why leave off? Aren\'t you curious, Grace? It came all the way from your world!' },
            { speaker: 'RYAN', text: 'You\'re right, Rocky. Let\'s see what Earth sent us.' }
        ], () => {
            this.powerOnJukebox(true);
        });
    }

    powerOnJukebox(fromDialogue = false) {
        this.sound.resume();
        this.sound.playRelayClickSfx();
        this.sound.playNeonHumSfx(3.0);
        this.jukeboxState.isPowered = true;
        const pwrBtn = document.getElementById('btnPower');
        if (pwrBtn) pwrBtn.classList.add('primary');

        if (fromDialogue || this.currentScene === 'scene4') {
            this.queueDialogues([
                { speaker: 'SYSTEM', text: '*BZZT... CLUNK... WARM VACUUM TUBE HUM...*' },
                { speaker: 'SYSTEM', text: 'DISPLAY: [ NASA EARTH INFORMATION CENTER — ARCHIVE 001 ]' },
                { speaker: 'RYAN', text: 'NASA\'s Earth Information Center! Rocky... it translates Earth observation frames into real-time soundscapes!' },
                { speaker: 'ROCKY', text: 'Amaze! It turns the sight of your planet into living music! Push button, Grace! Let us listen!' }
            ], () => {
                this.initScene('scene5');
            });
        } else {
            this.showPrompt('[ JUKEBOX POWERED ON — READY FOR PLAYBACK ]');
            if (this.jukeboxState.activeRecord) {
                this.playJukebox();
            }
        }
    }

    // SCENE 5 — THE SOUND COLLECTION
    initScene5() {
        this.sound.stopSceneAmbience();
        this.sound.currentSceneAmbience = null;
        this.ui.jukeboxPanel.style.display = 'flex';
        this.ui.nasaHud.style.display = 'none';

        this.eli.x = 220;
        this.eli.facing = 1;
        this.eli.state = 'idle';
        this.eli.isCarrying = false;
        this.koru.x = 420;
        this.koru.facing = -1;
        this.koru.state = 'idle';
        this.jukeboxState.isPowered = true;

        this.setupJukeboxUI();
        this.showPrompt('[ [ < / > ] SWITCH RECORD  |  [ENTER] ZOOM INTO MEMORY  |  [🚀 PROCEED TO DEPARTURE] ]');

        // Auto-select Forest record first
        this.selectJukeboxRecord('forest');

        // Automatically unlock Departure button and Earth Record after 1 second
        setTimeout(() => {
            const btnProceed = document.getElementById('btnProceed');
            if (btnProceed) {
                btnProceed.style.display = 'inline-block';
            }
            this.unlockEarthRecord();
        }, 1000);
    }

    unlockEarthRecord() {
        this.jukeboxState.unlockedRecords.earth = true;
        const earthBtn = document.getElementById('btnRecEarth');
        if (earthBtn) {
            earthBtn.classList.remove('locked');
            earthBtn.innerHTML = '<span class="rec-icon">🌍</span><span>004 EARTH (UNLOCKED)</span>';
        }
        const btnProceed = document.getElementById('btnProceed');
        if (btnProceed) {
            btnProceed.style.display = 'inline-block';
        }
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
            { speaker: 'ROCKY', text: 'You miss it, Grace.' },
            { speaker: 'RYAN', text: 'Every day, Rocky. Every single day.' },
            { speaker: 'ROCKY', text: 'Question: Why stay on Erid when your heart wants Earth?' },
            { speaker: 'RYAN', text: 'I thought my journey was over. But hearing these sounds again... I know where I belong.' },
            { speaker: 'ROCKY', text: 'Then we go! I build xenonite life-support sphere for spacecraft! I install atmospheric regulators! We fly to Earth together!' },
            { speaker: 'RYAN', text: 'Rocky... you\'d really cross the galaxy to come to Earth with me?' },
            { speaker: 'ROCKY', text: 'Amaze! Yes! You saved my entire species, Grace! I will not let you travel alone! We go together!' },
            { speaker: 'RYAN', text: 'Then let\'s prep the ship!' }
        ], () => {
            this.showChoiceMenu('CHOICE 3 — What do we do with the jukebox?', [
                {
                    text: 'A. TAKE IT TO THE SPACECRAFT',
                    action: () => {
                        this.jukeboxState.takenToShip = true;
                        this.queueDialogues([
                            { speaker: 'RYAN', text: 'We\'re taking the jukebox with us. It brought us together.' },
                            { speaker: 'ROCKY', text: 'Good! We play Earth songs while our spin drives roar across the stars!' }
                        ], () => {
                            this.initScene('scene7');
                        });
                    }
                },
                {
                    text: 'B. LEAVE IT IN HABITAT',
                    action: () => {
                        this.jukeboxState.takenToShip = false;
                        this.queueDialogues([
                            { speaker: 'RYAN', text: 'We\'ll hear the real sounds when we get there.' },
                            { speaker: 'ROCKY', text: 'Amaze! Then let us fly to the real sounds!' }
                        ], () => {
                            this.initScene('scene7');
                        });
                    }
                }
            ]);
        });
    }

    // SCENE 7 — THE GRAND FINALE: IN THE SPACECRAFT HEADING TO EARTH
    initScene7() {
        this.sound.stopSceneAmbience();
        this.sound.startSceneAmbience('spaceship_flight');

        this.flightProgress = 0;
        this.arrivalPhase = false;
        this.fistBumping = false;
        this.headingIntoAtmosphere = false;
        this.arrivalComplete = false;

        this.queueDialogues([
            {
                speaker: 'ROCKY',
                text: 'Grace! Grace! Look at viewport! Look ahead!',
                onShow: () => {
                    this.showPrompt('[ENTER] / CLICK VIEWPORT: WATCH WHOLE EARTH IN 4K (NASA ARCHIVE) | [SPACE] CONTINUE');
                }
            },
            {
                speaker: 'RYAN',
                text: 'I see it, Rocky... look at that.'
            },
            {
                speaker: 'ROCKY',
                text: 'Amaze! Amaze! Amaze! The blue marble! It is truly blue! Liquid water everywhere!'
            },
            {
                speaker: 'RYAN',
                text: 'That\'s Earth, buddy. Oceans, forests, atmosphere... all the music we listened to.'
            },
            {
                speaker: 'ROCKY',
                text: 'Question: Can we hear the birds and the waves when we enter the atmosphere?'
            },
            {
                speaker: 'RYAN',
                text: 'Very soon, Rocky. We\'re on final orbital approach right now.'
            },
            {
                speaker: 'ROCKY',
                text: 'We saved my world. We saved your world. Now we go home together. Good. Proud.'
            },
            {
                speaker: 'RYAN',
                text: 'I couldn\'t have done any of this without you, Rocky. You\'re the best friend I ever had.'
            },
            {
                speaker: 'RYAN',
                text: 'Fist-bump, Rocky!',
                onShow: () => {
                    this.fistBumping = true;
                }
            },
            {
                speaker: 'ROCKY',
                text: 'Fist my bump!',
                onShow: () => {
                    this.fistBumping = true;
                    if (this.sound) this.sound.playRelayClickSfx();
                }
            },
            {
                speaker: 'RYAN',
                text: 'Attitude thrusters firing! Heading into Earth\'s atmosphere in three... two... one... Hold on, Rocky!'
            },
            {
                speaker: 'ROCKY',
                text: 'Amaze! Hang on, Grace! We go home!',
                onShow: () => {
                    this.headingIntoAtmosphere = true;
                }
            }
        ], () => {
            this.arrivalComplete = true;
            this.showPrompt('[RE-ENTERING ATMOSPHERE... LANDING ON EARTH]');
            setTimeout(() => {
                this.initScene('scene8');
            }, 3200);
        });
    }

    // SCENE 8 — GRAND FINALE: EARTH'S JURASSIC COAST (DURDLE DOOR)
    initScene8() {
        this.sound.stopSceneAmbience();
        this.sound.startSceneAmbience('earth_beach');

        this.showSceneOverlay('SOUND OF TIMES', 'EARTH — THE JURASSIC COAST (SOME TIME LATER...)', 3600);

        // Ryan is seated on the pebble beach listening to the real ocean waves
        this.eli.x = 310;
        this.eli.y = this.height * 0.80;
        this.eli.facing = -1;
        this.eli.state = 'idle';
        this.beachSeated = true;

        // Rocky starts walking along the pebble shoreline in his form-fitting xenonite suit
        this.koru.x = 80;
        this.koru.y = this.height * 0.80;
        this.koru.facing = 1;
        this.koru.state = 'walk';
        this.rockyBeachSeated = false;
        this.beachFistBumping = false;

        // Rocky walks up to visit Ryan on the pebble beach!
        setTimeout(() => {
            this.queueDialogues([
                {
                    speaker: 'ROCKY',
                    text: 'Why you take so long?',
                    onShow: () => {
                        this.koru.x = 210;
                        this.koru.state = 'walk';
                    }
                },
                {
                    speaker: 'RYAN',
                    text: 'Just listening to the waves, Rocky. Come sit with me.'
                },
                {
                    speaker: 'ROCKY',
                    text: 'Question: This is ocean? Real liquid water ocean?',
                    onShow: () => {
                        this.koru.x = 265;
                        this.koru.facing = 1;
                        this.koru.state = 'idle';
                        this.rockyBeachSeated = true; // Sits down beside Ryan!
                    }
                },
                {
                    speaker: 'RYAN',
                    text: 'The very same one from the jukebox recording. Seventy percent of Earth\'s surface. Salty, restless, and endless.'
                },
                {
                    speaker: 'ROCKY',
                    text: 'Amaze. Amaze. Amaze. Sound is... good. Very good. Better than recording. Loud and soft at same time.'
                },
                {
                    speaker: 'RYAN',
                    text: 'Yeah. It really is. Thank you for coming across the stars to visit me on Earth, Rocky.'
                },
                {
                    speaker: 'ROCKY',
                    text: 'Good. Proud. We saved two worlds, Grace. We are friends forever. Fist my bump.'
                },
                {
                    speaker: 'RYAN',
                    text: 'Fist-bump, buddy!',
                    onShow: () => {
                        this.beachFistBumping = true;
                        if (this.sound) this.sound.playRelayClickSfx();
                    }
                }
            ], () => {
                this.showPrompt('[ENTER] WATCH NASA WHOLE EARTH CINEMA (4K)  |  [←/→] WALK BY WATER  |  [R] REPLAY');
            });
        }, 2200);
    }

    // CREDITS & ENDING SCREEN
    initCredits() {
        this.initScene8();
    }

    // ----------------------------------------------------
    // JUKEBOX INTERACTIVE UI & CONTROLS
    // ----------------------------------------------------

    setupJukeboxUI() {
        const recordBtns = document.querySelectorAll('.record-btn');
        recordBtns.forEach(btn => {
            btn.onclick = () => {
                this.sound.resume();
                if (typeof Tone !== 'undefined' && Tone.context && Tone.context.state !== 'running') {
                    Tone.start();
                }
                const rec = btn.getAttribute('data-record');
                if (rec === 'earth' && !this.jukeboxState.unlockedRecords.earth) {
                    this.unlockEarthRecord();
                }
                this.selectJukeboxRecord(rec);
            };
        });

        const btnPower = document.getElementById('btnPower');
        if (btnPower) btnPower.onclick = () => this.toggleJukeboxPower();

        const btnPlay = document.getElementById('btnPlay');
        if (btnPlay) {
            btnPlay.onclick = () => {
                this.sound.resume();
                if (typeof Tone !== 'undefined' && Tone.context && Tone.context.state !== 'running') {
                    Tone.start();
                }
                if (!this.jukeboxState.isPowered) {
                    this.powerOnJukebox(false);
                }
                this.playJukebox();
            };
        }

        const btnPause = document.getElementById('btnPause');
        if (btnPause) btnPause.onclick = () => this.pauseJukebox();

        const btnStop = document.getElementById('btnStop');
        if (btnStop) btnStop.onclick = () => this.stopJukebox();

        const btnReplay = document.getElementById('btnReplay');
        if (btnReplay) {
            btnReplay.onclick = () => {
                this.sound.resume();
                if (typeof Tone !== 'undefined' && Tone.context && Tone.context.state !== 'running') {
                    Tone.start();
                }
                this.replayJukebox();
            };
        }

        const btnEject = document.getElementById('btnEject');
        if (btnEject) btnEject.onclick = () => this.ejectJukebox();

        const btnMemory = document.getElementById('btnMemoryVision');
        if (btnMemory) {
            btnMemory.onclick = () => this.openMemoryVision();
        }

        const btnProceed = document.getElementById('btnProceed');
        if (btnProceed) {
            btnProceed.onclick = () => {
                this.initScene('scene6');
            };
        }

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
                    if (typeof window.atmosphereSonification.setVolume === 'function') {
                        window.atmosphereSonification.setVolume(val);
                    } else {
                        window.atmosphereSonification.volumeLevel = val;
                        if (window.atmosphereSonification.masterVolume && typeof Tone !== 'undefined') {
                            window.atmosphereSonification.masterVolume.volume.value = Tone.gainToDb(Math.max(val, 0.0001));
                        }
                    }
                }
                if (window.earthSonification) {
                    if (typeof window.earthSonification.setVolume === 'function') {
                        window.earthSonification.setVolume(val);
                    } else {
                        window.earthSonification.volumeLevel = val;
                        if (window.earthSonification.masterVolume && typeof Tone !== 'undefined') {
                            window.earthSonification.masterVolume.volume.value = Tone.gainToDb(Math.max(val, 0.0001));
                        }
                    }
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
                let targetId = 'forestSciencePanel';
                if (this.jukeboxState.activeRecord === 'ocean') targetId = 'oceanSciencePanel';
                else if (this.jukeboxState.activeRecord === 'atmosphere') targetId = 'atmosphereSciencePanel';
                else if (this.jukeboxState.activeRecord === 'earth') targetId = 'earthSciencePanel';
                const pnl = document.getElementById(targetId);
                if (pnl) {
                    const willShow = (pnl.style.display === 'none');
                    pnl.style.display = willShow ? 'block' : 'none';
                    if (this.ui.nasaHud) this.ui.nasaHud.style.display = willShow ? 'block' : 'none';
                    this.showPrompt(`[ SCIENTIFIC DETAILS: ${willShow ? 'DISPLAYED' : 'COLLAPSED'} ]`);
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
                        Object.values(modeBtns).forEach(b => {
                            if (b) b.classList.remove('active');
                        });
                        btn.classList.add('active');
                        this.showPrompt(`[ TIME OF DAY SET TO ${modeKey.toUpperCase()} ]`);
                    };
                }
            });

            // Wire Layer Mute buttons
            const btnMuteMusic = document.getElementById('btnMuteMusic');
            if (btnMuteMusic) {
                btnMuteMusic.onclick = () => {
                    const isMuted = window.forestSonification.soundscape.toggleMusicMute();
                    btnMuteMusic.classList.toggle('muted', isMuted);
                    this.showPrompt(`[ MUSIC LAYER ${isMuted ? 'MUTED' : 'UNMUTED'} ]`);
                };
            }
            const btnMuteCanopy = document.getElementById('btnMuteCanopy');
            if (btnMuteCanopy) {
                btnMuteCanopy.onclick = () => {
                    const isMuted = window.forestSonification.soundscape.toggleCanopyMute();
                    btnMuteCanopy.classList.toggle('muted', isMuted);
                    this.showPrompt(`[ CANOPY & WIND LAYER ${isMuted ? 'MUTED' : 'UNMUTED'} ]`);
                };
            }
            const btnMuteWildlife = document.getElementById('btnMuteWildlife');
            if (btnMuteWildlife) {
                btnMuteWildlife.onclick = () => {
                    const isMuted = window.forestSonification.soundscape.toggleWildlifeMute();
                    btnMuteWildlife.classList.toggle('muted', isMuted);
                    this.showPrompt(`[ WILDLIFE & BIRDS LAYER ${isMuted ? 'MUTED' : 'UNMUTED'} ]`);
                };
            }
            const btnMuteWater = document.getElementById('btnMuteWater');
            if (btnMuteWater) {
                btnMuteWater.onclick = () => {
                    const isMuted = window.forestSonification.soundscape.toggleWaterMute();
                    btnMuteWater.classList.toggle('muted', isMuted);
                    this.showPrompt(`[ MOUNTAIN STREAM LAYER ${isMuted ? 'MUTED' : 'UNMUTED'} ]`);
                };
            }

            // Wire Call Bird Button
            const btnCallBird = document.getElementById('btnCallBird');
            if (btnCallBird) {
                btnCallBird.onclick = async () => {
                    this.sound.resume();
                    if (typeof Tone !== 'undefined' && Tone.context && Tone.context.state !== 'running') {
                        await Tone.start();
                    }
                    if (window.forestSonification) {
                        if (!window.forestSonification.isInitialized) {
                            await window.forestSonification.initAudio();
                        }
                        if (window.forestSonification.masterVolume) {
                            window.forestSonification.masterVolume.mute = false;
                        }
                        if (window.forestSonification.soundscape) {
                            if (window.forestSonification.soundscape.wildlifeMuted) {
                                window.forestSonification.soundscape.toggleWildlifeMute();
                                if (btnMuteWildlife) btnMuteWildlife.classList.remove('muted');
                            }
                            const res = window.forestSonification.soundscape.callBird('random');
                            if (res) {
                                this.showPrompt(`[ 🐦 BIRD CALLED: ${res.species.toUpperCase()} SINGING IN CANOPY ]`);
                            }
                        }
                    }
                };
            }

            const btnStreamGurgle = document.getElementById('btnStreamGurgle');
            if (btnStreamGurgle) {
                btnStreamGurgle.onclick = async () => {
                    this.sound.resume();
                    if (typeof Tone !== 'undefined' && Tone.context && Tone.context.state !== 'running') {
                        await Tone.start();
                    }
                    if (window.forestSonification) {
                        if (!window.forestSonification.isInitialized) await window.forestSonification.initAudio();
                        if (window.forestSonification.masterVolume) window.forestSonification.masterVolume.mute = false;
                        if (window.forestSonification.soundscape) {
                            window.forestSonification.soundscape.playStreamGurgle();
                            this.showPrompt('[ 💧 MOUNTAIN STREAM: WATER GURGLING OVER MOSSY STONES ]');
                        }
                    }
                };
            }

            const btnWoodpecker = document.getElementById('btnWoodpecker');
            if (btnWoodpecker) {
                btnWoodpecker.onclick = async () => {
                    this.sound.resume();
                    if (typeof Tone !== 'undefined' && Tone.context && Tone.context.state !== 'running') {
                        await Tone.start();
                    }
                    if (window.forestSonification) {
                        if (!window.forestSonification.isInitialized) await window.forestSonification.initAudio();
                        if (window.forestSonification.masterVolume) window.forestSonification.masterVolume.mute = false;
                        if (window.forestSonification.soundscape) {
                            window.forestSonification.soundscape.playWoodpeckerTaps();
                            this.showPrompt('[ 🪵 WOODPECKER DRUMMING ON TREE TRUNK ]');
                        }
                    }
                };
            }

            const btnFrog = document.getElementById('btnFrog');
            if (btnFrog) {
                btnFrog.onclick = async () => {
                    this.sound.resume();
                    if (typeof Tone !== 'undefined' && Tone.context && Tone.context.state !== 'running') {
                        await Tone.start();
                    }
                    if (window.forestSonification) {
                        if (!window.forestSonification.isInitialized) await window.forestSonification.initAudio();
                        if (window.forestSonification.masterVolume) window.forestSonification.masterVolume.mute = false;
                        if (window.forestSonification.soundscape) {
                            window.forestSonification.soundscape.playFrogCroak();
                            this.showPrompt('[ 🐸 TREEFROG & BULLFROG CROAKING NEAR BROOK ]');
                        }
                    }
                };
            }

            const btnRainDrop = document.getElementById('btnRainDrop');
            if (btnRainDrop) {
                btnRainDrop.onclick = async () => {
                    this.sound.resume();
                    if (typeof Tone !== 'undefined' && Tone.context && Tone.context.state !== 'running') {
                        await Tone.start();
                    }
                    if (window.forestSonification) {
                        if (!window.forestSonification.isInitialized) await window.forestSonification.initAudio();
                        if (window.forestSonification.masterVolume) window.forestSonification.masterVolume.mute = false;
                        if (window.forestSonification.soundscape) {
                            window.forestSonification.soundscape.setRainGain(0.35);
                            window.forestSonification.soundscape.playCanopyLeafDrip();
                            this.showPrompt('[ 🌧️ CANOPY RAINFALL & LEAF DRIP PITTER-PATTER ]');
                        }
                    }
                };
            }

            const btnThunder = document.getElementById('btnThunder');
            if (btnThunder) {
                btnThunder.onclick = async () => {
                    this.sound.resume();
                    if (typeof Tone !== 'undefined' && Tone.context && Tone.context.state !== 'running') {
                        await Tone.start();
                    }
                    if (window.forestSonification) {
                        if (!window.forestSonification.isInitialized) await window.forestSonification.initAudio();
                        if (window.forestSonification.masterVolume) window.forestSonification.masterVolume.mute = false;
                        if (window.forestSonification.soundscape) {
                            window.forestSonification.soundscape.playThunderRumble();
                            this.renderer.triggerFlash();
                            this.showPrompt('[ ⚡ DISTANT ROLLING ATMOSPHERIC THUNDER ]');
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
                    if (window.forestSonification && window.forestSonification.soundscape) {
                        window.forestSonification.soundscape.setCanopyVolume(val);
                        window.forestSonification.soundscape.setWildlifeVolume(val * 0.95);
                        window.forestSonification.soundscape.setWaterVolume(val * 0.85);
                    }
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
        this.sound.stopSceneAmbience();
        this.sound.currentSceneAmbience = null;
        this.jukeboxState.activeRecord = recordKey;
        this.sound.playRecordCarouselSfx();

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
        this.sound.stopSceneAmbience();
        this.sound.currentSceneAmbience = null;
        this.jukeboxState.isPlaying = true;
        this.jukeboxState.isPaused = false;
        this.sound.stopSceneAmbience();
        this.sound.playTurntableSpinupSfx();
        this.sound.playNeedleDropSfx();
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

        this.showPrompt(`[ PLAYING ${rec.toUpperCase()} RECORD — SPACE: PAUSE | [ENTER]: MEMORY | 🚀 PROCEED TO DEPARTURE ]`);

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
                    { speaker: 'RYAN', text: 'This one... this must be everything together.' }
                ]);
            }, 8000);
        }

        // Show Proceed button
        const btnProceed = document.getElementById('btnProceed');
        if (btnProceed) {
            btnProceed.style.display = 'inline-block';
        }
    }

    pauseJukebox() {
        if (!this.jukeboxState.activeRecord) return;
        this.jukeboxState.isPlaying = false;
        this.jukeboxState.isPaused = true;
        this.sound.playNeedleLiftSfx();
        this.sound.stopSceneAmbience();
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
        this.sound.playNeedleLiftSfx();
        this.sound.stopSceneAmbience();
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
        this.dismissDialogue();
        if (window.memoryCinema) {
            window.memoryCinema.forceCanvasMode = true;
            window.memoryCinema.isPixelated = true;
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
                { speaker: 'RYLAND', text: 'Record 003: The Forest. NASA GEDI lidar structure and biomass archive.' },
                { speaker: 'ROCKY', text: 'Listen! High-frequency melodic vibrations! Organisms are in the gas!' },
                { speaker: 'RYAN', text: 'Those are birds welcoming the dawn sun, Rocky. And wind moving through living trees sixty meters tall.' },
                { speaker: 'ROCKY', text: 'Amaze! Amaze! Amaze! Giant carbon towers filled with singing creatures!' },
                { speaker: 'ROCKY', text: 'Question: Can humans climb to the top of these trees?' },
                { speaker: 'RYAN', text: 'Kids do it all the time. I loved climbing them when I was young.' },
                { speaker: 'ROCKY', text: 'Good. Tree climbing is practical. You are good climber, Grace.' }
            ], null, true);
        } else if (recordKey === 'ocean') {
            this.queueDialogues([
                { speaker: 'RYLAND', text: 'Record 002: The Ocean. NASA ECCO daily temperature and salinity measurements.' },
                { speaker: 'ROCKY', text: 'Deep resonant frequencies! Chords changing pitch! Why does the fluid sing?' },
                { speaker: 'RYAN', text: 'Those are ocean currents, Rocky. Cold subpolar waters hum low and deep, while the warm Gulf Stream sings high.' },
                { speaker: 'ROCKY', text: 'Question: Water that covers seventy percent of a world has its own voice? Can we visit this water?' },
                { speaker: 'RYAN', text: 'I would love to show you, Rocky. Stand on the shore and watch the tides.' },
                { speaker: 'ROCKY', text: 'Good. Proud. We will visit the big singing water.' }
            ], null, true);
        } else if (recordKey === 'atmosphere') {
            this.queueDialogues([
                { speaker: 'ROCKY', text: 'Tapping on glass! Fluid falling from the sky!' },
                { speaker: 'RYAN', text: 'That\'s rain, Rocky. Fresh water falling from clouds in the sky.' },
                { speaker: 'ROCKY', text: 'Liquid falls from sky? Scary. Scary. Scary. But... sounds very peaceful.' },
                { speaker: 'RYAN', text: 'It is. It\'s the sound of life.' }
            ], null, true);
        } else if (recordKey === 'earth') {
            this.queueDialogues([
                { speaker: 'ROCKY', text: 'Question: Why does human face leak fluid from eyes? Are you damaged, Grace?' },
                { speaker: 'RYAN', text: 'No, Rocky... I\'m not damaged. I just... I miss it. I miss home.' },
                { speaker: 'ROCKY', text: 'Understand. Earth has beautiful sounds. How could anyone forget something so wonderful?' }
            ], null, true);
        }
    }

    updateNasaHud(type, dataPoint, norm) {
        if (!this.ui || !this.ui.hudMetric) return;
        if (type === 'forest') {
            this.ui.hudMetric.innerText = `NASA EIC | GEDI L4B/L3 3D Canopy Visual Frame [${dataPoint.location || 'Transect ' + dataPoint.step}]`;
            const hStr = (dataPoint.canopyHeight != null) ? `${dataPoint.canopyHeight.toFixed(1)}m` : 'N/A';
            const cStr = (dataPoint.canopyCover != null) ? `${(dataPoint.canopyCover * 100).toFixed(0)}%` : 'N/A';
            const bStr = (dataPoint.biomass != null) ? `${dataPoint.biomass.toFixed(1)} Mg/ha` : 'N/A';
            this.ui.hudValue.innerText = `Height: ${hStr} | Cover: ${cStr} | Biomass: ${bStr}`;
            this.ui.hudDesc.innerText = `NASA Earth Information Center (EIC) Biosphere Exhibit & GEDI Spaceborne Lidar (DOI: 10.5067/GEDI/GEDI04_B.002). Waveform laser return converted into multi-octave Lydian pitch, canopy density chorus, and sub-bass biomass resonance. Biome: ${dataPoint.biome || 'Temperate Rainforest'}.`;
        } else if (type === 'ocean') {
            this.ui.hudMetric.innerText = `NASA EIC | ECCO V4r4 & SVS 3912 Ocean Current Frame [${dataPoint.date || 'Day ' + dataPoint.step}]`;
            const tempStr = (dataPoint.temperature != null) ? `${dataPoint.temperature.toFixed(2)}°C` : 'N/A (Reef/Land Mask)';
            const salStr = (dataPoint.salinity != null) ? `${dataPoint.salinity.toFixed(2)} PSU` : 'N/A';
            const speedStr = (dataPoint.currentSpeed != null) ? `${dataPoint.currentSpeed.toFixed(2)} m/s` : 'N/A';
            this.ui.hudValue.innerText = `Temp: ${tempStr} | Salt: ${salStr} | Current: ${speedStr}`;
            this.ui.hudDesc.innerText = `NASA Earth Information Center (EIC) Ocean Circulation Exhibit (DOI: 10.5067/ECG5D-OTS44) & SVS 3912. Potential temperature mapped to pitch, salinity to overtone timbre, and current flow to stereo panning. Location: ${dataPoint.location} (${dataPoint.lat}°N, ${Math.abs(dataPoint.lon)}°W).`;
        } else if (type === 'atmosphere') {
            this.ui.hudMetric.innerText = `NASA EIC | MERRA-2 & GPM IMERG Precipitation Frame [${dataPoint.location || 'Station ' + dataPoint.step}]`;
            const rainStr = (dataPoint.precipitationRate != null) ? `${dataPoint.precipitationRate.toFixed(1)} mm/hr` : '0 mm/hr';
            const windStr = (dataPoint.windSpeed != null) ? `${dataPoint.windSpeed.toFixed(1)} m/s` : 'N/A';
            const pStr = (dataPoint.barometricPressure != null) ? `${dataPoint.barometricPressure.toFixed(1)} hPa` : 'N/A';
            this.ui.hudValue.innerText = `Rain: ${rainStr} | Wind: ${windStr} | Pressure: ${pStr}`;
            this.ui.hudDesc.innerText = `NASA Earth Information Center (EIC) Atmospheric Dynamics Exhibit (DOI: 10.5067/95140KBM4KUS) & GPM IMERG. Surface precipitation rate controls dynamic rain cascades, wind speed controls aerodynamic filter cutoffs, and pressure maps to harmonic Dorian pitches. Location: ${dataPoint.location || 'Global Front'}.`;
        } else if (type === 'earth') {
            this.ui.hudMetric.innerText = `NASA EIC | Planetary Symphony & Voyager Golden Record`;
            this.ui.hudValue.innerText = `${dataPoint.track || 'Track ' + dataPoint.step} | Chord: ${dataPoint.harmonicChord || 'F Lydian'}`;
            this.ui.hudDesc.innerText = `NASA Earth Information Center (EIC) Integrated Biosphere-Hydrosphere-Atmosphere Archive (DOI: 10.5067/VOYAGER-GOLDEN-RECORD-SOUNDS-1977). ${dataPoint.caption || 'The planetary symphony uniting biosphere, ocean, and atmosphere with human piano memory.'}`;
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
            if (this.ui && this.ui.dialogueBox) this.ui.dialogueBox.style.display = 'none';
            this.clearActionKeys();
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
        if (speakerDisplay === 'ELI' || speakerDisplay === 'RYLAND') speakerDisplay = 'RYAN';
        if (this.ui && this.ui.speakerName) this.ui.speakerName.innerText = speakerDisplay;
        if (this.ui && this.ui.dialogueText) this.ui.dialogueText.innerText = '';
        if (this.ui && this.ui.continuePrompt) this.ui.continuePrompt.style.display = 'none';

        // Speaker color styling
        if (this.ui && this.ui.speakerName) {
            if (this.currentDialogue.speaker === 'ELI' || this.currentDialogue.speaker === 'RYAN' || this.currentDialogue.speaker === 'RYLAND') {
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

    dismissDialogue() {
        this.currentDialogue = null;
        this.dialogueQueue = [];
        this.isTyping = false;
        if (this.ui && this.ui.dialogueBox) {
            this.ui.dialogueBox.style.display = 'none';
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
            const formatted = text
                .replace(/←\s*\/\s*→/g, 'ARROWS')
                .replace(/→\s*\/\s*←/g, 'ARROWS')
                .replace(/←/g, '<')
                .replace(/→/g, '>')
                .replace(/↑/g, '^')
                .replace(/↓/g, 'v');
            this.ui.screenPrompt.innerText = formatted;
            this.ui.screenPrompt.textContent = formatted;
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
            case 'scene5':
                this.updateScene5(dt);
                break;
            case 'scene7':
                this.updateScene7(dt);
                break;
            case 'scene8':
                this.updateScene8(dt);
                break;
            case 'credits':
                if (this.keys['r'] || this.keys['R']) {
                    this.initScene('scene1');
                }
                break;
        }
    }

    updateScene5(dt) {
        if (window.memoryCinema && window.memoryCinema.isOpen) return;
        if (this.currentDialogue || this.activeChoice) return;

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

        // Clamp Eli inside habitat room
        this.eli.x = Math.max(90, Math.min(480, this.eli.x));

        // Update interaction prompt based on position
        const distToJukebox = Math.abs(this.eli.x - 320);
        if (distToJukebox < 65) {
            this.showPrompt('[ENTER] ZOOM INTO MEMORY  |  [ < / > ] WALK');
        } else {
            this.showPrompt('[ < / > ] WALK IN HABITAT  |  [ENTER] ZOOM INTO MEMORY');
        }
    }

    updateScene7(dt) {
        if (this.keys['r'] || this.keys['R']) {
            this.initScene('scene1');
            return;
        }
        // Smoothly advance orbital flight progress as the ship approaches Earth
        if (this.flightProgress < 1.0) {
            this.flightProgress = Math.min(1.0, this.flightProgress + dt * 0.04);
        }
    }

    updateScene8(dt) {
        if (this.keys['r'] || this.keys['R']) {
            this.initScene('scene1');
            return;
        }

        if (this.currentDialogue) return;

        // Toggle sitting on the pebble beach with Enter or Space
        if (this.keys['enter'] || this.keys[' ']) {
            if (!this.lastToggleSeatTime || this.sceneTime - this.lastToggleSeatTime > 0.45) {
                this.beachSeated = !this.beachSeated;
                this.rockyBeachSeated = this.beachSeated;
                this.lastToggleSeatTime = this.sceneTime;
                if (this.beachSeated) {
                    this.eli.state = 'idle';
                    this.koru.state = 'idle';
                    this.showPrompt('[ENTER] STAND UP  |  [R] REPLAY THE JOURNEY');
                } else {
                    this.showPrompt('[A/D] or [ARROWS] WALK BY WATER  |  [ENTER] SIT ON PEBBLES');
                }
            }
        }

        if (this.beachSeated) return;

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

        // Clamp Ryan along the open shoreline
        this.eli.x = Math.max(50, Math.min(560, this.eli.x));

        // Rocky walks alongside Ryan on the pebble beach in his form-fitting suit!
        const targetRockyX = this.eli.x - 45 * this.eli.facing;
        const diffX = targetRockyX - this.koru.x;
        if (Math.abs(diffX) > 12) {
            this.koru.x += Math.sign(diffX) * this.koru.speed * dt;
            this.koru.facing = Math.sign(diffX);
            this.koru.state = 'walk';
        } else {
            this.koru.state = 'idle';
            this.koru.facing = this.eli.facing;
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
                this.showPrompt('[ > / D ] CARRY JUKEBOX FORWARD TO HABITAT | [ENTER] ENTER HABITAT');

                // Enter habitat with Enter or walking to right edge
                const enterPressed = (this.keys['enter'] || this.keys['Enter']);
                if (enterPressed || this.eli.x > this.width - 50) {
                    this.clearActionKeys();
                    this.initScene('scene4');
                }
            }
            // Case B: Jukebox still buried at x = 410
            else {
                const distToJukebox = Math.abs(this.eli.x - 410);
                if (distToJukebox < 40) {
                    this.showPrompt('[ENTER] EXAMINE JUKEBOX');
                    if (this.keys['e'] || this.keys['E'] || this.keys['Enter'] || this.keys['enter']) {
                        this.clearActionKeys();
                        this.inspectJukeboxScene3();
                    }
                } else {
                    this.showPrompt('[ > / D ] WALK FORWARD TOWARDS THE GOLDEN LIGHT');
                }
            }
        }
    }

    inspectJukeboxScene3() {
        this.eli.state = 'kneel';
        this.clearPrompt();

        this.queueDialogues([
            { speaker: 'RYAN', text: 'That definitely wasn\'t here yesterday.' },
            { speaker: 'ROCKY', text: 'Question: What is that object? Smells like petroleum polymer and brass!' },
            { speaker: 'RYAN', text: 'It\'s... an Earth jukebox! It bears the NASA Earth Information Center emblem!' },
            { speaker: 'ROCKY', text: 'Amaze! Heavy sound apparatus from your world! Let us carry it to habitat!' }
        ], () => {
            this.showChoiceMenu('CHOICE 1 — What should we do?', [
                {
                    text: 'A. PICK IT UP',
                    action: () => {
                        this.eli.state = 'idle';
                        this.eli.isCarrying = true;
                        this.jukeboxDugUp = true;
                        this.queueDialogues([
                            { speaker: 'RYAN', text: 'I don\'t know how it crossed interstellar space, but we have to find out.' },
                            { speaker: 'ROCKY', text: 'Good! Let us take it back to habitat and clean it up!' }
                        ], () => {
                            this.clearActionKeys();
                            this.showPrompt('[ > / D ] CARRY JUKEBOX FORWARD TO HABITAT | [ENTER] ENTER HABITAT');
                        });
                    }
                },
                {
                    text: 'B. LEAVE IT HERE',
                    action: () => {
                        this.eli.state = 'idle';
                        this.queueDialogues([
                            { speaker: 'RYAN', text: 'Maybe it\'s better left alone...' },
                            { speaker: 'SYSTEM', text: '*Click... warm vinyl crackle...*' },
                            { speaker: 'ROCKY', text: 'Grace! Listen! Apparatus makes sound! It hums!' },
                            { speaker: 'RYAN', text: 'Wait... that crackle... that\'s an Earth record!' }
                        ], () => {
                            this.showChoiceMenu('Go back and pick it up?', [
                                {
                                    text: 'PICK UP THE JUKEBOX',
                                    action: () => {
                                        this.eli.isCarrying = true;
                                        this.jukeboxDugUp = true;
                                        this.queueDialogues([
                                            { speaker: 'RYAN', text: 'We have to know what music it holds.' },
                                            { speaker: 'ROCKY', text: 'Amaze! I help carry! We learn together!' }
                                        ], () => {
                                            this.clearActionKeys();
                                            this.showPrompt('[ > / D ] CARRY JUKEBOX FORWARD TO HABITAT | [ENTER] ENTER HABITAT');
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
                    if (this.jukeboxState.activeRecord && !(window.memoryCinema && window.memoryCinema.isOpen)) {
                        r.drawThoughtBubble(this.eli.x, this.eli.y, this.jukeboxState.activeRecord, this.jukeboxState.isPlaying);
                    }
                }
                break;

            case 'scene7':
                r.drawSpacecraftHeadingToEarth(
                    this.flightProgress,
                    isRyanSpeaking,
                    isKoruSpeaking,
                    this.fistBumping,
                    this.headingIntoAtmosphere,
                    this.arrivalComplete
                );
                break;

            case 'scene8':
            case 'credits':
                r.drawEarthCoastline(this.cameraX, this.sceneTime);
                r.drawRyanBeach(this.eli.x, this.eli.y, this.eli.state, this.eli.facing, isRyanSpeaking, this.beachSeated);
                r.drawRockyBeachSuit(this.koru.x, this.koru.y, this.koru.state, this.koru.facing, isKoruSpeaking, this.rockyBeachSeated);
                if (this.beachFistBumping) {
                    r.drawBeachFistBump(this.eli.x, this.eli.y, this.koru.x, this.koru.y);
                }
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

window.Game = Game;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Game };
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
