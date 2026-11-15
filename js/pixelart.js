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
        // Habitat structure
        ctx.fillStyle = '#42325c';
        ctx.fillRect(x, y - 80, 160, 80);
        ctx.fillStyle = '#2c1e42';
        ctx.fillRect(x + 10, y - 70, 140, 70);

        // Curved dome roof
        ctx.fillStyle = '#5c487d';
        ctx.beginPath();
        ctx.ellipse(x + 80, y - 80, 80, 35, 0, Math.PI, 0);
        ctx.fill();

        // Glowing panoramic observation window (Artificial beach & warm lights inside)
        const winGrad = ctx.createLinearGradient(x + 25, y - 65, x + 135, y - 15);
        winGrad.addColorStop(0, '#ffca72');
        winGrad.addColorStop(0.5, '#47d8f2');
        winGrad.addColorStop(1, '#26134d');
        ctx.fillStyle = winGrad;
        ctx.fillRect(x + 25, y - 65, 110, 50);

        // Window frame dividers
        ctx.fillStyle = '#1e142e';
        ctx.fillRect(x + 60, y - 65, 4, 50);
        ctx.fillRect(x + 95, y - 65, 4, 50);

        // Internal artificial fog / wave silhouette inside window
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        const waveY = y - 25 + Math.sin(this.animTime * 2) * 2;
        ctx.moveTo(x + 25, waveY);
        ctx.bezierCurveTo(x + 50, waveY - 4, x + 85, waveY + 4, x + 135, waveY);
        ctx.lineTo(x + 135, y - 15);
        ctx.lineTo(x + 25, y - 15);
        ctx.closePath();
        ctx.fill();

        // Habitat entrance door
        ctx.fillStyle = '#ffca72';
        ctx.fillRect(x + 135, y - 45, 20, 45);
        ctx.fillStyle = '#311b52';
        ctx.fillRect(x + 137, y - 43, 16, 43);
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

        // Stones for students to sit on
        this.drawSittingStone(140, h * 0.75);
        this.drawSittingStone(200, h * 0.76);
        this.drawSittingStone(260, h * 0.74);
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

        // Water with gentle waves
        const waterWave = Math.sin(this.animTime * 2.2) * 4;
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

        // Retro Lamp on the workbench
        this.drawDeskLamp(tableX - 35, tableY - 32);

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
        // Brass neck & lamp shade
        ctx.strokeStyle = this.palette.warmGold;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - 24);
        ctx.lineTo(x + 12, y - 28);
        ctx.stroke();

        ctx.fillStyle = '#5c4323';
        ctx.beginPath();
        ctx.arc(x + 14, y - 28, 7, 0, Math.PI * 2);
        ctx.fill();

        // Warm light cone downwards
        const lightGrad = ctx.createRadialGradient(x + 14, y - 26, 2, x + 14, y + 10, 42);
        lightGrad.addColorStop(0, 'rgba(255, 202, 114, 0.45)');
        lightGrad.addColorStop(1, 'rgba(255, 202, 114, 0)');
        ctx.fillStyle = lightGrad;
        ctx.beginPath();
        ctx.moveTo(x + 10, y - 26);
        ctx.lineTo(x - 16, y + 12);
        ctx.lineTo(x + 44, y + 12);
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

        const jw = 76;
        const jh = 88;
        const jx = x - jw * 0.5;
        const jy = y - jh;

        // 1. Wooden Outer Rounded Frame
        ctx.fillStyle = '#3a1b0b'; // dark mahogany
        ctx.beginPath();
        ctx.roundRect(jx, jy, jw, jh, [18, 18, 4, 4]);
        ctx.fill();

        // Brass/Gold Outer Border
        ctx.strokeStyle = this.palette.warmGold;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Inner dark polished body
        ctx.fillStyle = this.palette.midnightPurple;
        ctx.beginPath();
        ctx.roundRect(jx + 5, jy + 6, jw - 10, jh - 12, [14, 14, 2, 2]);
        ctx.fill();

        // 2. Neon Tubes (Cyan & Violet on side arches)
        const neonPulse = isPowered ? (Math.sin(t * 3.5) * 0.2 + 0.8 + audioMetrics.energy * 0.5) : 0.15;
        ctx.lineWidth = 3;

        // Left Neon Tube (Cyan)
        ctx.strokeStyle = `rgba(71, 216, 242, ${neonPulse})`;
        ctx.beginPath();
        ctx.moveTo(jx + 9, jy + jh - 16);
        ctx.lineTo(jx + 9, jy + 24);
        ctx.quadraticCurveTo(jx + 12, jy + 10, jx + 22, jy + 8);
        ctx.stroke();

        // Right Neon Tube (Violet/Pink)
        ctx.strokeStyle = `rgba(242, 139, 189, ${neonPulse})`;
        ctx.beginPath();
        ctx.moveTo(jx + jw - 9, jy + jh - 16);
        ctx.lineTo(jx + jw - 9, jy + 24);
        ctx.quadraticCurveTo(jx + jw - 12, jy + 10, jx + jw - 22, jy + 8);
        ctx.stroke();

        // 3. Top Earth Emblem / Coin Slot
        ctx.fillStyle = this.palette.warmGold;
        ctx.beginPath();
        ctx.arc(jx + jw * 0.5, jy + 12, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#26134d';
        ctx.beginPath();
        ctx.arc(jx + jw * 0.5, jy + 12, 5, 0, Math.PI * 2);
        ctx.fill();
        // Mini globe cross inside emblem
        ctx.fillStyle = this.palette.electricBlue;
        ctx.fillRect(jx + jw * 0.5 - 3, jy + 11, 6, 2);

        // 4. Curved Glass Display (Viewing Window)
        const glassX = jx + 14;
        const glassY = jy + 22;
        const glassW = jw - 28;
        const glassH = 34;

        ctx.fillStyle = '#0f081c';
        ctx.fillRect(glassX, glassY, glassW, glassH);
        ctx.strokeStyle = '#553773';
        ctx.lineWidth = 1;
        ctx.strokeRect(glassX, glassY, glassW, glassH);

        // Visible Spinning Vinyl Record inside glass
        const vCenter = { x: glassX + glassW * 0.5, y: glassY + glassH * 0.5 };
        const vRadius = 14;

        // Vinyl disc
        ctx.fillStyle = '#111115';
        ctx.beginPath();
        ctx.arc(vCenter.x, vCenter.y, vRadius, 0, Math.PI * 2);
        ctx.fill();

        // Grooves
        ctx.strokeStyle = '#282830';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(vCenter.x, vCenter.y, vRadius - 3, 0, Math.PI * 2);
        ctx.arc(vCenter.x, vCenter.y, vRadius - 6, 0, Math.PI * 2);
        ctx.stroke();

        // Center Record Label (Color matches active record)
        let labelColor = '#47d8f2';
        if (activeRecord === 'forest') labelColor = this.palette.earthGreen;
        else if (activeRecord === 'ocean') labelColor = this.palette.electricBlue;
        else if (activeRecord === 'atmosphere') labelColor = this.palette.softPink;
        else if (activeRecord === 'earth') labelColor = this.palette.warmGold;

        ctx.fillStyle = labelColor;
        ctx.beginPath();
        ctx.arc(vCenter.x, vCenter.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Spinning indicator / tonearm needle
        if (isPlaying && !isPaused) {
            const rotAngle = (t * 8) % (Math.PI * 2);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(vCenter.x, vCenter.y);
            ctx.lineTo(vCenter.x + Math.cos(rotAngle) * 4, vCenter.y + Math.sin(rotAngle) * 4);
            ctx.stroke();
        }

        // Metal Tonearm
        ctx.strokeStyle = '#c2a868';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(glassX + glassW - 4, glassY + 4);
        ctx.lineTo(glassX + glassW - 7, glassY + 12);
        if (isPlaying || isPaused) {
            ctx.lineTo(vCenter.x + 6, vCenter.y); // Needle on record
        } else {
            ctx.lineTo(glassX + glassW - 6, glassY + 24); // Tonearm parked
        }
        ctx.stroke();

        // Glass reflection glare line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(glassX + 3, glassY + glassH - 4);
        ctx.lineTo(glassX + 16, glassY + 4);
        ctx.stroke();

        // 5. Digital Display: reads "EARTH ARCHIVE" or record name
        const dispX = jx + 14;
        const dispY = jy + 59;
        const dispW = jw - 28;
        const dispH = 10;

        ctx.fillStyle = '#06020c';
        ctx.fillRect(dispX, dispY, dispW, dispH);

        if (isPowered) {
            ctx.fillStyle = this.palette.electricBlue;
            ctx.font = '6px "Courier New", monospace';
            ctx.textAlign = 'center';

            let displayText = 'EARTH ARCHIVE';
            if (isPlaying) {
                if (activeRecord === 'forest') displayText = '001 FOREST';
                else if (activeRecord === 'ocean') displayText = '002 OCEAN';
                else if (activeRecord === 'atmosphere') displayText = '003 ATMOSPHERE';
                else if (activeRecord === 'earth') displayText = '004 EARTH';
            } else if (isPaused) {
                displayText = '[PAUSED]';
            }
            ctx.fillText(displayText, dispX + dispW * 0.5, dispY + 7);
        }

        // 6. Central Selector Dial & 6 glowing selection buttons
        const dialX = jx + jw * 0.5;
        const dialY = jy + 76;

        // Dial
        ctx.fillStyle = this.palette.warmGold;
        ctx.beginPath();
        ctx.arc(dialX, dialY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#26134d';
        ctx.beginPath();
        ctx.arc(dialX, dialY, 2, 0, Math.PI * 2);
        ctx.fill();

        // 6 small record buttons (3 on left, 3 on right)
        const btnColors = ['#62c98a', '#47d8f2', '#f28bbd', '#ffca72', '#a67c52', '#8c52ff'];
        for (let b = 0; b < 6; b++) {
            const bx = (b < 3) ? (jx + 15 + b * 6) : (jx + jw - 27 + (b - 3) * 6);
            ctx.fillStyle = isPowered ? btnColors[b] : '#331f47';
            ctx.fillRect(bx, jy + 74, 4, 4);
        }

        // 7. Holographic Projection Above Jukebox if record is playing
        if (isPlaying && !isPaused && activeRecord) {
            this.drawRecordHologram(x, jy - 10, activeRecord, audioMetrics);
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
            // Record 001: Holographic miniature forest with fluttering birds
            const hx = x;
            const hy = y - 35;

            // Mini trees
            ctx.strokeStyle = '#62c98a';
            ctx.lineWidth = 1.5;
            for (let i = -2; i <= 2; i++) {
                const tx = hx + i * 14;
                const th = 22 - Math.abs(i) * 3 + Math.sin(t * 3 + i) * 3;
                ctx.beginPath();
                ctx.moveTo(tx, hy);
                ctx.lineTo(tx, hy - th);
                ctx.stroke();

                ctx.fillStyle = 'rgba(98, 201, 138, 0.7)';
                ctx.beginPath();
                ctx.arc(tx, hy - th, 5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Flying bird silhouette
            const bx = hx + Math.sin(t * 1.5) * 28;
            const by = hy - 32 + Math.cos(t * 2) * 6;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(bx - 4, by - 2);
            ctx.lineTo(bx, by);
            ctx.lineTo(bx + 4, by - 2);
            ctx.stroke();

        } else if (recordKey === 'ocean') {
            // Record 002: Miniature ocean wave spectrum reacting to NASA data
            const hx = x;
            const hy = y - 30;

            ctx.strokeStyle = this.palette.electricBlue;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(hx - 35, hy);

            for (let ox = -35; ox <= 35; ox += 5) {
                const waveHeight = Math.sin(t * 4 + ox * 0.2) * (6 + energy * 12);
                ctx.lineTo(hx + ox, hy + waveHeight);
            }
            ctx.stroke();

            // Water droplet spray
            ctx.fillStyle = '#b3f7ff';
            for (let i = 0; i < 4; i++) {
                const sx = hx + Math.sin(t * 5 + i * 2) * 20;
                const sy = hy - 10 - (t * 20 + i * 8) % 18;
                ctx.fillRect(sx, sy, 2, 2);
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

    // Eli — Human Teacher / Astronaut
    drawEli(x, y, state = 'idle', facing = 1, isCarrying = false) {
        const ctx = this.ctx;
        const t = this.animTime;

        ctx.save();
        ctx.translate(x, y);
        if (facing < 0) {
            ctx.scale(-1, 1);
        }

        // Bobbing & leg swing
        let walkOffset = 0;
        let legL = 0;
        let legR = 0;

        if (state === 'walk') {
            walkOffset = Math.sin(t * 12) * 1.5;
            legL = Math.sin(t * 12) * 5;
            legR = -Math.sin(t * 12) * 5;
        } else if (state === 'kneel') {
            // Kneeling down to inspect
            walkOffset = 8;
        }

        const by = -walkOffset;

        // Life support backpack
        ctx.fillStyle = '#6b5c82';
        ctx.fillRect(-11, by - 36, 7, 22);
        ctx.fillStyle = '#47d8f2';
        ctx.fillRect(-10, by - 32, 5, 2); // oxygen gauge

        // Legs
        if (state === 'kneel') {
            ctx.fillStyle = '#dcd3e8';
            ctx.fillRect(-5, by - 12, 14, 6);
            ctx.fillStyle = '#26134d'; // boot
            ctx.fillRect(4, by - 6, 8, 6);
        } else {
            // Left leg
            ctx.fillStyle = '#dcd3e8';
            ctx.fillRect(-6 + legL * 0.4, by - 14, 5, 12);
            ctx.fillStyle = '#26134d'; // boot
            ctx.fillRect(-7 + legL * 0.4, by - 3, 7, 4);

            // Right leg
            ctx.fillStyle = '#ece4f7';
            ctx.fillRect(1 + legR * 0.4, by - 14, 5, 12);
            ctx.fillStyle = '#26134d';
            ctx.fillRect(0 + legR * 0.4, by - 3, 7, 4);
        }

        // White/Light Violet Astronaut Suit Body
        ctx.fillStyle = '#ece4f7';
        ctx.fillRect(-6, by - 34, 14, 20);
        // Chest emblem (Blue Earth patch)
        ctx.fillStyle = this.palette.electricBlue;
        ctx.fillRect(-1, by - 30, 4, 4);

        // Arms
        if (isCarrying) {
            // Arms holding jukebox out front
            ctx.fillStyle = '#ece4f7';
            ctx.fillRect(4, by - 28, 12, 5);
            ctx.fillRect(12, by - 26, 4, 8);
            // Draw small carried jukebox
            ctx.fillStyle = '#663b14';
            ctx.fillRect(14, by - 32, 14, 16);
            ctx.fillStyle = '#ffd15c';
            ctx.fillRect(15, by - 31, 12, 3);
        } else if (state === 'kneel') {
            ctx.fillStyle = '#ece4f7';
            ctx.fillRect(4, by - 26, 8, 14);
        } else {
            ctx.fillStyle = '#ece4f7';
            const armSwing = (state === 'walk') ? -legL * 0.6 : 0;
            ctx.fillRect(-2 + armSwing, by - 32, 4, 14);
        }

        // Helmet & Visor
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(-7, by - 48, 16, 15, 5);
        ctx.fill();

        // Glowing Golden Visor
        ctx.fillStyle = this.palette.warmGold;
        ctx.beginPath();
        ctx.roundRect(0, by - 45, 8, 9, 3);
        ctx.fill();
        // Visor reflection
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(1, by - 44, 2, 4);

        ctx.restore();
    }

    // Koru — The Alien Friend (Friendly, rock-like alien with expressive glowing eyes)
    drawKoru(x, y, state = 'idle', facing = 1) {
        const ctx = this.ctx;
        const t = this.animTime;

        ctx.save();
        ctx.translate(x, y);
        if (facing < 0) {
            ctx.scale(-1, 1);
        }

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

    // The Little Ones — The Rock Students
    drawLittleOnes(time) {
        const t = this.animTime;

        // Little Rock 1: Bouncing & attentive with big eyes (Sitting at stone 1)
        this.drawLittleStudent(140, this.height * 0.74, 1, Math.sin(t * 5) * 3);

        // Little Rock 2: Trying to stack smaller rocks on top of each other!
        this.drawLittleStudent(200, this.height * 0.75, 2, 0);

        // Little Rock 3: Sleeping peacefully with animated "Zzz"
        this.drawLittleStudent(260, this.height * 0.73, 3, 0);
    }

    drawLittleStudent(x, y, id, bounce) {
        const ctx = this.ctx;
        const t = this.animTime;
        const sy = y - 10 - bounce;

        // Little rock body
        ctx.fillStyle = (id === 1) ? '#72608c' : (id === 2 ? '#5d4f73' : '#8572a1');
        ctx.beginPath();
        ctx.roundRect(x - 9, sy - 14, 18, 15, 6);
        ctx.fill();

        if (id === 1) {
            // Little Rock 1: Big curious eyes
            ctx.fillStyle = this.palette.warmGold;
            ctx.fillRect(x - 5, sy - 10, 4, 4);
            ctx.fillRect(x + 2, sy - 10, 4, 4);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x - 4, sy - 9, 2, 2);
            ctx.fillRect(x + 3, sy - 9, 2, 2);
        } else if (id === 2) {
            // Little Rock 2: Rock stacking
            ctx.fillStyle = this.palette.electricBlue;
            ctx.fillRect(x - 4, sy - 8, 3, 3);
            ctx.fillRect(x + 2, sy - 8, 3, 3);

            // Stacked pebbles in front
            const stackWobble = Math.sin(t * 3) * 1.5;
            ctx.fillStyle = '#a694bf';
            ctx.fillRect(x + 12, sy, 6, 4);
            ctx.fillRect(x + 13 + stackWobble * 0.5, sy - 4, 4, 4);
            ctx.fillRect(x + 14 + stackWobble, sy - 7, 3, 3);
        } else if (id === 3) {
            // Little Rock 3: Closed sleeping eyes (- -)
            ctx.strokeStyle = '#3d2b52';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x - 5, sy - 7);
            ctx.lineTo(x - 1, sy - 7);
            ctx.moveTo(x + 2, sy - 7);
            ctx.lineTo(x + 6, sy - 7);
            ctx.stroke();

            // Floating "z Z z"
            const zAlpha = (Math.sin(t * 2) * 0.4 + 0.6);
            ctx.fillStyle = `rgba(179, 247, 255, ${zAlpha})`;
            ctx.font = '8px "Courier New", monospace';
            const zOffset = (t * 8) % 18;
            ctx.fillText('z', x + 8, sy - 12 - zOffset * 0.5);
            ctx.fillText('Z', x + 12, sy - 18 - zOffset);
        }
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
