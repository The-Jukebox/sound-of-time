/**
 * SOUND OF TIMES - Pixel Art Renderer & Sprite Engine
 * Renders characters (Eli, Koru, Little Rocks), environments, dynamic holograms, and the retro Jukebox.
 */

// Canvas roundRect polyfill for maximum browser compatibility
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
        if (!radii) radii = 0;
        let r = 0;
        if (typeof radii === 'number') {
            r = radii;
        } else if (Array.isArray(radii)) {
            r = radii[0] || 0;
        }
        this.beginPath();
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        this.closePath();
        return this;
    };
}

class PixelRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Ensure crisp pixel rendering
        this.ctx.imageSmoothingEnabled = false;

        // Time tracking for animations
        this.animTime = 0;

        // Particle system for sound waves, cosmic dust, rain, etc.
        this.particles = [];
        this.rainDrops = [];
        this.lightningFlash = 0;

        // Colors
        this.palette = {
            deepViolet: '#26134D',
            midnightPurple: '#140D2B',
            electricBlue: '#47D8F2',
            warmGold: '#FFCA72',
            softPink: '#F28BBD',
            earthGreen: '#62C98A',
            spaceBlack: '#0a0514',
            rockGray: '#514763',
            rockHighlight: '#7e7399',
            lightCyan: '#b3f7ff',
            windowWarmth: '#ffb24d'
        };

        this.initRain();
        this.initRockySprites();
        this.initRyanSprites();
        this.initSnow();
        this.initThoughtImages();
    }

    initThoughtImages() {
        this.thoughtImages = {};
        const sources = {
            forest: ['assets/memories/leaves_hd.jpg', 'Public/assets/memories/leaves_hd.jpg', 'memories/leaves_hd.jpg'],
            ocean: ['assets/memories/ocean_hd.jpg', 'Public/assets/memories/ocean_hd.jpg', 'memories/ocean_hd.jpg'],
            atmosphere: ['assets/memories/rain_hd.jpg', 'Public/assets/memories/rain_hd.jpg', 'memories/rain_hd.jpg'],
            earth: ['assets/memories/birds_hd.jpg', 'Public/assets/memories/birds_hd.jpg', 'memories/birds_hd.jpg']
        };

        const loadWithFallback = (paths) => {
            const img = new Image();
            let idx = 0;
            const tryNext = () => {
                if (idx < paths.length) {
                    img.src = paths[idx++];
                }
            };
            img.onerror = () => tryNext();
            tryNext();
            return img;
        };

        for (const [key, paths] of Object.entries(sources)) {
            this.thoughtImages[key] = loadWithFallback(paths);
        }
    }

    initRockySprites() {
        const loadImg = (path) => {
            const img = new Image();
            img.src = path;
            return img;
        };

        this.rockySprites = {
            walk: [
                loadImg('assets/rocky/walk_0.png'),
                loadImg('assets/rocky/walk_1.png'),
                loadImg('assets/rocky/walk_2.png'),
                loadImg('assets/rocky/walk_3.png')
            ],
            talk: [
                loadImg('assets/rocky/talk_0.png'),
                loadImg('assets/rocky/talk_1.png'),
                loadImg('assets/rocky/talk_2.png')
            ],
            hands: [
                loadImg('assets/rocky/hands_0.png'),
                loadImg('assets/rocky/hands_1.png'),
                loadImg('assets/rocky/hands_2.png')
            ]
        };
    }

    initRyanSprites() {
        const loadImg = (path) => {
            const img = new Image();
            img.src = path;
            return img;
        };

        this.ryanSprites = {
            walk: [
                loadImg('assets/ryan/walk_0.png'),
                loadImg('assets/ryan/walk_1.png'),
                loadImg('assets/ryan/walk_2.png'),
                loadImg('assets/ryan/walk_3.png'),
                loadImg('assets/ryan/walk_4.png'),
                loadImg('assets/ryan/walk_5.png')
            ],
            talk: [
                loadImg('assets/ryan/talk_0.png'),
                loadImg('assets/ryan/talk_1.png'),
                loadImg('assets/ryan/talk_2.png'),
                loadImg('assets/ryan/talk_3.png'),
                loadImg('assets/ryan/talk_4.png'),
                loadImg('assets/ryan/talk_5.png')
            ],
            hands: [
                loadImg('assets/ryan/hands_0.png'),
                loadImg('assets/ryan/hands_1.png'),
                loadImg('assets/ryan/hands_2.png'),
                loadImg('assets/ryan/hands_3.png')
            ]
        };
    }

    initSnow() {
        this.snowFlakes = [];
        for (let i = 0; i < 90; i++) {
            this.snowFlakes.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                speedY: 0.6 + Math.random() * 1.4,
                speedX: -0.4 + Math.random() * 0.8,
                size: 1.2 + Math.random() * 2.2,
                alpha: 0.4 + Math.random() * 0.55
            });
        }
    }

    initRain() {
        this.rainDrops = [];
        for (let i = 0; i < 45; i++) {
            this.rainDrops.push({
                x: 180 + Math.random() * 280,
                y: 40 + Math.random() * 140,
                speed: 1.5 + Math.random() * 2.5,
                length: 4 + Math.random() * 6,
                alpha: 0.3 + Math.random() * 0.5
            });
        }
    }

    update(dt) {
        this.animTime += dt;

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= dt;
            p.alpha = Math.max(0, p.life / p.maxLife);
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update window rain (for Scene 5 atmosphere)
        this.rainDrops.forEach(drop => {
            drop.y += drop.speed;
            if (drop.y > 185) {
                drop.y = 42;
                drop.x = 180 + Math.random() * 280;
            }
        });

        if (this.lightningFlash > 0) {
            this.lightningFlash = Math.max(0, this.lightningFlash - dt * 2.5);
        }
    }

    triggerFlash() {
        this.lightningFlash = 0.85;
    }

    spawnParticle(x, y, vx, vy, color, life = 1.5, size = 2) {
        this.particles.push({
            x, y, vx, vy, color, life, maxLife: life, alpha: 1, size
        });
    }

    // ----------------------------------------------------
    // BACKGROUNDS
    // ----------------------------------------------------

    // Scene 1 & 2: Wide Alien Planet Landscape & Classroom
    drawAlienPlanetBackground(cameraX = 0) {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // 1. Sky Gradient: Deep purple to midnight violet
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.7);
        skyGrad.addColorStop(0, '#0d071e');
        skyGrad.addColorStop(0.4, '#1b0f38');
        skyGrad.addColorStop(0.75, '#2e1859');
        skyGrad.addColorStop(1, '#4a256f');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // 2. Distant Twinkling Stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 65; i++) {
            const sx = (Math.sin(i * 99 + 12) * 5000 + 5000) % w;
            const sy = (Math.cos(i * 77 + 45) * 5000 + 5000) % (h * 0.55);
            const twinkle = Math.sin(this.animTime * 2.5 + i) * 0.4 + 0.6;
            ctx.globalAlpha = twinkle * 0.8;
            ctx.fillRect(Math.floor(sx), Math.floor(sy), (i % 5 === 0) ? 2 : 1, (i % 5 === 0) ? 2 : 1);
        }
        ctx.globalAlpha = 1.0;

        // 3. Huge Distant Gas Giant Planet with Rings
        const planetX = 140 - cameraX * 0.05;
        const planetY = 65;
        // Planet glow
        const glow = ctx.createRadialGradient(planetX, planetY, 15, planetX, planetY, 55);
        glow.addColorStop(0, 'rgba(242, 139, 189, 0.4)');
        glow.addColorStop(0.6, 'rgba(71, 216, 242, 0.15)');
        glow.addColorStop(1, 'rgba(38, 19, 77, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(planetX, planetY, 55, 0, Math.PI * 2);
        ctx.fill();

        // Planet body
        const pGrad = ctx.createLinearGradient(planetX - 30, planetY - 30, planetX + 30, planetY + 30);
        pGrad.addColorStop(0, '#f28bbd');
        pGrad.addColorStop(0.5, '#8c52ff');
        pGrad.addColorStop(1, '#26134d');
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(planetX, planetY, 28, 0, Math.PI * 2);
        ctx.fill();

        // Planet rings
        ctx.save();
        ctx.translate(planetX, planetY);
        ctx.rotate(-0.35);
        ctx.strokeStyle = 'rgba(255, 202, 114, 0.75)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 52, 12, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Smaller Moon
        ctx.fillStyle = '#47d8f2';
        ctx.beginPath();
        ctx.arc(planetX + 85, planetY - 20, 8, 0, Math.PI * 2);
        ctx.fill();

        // 4. Parallax Mountain Ridges (Back, Mid, Front)
        this.drawMountainRidge(h * 0.48, '#1e113b', cameraX * 0.1, 45, 120);
        this.drawMountainRidge(h * 0.58, '#2d1852', cameraX * 0.25, 35, 90);
        this.drawMountainRidge(h * 0.68, '#3d1f6b', cameraX * 0.45, 25, 60);

        // 5. Rocky Ground & Bioluminescent Spores
        ctx.fillStyle = '#21133b';
        ctx.fillRect(0, h * 0.72, w, h * 0.28);

        // Ground texture lines
        ctx.fillStyle = '#311b52';
        for (let gx = 0; gx < w; gx += 20) {
            const rx = (gx - (cameraX % 20) + w) % w;
            ctx.fillRect(rx, h * 0.74, 14, 2);
            ctx.fillRect((rx + 8) % w, h * 0.82, 18, 3);
            ctx.fillRect((rx + 3) % w, h * 0.90, 22, 2);
        }

        // Strange alien plants with glowing neon tips
        this.drawAlienFlora(70 - cameraX, h * 0.74);
        this.drawAlienFlora(180 - cameraX, h * 0.76);
        this.drawAlienFlora(340 - cameraX, h * 0.73);
        this.drawAlienFlora(510 - cameraX, h * 0.75);
        this.drawAlienFlora(680 - cameraX, h * 0.74);
    }

    drawMountainRidge(baseY, color, offset, minH, maxH) {
        const ctx = this.ctx;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, this.height);
        ctx.lineTo(0, baseY);

        const step = 40;
        for (let x = 0; x <= this.width + step; x += step) {
            const peak = Math.sin((x + offset) * 0.015) * 20 + Math.cos((x + offset) * 0.035) * 15;
            ctx.lineTo(x, baseY - minH - peak);
        }
        ctx.lineTo(this.width, this.height);
        ctx.closePath();
        ctx.fill();
    }

    drawAlienFlora(x, y) {
        if (x < -30 || x > this.width + 30) return;
        const ctx = this.ctx;
        const t = this.animTime;
        const sway = Math.sin(t * 1.8 + x) * 2;

        // Dark stalk
        ctx.strokeStyle = '#4a256f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + sway, y - 18, x + sway * 1.5, y - 30);
        ctx.stroke();

        // Glowing spore cap
        const glowPulse = Math.sin(t * 3 + x) * 0.3 + 0.7;
        ctx.fillStyle = this.palette.electricBlue;
        ctx.globalAlpha = glowPulse;
        ctx.beginPath();
        ctx.arc(x + sway * 1.5, y - 32, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Glow halo
        ctx.fillStyle = 'rgba(71, 216, 242, 0.25)';
        ctx.beginPath();
        ctx.arc(x + sway * 1.5, y - 32, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    // Eli's Habitat Exterior Dome (Scene 1)
    drawHabitatExterior(x, y) {
        const ctx = this.ctx;
        // Habitat structure (properly proportioned for adult Ryan ~82px)
        ctx.fillStyle = '#42325c';
        ctx.fillRect(x, y - 105, 175, 105);
        ctx.fillStyle = '#2c1e42';
        ctx.fillRect(x + 10, y - 95, 155, 95);

        // Curved dome roof
        ctx.fillStyle = '#5c487d';
        ctx.beginPath();
        ctx.ellipse(x + 88, y - 105, 88, 42, 0, Math.PI, 0);
        ctx.fill();

        // Glowing panoramic observation window (Artificial beach & warm lights inside)
        const winGrad = ctx.createLinearGradient(x + 20, y - 85, x + 125, y - 20);
        winGrad.addColorStop(0, '#ffca72');
        winGrad.addColorStop(0.5, '#47d8f2');
        winGrad.addColorStop(1, '#26134d');
        ctx.fillStyle = winGrad;
        ctx.fillRect(x + 20, y - 85, 105, 65);

        // Window frame dividers
        ctx.fillStyle = '#1e142e';
        ctx.fillRect(x + 55, y - 85, 4, 65);
        ctx.fillRect(x + 90, y - 85, 4, 65);

        // Internal artificial fog / wave silhouette inside window
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        const waveY = y - 30 + Math.sin(this.animTime * 2) * 2;
        ctx.moveTo(x + 20, waveY);
        ctx.bezierCurveTo(x + 50, waveY - 4, x + 85, waveY + 4, x + 125, waveY);
        ctx.lineTo(x + 125, y - 20);
        ctx.lineTo(x + 20, y - 20);
        ctx.closePath();
        ctx.fill();

        // Habitat entrance door (tall enough for adult Ryan ~82px to walk through)
        ctx.fillStyle = '#ffca72';
        ctx.fillRect(x + 135, y - 88, 28, 88);
        ctx.fillStyle = '#311b52';
        ctx.fillRect(x + 137, y - 86, 24, 86);
        // Door light sensor
        ctx.fillStyle = this.palette.electricBlue;
        ctx.fillRect(x + 145, y - 76, 8, 3);
    }

    // Classroom Scene (Scene 2)
    drawClassroom(boardContent = 'earth') {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // Background
        this.drawAlienPlanetBackground(0);

        // Holographic Projector Base
        const hx = w * 0.5;
        const hy = h * 0.74;

        ctx.fillStyle = '#42325c';
        ctx.beginPath();
        ctx.ellipse(hx, hy, 45, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.palette.electricBlue;
        ctx.fillRect(hx - 25, hy - 4, 50, 4);

        // Holographic Beam
        const beamGrad = ctx.createLinearGradient(hx, hy, hx, hy - 160);
        beamGrad.addColorStop(0, 'rgba(71, 216, 242, 0.45)');
        beamGrad.addColorStop(0.3, 'rgba(71, 216, 242, 0.25)');
        beamGrad.addColorStop(1, 'rgba(71, 216, 242, 0.05)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(hx - 25, hy - 4);
        ctx.lineTo(hx - 110, hy - 160);
        ctx.lineTo(hx + 110, hy - 160);
        ctx.lineTo(hx + 25, hy - 4);
        ctx.closePath();
        ctx.fill();

        // Hologram Screen Display
        const bx = hx - 100;
        const by = hy - 170;
        const bw = 200;
        const bh = 110;

        // Glass hologram container
        ctx.fillStyle = 'rgba(20, 13, 43, 0.75)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = this.palette.electricBlue;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);

        // Hologram scanlines
        ctx.fillStyle = 'rgba(71, 216, 242, 0.12)';
        for (let sl = 0; sl < bh; sl += 4) {
            ctx.fillRect(bx, by + sl, bw, 2);
        }

        // Draw dynamic content inside hologram
        if (boardContent === 'earth') {
            // Rotating pixel Earth illustration
            this.drawPixelEarthHologram(hx, by + 50, 32);
            ctx.fillStyle = this.palette.warmGold;
            ctx.font = '10px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('PLANET EARTH / SOL-3', hx, by + 98);
        } else if (boardContent === 'forest') {
            // Swaying green trees animation
            this.drawHolographicForest(bx, by, bw, bh);
            ctx.fillStyle = this.palette.earthGreen;
            ctx.font = '10px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('BIOSPHERE: SWAYING FORESTS', hx, by + 98);
        } else if (boardContent === 'rain') {
            // Falling blue raindrops across hologram
            this.drawHolographicRain(bx, by, bw, bh);
            ctx.fillStyle = this.palette.electricBlue;
            ctx.font = '10px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('HYDROSPHERE: RAINFALL', hx, by + 98);
        }

        // Classroom seating pillars & Eridian students rendered in drawLittleOnes
    }

    drawSittingStone(x, y) {
        const ctx = this.ctx;
        ctx.fillStyle = '#42325c';
        ctx.beginPath();
        ctx.ellipse(x, y, 22, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6b548f';
        ctx.beginPath();
        ctx.ellipse(x, y - 3, 18, 7, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawHolographicForest(bx, by, bw, bh) {
        const ctx = this.ctx;
        const t = this.animTime;
        // Ground line
        ctx.strokeStyle = this.palette.earthGreen;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx + 15, by + 78);
        ctx.lineTo(bx + bw - 15, by + 78);
        ctx.stroke();

        // 5 swaying pixel trees
        const treeX = [bx + 35, bx + 68, bx + 100, bx + 132, bx + 165];
        const heights = [38, 46, 52, 42, 36];

        treeX.forEach((tx, i) => {
            const h = heights[i];
            const sway = Math.sin(t * 3 + i * 1.2) * 4;

            // Trunk
            ctx.strokeStyle = '#a67c52';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(tx, by + 78);
            ctx.lineTo(tx + sway * 0.3, by + 78 - h * 0.4);
            ctx.stroke();

            // Foliage triangle layers
            ctx.fillStyle = (i % 2 === 0) ? '#62c98a' : '#45b370';
            ctx.beginPath();
            ctx.moveTo(tx + sway, by + 78 - h);
            ctx.lineTo(tx - 14 + sway * 0.5, by + 78 - h * 0.3);
            ctx.lineTo(tx + 14 + sway * 0.5, by + 78 - h * 0.3);
            ctx.closePath();
            ctx.fill();

            // Glow particles around foliage
            if (Math.random() < 0.2) {
                ctx.fillStyle = '#b3f7ff';
                ctx.fillRect(tx + (Math.random() * 20 - 10), by + 78 - h + Math.random() * 20, 2, 2);
            }
        });
    }

    drawHolographicRain(bx, by, bw, bh) {
        const ctx = this.ctx;
        const t = this.animTime;

        // Cloud at top
        ctx.fillStyle = 'rgba(140, 82, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(bx + bw * 0.5, by + 22, bw * 0.4, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Falling blue droplets
        ctx.strokeStyle = this.palette.electricBlue;
        ctx.lineWidth = 2;
        for (let i = 0; i < 35; i++) {
            const rx = bx + 20 + ((i * 37) % (bw - 40));
            const ry = by + 28 + (((t * 90 + i * 18)) % (bh - 45));
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx - 2, ry + 6);
            ctx.stroke();

            // Splash ripples at bottom
            if (ry > by + bh - 20) {
                ctx.strokeStyle = 'rgba(71, 216, 242, 0.3)';
                ctx.beginPath();
                ctx.ellipse(rx, by + bh - 16, 4, 1.5, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }

    drawPixelEarthHologram(cx, cy, r) {
        const ctx = this.ctx;
        const t = this.animTime;

        // Atmosphere glow
        const glow = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 1.3);
        glow.addColorStop(0, 'rgba(71, 216, 242, 0.6)');
        glow.addColorStop(1, 'rgba(71, 216, 242, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Ocean blue sphere
        ctx.fillStyle = '#1e88e5';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Rotating Continents (Pixel art landmasses)
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
        ctx.clip();

        ctx.fillStyle = this.palette.earthGreen;
        const offset = (t * 12) % (r * 4);

        for (let rep = -1; rep <= 2; rep++) {
            const lx = cx - r * 2 + offset + rep * r * 3;
            // North America / Europe shape
            ctx.fillRect(lx, cy - 14, 18, 12);
            ctx.fillRect(lx + 10, cy - 22, 14, 10);
            ctx.fillRect(lx + 6, cy + 2, 12, 14); // South America / Africa
            ctx.fillRect(lx + 32, cy - 12, 22, 16); // Asia
            ctx.fillRect(lx + 38, cy + 8, 10, 8); // Australia
        }

        // Atmospheric cloud swirls
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        for (let rep = -1; rep <= 2; rep++) {
            const clx = cx - r * 2 + (t * 18) % (r * 4) + rep * r * 3;
            ctx.fillRect(clx + 4, cy - 18, 16, 3);
            ctx.fillRect(clx + 18, cy, 22, 4);
            ctx.fillRect(clx - 8, cy + 12, 15, 3);
        }
        ctx.restore();

        // Edge rim lighting
        ctx.strokeStyle = this.palette.electricBlue;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Scene 3: Rocky Pathway with Golden Light Flicker
    drawRockyPathway(flicker = true, cameraX = 0) {
        this.drawAlienPlanetBackground(cameraX);
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // Jagged foreground rocks
        ctx.fillStyle = '#2c1945';
        ctx.beginPath();
        ctx.moveTo(380 - cameraX, h * 0.74);
        ctx.lineTo(410 - cameraX, h * 0.62);
        ctx.lineTo(435 - cameraX, h * 0.74);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#3c245c';
        ctx.beginPath();
        ctx.moveTo(425 - cameraX, h * 0.74);
        ctx.lineTo(455 - cameraX, h * 0.60);
        ctx.lineTo(490 - cameraX, h * 0.74);
        ctx.closePath();
        ctx.fill();

        // Metallic Jukebox partially buried between the two rocks
        const jx = 422 - cameraX;
        const jy = h * 0.71;

        // Jukebox top corner showing
        ctx.fillStyle = '#663b14'; // wood
        ctx.fillRect(jx, jy - 14, 22, 14);
        ctx.fillStyle = '#ffd15c'; // gold trim
        ctx.fillRect(jx + 2, jy - 13, 18, 3);
        ctx.fillStyle = '#47d8f2'; // neon edge
        ctx.fillRect(jx + 4, jy - 9, 14, 2);

        // Golden light flicker
        if (flicker) {
            const pulse = (Math.sin(this.animTime * 8) * 0.4 + 0.6);
            const goldGlow = ctx.createRadialGradient(jx + 11, jy - 8, 2, jx + 11, jy - 8, 32);
            goldGlow.addColorStop(0, `rgba(255, 202, 114, ${0.9 * pulse})`);
            goldGlow.addColorStop(0.5, `rgba(255, 202, 114, ${0.4 * pulse})`);
            goldGlow.addColorStop(1, 'rgba(255, 202, 114, 0)');
            ctx.fillStyle = goldGlow;
            ctx.beginPath();
            ctx.arc(jx + 11, jy - 8, 32, 0, Math.PI * 2);
            ctx.fill();

            // Sparkle particles
            if (Math.random() < 0.3) {
                this.spawnParticle(jx + 11 + (Math.random() * 20 - 10), jy - 8 + (Math.random() * 20 - 10), 0, -0.5, '#ffca72', 0.8, 2);
            }
        }
    }

    // Scene 4, 5, 6: Inside Eli's Cozy Home
    drawHomeInterior(activeRecord = null, audioMetrics = null) {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // Cozy room walls (warm dark wood & purple panels)
        const wallGrad = ctx.createLinearGradient(0, 0, 0, h * 0.7);
        wallGrad.addColorStop(0, '#1c1033');
        wallGrad.addColorStop(1, '#331d4d');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(0, 0, w, h);

        // Warm Wooden Floor
        ctx.fillStyle = '#261421';
        ctx.fillRect(0, h * 0.68, w, h * 0.32);
        // Floor planks
        ctx.strokeStyle = '#381f2f';
        ctx.lineWidth = 1.5;
        for (let fy = h * 0.68; fy < h; fy += 14) {
            ctx.beginPath();
            ctx.moveTo(0, fy);
            ctx.lineTo(w, fy);
            ctx.stroke();
        }

        // Large Panoramic Bay Window (overlooking purple landscape & artificial beach)
        const winX = 170;
        const winY = 35;
        const winW = 300;
        const winH = 145;

        // Window background: Night sky with purple mountains and moon
        ctx.save();
        ctx.beginPath();
        ctx.rect(winX, winY, winW, winH);
        ctx.clip();

        if (activeRecord === 'forest') {
            this.drawForestWindowView(winX, winY, winW, winH);
        } else {
            // Alien sky through window
            const outSky = ctx.createLinearGradient(winX, winY, winX, winY + winH);
            outSky.addColorStop(0, '#0a0517');
            outSky.addColorStop(0.6, '#281347');
            outSky.addColorStop(1, '#441d66');
            ctx.fillStyle = outSky;
            ctx.fillRect(winX, winY, winW, winH);

            // Distant stars & moon
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 25; i++) {
                ctx.fillRect(winX + (i * 47) % winW, winY + (i * 29) % (winH * 0.5), 1.5, 1.5);
            }
            ctx.fillStyle = '#ffca72';
            ctx.beginPath();
            ctx.arc(winX + 230, winY + 40, 16, 0, Math.PI * 2);
            ctx.fill();

            // Purple mountains outside window
            ctx.fillStyle = '#1e0c33';
            ctx.beginPath();
            ctx.moveTo(winX, winY + winH);
            ctx.lineTo(winX, winY + 90);
            ctx.lineTo(winX + 70, winY + 65);
            ctx.lineTo(winX + 160, winY + 95);
            ctx.lineTo(winX + 240, winY + 60);
            ctx.lineTo(winX + winW, winY + 85);
            ctx.lineTo(winX + winW, winY + winH);
            ctx.closePath();
            ctx.fill();

            // Artificial Beach & Gentle Waves (visible outside habitat)
            ctx.fillStyle = '#ffcc80'; // sandy shore
            ctx.fillRect(winX, winY + winH - 22, winW, 22);

            // Water with gentle waves (surges in sync with ocean sonification)
            let waveAmp = 4;
            if (activeRecord === 'ocean' && window.oceanSonification && window.oceanSonification.isPlaying) {
                const m = window.oceanSonification.getMetrics();
                waveAmp = 3 + m.energy * 9;
            }
            const waterWave = Math.sin(this.animTime * 2.2) * waveAmp;
            ctx.fillStyle = '#399ec7';
            ctx.beginPath();
            ctx.moveTo(winX, winY + winH);
            ctx.lineTo(winX, winY + winH - 14 + waterWave);
            ctx.quadraticCurveTo(winX + winW * 0.5, winY + winH - 18 - waterWave, winX + winW, winY + winH - 14 + waterWave);
            ctx.lineTo(winX + winW, winY + winH);
            ctx.closePath();
            ctx.fill();

            // Rain on window if ATMOSPHERE or EARTH is active
            if (activeRecord === 'atmosphere' || activeRecord === 'earth') {
                ctx.strokeStyle = 'rgba(71, 216, 242, 0.45)';
                ctx.lineWidth = 1.5;
                this.rainDrops.forEach(drop => {
                    ctx.beginPath();
                    ctx.moveTo(drop.x, drop.y);
                    ctx.lineTo(drop.x - 1, drop.y + drop.length);
                    ctx.stroke();
                });
            }
        }

        ctx.restore();

        // Window Frame & Mullions
        ctx.strokeStyle = '#4e3152';
        ctx.lineWidth = 6;
        ctx.strokeRect(winX, winY, winW, winH);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(winX + winW * 0.5, winY);
        ctx.lineTo(winX + winW * 0.5, winY + winH);
        ctx.stroke();

        // Cozy Room Furniture:
        // Potted Earth fern on the left
        this.drawPottedPlant(75, h * 0.68, activeRecord === 'forest');

        // Cozy couch on the right
        this.drawCouch(500, h * 0.70);

        // Workbench / Table in the center where Jukebox rests
        const tableX = 270;
        const tableY = h * 0.70;
        this.drawWorkbench(tableX, tableY);

        // Retro Lamp on the workbench (sitting securely on the left of tabletop)
        this.drawDeskLamp(tableX - 5, tableY - 28);

        // If Earth record is active, room lighting shifts warmly!
        if (activeRecord === 'earth') {
            const earthWarmth = ctx.createRadialGradient(tableX + 45, tableY - 45, 10, tableX + 45, tableY - 45, 240);
            earthWarmth.addColorStop(0, 'rgba(255, 202, 114, 0.22)');
            earthWarmth.addColorStop(0.7, 'rgba(98, 201, 138, 0.12)');
            earthWarmth.addColorStop(1, 'rgba(38, 19, 77, 0)');
            ctx.fillStyle = earthWarmth;
            ctx.fillRect(0, 0, w, h);
        }

        // Lightning flash effect
        if (this.lightningFlash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlash * 0.7})`;
            ctx.fillRect(0, 0, w, h);
        }
    }

    // Panoramic Window View for Earth Archive Record 003: The Forest
    drawForestWindowView(winX, winY, winW, winH) {
        const ctx = this.ctx;
        const t = this.animTime;

        let metrics = null;
        let soundscape = null;
        if (window.forestSonification) {
            metrics = window.forestSonification.getMetrics();
            soundscape = metrics ? metrics.soundscape : null;
        }

        const mode = soundscape ? soundscape.mode : 'morning';
        const windIntensity = soundscape ? soundscape.windIntensity : 0.4;
        const streamIntensity = soundscape ? soundscape.streamIntensity : 0.5;
        const rainIntensity = soundscape ? soundscape.rainIntensity : 0.0;
        const energy = metrics ? metrics.energy : 0.4;
        const lastBirdChirp = soundscape ? soundscape.lastBirdChirpTime : 0;
        const isBirdActive = (performance.now() - lastBirdChirp) < 1800;

        // 1. Sky Gradient based on Day/Night Mode
        const skyGrad = ctx.createLinearGradient(winX, winY, winX, winY + winH);
        if (mode === 'morning') {
            skyGrad.addColorStop(0, '#ffb870'); // Golden dawn
            skyGrad.addColorStop(0.4, '#ffd898');
            skyGrad.addColorStop(0.8, '#a0cbe8');
            skyGrad.addColorStop(1, '#6ea8d0');
        } else if (mode === 'afternoon') {
            skyGrad.addColorStop(0, '#2b78b8'); // Solar azure
            skyGrad.addColorStop(0.5, '#5ea8dc');
            skyGrad.addColorStop(1, '#a6d8f0');
        } else if (mode === 'evening') {
            skyGrad.addColorStop(0, '#361543'); // Violet / amber twilight
            skyGrad.addColorStop(0.5, '#8c2d58');
            skyGrad.addColorStop(0.85, '#e06840');
            skyGrad.addColorStop(1, '#ffaa50');
        } else {
            // Night
            skyGrad.addColorStop(0, '#04020e'); // Deep cosmic indigo
            skyGrad.addColorStop(0.6, '#0f0c2a');
            skyGrad.addColorStop(1, '#1b1442');
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(winX, winY, winW, winH);

        // Sun / Moon / Celestial bodies
        if (mode === 'morning') {
            // Low golden sun
            const sunX = winX + winW * 0.25;
            const sunY = winY + winH * 0.35;
            const sunGlow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 45);
            sunGlow.addColorStop(0, 'rgba(255, 240, 180, 0.9)');
            sunGlow.addColorStop(0.4, 'rgba(255, 200, 110, 0.4)');
            sunGlow.addColorStop(1, 'rgba(255, 180, 80, 0)');
            ctx.fillStyle = sunGlow;
            ctx.beginPath();
            ctx.arc(sunX, sunY, 45, 0, Math.PI * 2);
            ctx.fill();
        } else if (mode === 'afternoon') {
            // High warm sun
            const sunX = winX + winW * 0.7;
            const sunY = winY + 28;
            ctx.fillStyle = 'rgba(255, 255, 220, 0.85)';
            ctx.beginPath();
            ctx.arc(sunX, sunY, 14, 0, Math.PI * 2);
            ctx.fill();
        } else if (mode === 'night') {
            // Crescent moon & Stars
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            for (let i = 0; i < 35; i++) {
                ctx.fillRect(winX + (i * 37) % winW, winY + (i * 23) % (winH * 0.55), 1.2, 1.2);
            }
            // Crescent Moon
            const moonX = winX + winW * 0.82;
            const moonY = winY + 28;
            ctx.fillStyle = '#fdf3c6';
            ctx.beginPath();
            ctx.arc(moonX, moonY, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0f0c2a';
            ctx.beginPath();
            ctx.arc(moonX - 4, moonY - 2, 11, 0, Math.PI * 2);
            ctx.fill();
        }

        // 2. Far Distant Mountain Ridges & Tree Horizon (Layer 1)
        const mtColor = (mode === 'night') ? '#0b081c' : (mode === 'evening' ? '#2c1228' : '#224855');
        ctx.fillStyle = mtColor;
        ctx.beginPath();
        ctx.moveTo(winX, winY + winH);
        ctx.lineTo(winX, winY + 80);
        ctx.lineTo(winX + 60, winY + 55);
        ctx.lineTo(winX + 140, winY + 75);
        ctx.lineTo(winX + 220, winY + 50);
        ctx.lineTo(winX + winW, winY + 70);
        ctx.lineTo(winX + winW, winY + winH);
        ctx.closePath();
        ctx.fill();

        // Distant Evergreen Tree Silhouettes along ridge
        ctx.fillStyle = (mode === 'night') ? '#070514' : (mode === 'evening' ? '#1f0d1c' : '#15323a');
        for (let x = winX; x < winX + winW; x += 12) {
            const th = 15 + Math.sin(x * 0.05) * 6;
            ctx.beginPath();
            ctx.moveTo(x, winY + 85);
            ctx.lineTo(x + 6, winY + 85 - th);
            ctx.lineTo(x + 12, winY + 85);
            ctx.fill();
        }

        // 3. Midground Towering Ancient Tree Trunks (Layer 2)
        const trunkColor = (mode === 'night') ? '#120f24' : (mode === 'evening' ? '#3d1e26' : '#3c2419');
        const trunkHighlights = (mode === 'night') ? '#1f1b3b' : (mode === 'evening' ? '#5a2d36' : '#573626');
        
        const treePositions = [
            { x: winX + 38, width: 22, height: winH },
            { x: winX + 115, width: 28, height: winH },
            { x: winX + 205, width: 18, height: winH },
            { x: winX + 265, width: 26, height: winH }
        ];

        treePositions.forEach((tp, i) => {
            ctx.fillStyle = trunkColor;
            ctx.fillRect(tp.x, winY, tp.width, tp.height);
            // Bark texture stripes
            ctx.fillStyle = trunkHighlights;
            ctx.fillRect(tp.x + 3, winY, 3, tp.height);
            ctx.fillRect(tp.x + tp.width - 6, winY, 2, tp.height);

            // Moss patches on trunks
            ctx.fillStyle = (mode === 'night') ? '#11292a' : '#457a4a';
            ctx.fillRect(tp.x + 2, winY + 45 + (i * 20), 4, 18);
            ctx.fillRect(tp.x + 1, winY + 85 + (i * 15), 5, 12);
        });

        // 4. Forest Floor with Moss & Riverbank (Layer 3)
        const bankColor = (mode === 'night') ? '#0d1a16' : (mode === 'evening' ? '#263825' : '#2d5a36');
        ctx.fillStyle = bankColor;
        ctx.fillRect(winX, winY + winH - 32, winW, 32);

        // 5. Winding Forest Stream (Babbling Brook)
        const streamWave = Math.sin(t * 3.5) * (2 + streamIntensity * 4);
        const waterColor = (mode === 'night') ? '#102238' : (mode === 'evening' ? '#32546e' : '#3fa1cf');
        ctx.fillStyle = waterColor;
        ctx.beginPath();
        ctx.moveTo(winX, winY + winH);
        ctx.lineTo(winX, winY + winH - 20 + streamWave);
        ctx.bezierCurveTo(
            winX + winW * 0.35, winY + winH - 26 - streamWave,
            winX + winW * 0.65, winY + winH - 14 + streamWave,
            winX + winW, winY + winH - 18 + streamWave
        );
        ctx.lineTo(winX + winW, winY + winH);
        ctx.closePath();
        ctx.fill();

        // Shimmering water ripples & foam
        ctx.strokeStyle = (mode === 'night') ? 'rgba(98, 201, 138, 0.4)' : 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1;
        for (let r = 0; r < 5; r++) {
            const rx = winX + 30 + ((r * 62 + t * 25) % (winW - 60));
            const ry = winY + winH - 12 + Math.sin(t * 4 + r) * 3;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx + 10 + (streamIntensity * 8), ry);
            ctx.stroke();
        }

        // 6. Upper Canopy Branches & Foliage (Layer 4)
        const swaySpeed = 2.0 + windIntensity * 3.5;
        const swayAmp = 3.0 + windIntensity * 9.0;
        const sway = Math.sin(t * swaySpeed) * swayAmp;

        const folColor1 = (mode === 'night') ? '#0c221a' : (mode === 'evening' ? '#3d6139' : '#3da85a');
        const folColor2 = (mode === 'night') ? '#123024' : (mode === 'evening' ? '#537d4e' : '#57c777');
        const folColor3 = (mode === 'night') ? '#1a3f31' : (mode === 'evening' ? '#6b9c65' : '#7fe39e');

        // Upper canopy domes
        ctx.fillStyle = folColor1;
        ctx.beginPath();
        ctx.arc(winX + 45 + sway * 0.4, winY + 8, 48, 0, Math.PI);
        ctx.arc(winX + 130 + sway * 0.6, winY + 12, 58, 0, Math.PI);
        ctx.arc(winX + 225 + sway * 0.5, winY + 6, 52, 0, Math.PI);
        ctx.arc(winX + 295 + sway * 0.7, winY + 14, 45, 0, Math.PI);
        ctx.fill();

        ctx.fillStyle = folColor2;
        ctx.beginPath();
        ctx.arc(winX + 85 + sway * 0.7, winY + 22, 42, 0, Math.PI);
        ctx.arc(winX + 180 + sway * 0.8, winY + 24, 46, 0, Math.PI);
        ctx.arc(winX + 260 + sway * 0.6, winY + 20, 38, 0, Math.PI);
        ctx.fill();

        // Branches reaching across window
        ctx.strokeStyle = trunkColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(winX + 115, winY + 50);
        ctx.quadraticCurveTo(winX + 160 + sway * 0.5, winY + 45, winX + 195 + sway, winY + 55);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(winX + 265, winY + 65);
        ctx.quadraticCurveTo(winX + 235 + sway * 0.4, winY + 60, winX + 190 + sway, winY + 70);
        ctx.stroke();

        // Individual Leaf Clusters at branch tips
        ctx.fillStyle = folColor3;
        const leafClusters = [
            { x: winX + 195 + sway, y: winY + 55 },
            { x: winX + 165 + sway * 0.6, y: winY + 46 },
            { x: winX + 190 + sway, y: winY + 70 },
            { x: winX + 225 + sway * 0.5, y: winY + 62 }
        ];
        leafClusters.forEach(lc => {
            ctx.beginPath();
            ctx.arc(lc.x, lc.y, 6 + (energy * 3), 0, Math.PI * 2);
            ctx.fill();
        });

        // 7. Sunlight Filtering Through Trees (Crepuscular God Rays)
        if (mode === 'morning' || mode === 'afternoon') {
            const rayAlpha = (0.12 + energy * 0.18);
            const rayGrad = ctx.createLinearGradient(winX + 100, winY, winX + 180, winY + winH);
            rayGrad.addColorStop(0, mode === 'morning' ? `rgba(255, 230, 160, ${rayAlpha})` : `rgba(255, 255, 200, ${rayAlpha})`);
            rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = rayGrad;

            // 3 Angled light beams
            ctx.beginPath();
            ctx.moveTo(winX + 70, winY);
            ctx.lineTo(winX + 120, winY);
            ctx.lineTo(winX + 190, winY + winH);
            ctx.lineTo(winX + 130, winY + winH);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(winX + 175, winY);
            ctx.lineTo(winX + 215, winY);
            ctx.lineTo(winX + 280, winY + winH);
            ctx.lineTo(winX + 230, winY + winH);
            ctx.fill();
        }

        // 8. Wildlife: Birds that react to bird calls
        const birdBranchX = winX + 180 + sway * 0.5;
        const birdBranchY = winY + 48;
        // Perched bird
        ctx.fillStyle = (mode === 'night') ? '#1e1a38' : '#e05a47'; // Red-breasted robin / thrush
        ctx.fillRect(birdBranchX - 3, birdBranchY - 5, 6, 5);
        ctx.fillStyle = '#f5c542'; // beak
        ctx.fillRect(birdBranchX + 3, birdBranchY - 4, 2, 2);

        // If a bird chirp triggered recently, animate fluttering wings!
        if (isBirdActive) {
            const wingFlap = Math.sin(t * 30) * 4;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(birdBranchX - 2, birdBranchY - 4);
            ctx.lineTo(birdBranchX - 6, birdBranchY - 8 - wingFlap);
            ctx.stroke();

            // Flying bird across canopy
            const flyX = winX + ((t * 45) % (winW + 40)) - 20;
            const flyY = winY + 35 + Math.sin(t * 5) * 8;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(flyX - 4, flyY - 2 + wingFlap * 0.5);
            ctx.lineTo(flyX, flyY);
            ctx.lineTo(flyX + 4, flyY - 2 + wingFlap * 0.5);
            ctx.stroke();
        }

        // 9. Particles: Drifting Leaves, Pollen, or Glowing Fireflies
        if (mode === 'night') {
            // Glowing Fireflies
            for (let f = 0; f < 14; f++) {
                const fx = winX + ((f * 31 + t * 12 + Math.sin(t * 2 + f) * 15) % winW);
                const fy = winY + 50 + ((f * 19 + Math.cos(t * 1.8 + f) * 18) % (winH - 65));
                const glow = 0.4 + Math.sin(t * 4 + f) * 0.4;
                ctx.fillStyle = `rgba(160, 255, 120, ${glow})`;
                ctx.beginPath();
                ctx.arc(fx, fy, 1.8, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Drifting leaf flakes & pollen
            ctx.fillStyle = (mode === 'evening') ? 'rgba(235, 150, 70, 0.75)' : 'rgba(120, 220, 130, 0.7)';
            for (let p = 0; p < 10; p++) {
                const px = winX + ((p * 41 + t * (20 + windIntensity * 30)) % winW);
                const py = winY + 25 + ((p * 29 + t * 12 + Math.sin(t * 3 + p) * 10) % (winH - 35));
                ctx.fillRect(px, py, 2, 2);
            }
        }

        // 10. Rain droplets if rain is active
        if (rainIntensity > 0.0) {
            ctx.strokeStyle = 'rgba(180, 225, 255, 0.55)';
            ctx.lineWidth = 1.2;
            const dropCount = Math.floor(15 + rainIntensity * 40);
            for (let d = 0; d < dropCount; d++) {
                const dx = winX + ((d * 23 + t * 40) % winW);
                const dy = winY + ((t * 180 + d * 35) % winH);
                ctx.beginPath();
                ctx.moveTo(dx, dy);
                ctx.lineTo(dx - 1, dy + 7);
                ctx.stroke();
            }
        }
    }

    drawWorkbench(x, y) {
        const ctx = this.ctx;
        // Table top (polished mahogany wood with brass studs)
        ctx.fillStyle = '#4a281e';
        ctx.fillRect(x - 20, y - 28, 130, 10);
        ctx.fillStyle = '#69382b';
        ctx.fillRect(x - 18, y - 28, 126, 4);

        // Table legs
        ctx.fillStyle = '#361b14';
        ctx.fillRect(x - 15, y - 18, 8, 38);
        ctx.fillRect(x + 97, y - 18, 8, 38);
    }

    drawPottedPlant(x, y, isDancing = false) {
        const ctx = this.ctx;
        // Pot
        ctx.fillStyle = '#8a4b29';
        ctx.beginPath();
        ctx.moveTo(x - 14, y - 24);
        ctx.lineTo(x + 14, y - 24);
        ctx.lineTo(x + 10, y);
        ctx.lineTo(x - 10, y);
        ctx.closePath();
        ctx.fill();

        // Earth fern fronds
        const t = this.animTime;
        const sway = isDancing ? Math.sin(t * 4) * 5 : Math.sin(t * 1.5) * 1.5;

        ctx.strokeStyle = this.palette.earthGreen;
        ctx.lineWidth = 2.5;

        for (let i = -2; i <= 2; i++) {
            const angle = i * 0.35;
            ctx.beginPath();
            ctx.moveTo(x, y - 24);
            ctx.quadraticCurveTo(
                x + i * 14 + sway,
                y - 45,
                x + i * 22 + sway * 1.5,
                y - 50 + Math.abs(i) * 5
            );
            ctx.stroke();
        }
    }

    drawCouch(x, y) {
        const ctx = this.ctx;
        // Velvet retro couch
        ctx.fillStyle = '#422442';
        ctx.fillRect(x, y - 36, 110, 36);
        ctx.fillStyle = '#613361';
        ctx.fillRect(x + 6, y - 32, 98, 20); // back cushion
        ctx.fillStyle = '#7a3e7a';
        ctx.fillRect(x + 4, y - 12, 102, 14); // seat cushion
        // Armrests
        ctx.fillStyle = '#301830';
        ctx.fillRect(x - 4, y - 24, 12, 26);
        ctx.fillRect(x + 102, y - 24, 12, 26);
    }

    drawDeskLamp(x, y) {
        const ctx = this.ctx;
        // Lamp weighted base plate on tabletop
        ctx.fillStyle = '#261608';
        ctx.fillRect(x - 5, y - 2, 10, 3);
        ctx.fillStyle = this.palette.warmGold;
        ctx.fillRect(x - 4, y - 3, 8, 2);

        // Brass arched gooseneck
        ctx.strokeStyle = this.palette.warmGold;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - 3);
        ctx.lineTo(x - 2, y - 20);
        ctx.lineTo(x + 10, y - 26);
        ctx.stroke();

        // Lamp shade angled toward jukebox
        ctx.fillStyle = '#5c4323';
        ctx.beginPath();
        ctx.arc(x + 12, y - 26, 7, 0, Math.PI * 2);
        ctx.fill();

        // Warm light cone directed down onto the workbench
        const lightGrad = ctx.createRadialGradient(x + 12, y - 24, 2, x + 16, y - 4, 38);
        lightGrad.addColorStop(0, 'rgba(255, 202, 114, 0.40)');
        lightGrad.addColorStop(1, 'rgba(255, 202, 114, 0)');
        ctx.fillStyle = lightGrad;
        ctx.beginPath();
        ctx.moveTo(x + 12, y - 24);
        ctx.lineTo(x - 10, y);
        ctx.lineTo(x + 42, y);
        ctx.closePath();
        ctx.fill();
    }

    // ----------------------------------------------------
    // DETAILED RETRO JUKEBOX
    // ----------------------------------------------------

    drawJukebox(x, y, state = {}) {
        const ctx = this.ctx;
        const t = this.animTime;
        const isPowered = state.isPowered || false;
        const isPlaying = state.isPlaying || false;
        const isPaused = state.isPaused || false;
        const activeRecord = state.activeRecord || null;
        const audioMetrics = state.audioMetrics || { energy: 0, bass: 0, treble: 0 };

        // Prominent, rich tabletop retro audio station (~74px wide, 86px tall)
        const jbScale = 0.78;
        const jw = 86;
        const jh = 100;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(jbScale, jbScale);

        const jx = -jw * 0.5;
        const jy = -jh;

        // 1. Rich Mahogany Wooden Cabinet with Beveled Crown
        ctx.fillStyle = '#2b1206'; // deep dark wood
        ctx.beginPath();
        ctx.roundRect(jx - 2, jy - 2, jw + 4, jh + 4, [20, 20, 6, 6]);
        ctx.fill();

        // Main warm wood grain
        const woodGrad = ctx.createLinearGradient(jx, jy, jx + jw, jy + jh);
        woodGrad.addColorStop(0, '#53230c');
        woodGrad.addColorStop(0.3, '#3a1707');
        woodGrad.addColorStop(0.7, '#4a1e0a');
        woodGrad.addColorStop(1, '#2b1206');
        ctx.fillStyle = woodGrad;
        ctx.beginPath();
        ctx.roundRect(jx, jy, jw, jh, [18, 18, 5, 5]);
        ctx.fill();

        // Polished Brass / Gold Inlay Trim
        ctx.strokeStyle = '#e6b95c';
        ctx.lineWidth = 2.0;
        ctx.stroke();

        // Inner polished chassis
        ctx.fillStyle = '#0a0515';
        ctx.beginPath();
        ctx.roundRect(jx + 5, jy + 6, jw - 10, jh - 12, [14, 14, 3, 3]);
        ctx.fill();

        // 2. Dual Neon Arches (Cyan on left, Warm Coral on right) with Beat Pulse
        const energyGlow = (audioMetrics.energy || 0) * 0.6;
        const neonAlpha = isPowered ? (Math.sin(t * 3.5) * 0.15 + 0.85 + energyGlow) : 0.18;

        // Left Neon Tube (Electric Cyan)
        ctx.lineWidth = 3.2;
        ctx.strokeStyle = 'rgba(71, 216, 242, ' + neonAlpha + ')';
        ctx.beginPath();
        ctx.moveTo(jx + 8, jy + jh - 18);
        ctx.lineTo(jx + 8, jy + 26);
        ctx.quadraticCurveTo(jx + 12, jy + 10, jx + 24, jy + 7);
        ctx.stroke();

        // Right Neon Tube (Warm Coral/Pink)
        ctx.strokeStyle = 'rgba(242, 139, 189, ' + neonAlpha + ')';
        ctx.beginPath();
        ctx.moveTo(jx + jw - 8, jy + jh - 18);
        ctx.lineTo(jx + jw - 8, jy + 26);
        ctx.quadraticCurveTo(jx + jw - 12, jy + 10, jx + jw - 24, jy + 7);
        ctx.stroke();

        // 3. Illuminated Sol-3 Earth Emblem & Top Strobe
        ctx.fillStyle = '#e6b95c';
        ctx.beginPath();
        ctx.arc(jx + jw * 0.5, jy + 12, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#180a33';
        ctx.beginPath();
        ctx.arc(jx + jw * 0.5, jy + 12, 6, 0, Math.PI * 2);
        ctx.fill();

        // Mini Earth Continents in Emblem
        ctx.fillStyle = isPowered ? '#47d8f2' : '#32506d';
        ctx.beginPath();
        ctx.arc(jx + jw * 0.5 - 1, jy + 11, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isPowered ? '#62c98a' : '#2b4432';
        ctx.fillRect(jx + jw * 0.5 + 1, jy + 12, 3, 2);

        // 4. Large Curved Glass Dome Window
        const glassX = jx + 12;
        const glassY = jy + 22;
        const glassW = jw - 24;
        const glassH = 40;

        ctx.fillStyle = '#06030d';
        ctx.fillRect(glassX, glassY, glassW, glassH);
        ctx.strokeStyle = '#43295c';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(glassX, glassY, glassW, glassH);

        // Glowing Vacuum Tubes (Warm Filament Valves) in rear of glass
        if (isPowered) {
            const tubeX1 = glassX + 7;
            const tubeX2 = glassX + glassW - 12;
            const tubeY = glassY + 6;
            const filamentPulse = 0.75 + Math.sin(t * 7.0) * 0.15 + (audioMetrics.bass || 0) * 0.25;

            [tubeX1, tubeX2].forEach(tx => {
                // Glass valve cylinder
                ctx.fillStyle = 'rgba(255, 230, 180, 0.12)';
                ctx.strokeStyle = 'rgba(255, 200, 120, 0.4)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(tx, tubeY, 6, 14, [3, 3, 1, 1]);
                ctx.fill();
                ctx.stroke();

                // Orange glowing filament coil
                ctx.fillStyle = 'rgba(255, 140, 30, ' + filamentPulse + ')';
                ctx.fillRect(tx + 2, tubeY + 4, 2, 7);
                ctx.fillStyle = 'rgba(255, 240, 180, ' + filamentPulse + ')';
                ctx.fillRect(tx + 2.5, tubeY + 5, 1, 4);
            });
        }

        // Visible Large Spinning Vinyl Record
        const vCenter = { x: glassX + glassW * 0.5, y: glassY + glassH * 0.5 };
        const vRadius = 17;

        // Vinyl Disc Body
        const vinylGrad = ctx.createRadialGradient(vCenter.x, vCenter.y, 2, vCenter.x, vCenter.y, vRadius);
        vinylGrad.addColorStop(0, '#1c1c22');
        vinylGrad.addColorStop(0.5, '#0c0c10');
        vinylGrad.addColorStop(1, '#050508');
        ctx.fillStyle = vinylGrad;
        ctx.beginPath();
        ctx.arc(vCenter.x, vCenter.y, vRadius, 0, Math.PI * 2);
        ctx.fill();

        // Realistic Sound Grooves (Concentric Sheen Rings)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(vCenter.x, vCenter.y, vRadius - 3, 0, Math.PI * 2);
        ctx.arc(vCenter.x, vCenter.y, vRadius - 6, 0, Math.PI * 2);
        ctx.arc(vCenter.x, vCenter.y, vRadius - 9, 0, Math.PI * 2);
        ctx.stroke();

        // Center Record Label (Color matches active record)
        let labelColor = '#47d8f2';
        if (activeRecord === 'forest') labelColor = '#62c98a';
        else if (activeRecord === 'ocean') labelColor = '#47d8f2';
        else if (activeRecord === 'atmosphere') labelColor = '#f28bbd';
        else if (activeRecord === 'earth') labelColor = '#ffca72';

        ctx.fillStyle = labelColor;
        ctx.beginPath();
        ctx.arc(vCenter.x, vCenter.y, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#06020c';
        ctx.beginPath();
        ctx.arc(vCenter.x, vCenter.y, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Spinning Strobe Dots & Vinyl Needle
        if (isPlaying && !isPaused) {
            const rotAngle = (t * 8.5) % (Math.PI * 2);

            // 4 Radial strobe dots for clear rotation
            for (let d = 0; d < 4; d++) {
                const a = rotAngle + (d * Math.PI / 2);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(vCenter.x + Math.cos(a) * 11, vCenter.y + Math.sin(a) * 11, 1.8, 1.8);
            }

            // Light sheen gleam rotating across record
            ctx.save();
            ctx.beginPath();
            ctx.arc(vCenter.x, vCenter.y, vRadius, rotAngle, rotAngle + 0.35);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();
        }

        // Precision Polished Brass Tonearm with Stylus
        ctx.strokeStyle = '#e6b95c';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(glassX + glassW - 5, glassY + 5);
        ctx.lineTo(glassX + glassW - 9, glassY + 15);
        if (isPlaying && !isPaused) {
            ctx.lineTo(vCenter.x + 8, vCenter.y + 2); // Stylus riding the groove
        } else {
            ctx.lineTo(glassX + glassW - 7, glassY + 28); // Parked tonearm
        }
        ctx.stroke();

        // Glass Specular Glare Reflection Line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(glassX + 4, glassY + glassH - 4);
        ctx.lineTo(glassX + 22, glassY + 4);
        ctx.stroke();

        // 5. Digital Marquee Display (Active Record Title / Status)
        const dispX = jx + 12;
        const dispY = jy + 64;
        const dispW = jw - 24;
        const dispH = 11;

        ctx.fillStyle = '#040208';
        ctx.fillRect(dispX, dispY, dispW, dispH);
        ctx.strokeStyle = '#38204d';
        ctx.lineWidth = 1;
        ctx.strokeRect(dispX, dispY, dispW, dispH);

        if (isPowered) {
            ctx.fillStyle = isPlaying ? labelColor : '#62a5b8';
            ctx.font = 'bold 6.5px "Courier New", monospace';
            ctx.textAlign = 'center';

            let displayText = 'EARTH ARCHIVE';
            if (isPlaying) {
                if (activeRecord === 'forest') displayText = '★ 003 FOREST ★';
                else if (activeRecord === 'ocean') displayText = '★ 002 OCEAN ★';
                else if (activeRecord === 'atmosphere') displayText = '★ 001 ATMOSPHERE ★';
                else if (activeRecord === 'earth') displayText = '★ 004 EARTH ★';
            } else if (isPaused) {
                displayText = '[ PAUSED ]';
            } else {
                displayText = '[ READY ]';
            }
            ctx.fillText(displayText, dispX + dispW * 0.5, dispY + 8);
        }

        // 6. Dual Backlit Analog VU Meters (Left & Right Channel)
        const vuY = jy + 78;
        const vuW = 26;
        const vuH = 9;

        // Left VU Meter
        [jx + 12, jx + jw - 38].forEach((vx, vIdx) => {
            // Warm amber backlit dial
            ctx.fillStyle = isPowered ? '#33230a' : '#141008';
            ctx.fillRect(vx, vuY, vuW, vuH);
            ctx.strokeStyle = '#664a14';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(vx, vuY, vuW, vuH);

            // Dial scale arc
            ctx.strokeStyle = isPowered ? 'rgba(255, 200, 100, 0.6)' : '#332810';
            ctx.beginPath();
            ctx.arc(vx + vuW * 0.5, vuY + vuH + 4, 10, -Math.PI * 0.8, -Math.PI * 0.2);
            ctx.stroke();

            // VU Needle bouncing to sound energy
            const channelEnergy = (vIdx === 0) ? (audioMetrics.energy || 0) : (audioMetrics.bass || 0);
            const needleAngle = isPlaying ? (-Math.PI * 0.68 + channelEnergy * 0.75 + Math.sin(t * 12 + vIdx) * 0.08) : -Math.PI * 0.68;

            ctx.strokeStyle = '#ff3344'; // Red meter needle
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(vx + vuW * 0.5, vuY + vuH);
            ctx.lineTo(vx + vuW * 0.5 + Math.cos(needleAngle) * 9, vuY + vuH + Math.sin(needleAngle) * 9);
            ctx.stroke();
        });

        // Center Heavy Brass Volume / Tone Knob
        const knobX = jx + jw * 0.5;
        const knobY = vuY + 4;
        ctx.fillStyle = '#e6b95c';
        ctx.beginPath();
        ctx.arc(knobX, knobY, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3a1707';
        ctx.beginPath();
        ctx.arc(knobX, knobY, 2.0, 0, Math.PI * 2);
        ctx.fill();

        // 7. Dynamic 8-Band LED Spectrum Visualizer along Speaker Grille
        const spkY = jy + 90;
        const numBands = 8;
        const bandW = 6;
        const startBx = jx + 13;

        for (let b = 0; b < numBands; b++) {
            const bx = startBx + b * 7.5;
            const barEnergy = isPlaying ? Math.min(1.0, (audioMetrics.energy || 0.2) * (0.8 + Math.sin(t * 14 + b * 0.8) * 0.4)) : 0.05;
            const barH = Math.max(1, Math.floor(barEnergy * 6));

            // Green to Amber LED stack
            ctx.fillStyle = isPowered ? (b >= 6 ? '#ff4d6d' : (b >= 4 ? '#ffca72' : '#62c98a')) : '#221133';
            ctx.fillRect(bx, spkY + (6 - barH), bandW, barH);
        }

        ctx.restore();

        // 8. Holographic Projection Above Jukebox if record is playing
        if (isPlaying && !isPaused && activeRecord) {
            this.drawRecordHologram(x, y - jh * jbScale, activeRecord, audioMetrics);
        }
    }


    // Dynamic Visual Holograms Above Jukebox for each record
    drawRecordHologram(x, y, recordKey, audioMetrics) {
        const ctx = this.ctx;
        const t = this.animTime;
        const energy = audioMetrics ? audioMetrics.energy : 0.5;

        // Spawn ambient particles
        if (Math.random() < 0.4) {
            let pColor = this.palette.earthGreen;
            if (recordKey === 'ocean') pColor = this.palette.electricBlue;
            else if (recordKey === 'atmosphere') pColor = this.palette.softPink;
            else if (recordKey === 'earth') pColor = this.palette.warmGold;

            this.spawnParticle(
                x + (Math.random() * 50 - 25),
                y - 10 + (Math.random() * 30 - 15),
                (Math.random() * 0.6 - 0.3),
                -0.6 - Math.random() * 0.8,
                pColor,
                1.4,
                2
            );
        }

        if (recordKey === 'forest') {
            // Earth Archive Record 003: NASA GEDI Lidar Canopy Architecture & Forest Soundscape
            const hx = x;
            const hy = y - 35;

            let forestMetrics = null;
            if (window.forestSonification) {
                forestMetrics = window.forestSonification.getMetrics();
            }

            const liveEnergy = (forestMetrics && forestMetrics.energy > 0) ? forestMetrics.energy : energy;
            const canopyHeight = (forestMetrics && forestMetrics.canopyHeight != null) ? forestMetrics.canopyHeight : 45.0;
            const canopyCover = (forestMetrics && forestMetrics.canopyCover != null) ? forestMetrics.canopyCover : 0.85;
            const fhd = (forestMetrics && forestMetrics.fhd != null) ? forestMetrics.fhd : 3.2;
            const note = (forestMetrics && forestMetrics.currentNote) ? forestMetrics.currentNote : 'F4';
            const soundscape = forestMetrics ? forestMetrics.soundscape : null;
            const isBirdActive = soundscape && (performance.now() - soundscape.lastBirdChirpTime < 1800);

            // 1. Emerald Canopy Halo Glow
            const haloR = 26 + liveEnergy * 18;
            const haloGrad = ctx.createRadialGradient(hx, hy, 4, hx, hy, haloR);
            haloGrad.addColorStop(0, `rgba(98, 201, 138, ${0.45 + liveEnergy * 0.4})`);
            haloGrad.addColorStop(0.6, `rgba(71, 216, 242, ${0.2 + liveEnergy * 0.25})`);
            haloGrad.addColorStop(1, 'rgba(38, 19, 77, 0)');
            ctx.fillStyle = haloGrad;
            ctx.beginPath();
            ctx.arc(hx, hy, haloR, 0, Math.PI * 2);
            ctx.fill();

            // 2. NASA GEDI Vertical Lidar Waveform Profile (Laser return amplitude curve)
            ctx.strokeStyle = '#47d8f2';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const waveBaseX = hx - 38;
            const waveBaseY = hy + 18;
            const waveHeight = 36;
            ctx.moveTo(waveBaseX, waveBaseY);
            for (let s = 0; s <= 20; s++) {
                const sy = waveBaseY - (s / 20) * waveHeight;
                const groundPeak = Math.exp(-Math.pow(s - 2, 2) / 3) * 12;
                const crownPeak = Math.exp(-Math.pow(s - 16, 2) / 5) * (14 + canopyCover * 8);
                const noise = Math.sin(t * 8 + s) * (liveEnergy * 2);
                const sx = waveBaseX + groundPeak + crownPeak + noise;
                ctx.lineTo(sx, sy);
            }
            ctx.stroke();

            // Lidar laser beam line
            ctx.strokeStyle = 'rgba(71, 216, 242, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 3]);
            ctx.beginPath();
            ctx.moveTo(waveBaseX, waveBaseY);
            ctx.lineTo(waveBaseX, waveBaseY - waveHeight);
            ctx.stroke();
            ctx.setLineDash([]);

            // 3. Mini 3D Swaying Pixel Trees
            const treeOffsets = [-16, 0, 16];
            treeOffsets.forEach((ox, idx) => {
                const tx = hx + ox;
                const normH = Math.max(16, Math.min(32, (canopyHeight / 70) * 32 - Math.abs(idx) * 3));
                const sway = Math.sin(t * 3.5 + idx) * (2 + liveEnergy * 3);

                // Trunk
                ctx.strokeStyle = '#a67c52';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(tx, hy + 18);
                ctx.lineTo(tx + sway * 0.4, hy + 18 - normH * 0.45);
                ctx.stroke();

                // Foliage crown
                ctx.fillStyle = (idx === 0) ? '#62c98a' : ((idx === 1) ? '#45b370' : '#7fe39e');
                ctx.beginPath();
                ctx.arc(tx + sway, hy + 18 - normH, 6 + (canopyCover * 3), 0, Math.PI * 2);
                ctx.fill();
            });

            // 4. Fluttering Bird Hologram
            const bx = hx + Math.sin(t * 1.8) * 32;
            const by = hy - 26 + Math.cos(t * 2.2) * 8;
            const wingSpread = isBirdActive ? Math.sin(t * 28) * 4 : 2;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(bx - 5, by - wingSpread);
            ctx.lineTo(bx, by);
            ctx.lineTo(bx + 5, by - wingSpread);
            ctx.stroke();

            // 5. NASA GEDI Live Telemetry Annotation
            ctx.fillStyle = '#ffca72';
            ctx.font = '5px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`GEDI RH100: ${canopyHeight.toFixed(1)}m | PAI: ${fhd.toFixed(1)} | NOTE: ${note}`, hx, hy + 27);

        } else if (recordKey === 'ocean') {
            // Record 002: NASA ECCO Ocean Data Sonification & SVS 3912 Current Flows
            const hx = x;
            const hy = y - 35;

            // Fetch live Tone.js ocean metrics if available
            let oceanMetrics = null;
            if (window.oceanSonification) {
                oceanMetrics = window.oceanSonification.getMetrics();
            }

            const liveEnergy = (oceanMetrics && oceanMetrics.energy > 0) ? oceanMetrics.energy : energy;
            const liveTemp = (oceanMetrics && oceanMetrics.temperature != null) ? oceanMetrics.temperature : 21.0;
            const tempNorm = (oceanMetrics && oceanMetrics.tempNorm != null) ? oceanMetrics.tempNorm : 0.65;
            const liveSpeed = (oceanMetrics && oceanMetrics.currentSpeed != null) ? oceanMetrics.currentSpeed : 0.45;
            const isLandMask = oceanMetrics && oceanMetrics.isLandMask;

            // 1. Temperature-Responsive Ocean Halo (Cold deep blue vs warm cyan/gold)
            const haloR = 24 + liveEnergy * 16;
            const haloGrad = ctx.createRadialGradient(hx, hy, 4, hx, hy, haloR);
            if (isLandMask) {
                haloGrad.addColorStop(0, 'rgba(126, 115, 153, 0.4)');
                haloGrad.addColorStop(1, 'rgba(38, 19, 77, 0)');
            } else if (tempNorm > 0.6) {
                // Warm Gulf Stream Core: Vibrant cyan with golden shimmer
                haloGrad.addColorStop(0, `rgba(71, 216, 242, ${0.4 + liveEnergy * 0.4})`);
                haloGrad.addColorStop(0.6, `rgba(255, 202, 114, ${0.2 + liveEnergy * 0.25})`);
                haloGrad.addColorStop(1, 'rgba(38, 19, 77, 0)');
            } else {
                // Cold Subpolar Water: Deep oceanic indigo & teal
                haloGrad.addColorStop(0, `rgba(30, 136, 229, ${0.35 + liveEnergy * 0.35})`);
                haloGrad.addColorStop(0.7, `rgba(49, 151, 149, ${0.15 + liveEnergy * 0.2})`);
                haloGrad.addColorStop(1, 'rgba(38, 19, 77, 0)');
            }
            ctx.fillStyle = haloGrad;
            ctx.beginPath();
            ctx.arc(hx, hy, haloR, 0, Math.PI * 2);
            ctx.fill();

            // 2. NASA SVS 3912 Surface Current Streamlines (Flow vectors)
            ctx.lineWidth = 1.2;
            const streamCount = 4;
            const flowSpeed = (0.5 + liveSpeed * 1.5) * (0.8 + liveEnergy * 1.2);

            for (let s = 0; s < streamCount; s++) {
                const streamY = hy - 14 + s * 9;
                const streamOffset = (t * flowSpeed * 35 + s * 22) % 76;
                const sxStart = hx - 38 + streamOffset;

                // Color lines by thermal gradient
                ctx.strokeStyle = (tempNorm > 0.5) ? 'rgba(71, 216, 242, 0.65)' : 'rgba(98, 201, 138, 0.6)';
                ctx.beginPath();
                ctx.moveTo(sxStart, streamY + Math.sin(sxStart * 0.15 + t * 2) * 2);
                ctx.lineTo(sxStart + 16, streamY + Math.sin((sxStart + 16) * 0.15 + t * 2) * 2);
                ctx.stroke();

                // Stream vector arrow tip
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(Math.floor(sxStart + 16), Math.floor(streamY + Math.sin((sxStart + 16) * 0.15 + t * 2) * 2) - 1, 2, 2);
            }

            // 3. Audio-Reactive Ocean Wave Crests
            // Quiter notes = calm gentle ripples; stronger notes = surging wave crests
            const waveHeightFactor = 4 + liveEnergy * 18;
            ctx.strokeStyle = this.palette.electricBlue;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(hx - 36, hy + 8);

            for (let ox = -36; ox <= 36; ox += 4) {
                const wY = hy + 8 + Math.sin(t * 4.5 + ox * 0.18) * waveHeightFactor;
                ctx.lineTo(hx + ox, wY);
            }
            ctx.stroke();

            // Secondary wave undercurrent
            ctx.strokeStyle = 'rgba(71, 216, 242, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(hx - 36, hy + 12);
            for (let ox = -36; ox <= 36; ox += 4) {
                const wY = hy + 12 + Math.cos(t * 3.5 + ox * 0.22) * (waveHeightFactor * 0.6);
                ctx.lineTo(hx + ox, wY);
            }
            ctx.stroke();

            // 4. Buoyant Salinity Bubbles & Water Spray (scales with audio amplitude)
            const sprayCount = 3 + Math.floor(liveEnergy * 5);
            ctx.fillStyle = '#b3f7ff';
            for (let i = 0; i < sprayCount; i++) {
                const sx = hx + Math.sin(t * 4 + i * 2.3) * (18 + liveEnergy * 14);
                const sy = hy - ((t * 30 + i * 14) % (28 + liveEnergy * 15));
                const pSize = (i % 2 === 0) ? 2 : 1;
                ctx.fillRect(Math.floor(sx), Math.floor(sy), pSize, pSize);
            }

            // 5. Land / Reef Mask Warning Indicator
            if (isLandMask) {
                ctx.fillStyle = this.palette.warmGold;
                ctx.font = '6px "Courier New", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('▲ REEF / LAND MASK', hx, hy - 22);
            } else if (oceanMetrics && oceanMetrics.note && oceanMetrics.note !== '—') {
                // Real-time musical note readout floating in hologram
                ctx.fillStyle = '#ffffff';
                ctx.font = '7px "Courier New", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`♪ ${oceanMetrics.note} (${liveTemp.toFixed(1)}°C)`, hx, hy - 22);
            }

        } else if (recordKey === 'atmosphere') {
            // Record 003: Purple swirling clouds & rain streaks
            const hx = x;
            const hy = y - 40;

            const cloudPulse = Math.sin(t * 2) * 3;
            ctx.fillStyle = 'rgba(140, 82, 255, 0.45)';
            ctx.beginPath();
            ctx.ellipse(hx, hy, 32 + cloudPulse, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            // Rain streaks
            ctx.strokeStyle = this.palette.electricBlue;
            ctx.lineWidth = 1;
            for (let i = -3; i <= 3; i++) {
                const rx = hx + i * 8;
                const ry = hy + 8 + ((t * 40 + i * 12) % 24);
                ctx.beginPath();
                ctx.moveTo(rx, ry);
                ctx.lineTo(rx - 1, ry + 4);
                ctx.stroke();
            }

        } else if (recordKey === 'earth') {
            // Record 004: Spinning complete pixel Earth with orbiting particles
            const hx = x;
            const hy = y - 45;
            this.drawPixelEarthHologram(hx, hy, 24);

            // Orbiting golden stardust rings
            ctx.save();
            ctx.translate(hx, hy);
            ctx.rotate(t * 1.2);
            ctx.strokeStyle = 'rgba(255, 202, 114, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(0, 0, 38, 12, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    // ----------------------------------------------------
    // CHARACTERS: ELI, KORU, THE LITTLE ONES
    // ----------------------------------------------------

    // Ryan (Eli) — Human Teacher & Astronaut with full custom sprite animation
    drawEli(x, y, state = 'idle', facing = 1, isCarrying = false, isSpeaking = false, isAstronautSuit = false) {
        const ctx = this.ctx;
        const t = this.animTime;

        ctx.save();
        ctx.translate(x, y);
        if (facing < 0) {
            ctx.scale(-1, 1);
        }

        // 1. In regular gameplay (Scenes 1-6), render Ryan with his custom clothes & hair sprites!
        if (!isAstronautSuit && this.ryanSprites) {
            let spriteImg = null;
            if (state === 'walk') {
                // 6-frame walking cycle (Row 2)
                const f = Math.floor(t * 10) % 6;
                spriteImg = this.ryanSprites.walk[f];
            } else if (state === 'hands' || state === 'gesture') {
                // 4-frame clapping / gesturing / teaching cycle (Row 3)
                const f = Math.floor(t * 5) % 4;
                spriteImg = this.ryanSprites.hands[f];
            } else if (isSpeaking || state === 'talk') {
                // 6-frame talking / listening / touching glasses cycle (Row 1)
                const f = Math.floor(t * 5) % 6;
                spriteImg = this.ryanSprites.talk[f];
            } else {
                // Idle breathing pose (Row 1, Frame 0 & 2)
                const f = (Math.sin(t * 2.2) > 0.5) ? 2 : 0;
                spriteImg = this.ryanSprites.talk[f];
            }

            if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
                // Scale Ryan to ~82px tall (adult human height, visibly larger than jukebox at ~51px)
                const baseScale = 82.0 / 234.0;
                const w = spriteImg.naturalWidth * baseScale;
                const h = spriteImg.naturalHeight * baseScale;
                const bob = (state === 'walk') ? Math.abs(Math.sin(t * 10)) * 1.5 : Math.sin(t * 2.2) * 0.7;
                const kneelOffset = (state === 'kneel') ? 16 : 0;

                ctx.drawImage(spriteImg, -w / 2, -h - bob + kneelOffset, w, h);

                // If carrying the retro jukebox
                if (isCarrying) {
                    ctx.save();
                    const jx = 10;
                    const jy = -48 - bob;
                    ctx.fillStyle = '#663b14';
                    ctx.fillRect(jx, jy, 26, 30);
                    ctx.fillStyle = '#ffd15c';
                    ctx.fillRect(jx + 3, jy + 3, 20, 8);
                    ctx.fillStyle = '#47d8f2';
                    ctx.fillRect(jx + 6, jy + 14, 14, 6);
                    ctx.restore();
                }

                ctx.restore();
                return;
            }
        }

        // 2. White Astronaut EVA Suit (Used at Earth Arrival in Scene 7 / Credits)
        // Scaled to match Ryan's 82px height
        const astroScale = 82.0 / 48.0;
        ctx.scale(astroScale, astroScale);
        let walkOffset = 0;
        let legL = 0;
        let legR = 0;

        if (state === 'walk') {
            walkOffset = Math.sin(t * 12) * 1.5;
            legL = Math.sin(t * 12) * 5;
            legR = -Math.sin(t * 12) * 5;
        } else if (state === 'kneel') {
            walkOffset = 8;
        }

        const by = -walkOffset;

        // Life support backpack
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-11, by - 36, 7, 22);
        ctx.fillStyle = '#47d8f2';
        ctx.fillRect(-10, by - 32, 5, 2);

        // Legs
        if (state === 'kneel') {
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(-5, by - 12, 14, 6);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(4, by - 6, 8, 6);
        } else {
            // Left leg
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(-6 + legL * 0.4, by - 14, 5, 12);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-7 + legL * 0.4, by - 3, 7, 4);

            // Right leg
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(1 + legR * 0.4, by - 14, 5, 12);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0 + legR * 0.4, by - 3, 7, 4);
        }

        // White Thermal Astronaut Suit Body
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-6, by - 34, 14, 20);
        // Chest mission patch (Blue Earth)
        ctx.fillStyle = this.palette.electricBlue;
        ctx.fillRect(-1, by - 30, 4, 4);

        // Arms
        if (isCarrying) {
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(4, by - 28, 12, 5);
            ctx.fillRect(12, by - 26, 4, 8);
            ctx.fillStyle = '#663b14';
            ctx.fillRect(14, by - 32, 14, 16);
            ctx.fillStyle = '#ffd15c';
            ctx.fillRect(15, by - 31, 12, 3);
        } else if (state === 'kneel') {
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(4, by - 26, 8, 14);
        } else {
            ctx.fillStyle = '#e2e8f0';
            const armSwing = (state === 'walk') ? -legL * 0.6 : 0;
            // Hand gesturing towards dome
            ctx.fillRect(-2 + armSwing, by - 32, 4, 14);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(-2 + armSwing, by - 19, 4, 4); // Glove
        }

        // Helmet & Visor
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(-7, by - 48, 16, 15, 5);
        ctx.fill();

        // Glowing Golden Visor reflecting the dome & snow
        ctx.fillStyle = this.palette.warmGold;
        ctx.beginPath();
        ctx.roundRect(0, by - 45, 8, 9, 3);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(1, by - 44, 2, 4);

        ctx.restore();
    }

    // Thought Bubble above Eli's Astronaut Helmet (Interactive Zoom-In Memory Portal)
    drawThoughtBubble(x, y, activeRecord, isPlaying) {
        if (!activeRecord) return;
        const ctx = this.ctx;
        const t = this.animTime;

        ctx.save();
        // Gentle vertical floating motion
        const floatY = Math.sin(t * 2.2) * 4;
        const bx = x + 35;
        const by = y - 105 + floatY;

        // 1. Rising connecting thought bubbles from helmet
        const bubbles = [
            { x: x + 8, y: y - 52, r: 3.5 },
            { x: x + 18, y: y - 66, r: 5.5 },
            { x: x + 26, y: y - 82, r: 7.5 }
        ];

        ctx.fillStyle = 'rgba(215, 240, 255, 0.75)';
        ctx.strokeStyle = '#a4e6ff';
        ctx.lineWidth = 1.2;

        bubbles.forEach((b, idx) => {
            const bWobble = Math.sin(t * 3.0 + idx) * 1.5;
            ctx.beginPath();
            ctx.arc(b.x + bWobble, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

        // 2. Large Cloud-like Thought Bubble
        const bw = 124;
        const bh = 72;

        // Cloud body shadow & dream glow
        ctx.shadowColor = 'rgba(164, 230, 255, 0.7)';
        ctx.shadowBlur = 14;

        ctx.fillStyle = 'rgba(12, 18, 38, 0.90)';
        ctx.strokeStyle = '#8ee0ff';
        ctx.lineWidth = 2.0;

        // Draw cloud rounded container
        ctx.beginPath();
        ctx.roundRect(bx - bw / 2, by - bh / 2, bw, bh, 14);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0; // reset shadow

        // 3. Mini Animated Earth Memory Preview inside thought bubble (Photorealistic HD Preview)
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(bx - bw / 2 + 3, by - bh / 2 + 3, bw - 6, bh - 6, 11);
        ctx.clip();

        const previewImg = this.thoughtImages ? this.thoughtImages[activeRecord] : null;
        let drawnHD = false;
        if (previewImg && previewImg.complete && previewImg.naturalWidth > 0) {
            // High-definition photorealistic render with subtle slow-motion drift
            const panX = Math.cos(t * 0.45) * 8;
            const panY = Math.sin(t * 0.35) * 5;
            const zoom = 1.10 + Math.sin(t * 0.5) * 0.04;
            const drawW = (bw - 6) * zoom;
            const drawH = (bh - 6) * zoom;
            const drawX = bx - bw / 2 + 3 + ((bw - 6) - drawW) / 2 + panX;
            const drawY = by - bh / 2 + 3 + ((bh - 6) - drawH) / 2 + panY;

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(previewImg, drawX, drawY, drawW, drawH);

            // Dreamy atmospheric sheen overlay
            const sheen = ctx.createLinearGradient(bx - bw / 2, by - bh / 2, bx + bw / 2, by + bh / 2);
            sheen.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
            sheen.addColorStop(0.5, 'rgba(120, 240, 255, 0.04)');
            sheen.addColorStop(1, 'rgba(0, 0, 0, 0.40)');
            ctx.fillStyle = sheen;
            ctx.fillRect(bx - bw / 2 + 3, by - bh / 2 + 3, bw - 6, bh - 6);
            drawnHD = true;
        }

        if (!drawnHD) {
            if (activeRecord === 'forest') {
                ctx.fillStyle = '#0e2b1f';
                ctx.fillRect(bx - bw / 2, by - bh / 2, bw, bh);
                ctx.fillStyle = 'rgba(255, 240, 160, 0.28)';
                ctx.beginPath();
                ctx.moveTo(bx + 35, by - bh / 2);
                ctx.lineTo(bx - 30, by + bh / 2);
                ctx.lineTo(bx - 8, by + bh / 2);
                ctx.lineTo(bx + 52, by - bh / 2);
                ctx.fill();
            } else if (activeRecord === 'ocean') {
                ctx.fillStyle = '#0a2238';
                ctx.fillRect(bx - bw / 2, by - bh / 2, bw, bh);
            } else {
                ctx.fillStyle = '#101d28';
                ctx.fillRect(bx - bw / 2, by - bh / 2, bw, bh);
            }
        }
        ctx.restore();

        // 4. Memory Callout Label with High-Contrast Background Pill
        const pillW = 118;
        const pillH = 22;
        ctx.fillStyle = 'rgba(10, 14, 28, 0.88)';
        ctx.strokeStyle = '#78f0ff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(bx - pillW / 2, by + 12, pillW, pillH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffe8ff';
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💭 MEMORY OF EARTH', bx, by + 21);
        ctx.fillStyle = '#78f0ff';
        ctx.font = 'bold 6.5px monospace';
        ctx.fillText('[ENTER / CLICK TO ZOOM]', bx, by + 30);

        ctx.restore();
    }


    // Rocky (Koru) — The Alien Friend with full sprite animation (Walk, Talk, Moving Hands)
    drawKoru(x, y, state = 'idle', facing = 1, isSpeaking = false) {
        const ctx = this.ctx;
        const t = this.animTime;

        ctx.save();
        ctx.translate(x, y);
        if (facing < 0) {
            ctx.scale(-1, 1);
        }

        // 1. Try rendering from real Rocky character sprite frames
        let spriteImg = null;
        if (this.rockySprites) {
            if (state === 'walk') {
                // 4-frame walking cycle (Row 1)
                const f = Math.floor(t * 8) % 4;
                spriteImg = this.rockySprites.walk[f];
            } else if (state === 'gesture' || state === 'hands') {
                // 3-frame moving hands & gesturing cycle (Row 3)
                const f = Math.floor(t * 5) % 3;
                spriteImg = this.rockySprites.hands[f];
            } else if (isSpeaking || state === 'talk') {
                // 3-frame talking / gesturing cycle (Row 2)
                const f = Math.floor(t * 6) % 3;
                spriteImg = this.rockySprites.talk[f];
            } else {
                // Idle breathing pose (Row 2, Frame 0 & 1 subtle breathing)
                const f = (Math.sin(t * 2.5) > 0.55) ? 1 : 0;
                spriteImg = this.rockySprites.talk[f];
            }
        }

        if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
            // Scale sprite to fit the game environment (base body height ~58px, bigger and more prominent, while appropriately smaller than Ryan at ~82px)
            const baseScale = 58.0 / 375.0;
            const w = spriteImg.naturalWidth * baseScale;
            const h = spriteImg.naturalHeight * baseScale;

            // Subtle bounce while walking or breathing
            const bob = (state === 'walk') ? Math.abs(Math.sin(t * 10)) * 1.6 : Math.sin(t * 2.5) * 0.8;

            ctx.drawImage(spriteImg, -w / 2, -h - bob, w, h);
            ctx.restore();
            return;
        }

        // 2. Procedural Fallback (while image assets are loading)
        const procScale = 58.0 / 36.0;
        ctx.scale(procScale, procScale);
        let bob = Math.sin(t * 3.5) * 1.5;
        let legL = 0;
        let legR = 0;

        if (state === 'walk') {
            legL = Math.sin(t * 10) * 4;
            legR = -Math.sin(t * 10) * 4;
            bob = Math.abs(Math.sin(t * 10)) * 2;
        }

        const ky = -bob;

        // Rock-like legs
        ctx.fillStyle = this.palette.rockGray;
        ctx.fillRect(-6 + legL * 0.5, ky - 8, 6, 8);
        ctx.fillRect(2 + legR * 0.5, ky - 8, 6, 8);

        // Rocky Rounded Body
        ctx.fillStyle = '#61537a';
        ctx.beginPath();
        ctx.roundRect(-10, ky - 36, 22, 28, [10, 10, 4, 4]);
        ctx.fill();

        // Crystalline rocky highlights / texture
        ctx.fillStyle = this.palette.rockHighlight;
        ctx.fillRect(-7, ky - 32, 6, 4);
        ctx.fillRect(4, ky - 28, 5, 6);
        ctx.fillRect(-4, ky - 18, 8, 4);

        // Small moss / lichen sprout on head (symbolizing warmth)
        ctx.fillStyle = this.palette.earthGreen;
        ctx.fillRect(-2, ky - 39, 4, 4);

        // Large Expressive Glowing Eyes
        const eyeBlink = (Math.sin(t * 0.8) > 0.96) ? 1 : 4;
        ctx.fillStyle = this.palette.electricBlue;
        ctx.beginPath();
        ctx.roundRect(0, ky - 28, 4, eyeBlink, 1);
        ctx.roundRect(6, ky - 28, 4, eyeBlink, 1);
        ctx.fill();

        // Eye pupils / glow dots
        if (eyeBlink > 2) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(1, ky - 27, 2, 2);
            ctx.fillRect(7, ky - 27, 2, 2);
        }

        // Friendly arm / gesturing
        ctx.fillStyle = '#61537a';
        if (state === 'gesture') {
            ctx.fillRect(8, ky - 28, 10, 4);
            ctx.fillRect(15, ky - 34, 4, 8);
        } else {
            ctx.fillRect(-4, ky - 22, 4, 10);
            ctx.fillRect(10, ky - 22, 4, 10);
        }

        ctx.restore();
    }

    // ----------------------------------------------------
    // ERIDIAN STUDENTS ("THE LITTLE ONES") — MATCHING MOVIE STILL
    // ----------------------------------------------------

    // Stepped hexagonal basalt stone pillars (matches classroom setting in reference photo!)
    drawBasaltPillars() {
        const ctx = this.ctx;
        const pillars = [
            { x: 135, y: this.height * 0.74, w: 34, h: 22 },
            { x: 195, y: this.height * 0.74, w: 36, h: 14 },
            { x: 255, y: this.height * 0.74, w: 34, h: 18 },
            { x: 315, y: this.height * 0.74, w: 38, h: 28 }
        ];

        pillars.forEach((p, idx) => {
            const topY = p.y - p.h;

            // 3D Hexagonal Basalt Column Body (dark volcanic stone)
            ctx.fillStyle = (idx % 2 === 0) ? '#241c30' : '#2d233c';
            ctx.fillRect(p.x - p.w * 0.5, topY, p.w, p.h + 8);

            // Shaded vertical facets
            ctx.fillStyle = '#171221';
            ctx.fillRect(p.x - p.w * 0.5, topY, p.w * 0.3, p.h + 8);
            ctx.fillStyle = '#3a2e4d';
            ctx.fillRect(p.x + p.w * 0.2, topY, p.w * 0.3, p.h + 8);

            // Flat stepped stone cap
            ctx.fillStyle = '#4c3f66';
            ctx.beginPath();
            ctx.ellipse(p.x, topY, p.w * 0.5, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#655487';
            ctx.beginPath();
            ctx.ellipse(p.x, topY - 1, p.w * 0.42, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Edge bevel stroke
            ctx.strokeStyle = '#7c68a4';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }

    drawLittleOnes(time) {
        const t = this.animTime;

        // 1. Draw the stepped basalt classroom pillars first
        this.drawBasaltPillars();

        // 2. The Little Eridians perched on their pillars:
        // Student 1 (Left pillar, h=22): Dark Slate / Obsidian Eridian (rock stacking)
        this.drawEridianStudent(135, this.height * 0.74 - 22, 2, 0);

        // Student 2 (Center-low pillar, h=14): Ochre & Jade Eridian (attentive front center)
        const tap = Math.sin(t * 6) * 1.5;
        this.drawEridianStudent(195, this.height * 0.74 - 14, 1, tap);

        // Student 3 (Mid pillar, h=18): Turquoise / Azure Eridian (playful, leaping/bouncing in the air!)
        const leap = Math.abs(Math.sin(t * 4)) * 10;
        this.drawEridianStudent(255, this.height * 0.74 - 18, 3, leap);

        // Student 4 (Right high tier, h=28): Copper & Rust Ore Eridian (humming / purring)
        this.drawEridianStudent(315, this.height * 0.74 - 28, 4, Math.sin(t * 3) * 1.0);
    }

    // Young Eridian Student with articulated 5 rock legs & faceted carapace
    drawEridianStudent(x, y, type = 1, bounce = 0) {
        const ctx = this.ctx;
        const t = this.animTime;
        const sy = y - bounce;

        // Color palettes from movie reference still:
        // 1: Ochre & Jade (Front center)
        // 2: Dark Slate & Obsidian (Left)
        // 3: Turquoise & Azure (Playful leaping/bouncing)
        // 4: Copper & Rust Ore (High tier right)
        let cBody, cHighlight, cShadow, cJoint;

        if (type === 1) {
            cBody = '#bfa168';
            cHighlight = '#8cae82'; // jade/lichen accent
            cShadow = '#78623b';
            cJoint = '#5e8555';
        } else if (type === 2) {
            cBody = '#464052';
            cHighlight = '#6a627a';
            cShadow = '#2b2733';
            cJoint = '#7a728c';
        } else if (type === 3) {
            cBody = '#2f8296';
            cHighlight = '#56cbe0'; // luminous turquoise
            cShadow = '#1a5261';
            cJoint = '#7be8fa';
        } else {
            cBody = '#944b38';
            cHighlight = '#bf6a54'; // copper sheen
            cShadow = '#5c2b1e';
            cJoint = '#d68874';
        }

        ctx.save();
        ctx.translate(x, sy);

        // Subtle leg wiggle / breathing
        const legWiggle = Math.sin(t * 4 + type * 1.5) * 1.2;
        const leapSpread = (type === 3 && bounce > 2) ? 3.5 : 0;

        // 1. Five articulated rock legs (spider/crab-like anatomy matching Rocky and movie still)
        ctx.lineWidth = 2.2;

        // Far-left leg
        ctx.strokeStyle = cShadow;
        ctx.beginPath();
        ctx.moveTo(-5, -12);
        ctx.lineTo(-12 - leapSpread, -16);
        ctx.lineTo(-16 - leapSpread * 1.4, -2 + legWiggle);
        ctx.stroke();

        // Far-right leg
        ctx.beginPath();
        ctx.moveTo(5, -12);
        ctx.lineTo(12 + leapSpread, -16);
        ctx.lineTo(16 + leapSpread * 1.4, -2 - legWiggle);
        ctx.stroke();

        // Mid-left leg
        ctx.strokeStyle = cBody;
        ctx.beginPath();
        ctx.moveTo(-4, -10);
        ctx.lineTo(-9 - leapSpread, -6);
        ctx.lineTo(-12 - leapSpread, 0);
        ctx.stroke();

        // Mid-right leg
        ctx.beginPath();
        ctx.moveTo(4, -10);
        ctx.lineTo(9 + leapSpread, -6);
        ctx.lineTo(12 + leapSpread, 0);
        ctx.stroke();

        // Front center leg (attentive tripod / gesture limb)
        const frontGesture = (type === 1) ? Math.sin(t * 5) * 2 : (type === 2 ? -2 : 0);
        ctx.strokeStyle = cHighlight;
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(frontGesture, -4);
        ctx.lineTo(frontGesture * 1.2, 0);
        ctx.stroke();

        // Leg joint rings (mineral bands)
        ctx.fillStyle = cJoint;
        ctx.fillRect(-13 - leapSpread, -17, 3, 3);
        ctx.fillRect(11 + leapSpread, -17, 3, 3);
        ctx.fillRect(-10 - leapSpread, -7, 2, 2);
        ctx.fillRect(8 + leapSpread, -7, 2, 2);

        // 2. Main Carapace Torso (Faceted rock body)
        ctx.fillStyle = cBody;
        ctx.beginPath();
        ctx.roundRect(-7, -17, 14, 11, [4, 4, 3, 3]);
        ctx.fill();

        // Lower body shadow / underbelly
        ctx.fillStyle = cShadow;
        ctx.fillRect(-5, -9, 10, 3);

        // 3. Upper Rock Shell / Carapace Shield (Distinct pentagonal rock crest on top)
        ctx.fillStyle = cHighlight;
        ctx.beginPath();
        ctx.moveTo(0, -21);
        ctx.lineTo(7, -17);
        ctx.lineTo(5, -13);
        ctx.lineTo(-5, -13);
        ctx.lineTo(-7, -17);
        ctx.closePath();
        ctx.fill();

        // Mineral fissures & carapace highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillRect(-3, -19, 6, 2);
        ctx.fillRect(-1, -15, 4, 2);

        // 4. Little Eridian student activities (stacking, purring, sleeping)
        if (type === 2) {
            // Student 2: Rock stacking in front
            const stackWobble = Math.sin(t * 3) * 1.0;
            ctx.fillStyle = '#8f839c';
            ctx.fillRect(7, -4, 5, 4);
            ctx.fillRect(8 + stackWobble * 0.4, -8, 3, 4);
            ctx.fillRect(9 + stackWobble * 0.8, -11, 2, 3);
        } else if (type === 4) {
            // Student 4: Soft acoustic purrs / sound bubbles
            const zAlpha = (Math.sin(t * 2.5) * 0.4 + 0.6);
            ctx.fillStyle = `rgba(180, 240, 255, ${zAlpha})`;
            ctx.font = '7px "Courier New", monospace';
            ctx.fillText('♪', 8, -16 - (t * 6) % 12);
        }

        ctx.restore();
    }

    // Backwards-compatibility alias for test suites
    drawLittleStudent(x, y, id, bounce = 0) {
        this.drawEridianStudent(x, y, id, bounce);
    }

    // ----------------------------------------------------
    // SCENE 7: SPACESHIP & COSMIC JOURNEY
    // ----------------------------------------------------

    drawSpaceship(x, y, isLaunching = false, hasJukebox = false) {
        const ctx = this.ctx;
        const t = this.animTime;

        ctx.save();
        ctx.translate(x, y);

        // Thruster flame if launching
        if (isLaunching) {
            const flameLen = 25 + Math.random() * 20;
            const fGrad = ctx.createLinearGradient(0, 15, 0, 15 + flameLen);
            fGrad.addColorStop(0, '#ffffff');
            fGrad.addColorStop(0.3, '#47d8f2');
            fGrad.addColorStop(0.7, '#ffca72');
            fGrad.addColorStop(1, 'rgba(255, 202, 114, 0)');
            ctx.fillStyle = fGrad;
            ctx.beginPath();
            ctx.moveTo(-12, 15);
            ctx.lineTo(12, 15);
            ctx.lineTo(0, 15 + flameLen);
            ctx.closePath();
            ctx.fill();

            // Spark particles
            if (Math.random() < 0.6) {
                this.spawnParticle(x + (Math.random() * 16 - 8), y + 18, (Math.random() * 2 - 1), 2 + Math.random() * 3, '#ffca72', 0.6, 3);
            }
        }

        // Spaceship Hull (Retro-futuristic shuttle)
        ctx.fillStyle = '#e8e0f0';
        ctx.beginPath();
        ctx.moveTo(0, -32); // nose
        ctx.lineTo(24, 12);
        ctx.lineTo(16, 16);
        ctx.lineTo(-16, 16);
        ctx.lineTo(-24, 12);
        ctx.closePath();
        ctx.fill();

        // Wings
        ctx.fillStyle = '#614b78';
        ctx.beginPath();
        ctx.moveTo(-24, 12);
        ctx.lineTo(-42, 18);
        ctx.lineTo(-22, -2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(24, 12);
        ctx.lineTo(42, 18);
        ctx.lineTo(22, -2);
        ctx.closePath();
        ctx.fill();

        // Cockpit Glass
        ctx.fillStyle = this.palette.electricBlue;
        ctx.beginPath();
        ctx.roundRect(-8, -18, 16, 14, 4);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-5, -16, 3, 8);

        // Jukebox glow through cargo hatch if brought along!
        if (hasJukebox) {
            ctx.fillStyle = this.palette.warmGold;
            ctx.fillRect(-4, 0, 8, 5);
        }

        ctx.restore();
    }

    // Final Scene 7: Deep Space Flight towards Earth
    drawSpaceDeparture(flightProgress = 0) {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // Deep cosmos background
        ctx.fillStyle = '#05020a';
        ctx.fillRect(0, 0, w, h);

        // Warp / Starfield streaks
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 90; i++) {
            const sx = (i * 67 + this.animTime * 140) % w;
            const sy = (i * 43) % h;
            const len = 3 + (i % 6) * 4;
            ctx.fillRect(sx, sy, len, 1.5);
        }

        // Alien purple planet shrinking in bottom left
        const alienPlanetR = Math.max(12, 90 * (1 - flightProgress * 0.7));
        const alienX = 80 - flightProgress * 60;
        const alienY = h - 60 + flightProgress * 40;

        const aGrad = ctx.createRadialGradient(alienX, alienY, alienPlanetR * 0.2, alienX, alienY, alienPlanetR);
        aGrad.addColorStop(0, '#8c52ff');
        aGrad.addColorStop(0.7, '#26134d');
        aGrad.addColorStop(1, '#05020a');
        ctx.fillStyle = aGrad;
        ctx.beginPath();
        ctx.arc(alienX, alienY, alienPlanetR, 0, Math.PI * 2);
        ctx.fill();

        // Beautiful Blue Earth revealing and growing in top right!
        const earthProgress = Math.min(1, Math.max(0, (flightProgress - 0.2) * 1.3));
        const earthR = 18 + earthProgress * 42;
        const earthX = w - 110;
        const earthY = 95;

        if (earthProgress > 0) {
            this.drawPixelEarthHologram(earthX, earthY, earthR);
        }

        // Spaceship flying across screen
        const shipX = 140 + flightProgress * (w - 220);
        const shipY = h * 0.65 - flightProgress * (h * 0.35);
        this.drawSpaceship(shipX, shipY, true, true);
    }

    // ----------------------------------------------------
    // SCENE 7 & FINALE: INSIDE THE SPACECRAFT HEADING TO EARTH (PROJECT HAIL MARY FINALE)
    // ----------------------------------------------------

    drawSpacecraftHeadingToEarth(flightProgress = 0, isRyanSpeaking = false, isRockySpeaking = false, isFistBumping = false, isAtmosphereEntry = false, isComplete = false) {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const t = this.animTime;

        // 1. Deep Space & Starfield through the panoramic cockpit viewport
        ctx.fillStyle = '#030108';
        ctx.fillRect(0, 0, w, h);

        // High-speed warp stars streaking towards the viewer/sides
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 85; i++) {
            const sx = (i * 73 + t * 160) % w;
            const sy = (i * 41) % (h * 0.72);
            const len = 4 + (i % 5) * 6;
            ctx.globalAlpha = 0.5 + (i % 3) * 0.25;
            ctx.fillRect(sx, sy, len, 1.5);
        }
        ctx.globalAlpha = 1.0;

        // 2. The Majestic Blue Planet Earth looming directly ahead!
        // As flight progresses, Earth grows from r=50 to r=115, filling the forward view
        const prog = Math.min(1.0, Math.max(0, flightProgress));
        const earthR = 50 + prog * 62;
        const earthX = w * 0.5;
        const earthY = h * 0.38 - prog * 10;

        // Earth atmospheric re-entry glow / ionization halo
        if (isAtmosphereEntry || prog > 0.8) {
            const entryGlow = ctx.createRadialGradient(earthX, earthY, earthR * 0.8, earthX, earthY, earthR * 1.6);
            entryGlow.addColorStop(0, 'rgba(255, 170, 60, 0.55)');
            entryGlow.addColorStop(0.4, 'rgba(71, 216, 242, 0.45)');
            entryGlow.addColorStop(1, 'rgba(30, 15, 60, 0)');
            ctx.fillStyle = entryGlow;
            ctx.beginPath();
            ctx.arc(earthX, earthY, earthR * 1.6, 0, Math.PI * 2);
            ctx.fill();

            // Ionization plasma sparks rushing past viewport
            for (let s = 0; s < 18; s++) {
                const px = (s * 43 + t * 240) % w;
                const py = (s * 31 + t * 80) % (h * 0.75);
                ctx.fillStyle = (s % 2 === 0) ? '#ffb85c' : '#47d8f2';
                ctx.fillRect(px, py, 6 + (s % 4) * 3, 2);
            }
        }

        // Animated Rotating Earth with oceans, continents and cloud swirls
        this.drawPixelEarthHologram(earthX, earthY, earthR);

        // 3. Spacecraft Cockpit Interior Frame & Bulkheads
        // Panoramic Viewport Outer Arch
        ctx.fillStyle = '#140e24';
        ctx.fillRect(0, 0, 80, h);
        ctx.fillRect(w - 80, 0, 80, h);

        // Cockpit ceiling beam
        ctx.fillRect(0, 0, w, 28);
        ctx.fillStyle = '#221838';
        ctx.fillRect(0, 24, w, 6);

        // Angled side pillars (cockpit window struts)
        ctx.fillStyle = '#1e1432';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(95, 0);
        ctx.lineTo(70, h * 0.72);
        ctx.lineTo(0, h * 0.72);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(w, 0);
        ctx.lineTo(w - 95, 0);
        ctx.lineTo(w - 70, h * 0.72);
        ctx.lineTo(w, h * 0.72);
        ctx.closePath();
        ctx.fill();

        // Metallic strut borders
        ctx.strokeStyle = '#4a3766';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(70, 28, w - 140, h * 0.72 - 28);

        // Glass reflection sheen
        const sheen = ctx.createLinearGradient(70, 28, w - 70, h * 0.72);
        sheen.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
        sheen.addColorStop(0.3, 'rgba(255, 255, 255, 0.02)');
        sheen.addColorStop(0.7, 'rgba(71, 216, 242, 0.05)');
        sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = sheen;
        ctx.fillRect(70, 28, w - 140, h * 0.72 - 28);

        // 4. Cockpit Flight Deck Floor
        const floorY = h * 0.74;
        ctx.fillStyle = '#161022';
        ctx.fillRect(0, floorY, w, h - floorY);
        // Floor deck grid lines
        ctx.strokeStyle = '#2d1e44';
        ctx.lineWidth = 1.5;
        for (let fx = 0; fx < w; fx += 32) {
            ctx.beginPath();
            ctx.moveTo(fx, floorY);
            ctx.lineTo(fx + (fx - w * 0.5) * 0.3, h);
            ctx.stroke();
        }

        // Pilot console table / flight computer panel
        ctx.fillStyle = '#241b36';
        ctx.fillRect(110, floorY - 24, w - 220, 26);
        ctx.fillStyle = '#392a54';
        ctx.fillRect(112, floorY - 24, w - 224, 4);

        // Glowing instruments & radar readouts on console
        ctx.fillStyle = '#47d8f2';
        ctx.fillRect(130, floorY - 18, 32, 14);
        ctx.fillStyle = '#061324';
        ctx.fillRect(132, floorY - 16, 28, 10);
        // Radar blip
        ctx.fillStyle = '#62c98a';
        ctx.fillRect(144, floorY - 12, 3, 3);

        ctx.fillStyle = '#ffca72';
        ctx.font = '6px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('SOL-3 / ORBIT LOCKED', 170, floorY - 13);
        ctx.fillStyle = '#62c98a';
        ctx.fillText('ATMOSPHERE: APPROACHING', 170, floorY - 6);

        // 5. Retro Jukebox safely mounted in left cockpit bay
        this.drawJukebox(105, floorY, { isPowered: true, isPlaying: true, activeRecord: 'earth' });

        // 6. RYAN (LEFT)
        const ryanX = 220;
        const ryanY = floorY;
        const ryanState = isFistBumping ? 'hands' : (isRyanSpeaking ? 'talk' : 'idle');
        const rockyState = isFistBumping ? 'hands' : (isRockySpeaking ? 'talk' : 'idle');

        // Draw Ryan facing right towards Rocky and Earth
        this.drawEli(ryanX, ryanY, ryanState, 1, false, isRyanSpeaking, false /* custom clothes */);

        // 7. ROCKY IN HIS FULL GEODESIC XENONITE SPHERE DOME (Matches reference photo!)
        const domeX = 395;
        const domeR = 58;
        const domeY = floorY - 38;
        this.drawGeodesicDome(domeX, domeY, domeR, rockyState, isRockySpeaking, -1 /* facing left towards Ryan */, false /* showSnow = false */);

        // 8. THE FIST BUMP MOMENT! (When isFistBumping is active)
        if (isFistBumping) {
            const bumpX = (ryanX + domeX) * 0.5 - 10;
            const bumpY = floorY - 42;

            // Golden starburst shockwave
            const shockR = 14 + Math.sin(t * 12) * 5;
            const shockGrad = ctx.createRadialGradient(bumpX, bumpY, 2, bumpX, bumpY, shockR);
            shockGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            shockGrad.addColorStop(0.4, 'rgba(255, 209, 92, 0.85)');
            shockGrad.addColorStop(0.8, 'rgba(71, 216, 242, 0.45)');
            shockGrad.addColorStop(1, 'rgba(255, 209, 92, 0)');
            ctx.fillStyle = shockGrad;
            ctx.beginPath();
            ctx.arc(bumpX, bumpY, shockR, 0, Math.PI * 2);
            ctx.fill();

            // Radiating golden spark rays
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            for (let a = 0; a < 8; a++) {
                const ang = a * Math.PI / 4 + t * 4;
                ctx.beginPath();
                ctx.moveTo(bumpX + Math.cos(ang) * 4, bumpY + Math.sin(ang) * 4);
                ctx.lineTo(bumpX + Math.cos(ang) * (shockR + 4), bumpY + Math.sin(ang) * (shockR + 4));
                ctx.stroke();
            }

            // "FIST MY BUMP!" Banner above fists
            ctx.fillStyle = '#ffca72';
            ctx.font = 'bold 9px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('FIST MY BUMP! 🤜🤛', bumpX, bumpY - 18);
        }

        // 9. Grand Finale Title Banner when entering Earth atmosphere
        if (isComplete || isAtmosphereEntry) {
            ctx.save();
            ctx.fillStyle = 'rgba(10, 5, 22, 0.65)';
            ctx.fillRect(w * 0.5 - 180, 40, 360, 48);
            ctx.strokeStyle = '#ffd15c';
            ctx.lineWidth = 2;
            ctx.strokeRect(w * 0.5 - 180, 40, 360, 48);

            ctx.fillStyle = '#ffd15c';
            ctx.font = 'bold 12px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('HEADING HOME TO EARTH', w * 0.5, 58);

            ctx.fillStyle = '#47d8f2';
            ctx.font = '9px "Courier New", monospace';
            ctx.fillText('“Amaze! Amaze! Amaze!” — Fist my bump!', w * 0.5, 74);
            ctx.restore();
        }
    }

    // ----------------------------------------------------
    // FINAL ARRIVAL: RYAN & ROCKY AT EARTH (GEODESIC XENONITE DOME)
    // ----------------------------------------------------

    drawGeodesicDomeScene(ryanX = 350, ryanY = 266, ryanFacing = -1, ryanState = 'idle', isRyanSpeaking = false, isRockySpeaking = false, rockyState = 'idle') {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // 1. Winter Earth Sky — Soft morning gradient (cold frosty blue to warm amber sunrise)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.72);
        skyGrad.addColorStop(0, '#537a9a');
        skyGrad.addColorStop(0.35, '#87a8c4');
        skyGrad.addColorStop(0.75, '#d4c4b2');
        skyGrad.addColorStop(1, '#f6e4d0');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // Soft distant morning winter sun through mist
        ctx.fillStyle = 'rgba(255, 235, 200, 0.45)';
        ctx.beginPath();
        ctx.arc(w * 0.68, 75, 42, 0, Math.PI * 2);
        ctx.fill();

        // 2. Distant Snow-Capped Mountain Range
        ctx.fillStyle = '#7a96b0';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.58);
        ctx.lineTo(65, h * 0.38);
        ctx.lineTo(145, h * 0.52);
        ctx.lineTo(235, h * 0.31);
        ctx.lineTo(335, h * 0.54);
        ctx.lineTo(425, h * 0.35);
        ctx.lineTo(525, h * 0.53);
        ctx.lineTo(595, h * 0.39);
        ctx.lineTo(w, h * 0.54);
        ctx.lineTo(w, h * 0.75);
        ctx.lineTo(0, h * 0.75);
        ctx.fill();

        // Mountain ridge snowy highlights
        ctx.fillStyle = '#ffffff';
        const peaks = [
            [65, h * 0.38, 25],
            [235, h * 0.31, 35],
            [425, h * 0.35, 30],
            [595, h * 0.39, 24]
        ];
        peaks.forEach(p => {
            ctx.beginPath();
            ctx.moveTo(p[0], p[1]);
            ctx.lineTo(p[0] + p[2], p[1] + p[2] * 0.45);
            ctx.lineTo(p[0] + p[2] * 0.6, p[1] + p[2] * 0.5);
            ctx.lineTo(p[0], p[1]);
            ctx.fill();
        });

        // 3. Layered Snowy Pine Forest
        for (let i = 0; i < 14; i++) {
            const px = 15 + i * 46;
            const py = h * 0.61 + (i % 3) * 6;
            this.drawSnowyPineTree(px, py, 0.72);
        }
        for (let i = 0; i < 10; i++) {
            const px = 10 + i * 66;
            const py = h * 0.67 + (i % 2) * 8;
            this.drawSnowyPineTree(px, py, 1.0);
        }

        // 4. Snowy Ground & Rolling Drifts
        const snowGrad = ctx.createLinearGradient(0, h * 0.69, 0, h);
        snowGrad.addColorStop(0, '#eaf2f8');
        snowGrad.addColorStop(0.3, '#d8e5f2');
        snowGrad.addColorStop(0.7, '#c0d2e4');
        snowGrad.addColorStop(1, '#9eb5cc');
        ctx.fillStyle = snowGrad;

        ctx.beginPath();
        ctx.moveTo(0, h * 0.69);
        ctx.bezierCurveTo(160, h * 0.67, 300, h * 0.72, 460, h * 0.68);
        ctx.bezierCurveTo(540, h * 0.66, 590, h * 0.70, w, h * 0.68);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.fill();

        // Snow surface sparkles
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 28; i++) {
            const sx = (i * 37) % w;
            const sy = h * 0.71 + ((i * 19) % (h * 0.26));
            ctx.fillRect(sx, sy, 2, 1);
        }

        // 5. THE GEODESIC XENONITE SPHERE DOME (Matches reference photo)
        const domeX = 220;
        const domeY = h * 0.72 - 44;
        const domeR = 68;
        this.drawGeodesicDome(domeX, domeY, domeR, rockyState, isRockySpeaking);

        // 6. RYAN IN HIS FULL WHITE ASTRONAUT SUIT (Outside in the cold Earth air)
        this.drawEli(ryanX, ryanY, ryanState, ryanFacing, false, isRyanSpeaking, true /* astronaut suit */);

        // 7. Falling Pixel Snow
        this.drawFallingSnow();
    }

    drawGeodesicDome(cx, cy, R, rockyState = 'idle', isSpeaking = false, facing = 1, showSnow = true) {
        const ctx = this.ctx;
        const t = this.animTime;

        if (showSnow) {
            // Base foundation in snow
            ctx.fillStyle = '#2c3540';
            ctx.beginPath();
            ctx.ellipse(cx, cy + R * 0.88, R * 0.8, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            // Metallic deck mounting ring on spacecraft bridge deck
            ctx.fillStyle = '#241a33';
            ctx.beginPath();
            ctx.ellipse(cx, cy + R * 0.86, R * 0.72, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#5a427a';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Gold/brass mounting lock brackets
            ctx.fillStyle = this.palette.warmGold;
            ctx.fillRect(cx - R * 0.5, cy + R * 0.82, 10, 5);
            ctx.fillRect(cx + R * 0.5 - 10, cy + R * 0.82, 10, 5);
        }

        // 1. Warm Glowing Xenonite Atmosphere inside the sphere (Erid environment: 200°C)
        const eridAtmosphere = ctx.createRadialGradient(cx, cy - 4, R * 0.15, cx, cy, R);
        eridAtmosphere.addColorStop(0, 'rgba(255, 185, 90, 0.52)');
        eridAtmosphere.addColorStop(0.5, 'rgba(240, 140, 50, 0.35)');
        eridAtmosphere.addColorStop(0.85, 'rgba(200, 90, 30, 0.20)');
        eridAtmosphere.addColorStop(1, 'rgba(120, 40, 10, 0.08)');

        ctx.fillStyle = eridAtmosphere;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fill();

        // 2. ROCKY INSIDE THE DOME!
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, R - 2, 0, Math.PI * 2);
        ctx.clip();

        // Rocky sits happily inside his warm geodesic habitat ball
        const rockyY = cy + R * 0.65;
        this.drawKoru(cx, rockyY, rockyState, facing, isSpeaking);
        ctx.restore();

        // 3. Geodesic Multi-Faceted Strut Grid (Classic icosahedron / geodesic sphere - matches reference photo!)
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.clip();

        const numOuter = 8;
        const outerPts = [];
        for (let i = 0; i < numOuter; i++) {
            const ang = (i * Math.PI * 2 / numOuter) + 0.2;
            outerPts.push({ x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang) });
        }

        const numInner = 6;
        const innerPts = [];
        for (let i = 0; i < numInner; i++) {
            const ang = (i * Math.PI * 2 / numInner) + 0.5;
            innerPts.push({ x: cx + (R * 0.58) * Math.cos(ang), y: cy + (R * 0.58) * Math.sin(ang) });
        }

        const centerPt = { x: cx - 4, y: cy - 6 };

        // Shimmering triangular glass facets
        const facets = [
            [centerPt, innerPts[0], innerPts[1]],
            [centerPt, innerPts[2], innerPts[3]],
            [innerPts[0], innerPts[1], outerPts[1]],
            [innerPts[4], innerPts[5], outerPts[5]]
        ];

        facets.forEach((f, idx) => {
            const shimmer = Math.sin(t * 1.5 + idx * 1.2) * 0.06 + 0.16;
            ctx.fillStyle = `rgba(220, 245, 255, ${shimmer})`;
            ctx.beginPath();
            ctx.moveTo(f[0].x, f[0].y);
            ctx.lineTo(f[1].x, f[1].y);
            ctx.lineTo(f[2].x, f[2].y);
            ctx.closePath();
            ctx.fill();
        });

        // Geodesic strut lines (silver / xenonite framing)
        ctx.strokeStyle = 'rgba(235, 248, 255, 0.92)';
        ctx.lineWidth = 1.6;

        // Center to inner
        for (let i = 0; i < numInner; i++) {
            ctx.beginPath();
            ctx.moveTo(centerPt.x, centerPt.y);
            ctx.lineTo(innerPts[i].x, innerPts[i].y);
            ctx.stroke();
        }

        // Inner ring loop
        for (let i = 0; i < numInner; i++) {
            const next = (i + 1) % numInner;
            ctx.beginPath();
            ctx.moveTo(innerPts[i].x, innerPts[i].y);
            ctx.lineTo(innerPts[next].x, innerPts[next].y);
            ctx.stroke();
        }

        // Inner to outer struts
        for (let i = 0; i < numInner; i++) {
            const o1 = i % numOuter;
            const o2 = (i + 1) % numOuter;
            ctx.beginPath();
            ctx.moveTo(innerPts[i].x, innerPts[i].y);
            ctx.lineTo(outerPts[o1].x, outerPts[o1].y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(innerPts[i].x, innerPts[i].y);
            ctx.lineTo(outerPts[o2].x, outerPts[o2].y);
            ctx.stroke();
        }

        // Strut node rivets
        ctx.fillStyle = '#ffffff';
        [centerPt, ...innerPts].forEach(pt => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 2.0, 0, Math.PI * 2);
            ctx.fill();
        });

        // Glass specular glint arc
        const glintGrad = ctx.createLinearGradient(cx - R * 0.7, cy - R * 0.7, cx + R * 0.4, cy + R * 0.4);
        glintGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        glintGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.08)');
        glintGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glintGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, R - 1, -Math.PI * 0.85, -Math.PI * 0.15);
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Exterior ring rim
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.stroke();

        if (showSnow) {
            // Snow piled on base of dome
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(cx - 24, cy + R * 0.85, 20, 6, 0.1, 0, Math.PI * 2);
            ctx.ellipse(cx + 20, cy + R * 0.86, 22, 7, -0.1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawSnowyPineTree(x, y, scale = 1.0) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Trunk
        ctx.fillStyle = '#3a271c';
        ctx.fillRect(-3, -10, 6, 12);

        // Tiered evergreen pine boughs with white snow
        const tiers = [
            { w: 32, h: 16, y: -10 },
            { w: 26, h: 14, y: -22 },
            { w: 18, h: 12, y: -32 },
            { w: 10, h: 10, y: -40 }
        ];

        tiers.forEach(t => {
            // Dark pine green
            ctx.fillStyle = '#1c3324';
            ctx.beginPath();
            ctx.moveTo(0, t.y - t.h);
            ctx.lineTo(-t.w / 2, t.y);
            ctx.lineTo(t.w / 2, t.y);
            ctx.closePath();
            ctx.fill();

            // Snow layer on top of bough
            ctx.fillStyle = '#edf4fa';
            ctx.beginPath();
            ctx.moveTo(0, t.y - t.h);
            ctx.lineTo(-t.w / 2, t.y);
            ctx.lineTo(-t.w / 2 + 5, t.y - 3);
            ctx.lineTo(0, t.y - t.h + 4);
            ctx.lineTo(t.w / 2 - 5, t.y - 3);
            ctx.lineTo(t.w / 2, t.y);
            ctx.closePath();
            ctx.fill();
        });

        ctx.restore();
    }

    drawFallingSnow() {
        const ctx = this.ctx;
        if (!this.snowFlakes) return;
        ctx.fillStyle = '#ffffff';
        this.snowFlakes.forEach(f => {
            f.y += f.speedY;
            f.x += f.speedX;
            if (f.y > this.height) {
                f.y = -5;
                f.x = Math.random() * this.width;
            }
            if (f.x > this.width) f.x = 0;
            if (f.x < 0) f.x = this.width;

            ctx.globalAlpha = f.alpha;
            ctx.fillRect(Math.floor(f.x), Math.floor(f.y), Math.ceil(f.size), Math.ceil(f.size));
        });
        ctx.globalAlpha = 1.0;
    }

    // ----------------------------------------------------
    // SCENE 8 — GRAND FINALE: EARTH'S JURASSIC COASTLINE & DURDLE DOOR
    // ----------------------------------------------------

    drawEarthCoastline(cameraX = 0, tideTime = 0) {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const t = this.animTime;

        ctx.save();

        // 1. Bright misty coastal sky (pale English coastal overcast daylight)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.58);
        skyGrad.addColorStop(0, '#d9e5eb');
        skyGrad.addColorStop(0.5, '#e9f0f3');
        skyGrad.addColorStop(1, '#f4f2ea');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h * 0.58);

        // Soft coastal sun diffusion
        const sunGlow = ctx.createRadialGradient(w * 0.38, h * 0.22, 10, w * 0.38, h * 0.22, 160);
        sunGlow.addColorStop(0, 'rgba(255, 252, 235, 0.45)');
        sunGlow.addColorStop(0.5, 'rgba(255, 248, 220, 0.18)');
        sunGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = sunGlow;
        ctx.fillRect(0, 0, w, h * 0.58);

        // Distant sea gulls soaring
        const gullT = t * 1.5;
        const gulls = [
            { x: (w * 0.22 + gullT * 12) % (w + 40) - 20, y: h * 0.18 + Math.sin(gullT * 0.8) * 6, s: 0.8 },
            { x: (w * 0.28 + gullT * 14) % (w + 40) - 20, y: h * 0.15 + Math.cos(gullT * 0.9) * 5, s: 0.65 },
            { x: (w * 0.65 + gullT * 10) % (w + 40) - 20, y: h * 0.25 + Math.sin(gullT * 0.7 + 1) * 8, s: 0.9 }
        ];
        ctx.strokeStyle = 'rgba(100, 120, 135, 0.6)';
        ctx.lineWidth = 1.2;
        gulls.forEach(g => {
            const wingFlap = Math.sin(t * 8 + g.x * 0.1) * 2;
            ctx.beginPath();
            ctx.moveTo(g.x - 5 * g.s, g.y - wingFlap);
            ctx.quadraticCurveTo(g.x - 2 * g.s, g.y - 2, g.x, g.y);
            ctx.quadraticCurveTo(g.x + 2 * g.s, g.y - 2, g.x + 5 * g.s, g.y - wingFlap);
            ctx.stroke();
        });

        // 2. Far distant headlands / hazy cliffs on left horizon
        ctx.fillStyle = 'rgba(180, 198, 208, 0.65)';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.46);
        ctx.lineTo(w * 0.22, h * 0.46);
        ctx.lineTo(w * 0.16, h * 0.42);
        ctx.lineTo(w * 0.08, h * 0.41);
        ctx.lineTo(0, h * 0.43);
        ctx.closePath();
        ctx.fill();

        // 3. Turquoise Ocean Waters (Multi-layered depths)
        const oceanTopY = h * 0.44;
        const oceanBottomY = h * 0.68;

        const seaGrad = ctx.createLinearGradient(0, oceanTopY, 0, oceanBottomY);
        seaGrad.addColorStop(0, '#2e6f77');
        seaGrad.addColorStop(0.35, '#3b929c');
        seaGrad.addColorStop(0.7, '#4eb4be');
        seaGrad.addColorStop(1, '#68ccd6');
        ctx.fillStyle = seaGrad;
        ctx.fillRect(0, oceanTopY, w, oceanBottomY - oceanTopY + 12);

        // Gentle animated ocean wave swells (flowing through bay and under arch)
        for (let waveRow = 0; waveRow < 5; waveRow++) {
            const rowY = oceanTopY + 8 + waveRow * 14;
            const waveSpeed = 1.2 + waveRow * 0.2;
            const waveFreq = 0.035 - waveRow * 0.003;
            const waveAmp = 2.0 + waveRow * 0.8;

            ctx.strokeStyle = (waveRow % 2 === 0) ? 'rgba(150, 235, 245, 0.45)' : 'rgba(255, 255, 255, 0.65)';
            ctx.lineWidth = 1.2 + waveRow * 0.3;
            ctx.beginPath();
            for (let wx = 0; wx < w; wx += 6) {
                const wy = rowY + Math.sin(t * waveSpeed + wx * waveFreq) * waveAmp;
                if (wx === 0) ctx.moveTo(wx, wy);
                else ctx.lineTo(wx, wy);
            }
            ctx.stroke();
        }

        // 4. THE ICONIC JURASSIC COAST SEA ARCH (Durdle Door formation)
        this.drawDurdleDoorSeaArch(w * 0.72, h * 0.42);

        // 5. Pebble / Shingle Shoreline (sloping beach)
        const beachTopY = h * 0.65;
        const beachGrad = ctx.createLinearGradient(0, beachTopY, 0, h);
        beachGrad.addColorStop(0, '#534335'); // Wet pebble waterline
        beachGrad.addColorStop(0.12, '#7a6652'); // Wet shingle
        beachGrad.addColorStop(0.45, '#9d8870'); // Dry pebbles
        beachGrad.addColorStop(1, '#b5a086'); // Upper shingle bank
        ctx.fillStyle = beachGrad;

        ctx.beginPath();
        ctx.moveTo(0, beachTopY + 4);
        for (let bx = 0; bx <= w; bx += 10) {
            const by = beachTopY + Math.sin(bx * 0.015 + 0.5) * 6;
            ctx.lineTo(bx, by);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        // 6. Breaking Surf & Wave Wash on the pebbles
        const surfCycle = Math.sin(t * 1.3);
        const surfReach = surfCycle * 14 + 10;
        const surfY = beachTopY + 6 - surfReach;

        // Foamy surf wash layer
        ctx.fillStyle = 'rgba(235, 250, 255, 0.45)';
        ctx.beginPath();
        ctx.moveTo(0, surfY + 4);
        for (let sx = 0; sx <= w; sx += 12) {
            const sy = surfY + Math.sin(t * 2.2 + sx * 0.06) * 3;
            ctx.lineTo(sx, sy);
        }
        ctx.lineTo(w, beachTopY + 12);
        ctx.lineTo(0, beachTopY + 12);
        ctx.closePath();
        ctx.fill();

        // Crisp white bubbly seafoam edge
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let sx = 0; sx <= w; sx += 8) {
            const sy = surfY + Math.sin(t * 2.2 + sx * 0.06) * 3;
            if (sx === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        // Seafoam bubbles trailing back
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let b = 0; b < 16; b++) {
            const bx = (b * 41 + t * 5) % w;
            const by = beachTopY + 2 + ((b * 19) % 18);
            ctx.fillRect(bx, by, 2, 2);
        }

        // 7. Individual scattered pebbles on the shingle bank
        const pebbleSeeds = [
            { x: 35, y: h * 0.76, w: 5, h: 3, c: '#36322d' },
            { x: 72, y: h * 0.82, w: 4, h: 3, c: '#e8e2d5' }, // white quartz
            { x: 120, y: h * 0.72, w: 6, h: 4, c: '#8a4e3b' }, // terracotta rust
            { x: 165, y: h * 0.88, w: 5, h: 3, c: '#454039' },
            { x: 210, y: h * 0.78, w: 4, h: 3, c: '#cfa569' }, // amber flint
            { x: 275, y: h * 0.85, w: 6, h: 4, c: '#e0ded7' },
            { x: 330, y: h * 0.74, w: 5, h: 3, c: '#8c4f3f' },
            { x: 385, y: h * 0.82, w: 4, h: 2, c: '#2b2723' },
            { x: 440, y: h * 0.77, w: 6, h: 4, c: '#bf9965' },
            { x: 495, y: h * 0.89, w: 5, h: 3, c: '#3b3833' },
            { x: 550, y: h * 0.80, w: 4, h: 3, c: '#e5ded0' }
        ];

        pebbleSeeds.forEach(p => {
            ctx.fillStyle = p.c;
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, p.w, p.h, 0.2, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    // Majestic Durdle Door Sea Arch with Jurassic rock striations
    drawDurdleDoorSeaArch(archBaseX, archBaseY) {
        const ctx = this.ctx;
        const t = this.animTime;

        ctx.save();
        ctx.translate(archBaseX, archBaseY);

        // Main cliff headland mass sloping down from the right
        // Strata band 1: Top grass / coastal turf (lichen green & weathered earth)
        ctx.fillStyle = '#677a5b';
        ctx.beginPath();
        ctx.moveTo(130, -85);
        ctx.quadraticCurveTo(80, -78, 20, -55);
        ctx.lineTo(-40, -42);
        ctx.lineTo(-75, -28);
        ctx.lineTo(-85, 4);
        ctx.lineTo(-55, 30);
        ctx.lineTo(130, 70);
        ctx.closePath();
        ctx.fill();

        // Strata band 2: Warm ochre sandstone layers (Portland stone)
        ctx.fillStyle = '#b89868';
        ctx.beginPath();
        ctx.moveTo(130, -68);
        ctx.quadraticCurveTo(70, -60, 10, -42);
        ctx.lineTo(-45, -30);
        ctx.lineTo(-80, -12);
        ctx.lineTo(-78, 24);
        ctx.lineTo(130, 65);
        ctx.closePath();
        ctx.fill();

        // Strata band 3: Purbeck limestone shale (darker striations)
        ctx.fillStyle = '#7a664d';
        ctx.beginPath();
        ctx.moveTo(130, -50);
        ctx.quadraticCurveTo(60, -44, 0, -28);
        ctx.lineTo(-50, -18);
        ctx.lineTo(-72, 8);
        ctx.lineTo(130, 58);
        ctx.closePath();
        ctx.fill();

        // Strata band 4: Sage sea-lichen and moss fissures
        ctx.fillStyle = '#546349';
        ctx.beginPath();
        ctx.moveTo(130, -32);
        ctx.quadraticCurveTo(50, -28, -8, -14);
        ctx.lineTo(-58, -4);
        ctx.lineTo(-68, 26);
        ctx.lineTo(130, 52);
        ctx.closePath();
        ctx.fill();

        // Geological chiseled strata lines (tilted bedding planes!)
        ctx.strokeStyle = '#382f25';
        ctx.lineWidth = 1.4;
        const strataAngles = [-60, -45, -30, -15, 0, 15];
        strataAngles.forEach(offsetY => {
            ctx.beginPath();
            ctx.moveTo(120, offsetY - 18);
            ctx.lineTo(-45, offsetY - 5);
            ctx.stroke();
        });

        // ----------------------------------------------------
        // THE ARCH PORTAL HOLE (The iconic hollow opening)
        // Turquoise sea water and distant surf are visible right through it!
        // ----------------------------------------------------
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-48, 48);
        ctx.lineTo(-48, 5);
        ctx.quadraticCurveTo(-48, -26, -18, -26);
        ctx.quadraticCurveTo(12, -26, 12, 10);
        ctx.lineTo(12, 48);
        ctx.closePath();
        ctx.clip();

        // Water inside arch
        const archWaterGrad = ctx.createLinearGradient(0, -26, 0, 48);
        archWaterGrad.addColorStop(0, '#2e757d');
        archWaterGrad.addColorStop(0.5, '#48abb5');
        archWaterGrad.addColorStop(1, '#66d1dc');
        ctx.fillStyle = archWaterGrad;
        ctx.fillRect(-55, -32, 75, 85);

        // Distant horizon wave through the arch
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 1.5;
        const innerWaveY = 12 + Math.sin(t * 1.8) * 3;
        ctx.beginPath();
        ctx.moveTo(-50, innerWaveY);
        ctx.lineTo(15, innerWaveY);
        ctx.stroke();

        ctx.restore();

        // Inner rock shadow on the arch rim
        ctx.strokeStyle = '#28231c';
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.moveTo(-48, 48);
        ctx.lineTo(-48, 5);
        ctx.quadraticCurveTo(-48, -26, -18, -26);
        ctx.quadraticCurveTo(12, -26, 12, 10);
        ctx.lineTo(12, 48);
        ctx.stroke();

        // Sun highlight on the seaward pillar of the arch
        ctx.fillStyle = 'rgba(255, 248, 220, 0.35)';
        ctx.beginPath();
        ctx.moveTo(-82, -10);
        ctx.lineTo(-76, 32);
        ctx.lineTo(-68, 32);
        ctx.lineTo(-74, -8);
        ctx.closePath();
        ctx.fill();

        // Crashing white surf spray at the base of the pillars
        const sprayBounce = Math.sin(t * 3.5) * 4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-52, 44 - sprayBounce * 0.3, 14, 5 + sprayBounce * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(14, 45 - sprayBounce * 0.2, 16, 6 + sprayBounce * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Rocky in his form-fitting geodesic xenonite exoskeleton on the beach
    drawRockyBeachSuit(x, y, state = 'idle', facing = 1, isSpeaking = false, isSeated = false) {
        const ctx = this.ctx;
        const t = this.animTime;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(facing, 1);

        const walkCycle = (state === 'walk') ? Math.sin(t * 8) : 0;
        const legShift = walkCycle * 4;
        const breath = Math.sin(t * 3) * 1.2;

        if (isSeated) {
            // Seated / Resting tripod posture on the pebble beach facing ocean waves
            ctx.lineWidth = 2.6;
            ctx.strokeStyle = '#6e563d';
            // Back legs
            ctx.beginPath();
            ctx.moveTo(-16, -10);
            ctx.lineTo(-26, -2);
            ctx.lineTo(-24, 6);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(16, -10);
            ctx.lineTo(26, -2);
            ctx.lineTo(24, 6);
            ctx.stroke();

            // Mid legs
            ctx.strokeStyle = '#8a6e50';
            ctx.beginPath();
            ctx.moveTo(-10, -6);
            ctx.lineTo(-18, 4);
            ctx.lineTo(-14, 8);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(10, -6);
            ctx.lineTo(18, 4);
            ctx.lineTo(14, 8);
            ctx.stroke();

            // Front sensory limb resting on pebble
            ctx.strokeStyle = '#a68763';
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(2, 6);
            ctx.stroke();

            // 2. Rocky's rock carapace body
            ctx.fillStyle = '#7a6247';
            ctx.beginPath();
            ctx.roundRect(-16, -22, 32, 20, [8, 8, 4, 4]);
            ctx.fill();

            // Mineral shell highlights
            ctx.fillStyle = '#9e8160';
            ctx.fillRect(-12, -20, 24, 6);

            // ----------------------------------------------------
            // 3. FORM-FITTING GEODESIC XENONITE EXOSKELETON
            // ----------------------------------------------------
            ctx.fillStyle = 'rgba(255, 235, 175, 0.22)';
            ctx.beginPath();
            ctx.roundRect(-20, -26, 40, 26, 10);
            ctx.fill();

            ctx.fillStyle = 'rgba(220, 245, 255, 0.35)';
            ctx.beginPath();
            ctx.roundRect(-19, -25, 38, 24, 8);
            ctx.fill();

            // Golden Geodesic Triangular Struts
            ctx.strokeStyle = '#e6c86a';
            ctx.lineWidth = 1.3;

            const nodes = [
                { x: 0, y: -26 },
                { x: -14, y: -18 },
                { x: 14, y: -18 },
                { x: -18, y: -8 },
                { x: 0, y: -10 },
                { x: 18, y: -8 },
                { x: -12, y: 0 },
                { x: 12, y: 0 }
            ];

            const edges = [
                [0, 1], [0, 2], [1, 2],
                [1, 3], [1, 4], [2, 4], [2, 5],
                [3, 4], [4, 5],
                [3, 6], [4, 6], [4, 7], [5, 7],
                [6, 7]
            ];

            edges.forEach(([i, j]) => {
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.stroke();
            });

            // Diamond glint sparkles on vertex nodes
            ctx.fillStyle = '#ffffff';
            nodes.forEach(n => {
                ctx.fillRect(n.x - 1, n.y - 1, 2, 2);
            });

            // Leg sleeves
            ctx.strokeStyle = 'rgba(240, 210, 110, 0.85)';
            ctx.lineWidth = 1.0;
            ctx.strokeRect(-27, -4, 8, 10);
            ctx.strokeRect(19, -4, 8, 10);
        } else {
            // Walking / Standing posture in form-fitting xenonite suit
            ctx.lineWidth = 2.8;

            // Leg 1 (Far left)
            ctx.strokeStyle = '#5a4632';
            ctx.beginPath();
            ctx.moveTo(-16, -14);
            ctx.lineTo(-28 - legShift, -6);
            ctx.lineTo(-24 - legShift, 8 + breath);
            ctx.stroke();

            // Leg 2 (Far right)
            ctx.beginPath();
            ctx.moveTo(16, -14);
            ctx.lineTo(28 + legShift, -6);
            ctx.lineTo(24 + legShift, 8 + breath);
            ctx.stroke();

            // Leg 3 (Mid left)
            ctx.strokeStyle = '#7a6247';
            ctx.beginPath();
            ctx.moveTo(-10, -10);
            ctx.lineTo(-18 + legShift * 0.7, 0);
            ctx.lineTo(-14 + legShift * 0.7, 8);
            ctx.stroke();

            // Leg 4 (Mid right)
            ctx.beginPath();
            ctx.moveTo(10, -10);
            ctx.lineTo(18 - legShift * 0.7, 0);
            ctx.lineTo(14 - legShift * 0.7, 8);
            ctx.stroke();

            // Leg 5 (Front gesture / sensory limb)
            ctx.strokeStyle = '#9e8160';
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(0, 4);
            ctx.lineTo(2, 8);
            ctx.stroke();

            // 2. Carapace body
            ctx.fillStyle = '#7a6247';
            ctx.beginPath();
            ctx.roundRect(-16, -30, 32, 22, [8, 8, 5, 5]);
            ctx.fill();

            // Mineral highlights
            ctx.fillStyle = '#9c7f5f';
            ctx.fillRect(-12, -28, 24, 7);

            // ----------------------------------------------------
            // 3. FORM-FITTING GEODESIC XENONITE SUIT
            // ----------------------------------------------------
            ctx.fillStyle = 'rgba(255, 235, 170, 0.25)';
            ctx.beginPath();
            ctx.roundRect(-21, -34, 42, 28, 11);
            ctx.fill();

            ctx.fillStyle = 'rgba(220, 245, 255, 0.38)';
            ctx.beginPath();
            ctx.roundRect(-20, -33, 40, 26, 9);
            ctx.fill();

            // Golden Triangular Frame Struts
            ctx.strokeStyle = '#e6c86a';
            ctx.lineWidth = 1.4;

            const nodes = [
                { x: 0, y: -34 },
                { x: -16, y: -24 },
                { x: 16, y: -24 },
                { x: -18, y: -12 },
                { x: 0, y: -14 },
                { x: 18, y: -12 },
                { x: -12, y: -3 },
                { x: 12, y: -3 }
            ];

            const edges = [
                [0, 1], [0, 2], [1, 2],
                [1, 3], [1, 4], [2, 4], [2, 5],
                [3, 4], [4, 5],
                [3, 6], [4, 6], [4, 7], [5, 7],
                [6, 7]
            ];

            edges.forEach(([i, j]) => {
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.stroke();
            });

            ctx.fillStyle = '#ffffff';
            nodes.forEach(n => {
                ctx.fillRect(n.x - 1, n.y - 1, 2, 2);
            });

            // Leg sleeves
            ctx.strokeStyle = 'rgba(240, 210, 110, 0.85)';
            ctx.lineWidth = 1.1;
            ctx.strokeRect(-29 - legShift, -6, 9, 14);
            ctx.strokeRect(20 + legShift, -6, 9, 14);
        }

        // Acoustic speech harmonics
        if (isSpeaking) {
            const harmonicAlpha = Math.sin(t * 10) * 0.4 + 0.6;
            ctx.fillStyle = `rgba(120, 230, 255, ${harmonicAlpha})`;
            ctx.font = '8px "Courier New", monospace';
            ctx.fillText('♫', 16, -32 - (t * 8) % 12);
        }

        ctx.restore();
    }

    // Ryan in his Earth patterned fleece jacket and beach attire
    drawRyanBeach(x, y, state = 'idle', facing = 1, isSpeaking = false, isSeated = false) {
        const ctx = this.ctx;
        const t = this.animTime;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(facing, 1);

        const walkCycle = (state === 'walk') ? Math.sin(t * 8) : 0;
        const legSwing = walkCycle * 5;

        if (isSeated) {
            // Seated peacefully on the pebbles facing the sea (as in movie still!)
            // Trousers & boots tucked
            ctx.fillStyle = '#2c333d';
            ctx.beginPath();
            ctx.roundRect(-10, -12, 22, 14, 4);
            ctx.fill();

            // Boots
            ctx.fillStyle = '#423325';
            ctx.fillRect(4, -2, 10, 6);

            // Cozy Cream/Oatmeal Fleece Jacket Body
            ctx.fillStyle = '#ede5d3';
            ctx.beginPath();
            ctx.roundRect(-12, -38, 24, 28, [6, 6, 3, 3]);
            ctx.fill();

            // High fleece neck collar
            ctx.fillStyle = '#dfd6c0';
            ctx.fillRect(-6, -42, 12, 6);

            // Mountain ram patterns (Chocolate brown geometric motifs)
            ctx.fillStyle = '#6e4428';
            ctx.fillRect(-8, -32, 6, 8);
            ctx.fillRect(-10, -28, 4, 6);
            ctx.fillRect(2, -32, 6, 8);
            ctx.fillRect(6, -28, 4, 6);
            ctx.fillRect(-10, -18, 20, 3);

            // Arms resting on knees
            ctx.fillStyle = '#dfd6c0';
            ctx.beginPath();
            ctx.roundRect(-2, -26, 12, 16, 3);
            ctx.fill();

            // Head & windblown brown hair
            ctx.fillStyle = '#ffd1aa';
            ctx.fillRect(-5, -48, 10, 8);

            ctx.fillStyle = '#4a2f1b';
            ctx.fillRect(-6, -52, 12, 6);
            ctx.fillRect(-7, -50, 4, 5);
            ctx.fillRect(4, -51, 3, 4);
        } else {
            // Walking / Standing on the beach
            ctx.fillStyle = '#2c333d';
            ctx.fillRect(-7 - legSwing * 0.4, -24, 6, 22);
            ctx.fillRect(1 + legSwing * 0.4, -24, 6, 22);

            ctx.fillStyle = '#423325';
            ctx.fillRect(-8 - legSwing * 0.4, -3, 8, 5);
            ctx.fillRect(0 + legSwing * 0.4, -3, 8, 5);

            // Cozy Earth Patterned Fleece Jacket
            ctx.fillStyle = '#ede5d3';
            ctx.beginPath();
            ctx.roundRect(-10, -56, 20, 34, [6, 6, 4, 4]);
            ctx.fill();

            // High fleece collar
            ctx.fillStyle = '#dfd6c0';
            ctx.fillRect(-5, -60, 10, 6);

            // Mountain ram patterns
            ctx.fillStyle = '#6e4428';
            ctx.fillRect(-7, -50, 6, 8);
            ctx.fillRect(1, -50, 6, 8);
            ctx.fillRect(-8, -36, 16, 4);

            // Sleeves
            ctx.fillStyle = '#dfd6c0';
            ctx.fillRect(-12, -54, 4, 20);
            ctx.fillRect(8, -54, 4, 20);

            // Hands
            ctx.fillStyle = '#ffd1aa';
            ctx.fillRect(-12, -34, 4, 4);
            ctx.fillRect(8, -34, 4, 4);

            // Head & Windblown hair
            ctx.fillStyle = '#ffd1aa';
            ctx.fillRect(-5, -66, 10, 8);

            ctx.fillStyle = '#2c221e';
            ctx.fillRect(1, -63, 2, 2);
            ctx.fillStyle = '#8a4e32';
            ctx.fillRect(0, -60, 3, 1);

            const hairSway = Math.sin(t * 4) * 1.5;
            ctx.fillStyle = '#4a2f1b';
            ctx.fillRect(-6, -70, 12, 6);
            ctx.fillRect(-7, -68 + hairSway, 4, 5);
            ctx.fillRect(3, -69, 4, 4);
        }

        ctx.restore();
    }

    // Golden harmonic fist-bump between Ryan and Rocky on the beach
    drawBeachFistBump(x1, y1, x2, y2) {
        const ctx = this.ctx;
        const t = this.animTime;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2 - 18;

        ctx.save();

        const sparkPulse = (t * 8) % 1.0;
        ctx.strokeStyle = `rgba(255, 230, 120, ${1.0 - sparkPulse})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(midX, midY, 6 + sparkPulse * 28, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(midX - 3, midY - 3, 6, 6);
        ctx.fillStyle = '#ffdc52';
        ctx.fillRect(midX - 1, midY - 8, 2, 16);
        ctx.fillRect(midX - 8, midY - 1, 16, 2);

        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = 'rgba(255, 220, 90, 0.95)';
        ctx.fillText('♫', midX - 14, midY - 12 - (t * 12) % 18);
        ctx.fillStyle = 'rgba(255, 140, 160, 0.95)';
        ctx.fillText('♥', midX + 8, midY - 14 - (t * 10) % 16);

        ctx.restore();
    }

    // Render active particles
    renderParticles() {
        const ctx = this.ctx;
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
        });
        ctx.globalAlpha = 1.0;
    }
}

window.PixelRenderer = PixelRenderer;
