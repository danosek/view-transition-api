/**
 * background-animation.js
 * Vyladěný ekosystém: Zpomalené fragmenty, kličkující pavouci, penalizace
 */

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('mushroom-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    window.forestEntities = []; 
    let width, height;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function random(min, max) { return Math.random() * (max - min) + min; }

    class Entity {
        constructor(x, y) {
            this.x = x; this.y = y;
            this.depthFactor = (this.y - (height * 0.2)) / (height * 0.8);
            this.scale = 0.5 + (this.depthFactor * 1.0); 
            this.lifePhase = 'growing'; this.opacity = 0;
            this.maxOpacity = 0.4 + (this.depthFactor * 0.6); 
            this.markedForDeletion = false;
        }
        setupContext(ctx) {
            ctx.save(); ctx.translate(this.x, this.y);
            const style = getComputedStyle(canvas);
            ctx.strokeStyle = style.color || '#aaaaaa';
            ctx.lineWidth = 1 * this.scale; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = this.opacity;
        }
        draw(ctx) { }
        update() { return !this.markedForDeletion; }
    }

    class Plant extends Entity {
        constructor(x, y) { super(x, y); this.growthProgress = 0; this.growthSpeed = random(0.005, 0.010); this.sustainTime = random(5000, 12000); this.spawnTime = performance.now(); }
        update(currentTime) {
            if (this.lifePhase === 'growing') {
                this.opacity = this.maxOpacity; this.growthProgress += this.growthSpeed;
                if (this.growthProgress >= 1) { this.growthProgress = 1; this.lifePhase = 'sustained'; this.spawnTime = currentTime; }
            } else if (this.lifePhase === 'sustained') {
                if (currentTime - this.spawnTime > this.sustainTime) this.lifePhase = 'fading';
            } else if (this.lifePhase === 'fading') {
                this.opacity -= 0.005; if (this.opacity <= 0) this.markedForDeletion = true;
            }
            return !this.markedForDeletion;
        }
        draw(ctx) {
            this.setupContext(ctx); this.drawPath(ctx);
            const l = this.totalPathLength * this.growthProgress;
            ctx.setLineDash([l, this.totalPathLength + 500]); ctx.stroke(); ctx.restore();
        }
        drawPath(ctx) {}
    }
    class Grass extends Plant { constructor(x,y){super(x,y); this.totalPathLength=80*this.scale; this.radius=15*this.scale;} drawPath(ctx){const s=this.scale; ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(-5*s,-20*s,-12*s,-35*s); ctx.moveTo(0,0); ctx.quadraticCurveTo(5*s,-25*s,10*s,-40*s);} }
    class Mushroom extends Plant { constructor(x,y){super(x,y); this.totalPathLength=350*this.scale; this.radius=30*this.scale; this.type=Math.floor(random(0,3)); this.w=random(0.8,1.2);} drawPath(ctx){const s=this.scale; const w=this.w; ctx.beginPath(); ctx.moveTo(0,0); if(this.type===0){ctx.quadraticCurveTo(-5*s,-40*s,-8*s,-90*s);ctx.bezierCurveTo(-45*s*w,-90*s,-35*s*w,-140*s,0,-140*s);ctx.bezierCurveTo(35*s*w,-140*s,45*s*w,-90*s,8*s,-90*s);ctx.quadraticCurveTo(5*s,-40*s,0,0);}else if(this.type===1){ctx.quadraticCurveTo(-3*s,-30*s,-4*s,-70*s);ctx.bezierCurveTo(-55*s*w,-70*s,-45*s*w,-100*s,0,-105*s);ctx.bezierCurveTo(45*s*w,-100*s,55*s*w,-70*s,4*s,-70*s);ctx.quadraticCurveTo(3*s,-30*s,0,0);}else{ctx.quadraticCurveTo(-2*s,-15*s,-6*s,-35*s);ctx.arc(-6*s,-35*s,12*s,0,Math.PI,true);ctx.moveTo(0,0);ctx.quadraticCurveTo(8*s,-20*s,12*s,-45*s);ctx.arc(12*s,-45*s,10*s,0,Math.PI,true);}} }
    class Tree extends Plant { constructor(x,y){super(x,y); this.totalPathLength=800*this.scale; this.radius=70*this.scale; this.wind=random(-15,15);} drawPath(ctx){const s=this.scale; const w=this.wind; ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(5*s,-60*s,0+w*0.3,-120*s); ctx.quadraticCurveTo(-30*s,-140*s,-50*s+w,-170*s); ctx.quadraticCurveTo(-25*s,-150*s,0+w*0.3,-120*s); ctx.quadraticCurveTo(5*s,-180*s,0+w*0.6,-240*s); ctx.quadraticCurveTo(30*s,-260*s,50*s+w,-290*s); ctx.quadraticCurveTo(25*s,-270*s,0+w*0.6,-240*s); ctx.quadraticCurveTo(-10*s+w,-300*s,0+w,-360*s); ctx.quadraticCurveTo(15*s+w*0.5,-180*s,20*s,0);} }

    class Bug extends Entity {
        constructor(x, y, isFragment = false) {
            const startLeft = Math.random() > 0.5;
            const spawnY = y || random(height * 0.4, height * 0.95);
            const spawnX = x || (startLeft ? -60 : width + 60);
            super(spawnX, spawnY);
            
            this.direction = startLeft ? 1 : -1;
            if (isFragment) this.direction = Math.random() > 0.5 ? 1 : -1;

            this.walkOffset = 0; this.radius = 20 * this.scale;
            this.isBug = true; this.isFragment = isFragment; 
            this.escaped = false;
            this.variant = isFragment ? 4 : Math.floor(random(0, 4));
            
            // Fragmenty jsou teď pomalejší (jen 1.2x base speed místo 2.5x)
            this.baseSpeed = random(0.4, 0.7) * (isFragment ? 1.2 : 1); 
            this.speed = this.baseSpeed * this.scale;
            
            this.points = 10; this.spiked = false; this.spikeTimer = 0; this.dashTimer = 0; this.ghostTimer = 0;

            if (this.variant === 0) { this.points = 30; this.speed *= 0.6; } // Obrněnec
            else if (this.variant === 1) { this.points = 15; } // Matka
            else if (this.variant === 2) { this.points = 20; this.baseOpacity = this.maxOpacity; } // Duch
            else if (this.variant === 3) { this.points = 25; } // Sprinter
            else if (this.variant === 4) { 
                this.points = 5; 
                this.scale *= 0.6; // Trochu větší než předtím
                this.radius *= 0.5;
            }
        }

        die() {
            this.markedForDeletion = true;
            if (this.variant === 1) { // Matka
                for(let i=0; i<4; i++) {
                    const fragment = new Bug(this.x, this.y, true);
                    fragment.direction = Math.random() > 0.5 ? 1 : -1;
                    fragment.y += random(-30, 30); // Větší rozptyl do výšky
                    // Rychlost fragmentů je teď variabilnější, aby se nelepily k sobě
                    fragment.speed = random(0.8, 2.0) * this.scale; 
                    window.forestEntities.push(fragment);
                }
            }
        }

        update() {
            // OBRNĚNEC
            if (this.variant === 0) {
                this.spikeTimer++;
                if (this.spikeTimer > 180) { this.spiked = !this.spiked; this.spikeTimer = 0; }
            }
            // DUCH
            if (this.variant === 2) {
                this.ghostTimer += 0.05;
                this.opacity = (Math.sin(this.ghostTimer) + 1.2) / 2.2 * this.maxOpacity;
                if(this.opacity < 0.1) this.opacity = 0.1;
                this.y += Math.sin(this.ghostTimer * 2) * 1.5 * this.scale;
            }
            // SPRINTER (PAVOUK) - Kličkování
            if (this.variant === 3) {
                this.dashTimer++;
                if (this.dashTimer > 120 && this.dashTimer < 160) {
                    // DASH
                    this.speed = this.baseSpeed * this.scale * 3.5;
                    // Kličkování nahoru a dolů během dashování
                    this.y += Math.sin(this.dashTimer) * 5 * this.scale;
                    
                    // Šance na změnu směru v půlce dashe (nepředvídatelnost)
                    if (this.dashTimer === 140 && Math.random() < 0.4) {
                        this.direction *= -1;
                    }
                } else {
                    this.speed = this.baseSpeed * this.scale;
                }
                if (this.dashTimer > 300) this.dashTimer = 0;
            }

            // OKRAJE A ÚTĚK
            // Fragmenty (variant 4) se nyní chovají jako normální brouci - penalizují, když utečou!
            if ((this.direction === 1 && this.x < 50) || (this.direction === -1 && this.x > width - 50)) {
                if (this.variant !== 2) this.opacity = Math.min(this.opacity + 0.02, this.maxOpacity);
            } else if ((this.direction === 1 && this.x > width - 50) || (this.direction === -1 && this.x < 50)) {
                if (this.variant !== 2) this.opacity -= 0.02;
                
                // DETEKCE ÚTĚKU
                if (!this.escaped && !this.markedForDeletion) {
                    this.escaped = true;
                    // I fragmenty teď posílají event o útěku!
                    const event = new CustomEvent('bugEscaped', { detail: { points: this.points } });
                    window.dispatchEvent(event);
                }
            } else {
               if (this.variant !== 2) this.opacity = this.maxOpacity;
            }

            this.x += this.speed * this.direction;
            this.walkOffset += this.speed * 0.5; 
            
            if (this.opacity <= 0 && ((this.direction === 1 && this.x > width) || (this.direction === -1 && this.x < 0))) {
                this.markedForDeletion = true;
            }
            return !this.markedForDeletion;
        }

        draw(ctx) {
            this.setupContext(ctx);
            const s = this.scale;
            const legWiggle = Math.sin(this.walkOffset) * 4 * s;
            ctx.scale(this.direction, 1); 
            if (this.variant === 0 && this.spiked) { ctx.translate(random(-1, 1), random(-1, 1)); ctx.strokeStyle = '#ff6b6b'; }

            ctx.beginPath();
            if (this.variant === 0) { // Obrněnec
                if (this.spiked) { ctx.moveTo(-10*s, -8*s); for(let i=-10; i<=10; i+=4) ctx.lineTo(i*s, -15*s); ctx.lineTo(10*s, -8*s); } 
                else { ctx.arc(0, -8*s, 10*s, Math.PI, 0); }
                ctx.lineTo(-10*s, -8*s); ctx.moveTo(5*s, -8*s); ctx.quadraticCurveTo(8*s, -2*s, 12*s + legWiggle, 0); ctx.moveTo(-5*s, -8*s); ctx.quadraticCurveTo(-8*s, -2*s, -12*s - legWiggle, 0);
            } else if (this.variant === 1) { // Matka
                ctx.moveTo(-15*s, -6*s); ctx.quadraticCurveTo(0, -12*s, 15*s, -6*s); ctx.lineTo(15*s, -6*s); ctx.moveTo(10*s, -6*s); ctx.lineTo(12*s + legWiggle, 0); ctx.moveTo(0, -8*s); ctx.lineTo(0 - legWiggle, 0); ctx.moveTo(-10*s, -6*s); ctx.lineTo(-12*s + legWiggle, 0); ctx.moveTo(15*s, -8*s); ctx.lineTo(20*s, -15*s);
            } else if (this.variant === 2) { // Duch
                ctx.arc(0, -15*s, 8*s, Math.PI, 0); const wave = Math.sin(this.walkOffset*0.5)*5*s; ctx.moveTo(-8*s, -15*s); ctx.bezierCurveTo(-5*s, -5*s, -5*s + wave, 0, 0, 5*s); ctx.moveTo(8*s, -15*s); ctx.bezierCurveTo(5*s, -5*s, 5*s + wave, 0, 0, 5*s);
            } else if (this.variant === 3) { // Sprinter
                ctx.arc(0, -12*s, 5*s, 0, Math.PI*2); ctx.moveTo(2*s, -12*s); ctx.lineTo(12*s, -20*s + legWiggle); ctx.lineTo(18*s, 0); ctx.moveTo(-2*s, -12*s); ctx.lineTo(-12*s, -20*s - legWiggle); ctx.lineTo(-18*s, 0);
            } else { // Fragment
                ctx.arc(0, -5*s, 4*s, 0, Math.PI*2); ctx.moveTo(0, -5*s); ctx.lineTo(legWiggle, 0);
            }
            ctx.stroke(); ctx.restore();
        }
    }

    function checkCollision(x, y, radius) {
        for (let ent of window.forestEntities) {
            if (ent.isBug) continue;
            const dx = x - ent.x; const dy = y - ent.y; const d = Math.sqrt(dx*dx + dy*dy);
            if (d < (radius + ent.radius)) return true;
        } return false;
    }

    function animate(currentTime) {
        ctx.clearRect(0, 0, width, height);
        if (window.forestEntities.filter(e => e instanceof Plant).length < 35) {
            let attempt = 0; let spawned = false;
            while (attempt < 15 && !spawned) {
                const x = random(60, width - 60); const y = random(height * 0.3, height * 0.95);
                const rand = Math.random(); let candidate;
                if (rand < 0.08) candidate = new Tree(x, y); else if (rand < 0.40) candidate = new Mushroom(x, y); else candidate = new Grass(x, y);
                if (!checkCollision(x, y, candidate.radius * 1.2)) { window.forestEntities.push(candidate); spawned = true; }
                attempt++;
            }
        }
        if (Math.random() < 0.012 && window.forestEntities.filter(e => e.isBug).length < 6) { window.forestEntities.push(new Bug()); }
        window.forestEntities.sort((a, b) => a.y - b.y);
        window.forestEntities = window.forestEntities.filter(entity => {
            const isAlive = entity.update(currentTime); if (isAlive) entity.draw(ctx); return isAlive;
        });
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
});