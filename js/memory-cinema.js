/**
 * SOUND OF TIMES — EARTH ARCHIVE
 * Full HD Slow-Mo Memory Cinema & Thought Bubble System
 * 
 * Renders Eli's high-definition nostalgic memories of Earth in slow-motion
 * corresponding to the active NASA environmental sonifications and nature soundscapes:
 * - Swaying forest canopy leaves with dappled sunlight & floating motes
 * - Majestic turquoise ocean surf & cresting breaker waves in slow motion
 * - Iridescent hummingbirds hovering & singing songbirds in slow motion
 * - Glistening mountain streams with slow-mo water crown splashes
 * - Soft atmospheric forest rain with expanding ripple crowns
 */

(function(window) {
    'use strict';

    class MemoryCinemaManager {
        constructor() {
            this.isOpen = false;
            this.currentVision = 'leaves'; // 'leaves', 'ocean', 'birds', 'stream', 'rain'
            this.slowMoFactor = 0.35; // 0.2, 0.35, 1.0
            this.animTime = 0;
            this.lastFrameTime = performance.now();
            this.rafId = null;

            // DOM Elements
            this.overlay = null;
            this.canvas = null;
            this.ctx = null;
            this.titleEl = null;
            this.quoteEl = null;
            this.speedTag = null;
            this.nasaTag = null;

            // Vision metadata and nostalgic Eli quotes
            this.visionMeta = {
                leaves: {
                    title: "LUSH CANOPY LEAVES SWAYING IN THE SUNLIGHT",
                    quote: "“I remember lying under the trees on warm summer afternoons... watching thousands of leaves move so gently in the wind.”",
                    nasaTag: "NASA GEDI L4B 58.4m Canopy Architecture",
                    defaultFor: 'forest'
                },
                ocean: {
                    title: "MAJESTIC OCEAN SURF & CRESTING BREAKERS",
                    quote: "“The endless blue... the sound of the tide rolling in, curling, and breaking onto warm sand. It made me feel like I belonged.”",
                    nasaTag: "NASA ECCO V4r4 24.2°C Tropical Gyre",
                    defaultFor: 'ocean'
                },
                birds: {
                    title: "IRIDESCENT HUMMINGBIRD & MORNING CHORUS",
                    quote: "“A tiny hummingbird hovering in our garden... its little wings moving faster than thought, yet resting completely still in mid-air.”",
                    nasaTag: "NASA GEDI Foliage Diversity & Avian Habitat",
                    defaultFor: 'birds'
                },
                stream: {
                    title: "MOUNTAIN BROOK & SUSPENDED DROPLETS",
                    quote: "“Pure glacial water trickling across river stones. On hot hikes, we would cup our hands to drink from the brook.”",
                    nasaTag: "NASA GEDI Riparian Corridor Transect",
                    defaultFor: 'stream'
                },
                rain: {
                    title: "SOFT FOREST RAIN FALLING ON THE CANOPY",
                    quote: "“Water falling from the sky... tapping against the glass window. Earth's quietest, most peaceful lullaby.”",
                    nasaTag: "NASA MERRA-2 Atmospheric Precipitation",
                    defaultFor: 'atmosphere'
                }
            };

            // Vision progression order for arrow-key navigation
            this.visionOrder = ['leaves', 'ocean', 'birds', 'stream', 'rain'];

            // Full HD Photographic Images
            this.hdImages = {
                leaves: this.loadHDImage('leaves_hd.jpg'),
                ocean: this.loadHDImage('ocean_hd.jpg'),
                birds: this.loadHDImage('birds_hd.jpg'),
                stream: this.loadHDImage('stream_hd.jpg'),
                rain: this.loadHDImage('rain_hd.jpg')
            };

            // Slow-motion particle systems
            this.particles = [];
            this.splashes = [];
            this.initParticles();
        }

        loadHDImage(filename) {
            const img = new Image();
            const candidates = [
                'assets/memories/' + filename,
                'Public/assets/memories/' + filename,
                'memories/' + filename,
                './assets/memories/' + filename
            ];
            let idx = 0;
            const tryNext = () => {
                if (idx < candidates.length) {
                    img.src = candidates[idx++];
                }
            };
            img.onerror = () => tryNext();
            tryNext();
            return img;
        }

        cycleVision(dir) {
            const idx = this.visionOrder.indexOf(this.currentVision);
            const nextIdx = (idx + dir + this.visionOrder.length) % this.visionOrder.length;
            this.setVision(this.visionOrder[nextIdx]);
        }

        initParticles() {
            this.particles = [];
            for (let i = 0; i < 70; i++) {
                this.particles.push({
                    x: Math.random(),
                    y: Math.random(),
                    size: 1.5 + Math.random() * 4,
                    speedX: (Math.random() - 0.5) * 0.08,
                    speedY: 0.02 + Math.random() * 0.06,
                    rot: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 0.02,
                    opacity: 0.3 + Math.random() * 0.6,
                    color: Math.random() > 0.4 ? '#8ee096' : '#d2f5a6',
                    wobblePhase: Math.random() * Math.PI * 2
                });
            }
        }

        setupDOM() {
            this.overlay = document.getElementById('memoryCinemaOverlay');
            this.canvas = document.getElementById('memoryCanvas');
            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
            }
            this.titleEl = document.getElementById('memoryTitle');
            this.quoteEl = document.getElementById('memoryQuote');
            this.speedTag = document.getElementById('memorySpeedTag');
            this.nasaTag = document.getElementById('memoryNasaTag');

            // Wire Vision Selectors
            const visionBtns = document.querySelectorAll('.mem-select-btn');
            visionBtns.forEach(btn => {
                btn.onclick = () => {
                    const v = btn.getAttribute('data-vision');
                    this.setVision(v);
                };
            });

            // Wire Speed Buttons
            const speedBtns = document.querySelectorAll('.speed-btn');
            speedBtns.forEach(btn => {
                btn.onclick = () => {
                    const spd = parseFloat(btn.getAttribute('data-speed'));
                    this.setSlowMoSpeed(spd);
                    speedBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                };
            });

            // Wire Close Button
            const closeBtn = document.getElementById('btnCloseMemory');
            if (closeBtn) {
                closeBtn.onclick = () => this.close();
            }

            // Click canvas to trigger interactive memory audio (e.g. bird chirps in slow-mo)
            if (this.canvas) {
                this.canvas.addEventListener('click', () => {
                    if (this.currentVision === 'birds' && window.forestSonification && window.forestSonification.soundscape) {
                        window.forestSonification.soundscape.callBird('random');
                    }
                });
            }

            // Keyboard controls for Memory Cinema (Strictly Arrow Keys and Enter)
            window.addEventListener('keydown', (e) => {
                if (!this.isOpen) return;
                if (e.key === 'ArrowRight') {
                    this.cycleVision(1);
                    e.preventDefault();
                } else if (e.key === 'ArrowLeft') {
                    this.cycleVision(-1);
                    e.preventDefault();
                } else if (e.key === 'Enter' || e.key === 'Escape') {
                    this.close();
                    e.preventDefault();
                }
            });

            // Resize listener for sharp Full HD rendering
            window.addEventListener('resize', () => {
                if (this.isOpen) {
                    this.resizeCanvas();
                }
            });
        }

        resizeCanvas() {
            if (!this.canvas) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            let w = this.canvas.parentElement ? this.canvas.parentElement.clientWidth : window.innerWidth;
            let h = this.canvas.parentElement ? this.canvas.parentElement.clientHeight : window.innerHeight;
            if (!w || w === 0) w = Math.floor(window.innerWidth * 0.94);
            if (!h || h === 0) h = Math.floor(window.innerHeight * 0.82);

            this.canvas.width = Math.floor(w * dpr);
            this.canvas.height = Math.floor(h * dpr);
            this.canvas.style.width = w + 'px';
            this.canvas.style.height = h + 'px';

            if (this.ctx) {
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                this.ctx.scale(dpr, dpr);
            }
        }

        open(initialVision = null) {
            if (!this.overlay) {
                this.setupDOM();
            }
            if (!this.overlay || !this.canvas) return;

            // Determine initial vision based on active record or parameter
            if (initialVision) {
                this.currentVision = initialVision;
            } else if (window.game && window.game.jukeboxState) {
                const rec = window.game.jukeboxState.activeRecord;
                if (rec === 'ocean') {
                    this.currentVision = 'ocean';
                } else if (rec === 'atmosphere') {
                    this.currentVision = 'rain';
                } else {
                    this.currentVision = 'leaves';
                }
            }

            this.isOpen = true;
            this.overlay.style.display = 'flex';
            this.overlay.classList.remove('zooming-out');
            // Trigger animation frame for smooth zoom scale expansion
            void this.overlay.offsetWidth;
            this.overlay.classList.add('active');

            this.resizeCanvas();
            this.updateMetadataUI();

            this.lastFrameTime = performance.now();
            this.startRenderLoop();

            if (window.game) {
                window.game.showPrompt('[ 💭 MEMORY CINEMA: [ → / ← ] SWITCH MEMORY  |  [ENTER] ZOOM OUT TO HABITAT ]');
            }
        }

        close() {
            if (!this.isOpen) return;
            this.isOpen = false;
            if (this.overlay) {
                this.overlay.classList.add('zooming-out');
                this.overlay.classList.remove('active');
                setTimeout(() => {
                    if (!this.isOpen && this.overlay) {
                        this.overlay.style.display = 'none';
                        this.overlay.classList.remove('zooming-out');
                    }
                }, 320);
            }
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
            if (window.game) {
                window.game.showPrompt('[ RETURNED TO HABITAT — [ → / ← ] WALK  |  [ENTER] ZOOM INTO MEMORY ]');
            }
        }

        toggle(initialVision = null) {
            if (this.isOpen) {
                this.close();
            } else {
                this.open(initialVision);
            }
        }

        setVision(visionKey) {
            if (!this.visionMeta[visionKey]) return;
            this.currentVision = visionKey;
            this.initParticles();
            this.updateMetadataUI();

            document.querySelectorAll('.mem-select-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-vision') === visionKey);
            });

            if (visionKey === 'birds' && window.forestSonification && window.forestSonification.soundscape) {
                window.forestSonification.soundscape.callBird('hummingbird');
            }
        }

        setSlowMoSpeed(spd) {
            this.slowMoFactor = Math.max(0.05, Math.min(2.0, spd));
            if (!this.speedTag) this.speedTag = document.getElementById('memorySpeedTag');
            if (this.speedTag) {
                const label = spd < 0.3 ? '⏱️ ULTRA SLOW 0.20x' : (spd < 0.8 ? `⏱️ SLOW MOTION ${spd.toFixed(2)}x` : '⏱️ REAL TIME 1.0x');
                this.speedTag.textContent = label;
                this.speedTag.innerText = label;
            }
        }

        updateMetadataUI() {
            const meta = this.visionMeta[this.currentVision];
            if (!meta) return;

            if (!this.titleEl) this.titleEl = document.getElementById('memoryTitle');
            if (!this.quoteEl) this.quoteEl = document.getElementById('memoryQuote');
            if (!this.nasaTag) this.nasaTag = document.getElementById('memoryNasaTag');
            if (!this.speedTag) this.speedTag = document.getElementById('memorySpeedTag');

            if (this.titleEl) {
                this.titleEl.textContent = meta.title;
                this.titleEl.innerText = meta.title;
            }
            if (this.quoteEl) {
                this.quoteEl.textContent = meta.quote;
                this.quoteEl.innerText = meta.quote;
            }
            if (this.nasaTag) {
                this.nasaTag.textContent = meta.nasaTag;
                this.nasaTag.innerText = meta.nasaTag;
            }

            document.querySelectorAll('.mem-select-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-vision') === this.currentVision);
            });
        }

        startRenderLoop() {
            const render = (now) => {
                if (!this.isOpen) return;
                const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1);
                this.lastFrameTime = now;
                this.animTime += dt * this.slowMoFactor;

                this.drawScene();
                this.rafId = requestAnimationFrame(render);
            };
            this.rafId = requestAnimationFrame(render);
        }

        // ----------------------------------------------------
        // FULL HD SLOW-MO CINEMATIC DRAWING
        // ----------------------------------------------------

        drawHDImage(ctx, img, w, h, t) {
            if (!img || !img.complete || img.naturalWidth === 0) return false;

            const imgAspect = img.naturalWidth / img.naturalHeight;
            const canvasAspect = w / h;
            let drawW, drawH;

            if (canvasAspect > imgAspect) {
                drawW = w;
                drawH = w / imgAspect;
            } else {
                drawH = h;
                drawW = h * imgAspect;
            }

            // High-definition cinematic Ken Burns slow-motion drift
            const zoom = 1.05 + Math.sin(t * 0.16) * 0.035;
            const panX = Math.cos(t * 0.11) * (drawW * 0.02);
            const panY = Math.sin(t * 0.09) * (drawH * 0.02);

            const finalW = drawW * zoom;
            const finalH = drawH * zoom;
            const offsetX = (w - finalW) / 2 + panX;
            const offsetY = (h - finalH) / 2 + panY;

            ctx.save();
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, offsetX, offsetY, finalW, finalH);
            ctx.restore();
            return true;
        }

        drawScene() {
            if (!this.ctx || !this.canvas) return;
            const ctx = this.ctx;
            const w = this.canvas.clientWidth || 960;
            const h = this.canvas.clientHeight || 540;
            const t = this.animTime;

            ctx.clearRect(0, 0, w, h);

            switch (this.currentVision) {
                case 'leaves':
                    this.drawSlowMoLeaves(ctx, w, h, t);
                    break;
                case 'ocean':
                    this.drawSlowMoOcean(ctx, w, h, t);
                    break;
                case 'birds':
                    this.drawSlowMoBirds(ctx, w, h, t);
                    break;
                case 'stream':
                    this.drawSlowMoStream(ctx, w, h, t);
                    break;
                case 'rain':
                    this.drawSlowMoRain(ctx, w, h, t);
                    break;
            }

            // Cinematic Slow-Motion Vignette & Dream Bloom
            this.drawCinematicVignette(ctx, w, h);
        }

        // VISION 1: CANOPY LEAVES SWAYING IN BREEZE (SLOW-MO)
        drawSlowMoLeaves(ctx, w, h, t) {
            const hasHD = this.drawHDImage(ctx, this.hdImages.leaves, w, h, t);
            if (!hasHD) {
                // Procedural fallback
                const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
                bgGrad.addColorStop(0, '#102e21');
                bgGrad.addColorStop(0.5, '#1e4832');
                bgGrad.addColorStop(1, '#0c1b14');
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, w, h);

                this.drawFoliageLayer(ctx, w, h, t * 0.5, '#153523', 0.85, 35);
                this.drawFoliageLayer(ctx, w, h, t * 0.8, '#26593a', 0.70, 24);
                this.drawForegroundCanopy(ctx, w, h, t);
            }

            // Radiant Dappled Sunlight God Rays (Komorebi)
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            const sunX = w * 0.78;
            const sunY = h * 0.15;
            for (let i = 0; i < 6; i++) {
                const angle = 0.55 + (i * 0.13) + Math.sin(t * 0.4 + i) * 0.04;
                const rayWidth = 60 + Math.sin(t * 0.6 + i * 2) * 20;
                const grad = ctx.createRadialGradient(sunX, sunY, 10, sunX + Math.cos(angle) * w, sunY + Math.sin(angle) * h, h * 1.2);
                grad.addColorStop(0, 'rgba(255, 245, 190, 0.28)');
                grad.addColorStop(0.5, 'rgba(255, 230, 150, 0.10)');
                grad.addColorStop(1, 'rgba(255, 220, 100, 0)');

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(sunX, sunY);
                ctx.arc(sunX, sunY, Math.max(w, h) * 1.2, angle - rayWidth / w, angle + rayWidth / w);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();

            // Slow-motion floating leaves & glistening golden pollen motes
            this.drawSlowMoFloatingLeaves(ctx, w, h, t);
        }

        drawFoliageLayer(ctx, w, h, t, color, scale, count) {
            ctx.fillStyle = color;
            for (let i = 0; i < count; i++) {
                const bx = (i / count) * w + Math.sin(t + i) * 18;
                const by = Math.sin(i * 1.7) * 45 + (1 - scale) * h * 0.4;
                const rad = (45 + Math.sin(i * 3.1) * 25) * scale;

                ctx.beginPath();
                ctx.arc(bx, by, rad, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        drawForegroundCanopy(ctx, w, h, t) {
            ctx.save();
            // Main graceful branch sweeping from top-left
            ctx.strokeStyle = '#1d130a';
            ctx.lineWidth = 14;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-20, 40);
            ctx.bezierCurveTo(w * 0.25, 70 + Math.sin(t * 0.6) * 12, w * 0.55, 120 + Math.cos(t * 0.5) * 15, w * 0.85, 90);
            ctx.stroke();

            // Sub-branches
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(w * 0.35, 80);
            ctx.quadraticCurveTo(w * 0.45, 190 + Math.sin(t * 0.7) * 10, w * 0.52, 240);
            ctx.moveTo(w * 0.6, 110);
            ctx.quadraticCurveTo(w * 0.72, 180 + Math.cos(t * 0.6) * 8, w * 0.78, 220);
            ctx.stroke();

            // Lush Detailed Leaves with Slow-Mo Sway
            const leaves = [
                { x: w * 0.25, y: 75, angle: 0.6, size: 48, col: '#459955' },
                { x: w * 0.32, y: 95, angle: 1.1, size: 55, col: '#5cb86e' },
                { x: w * 0.40, y: 135, angle: 0.8, size: 52, col: '#3b864a' },
                { x: w * 0.46, y: 190, angle: 1.4, size: 44, col: '#62c98a' },
                { x: w * 0.52, y: 245, angle: 1.7, size: 58, col: '#50a863' },
                { x: w * 0.62, y: 120, angle: 0.4, size: 50, col: '#72d99c' },
                { x: w * 0.70, y: 165, angle: 0.9, size: 56, col: '#439955' },
                { x: w * 0.78, y: 220, angle: 1.3, size: 60, col: '#5cb86e' },
                { x: w * 0.85, y: 105, angle: -0.2, size: 46, col: '#3b864a' }
            ];

            leaves.forEach((lf, idx) => {
                const sway = Math.sin(t * 0.8 + idx * 0.7) * 0.12;
                this.drawDetailedLeaf(ctx, lf.x, lf.y, lf.angle + sway, lf.size, lf.col, t);
            });
            ctx.restore();
        }

        drawDetailedLeaf(ctx, x, y, angle, size, baseColor, t) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);

            // Leaf Body
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(size * 0.45, -size * 0.35, size * 0.85, -size * 0.25, size, 0);
            ctx.bezierCurveTo(size * 0.85, size * 0.25, size * 0.45, size * 0.35, 0, 0);
            ctx.fillStyle = baseColor;
            ctx.fill();

            // Leaf Highlight / Translucency
            ctx.strokeStyle = '#aef5be';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(2, 0);
            ctx.lineTo(size * 0.92, 0);
            ctx.stroke();

            // Leaf Veins
            ctx.lineWidth = 0.8;
            ctx.strokeStyle = 'rgba(174, 245, 190, 0.45)';
            for (let v = 0.2; v < 0.85; v += 0.18) {
                const vx = size * v;
                ctx.beginPath();
                ctx.moveTo(vx, 0);
                ctx.lineTo(vx + size * 0.12, -size * 0.15);
                ctx.moveTo(vx, 0);
                ctx.lineTo(vx + size * 0.12, size * 0.15);
                ctx.stroke();
            }

            // Glistening morning dew droplet on leaf tip (Slow-mo shimmer)
            const dropGlow = 0.5 + Math.sin(t * 1.5 + x) * 0.4;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * dropGlow})`;
            ctx.beginPath();
            ctx.arc(size * 0.88, Math.sin(t * 0.8) * 1.5, 3.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        drawSlowMoFloatingLeaves(ctx, w, h, t) {
            this.particles.forEach(p => {
                p.y += p.speedY * this.slowMoFactor;
                p.x += Math.sin(t * 0.6 + p.wobblePhase) * 0.001 * this.slowMoFactor;
                p.rot += p.rotSpeed * this.slowMoFactor;

                if (p.y > 1.1) {
                    p.y = -0.1;
                    p.x = Math.random();
                }

                const px = p.x * w;
                const py = p.y * h;

                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.opacity;

                ctx.beginPath();
                ctx.ellipse(0, 0, p.size * 2.2, p.size, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
            ctx.globalAlpha = 1.0;
        }

        // VISION 2: MAJESTIC OCEAN SURF & BREAKERS (SLOW-MO)
        drawSlowMoOcean(ctx, w, h, t) {
            const hasHD = this.drawHDImage(ctx, this.hdImages.ocean, w, h, t);
            if (!hasHD) {
                // Procedural fallback
                const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
                skyGrad.addColorStop(0, '#0a1d37');
                skyGrad.addColorStop(0.6, '#18426d');
                skyGrad.addColorStop(1, '#ffc285'); // Warm sunset horizon
                ctx.fillStyle = skyGrad;
                ctx.fillRect(0, 0, w, h);

                // Glowing Horizon Sun
                ctx.save();
                ctx.fillStyle = 'rgba(255, 240, 200, 0.85)';
                ctx.shadowColor = '#ffa64d';
                ctx.shadowBlur = 40;
                ctx.beginPath();
                ctx.arc(w * 0.5, h * 0.48, 45, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Background Deep Ocean Swell
                const seaGrad = ctx.createLinearGradient(0, h * 0.45, 0, h);
                seaGrad.addColorStop(0, '#093652');
                seaGrad.addColorStop(0.5, '#0d607a');
                seaGrad.addColorStop(1, '#052338');
                ctx.fillStyle = seaGrad;
                ctx.fillRect(0, h * 0.46, w, h * 0.54);

                // Distant Rolling Waves
                for (let layer = 0; layer < 3; layer++) {
                    ctx.fillStyle = layer === 0 ? '#0b476b' : (layer === 1 ? '#126187' : '#1980a6');
                    ctx.beginPath();
                    ctx.moveTo(0, h);
                    const baseY = h * (0.50 + layer * 0.08);
                    for (let x = 0; x <= w; x += 15) {
                        const waveY = baseY + Math.sin(x * 0.008 + t * 0.6 + layer * 1.5) * (10 + layer * 6);
                        ctx.lineTo(x, waveY);
                    }
                    ctx.lineTo(w, h);
                    ctx.closePath();
                    ctx.fill();
                }

                // Foreground Slow-Mo Breaker Crest & Barrel
                this.drawSlowMoBreakerWave(ctx, w, h, t);
            } else {
                // Shimmering live sun reflections & slow-motion ocean spray
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                ctx.fillStyle = 'rgba(255, 235, 175, 0.15)';
                for (let s = 0; s < 18; s++) {
                    const sx = ((s * 58 + t * 40) % w);
                    const sy = h * 0.55 + Math.sin(t * 1.2 + s) * (h * 0.35);
                    ctx.beginPath();
                    ctx.ellipse(sx, sy, 14, 2.5, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
                this.drawSeaSprayParticles(ctx, w, h, t);
            }
        }

        drawSlowMoBreakerWave(ctx, w, h, t) {
            ctx.save();
            const waveProgress = (t * 0.3) % (Math.PI * 2);
            const waveY = h * 0.72 + Math.sin(waveProgress) * 22;

            // Translucent Turquoise Wave Face
            const waveGrad = ctx.createLinearGradient(0, waveY - 80, 0, h);
            waveGrad.addColorStop(0, '#3ae4d4');
            waveGrad.addColorStop(0.35, '#139ea0');
            waveGrad.addColorStop(0.8, '#084860');
            waveGrad.addColorStop(1, '#032030');

            ctx.fillStyle = waveGrad;
            ctx.beginPath();
            ctx.moveTo(0, h);
            ctx.lineTo(0, waveY + 20);

            // Curling crest shape
            for (let x = 0; x <= w; x += 10) {
                const curl = Math.sin(x * 0.005 + t * 0.4) * 35 + Math.cos(x * 0.012 - t * 0.3) * 15;
                ctx.lineTo(x, waveY + curl);
            }
            ctx.lineTo(w, h);
            ctx.closePath();
            ctx.fill();

            // Foaming Breaker Lip with Slow-Motion Spray Droplets
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#6df2e2';
            ctx.shadowBlur = 12;

            for (let x = 0; x <= w; x += 22) {
                const foamY = waveY + Math.sin(x * 0.005 + t * 0.4) * 35 + Math.cos(x * 0.012 - t * 0.3) * 15;
                // Foaming froth clumps
                ctx.beginPath();
                ctx.arc(x, foamY, 6 + Math.sin(x + t) * 3, 0, Math.PI * 2);
                ctx.fill();

                // Slow-motion sea spray droplets suspended in mid-air
                const sprayCount = 3;
                for (let s = 0; s < sprayCount; s++) {
                    const sprayH = 15 + Math.sin(x * 2.3 + s + t) * 30;
                    const sprayX = x + Math.cos(t * 0.5 + s) * 12;
                    ctx.beginPath();
                    ctx.arc(sprayX, foamY - sprayH, 1.8 + Math.random() * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
        }

        // VISION 3: HOVERING HUMMINGBIRD & SONGBIRD (SLOW-MO)
        drawSlowMoBirds(ctx, w, h, t) {
            const hasHD = this.drawHDImage(ctx, this.hdImages.birds, w, h, t);
            if (!hasHD) {
                // Soft Dappled Garden Background
                const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.4, 40, w * 0.5, h * 0.5, w * 0.7);
                bgGrad.addColorStop(0, '#365e3e');
                bgGrad.addColorStop(0.6, '#1a3723');
                bgGrad.addColorStop(1, '#0e1e14');
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, w, h);

                // Exotic Nectar Flower on the right
                this.drawExoticFlower(ctx, w * 0.72, h * 0.52, t);

                // Slow-Motion Hovering Hummingbird
                const hx = w * 0.42 + Math.sin(t * 0.7) * 18;
                const hy = h * 0.45 + Math.cos(t * 0.9) * 14;
                this.drawHummingbird(ctx, hx, hy, t);

                // Distant Singing Songbird perched on left branch
                this.drawPerchedSongbird(ctx, w * 0.18, h * 0.36, t);
            } else {
                // Shimmering hummingbird iridescent aura & suspended nectar glow
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                const pulse = 0.5 + Math.sin(t * 3.0) * 0.3;
                ctx.fillStyle = `rgba(180, 255, 220, ${0.15 * pulse})`;
                ctx.beginPath();
                ctx.arc(w * 0.45, h * 0.45, 90, 0, Math.PI * 2);
                ctx.fill();

                // Slow-motion floating pollen motes
                for (let p = 0; p < 16; p++) {
                    const px = (w * 0.3 + ((p * 45 + t * 25) % (w * 0.5)));
                    const py = (h * 0.3 + Math.sin(t * 1.5 + p) * 80);
                    ctx.fillStyle = 'rgba(255, 245, 170, 0.45)';
                    ctx.beginPath();
                    ctx.arc(px, py, 1.8, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        }

        drawHummingbird(ctx, x, y, t) {
            ctx.save();
            ctx.translate(x, y);

            // Slow-motion wing beat cycle (visible motion arcs at 0.35x speed)
            const wingPhase = Math.sin(t * 14); // Slowed down wing oscillation
            
            // Wing Motion Blur Ghost Arcs (Slow-Mo Effect)
            ctx.fillStyle = 'rgba(210, 245, 230, 0.22)';
            ctx.beginPath();
            ctx.ellipse(-15, -25, 45, 18, -0.6 + wingPhase * 0.4, 0, Math.PI * 2);
            ctx.fill();

            // Main Primary Wings
            ctx.fillStyle = 'rgba(75, 175, 140, 0.75)';
            ctx.strokeStyle = '#a4f0d2';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.ellipse(-18, -26, 42, 14, -0.6 + wingPhase * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Iridescent Emerald & Ruby Feathered Body
            const bodyGrad = ctx.createLinearGradient(-30, 0, 30, 0);
            bodyGrad.addColorStop(0, '#2ea872');
            bodyGrad.addColorStop(0.5, '#40d995');
            bodyGrad.addColorStop(0.8, '#e64555'); // Ruby throat gorget
            bodyGrad.addColorStop(1, '#1b6944');

            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.ellipse(0, 0, 28, 15, -0.3, 0, Math.PI * 2);
            ctx.fill();

            // Bird Head
            ctx.fillStyle = '#228557';
            ctx.beginPath();
            ctx.arc(22, -8, 10, 0, Math.PI * 2);
            ctx.fill();

            // Ruby Gorget Iridescent Throat Flash
            const throatGlow = 0.5 + Math.sin(t * 2.5) * 0.5;
            ctx.fillStyle = `rgba(255, 60, 90, ${0.4 + throatGlow * 0.6})`;
            ctx.beginPath();
            ctx.ellipse(20, -4, 7, 5, 0.4, 0, Math.PI * 2);
            ctx.fill();

            // Bird Eye with glint
            ctx.fillStyle = '#050505';
            ctx.beginPath();
            ctx.arc(24, -10, 2.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(24.5, -10.5, 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Long Slender Beak sipping near flower
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 2.2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(30, -7);
            ctx.lineTo(62, -2);
            ctx.stroke();

            // Micro suspended nectar droplet on beak tip
            ctx.fillStyle = 'rgba(255, 230, 150, 0.85)';
            ctx.beginPath();
            ctx.arc(63, -1.8, 2.2, 0, Math.PI * 2);
            ctx.fill();

            // Forked Tail Feathers
            ctx.strokeStyle = '#1b4d37';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(-25, 4);
            ctx.lineTo(-52, 14);
            ctx.moveTo(-24, 7);
            ctx.lineTo(-48, 20);
            ctx.stroke();

            ctx.restore();
        }

        drawExoticFlower(ctx, x, y, t) {
            ctx.save();
            ctx.translate(x, y);

            // Stem
            ctx.strokeStyle = '#276b3a';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(0, 80);
            ctx.quadraticCurveTo(-15, 30, -5, 0);
            ctx.stroke();

            // Vibrant Hibiscus Petals
            const petals = 5;
            for (let p = 0; p < petals; p++) {
                const angle = (p / petals) * Math.PI * 2 + Math.sin(t * 0.5) * 0.05;
                ctx.save();
                ctx.rotate(angle);
                const pGrad = ctx.createRadialGradient(0, 0, 5, 25, 0, 40);
                pGrad.addColorStop(0, '#fff078');
                pGrad.addColorStop(0.3, '#ff5982');
                pGrad.addColorStop(1, '#db1f4e');

                ctx.fillStyle = pGrad;
                ctx.beginPath();
                ctx.ellipse(28, 0, 26, 16, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Stamen & Nectar Droplet
            ctx.strokeStyle = '#ffe45e';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-28, -8);
            ctx.stroke();

            ctx.restore();
        }

        drawPerchedSongbird(ctx, x, y, t) {
            ctx.save();
            ctx.translate(x, y);

            // Perch Branch
            ctx.strokeStyle = '#3d2516';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(-60, 20);
            ctx.lineTo(80, 25);
            ctx.stroke();

            // Songbird Body
            ctx.fillStyle = '#4a7ec2';
            ctx.beginPath();
            ctx.ellipse(0, 5, 22, 14, 0.2, 0, Math.PI * 2);
            ctx.fill();

            // Head tilting upwards singing
            const headTilt = Math.sin(t * 1.8) * 0.12;
            ctx.save();
            ctx.translate(16, -6);
            ctx.rotate(headTilt);

            ctx.fillStyle = '#315a91';
            ctx.beginPath();
            ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.fill();

            // Open Beak Singing
            ctx.fillStyle = '#ffb347';
            ctx.beginPath();
            ctx.moveTo(7, -2);
            ctx.lineTo(16, -6);
            ctx.lineTo(8, 2);
            ctx.closePath();
            ctx.fill();

            // Expanding Sonic Song Chime Rings in Slow-Mo
            for (let r = 0; r < 3; r++) {
                const ringProgress = (t * 1.2 + r * 0.6) % 2.0;
                const ringRad = 15 + ringProgress * 35;
                const ringAlpha = Math.max(0, 1 - ringProgress / 2.0) * 0.45;
                ctx.strokeStyle = `rgba(164, 230, 255, ${ringAlpha})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(16, -3, ringRad, -0.6, 0.6);
                ctx.stroke();
            }
            ctx.restore();

            ctx.restore();
        }

        // VISION 4: MOUNTAIN STREAM & DROPLET IMPACT CROWN (SLOW-MO)
        drawSlowMoStream(ctx, w, h, t) {
            const hasHD = this.drawHDImage(ctx, this.hdImages.stream, w, h, t);
            if (!hasHD) {
                // Mountain Forest Background
                const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
                bgGrad.addColorStop(0, '#0c2118');
                bgGrad.addColorStop(0.5, '#153828');
                bgGrad.addColorStop(1, '#0b1f24');
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, w, h);

                // Smooth Riverbed Stones
                this.drawRiverStones(ctx, w, h);

                // Flowing Stream Liquid Ribbon (Slow-Mo Fluid Curves)
                this.drawStreamRibbon(ctx, w, h, t);

                // Ultra Slow-Motion High-Speed Water Droplet Splash Crown
                this.drawWaterCrownSplash(ctx, w * 0.5, h * 0.62, t);
            } else {
                // Suspended slow-motion water crown droplet & ripples over HD photo
                this.drawWaterCrownSplash(ctx, w * 0.5, h * 0.70, t);
            }
        }

        drawRiverStones(ctx, w, h) {
            const stones = [
                { x: w * 0.2, y: h * 0.72, rx: 55, ry: 28, col: '#424d47' },
                { x: w * 0.35, y: h * 0.82, rx: 70, ry: 35, col: '#5a6b61' },
                { x: w * 0.68, y: h * 0.75, rx: 60, ry: 32, col: '#3a4a40' },
                { x: w * 0.82, y: h * 0.68, rx: 50, ry: 25, col: '#4f5e55' }
            ];

            stones.forEach(s => {
                ctx.fillStyle = s.col;
                ctx.beginPath();
                ctx.ellipse(s.x, s.y, s.rx, s.ry, 0.1, 0, Math.PI * 2);
                ctx.fill();
                // Wet Stone Sunlight Highlight
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(s.x - s.rx * 0.3, s.y - s.ry * 0.3, s.ry * 0.4, 0, Math.PI);
                ctx.stroke();
            });
        }

        drawStreamRibbon(ctx, w, h, t) {
            ctx.save();
            const waterGrad = ctx.createLinearGradient(0, h * 0.45, 0, h);
            waterGrad.addColorStop(0, 'rgba(40, 150, 180, 0.55)');
            waterGrad.addColorStop(0.5, 'rgba(70, 200, 210, 0.65)');
            waterGrad.addColorStop(1, 'rgba(25, 110, 140, 0.85)');

            ctx.fillStyle = waterGrad;
            ctx.beginPath();
            ctx.moveTo(0, h * 0.58);
            for (let x = 0; x <= w; x += 20) {
                const wy = h * 0.58 + Math.sin(x * 0.008 + t * 0.8) * 14;
                ctx.lineTo(x, wy);
            }
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fill();

            // Foam stream ribbons
            ctx.strokeStyle = 'rgba(230, 255, 255, 0.4)';
            ctx.lineWidth = 2.5;
            for (let r = 0; r < 4; r++) {
                ctx.beginPath();
                const ry = h * (0.64 + r * 0.07);
                for (let x = 0; x <= w; x += 25) {
                    ctx.lineTo(x, ry + Math.sin(x * 0.015 + t + r) * 8);
                }
                ctx.stroke();
            }
            ctx.restore();
        }

        drawWaterCrownSplash(ctx, x, y, t) {
            ctx.save();
            ctx.translate(x, y);

            // Droplet Cycle: Drop falls -> hits water -> crowns up -> rebound droplet
            const cycle = (t * 0.7) % 2.5;

            if (cycle < 0.8) {
                // Falling water droplet in ultra slow-motion
                const dropY = -140 + (cycle / 0.8) * 140;
                ctx.fillStyle = '#c5f7ff';
                ctx.shadowColor = '#65d5ed';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(0, dropY - 14);
                ctx.quadraticCurveTo(8, dropY - 2, 0, dropY + 8);
                ctx.quadraticCurveTo(-8, dropY - 2, 0, dropY - 14);
                ctx.fill();
            } else {
                // Splash Crown & Rebound Droplet (High-Speed Macro Photography Effect)
                const splashT = (cycle - 0.8) / 1.7;
                const crownRad = 35 + splashT * 40;
                const crownH = Math.sin(splashT * Math.PI) * 45;

                // Expanding Concentric Ripple Rings
                for (let r = 1; r <= 3; r++) {
                    const rDist = (splashT * 85 + r * 30) % 130;
                    const rAlpha = Math.max(0, 1 - rDist / 130) * 0.6;
                    ctx.strokeStyle = `rgba(180, 245, 255, ${rAlpha})`;
                    ctx.lineWidth = 2.0;
                    ctx.beginPath();
                    ctx.ellipse(0, 0, rDist * 1.8, rDist * 0.55, 0, 0, Math.PI * 2);
                    ctx.stroke();
                }

                // Water Splash Crown Spikes
                ctx.fillStyle = 'rgba(210, 250, 255, 0.85)';
                const spikes = 9;
                for (let s = 0; s < spikes; s++) {
                    const ang = (s / spikes) * Math.PI * 2;
                    const sx = Math.cos(ang) * crownRad;
                    const sy = Math.sin(ang) * (crownRad * 0.35) - crownH;
                    ctx.beginPath();
                    ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Suspended Rebound Droplet in Center
                const reboundY = -crownH * 1.35;
                if (reboundY < -5) {
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(0, reboundY, 4.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
        }

        // VISION 5: CANOPY RAIN IN SLOW MOTION
        drawSlowMoRain(ctx, w, h, t) {
            const hasHD = this.drawHDImage(ctx, this.hdImages.rain, w, h, t);
            if (!hasHD) {
                // Moody Twilight Forest Background
                const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
                bgGrad.addColorStop(0, '#0c1a24');
                bgGrad.addColorStop(0.6, '#182f3b');
                bgGrad.addColorStop(1, '#0e241c');
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, w, h);

                // Giant Wet Emerald Leaves swaying under raindrops
                this.drawRainCanopyFoliage(ctx, w, h, t);
            }

            // Falling Raindrops in Ultra Slow-Mo
            ctx.strokeStyle = 'rgba(215, 245, 255, 0.75)';
            ctx.lineWidth = 1.8;
            for (let i = 0; i < 45; i++) {
                const rx = ((i * 37) % w);
                const ry = ((i * 73 + t * 220) % (h + 80)) - 40;
                const len = 18 + (i % 5) * 8;

                ctx.beginPath();
                ctx.moveTo(rx, ry);
                ctx.lineTo(rx - 2.5, ry + len);
                ctx.stroke();

                // Droplet Splash Crown upon hitting floor / leaves
                if (ry > h * 0.65 && (i % 3 === 0)) {
                    ctx.strokeStyle = 'rgba(220, 250, 255, 0.45)';
                    ctx.beginPath();
                    ctx.ellipse(rx, ry + len, 8, 3, 0, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }

        drawRainCanopyFoliage(ctx, w, h, t) {
            const bigLeaves = [
                { x: w * 0.25, y: h * 0.65, size: 140, angle: 0.3 },
                { x: w * 0.65, y: h * 0.70, size: 160, angle: -0.25 },
                { x: w * 0.85, y: h * 0.55, size: 120, angle: -0.5 }
            ];

            bigLeaves.forEach((bl, idx) => {
                // Raindrop impact bounce
                const bounce = Math.sin(t * 3.5 + idx * 2.1) * 0.06;
                this.drawDetailedLeaf(ctx, bl.x, bl.y, bl.angle + bounce, bl.size, '#246b3e', t);
            });
        }

        drawCinematicVignette(ctx, w, h) {
            const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.45, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
            vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
            vig.addColorStop(0.7, 'rgba(10, 5, 20, 0.25)');
            vig.addColorStop(1, 'rgba(5, 2, 12, 0.75)');

            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, w, h);
        }
    }

    // Attach singleton to window
    window.MemoryCinemaManager = MemoryCinemaManager;
    window.memoryCinema = new MemoryCinemaManager();

})(typeof window !== 'undefined' ? window : global);
