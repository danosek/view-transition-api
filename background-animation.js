/**
 * forest-illustration-clean.js
 * Elegantní, procedurální lesní ilustrace.
 * Důraz na čistotu, prostor a viditelný cyklus růstu a zániku.
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

    // --- ZÁKLADNÍ TŘÍDA ENTITY ---
    class Entity {
        constructor(x, y) {
            this.x = x; this.y = y;
            // Hloubka: 0 = vzadu (horizont), 1 = vpředu (dolní okraj)
            this.depthFactor = (this.y - (height * 0.1)) / (height * 0.9);
            this.depthFactor = Math.max(0, Math.min(1, this.depthFactor)); // Ořezání 0-1

            // Škálování: Větší rozdíl mezi popředím a pozadím pro lepší hloubku
            this.scale = 0.3 + (this.depthFactor * 1.0);

            this.lifePhase = 'growing';
            this.opacity = 0;
            // Max průhlednost: Věci vzadu jsou mnohem jemnější
            this.maxOpacity = 0.2 + (this.depthFactor * 0.6);
            this.markedForDeletion = false;
        }
        setupContext(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            const style = getComputedStyle(canvas);
            ctx.strokeStyle = style.color || '#aaaaaa';
            // Tloušťka čáry se výrazně mění s hloubkou
            ctx.lineWidth = (0.8 + (this.depthFactor * 1.2)) * this.scale;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = this.opacity;
        }
        update() { return !this.markedForDeletion; }
    }

    // --- ZÁKLADNÍ TŘÍDA ROSTLINY (Rychlejší cyklus) ---
    class Plant extends Entity {
        constructor(x, y) {
            super(x, y);
            this.growthProgress = 0;
            // Rychlejší růst
            this.growthSpeed = random(0.008, 0.015);
            // Mnohem kratší doba života v plné kráse = rychlejší obměna lesa
            this.sustainTime = random(3000, 8000);
            this.spawnTime = performance.now();
        }
        update(currentTime) {
            if (this.lifePhase === 'growing') {
                // Plynulý náběh průhlednosti
                this.opacity = Math.min(this.opacity + 0.015, this.maxOpacity);
                this.growthProgress += this.growthSpeed;
                if (this.growthProgress >= 1) {
                    this.growthProgress = 1;
                    this.lifePhase = 'sustained';
                    this.spawnTime = currentTime;
                }
            } else if (this.lifePhase === 'sustained') {
                if (currentTime - this.spawnTime > this.sustainTime) this.lifePhase = 'fading';
            } else if (this.lifePhase === 'fading') {
                // Plynulé mizení
                this.opacity -= 0.005;
                if (this.opacity <= 0) this.markedForDeletion = true;
            }
            return !this.markedForDeletion;
        }
        draw(ctx) {
            this.setupContext(ctx);
            ctx.beginPath();
            this.drawPath(ctx);
            const l = this.totalPathLength * this.growthProgress;
            // Vykreslení cesty pomocí dash array pro efekt růstu
            ctx.setLineDash([l, this.totalPathLength * 3]);
            ctx.stroke();
            ctx.restore();
        }
        drawPath(ctx) {}
    }

    // --- KONKRÉTNÍ DRUHY ROSTLIN ---

    class Grass extends Plant {
        constructor(x,y){
            super(x,y);
            this.totalPathLength=80*this.scale;
            this.radius=15*this.scale;
            this.bend = random(-10, 10);
        }
        drawPath(ctx){
            const s=this.scale; const b = this.bend * s;
            ctx.moveTo(0,0); ctx.quadraticCurveTo(b, -20*s, b*1.5 - 5*s, -40*s);
            ctx.moveTo(0,0); ctx.quadraticCurveTo(-b*0.5, -25*s, -b*1.2 + 5*s, -35*s);
        }
    }

    // Jednoduchá květina
    class Flower extends Plant {
        constructor(x,y){
            super(x,y);
            this.totalPathLength=120*this.scale;
            this.radius=20*this.scale;
            this.stemBend = random(-8, 8);
        }
        drawPath(ctx){
             const s=this.scale; const b = this.stemBend * s;
             ctx.moveTo(0,0); ctx.quadraticCurveTo(b, -40*s, 0, -80*s); // Stonek
             const headY = -80*s;
             ctx.moveTo(0 + 5*s, headY); ctx.arc(0, headY, 5*s, 0, Math.PI*2); // Střed
             // Jednoduché okvětní lístky (jen smyčky)
             ctx.moveTo(0, headY-5*s); ctx.bezierCurveTo(-15*s, headY-20*s, 15*s, headY-20*s, 0, headY-5*s);
             ctx.moveTo(0, headY+5*s); ctx.bezierCurveTo(-15*s, headY+20*s, 15*s, headY+20*s, 0, headY+5*s);
        }
    }

    // Kapradí (zjednodušené)
    class Fern extends Plant {
        constructor(x,y){
            super(x,y);
            this.totalPathLength=180*this.scale;
            this.radius=35*this.scale;
            this.bendDir = random(-1, 1) > 0 ? 1 : -1;
        }
        drawPath(ctx){
             const s=this.scale; const b = 40 * this.bendDir * s;
             ctx.moveTo(0,0); ctx.quadraticCurveTo(b, -80*s, b*1.2, -130*s);
             for(let i=1; i<=5; i++) {
                 const t = i/5; const cX = (b * t) + (b*0.2 * t*t); const cY = (-80*s * t) + (-50*s * t*t);
                 const fS = (1.1 - t) * 20 * s;
                 ctx.moveTo(cX, cY); ctx.quadraticCurveTo(cX - fS*0.8, cY - fS*0.5, cX - fS*1.2, cY - fS*0.2);
                 ctx.moveTo(cX, cY); ctx.quadraticCurveTo(cX + fS*0.8, cY - fS*0.5, cX + fS*1.2, cY - fS*0.2);
             }
        }
    }

    class Mushroom extends Plant {
        constructor(x,y){
            super(x,y);
            this.totalPathLength=300*this.scale; this.radius=25*this.scale; // Menší radius
            this.type=Math.floor(random(0,3)); this.w=random(0.9,1.1);
        }
        drawPath(ctx){
            const s=this.scale; const w=this.w;
            if(this.type===0){
                ctx.moveTo(0,0); ctx.quadraticCurveTo(-5*s,-40*s,-8*s,-90*s);
                ctx.bezierCurveTo(-40*s*w,-90*s,-30*s*w,-130*s,0,-130*s); ctx.bezierCurveTo(30*s*w,-130*s,40*s*w,-90*s,8*s,-90*s);
                ctx.quadraticCurveTo(5*s,-40*s,0,0);
            }else if(this.type===1){
                ctx.moveTo(0,0); ctx.quadraticCurveTo(-3*s,-30*s,-4*s,-70*s);
                ctx.bezierCurveTo(-50*s*w,-70*s,-40*s*w,-110*s,0,-115*s); ctx.bezierCurveTo(40*s*w,-110*s,50*s*w,-70*s,4*s,-70*s);
                ctx.quadraticCurveTo(3*s,-30*s,0,0);
            }else{
                ctx.moveTo(0,0); ctx.quadraticCurveTo(-2*s,-15*s,-5*s,-35*s); ctx.arc(-5*s,-35*s,10*s,0,Math.PI,true);
                ctx.moveTo(0,0); ctx.quadraticCurveTo(6*s,-20*s,10*s,-45*s); ctx.arc(10*s,-45*s,8*s,0,Math.PI,true);
            }
        }
    }

    class Tree extends Plant {
        constructor(x,y){
            super(x,y);
            this.totalPathLength=800*this.scale; this.radius=60*this.scale;
            this.wind=random(-10,10);
        }
        drawPath(ctx){
            // Návrat k původnímu designu holých větví - je to čistší
            const s=this.scale; const w=this.wind;
            ctx.moveTo(0,0); ctx.quadraticCurveTo(5*s,-60*s,0+w*0.3,-120*s); ctx.quadraticCurveTo(-30*s,-140*s,-50*s+w,-170*s); ctx.quadraticCurveTo(-25*s,-150*s,0+w*0.3,-120*s); ctx.quadraticCurveTo(5*s,-180*s,0+w*0.6,-240*s); ctx.quadraticCurveTo(30*s,-260*s,45*s+w,-280*s); ctx.quadraticCurveTo(25*s,-260*s,0+w*0.6,-240*s); ctx.quadraticCurveTo(-10*s+w,-290*s,0+w,-340*s); ctx.quadraticCurveTo(15*s+w*0.5,-180*s,20*s,0);
        }
    }

    // --- HLAVNÍ SMYČKA ---

    // Přísnější kontrola kolizí pro více prostoru
    function checkCollision(x, y, radius) {
        for (let ent of window.forestEntities) {
            const dx = x - ent.x; const dy = y - ent.y; const d = Math.sqrt(dx*dx + dy*dy);
            // Vyžadujeme více místa než je součet poloměrů (1.1 násobek)
            if (d < (radius * 1.1 + ent.radius * 1.1)) return true;
        } return false;
    }

    function animate(currentTime) {
        ctx.clearRect(0, 0, width, height);

        // SNÍŽENÝ LIMIT ROSTLIN (pro čistší vzhled)
        const PLANT_LIMIT = 75;

        if (window.forestEntities.length < PLANT_LIMIT) {
            let attempt = 0;
            // Méně pokusů o spawn za frame, aby se les nezahlstil naráz
            while (attempt < 3 && window.forestEntities.length < PLANT_LIMIT) {
                const x = random(width * 0.05, width * 0.95);
                // Spawnujeme v širším pásu Y pro lepší hloubku
                const y = random(height * 0.25, height * 0.95);

                const rand = Math.random();
                let candidate;
                // Větší šance na trávu a malé věci, menší na dominantní stromy
                if (rand < 0.06) candidate = new Tree(x, y);
                else if (rand < 0.25) candidate = new Mushroom(x, y);
                else if (rand < 0.40) candidate = new Fern(x, y);
                else if (rand < 0.55) candidate = new Flower(x, y);
                else candidate = new Grass(x, y);

                if (!checkCollision(x, y, candidate.radius)) {
                    window.forestEntities.push(candidate);
                    // Důležité: Sort podle Y zajistí správné překrývání (věci vpředu kresleny naposled)
                    window.forestEntities.sort((a, b) => a.y - b.y);
                }
                attempt++;
            }
        }

        window.forestEntities = window.forestEntities.filter(entity => {
            const isAlive = entity.update(currentTime);
            if (isAlive) entity.draw(ctx);
            return isAlive;
        });

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
});