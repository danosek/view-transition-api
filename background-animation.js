document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('mushroom-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    let width, height;
    let entities = [];
    let lastTime = 0;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    // === BÁZOVÁ TŘÍDA ===
    class Entity {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            // Hloubka (0.0 vzadu, 1.0 vepředu)
            this.depthFactor = (this.y - (height * 0.2)) / (height * 0.8);
            // Škálování podle hloubky
            this.scale = 0.5 + (this.depthFactor * 1.0); 
            
            this.lifePhase = 'growing'; 
            this.opacity = 0;
            // Věci vzadu jsou světlejší (atmosférická perspektiva)
            this.maxOpacity = 0.4 + (this.depthFactor * 0.6); 
            
            this.markedForDeletion = false;
        }

        setupContext(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            const style = getComputedStyle(canvas);
            ctx.strokeStyle = style.color || '#aaaaaa';
            
            ctx.lineWidth = 1 * this.scale;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = this.opacity;
        }

        draw(ctx) { /* Override */ }
        update() { /* Override */ return !this.markedForDeletion; }
    }

    // === ROSTLINY (Stojí na místě) ===
    class Plant extends Entity {
        constructor(x, y) {
            super(x, y);
            this.growthProgress = 0;
            this.growthSpeed = random(0.005, 0.010);
            this.sustainTime = random(5000, 12000); // Stromy a houby drží déle
            this.spawnTime = performance.now();
            this.totalPathLength = 100; 
        }

        update(currentTime) {
            if (this.lifePhase === 'growing') {
                this.opacity = this.maxOpacity;
                this.growthProgress += this.growthSpeed;
                if (this.growthProgress >= 1) {
                    this.growthProgress = 1;
                    this.lifePhase = 'sustained';
                    this.spawnTime = currentTime;
                }
            } else if (this.lifePhase === 'sustained') {
                if (currentTime - this.spawnTime > this.sustainTime) {
                    this.lifePhase = 'fading';
                }
            } else if (this.lifePhase === 'fading') {
                this.opacity -= 0.005;
                if (this.opacity <= 0) this.markedForDeletion = true;
            }
            return !this.markedForDeletion;
        }

        draw(ctx) {
            this.setupContext(ctx);
            this.drawPath(ctx);
            
            // Efekt postupného kreslení
            const currentLength = this.totalPathLength * this.growthProgress;
            ctx.setLineDash([currentLength, this.totalPathLength + 500]);
            
            ctx.stroke();
            ctx.restore();
        }
        
        drawPath(ctx) {}
    }

    class Grass extends Plant {
        constructor(x, y) {
            super(x, y);
            this.totalPathLength = 80 * this.scale;
            this.radius = 15 * this.scale; 
        }
        drawPath(ctx) {
            const s = this.scale;
            ctx.beginPath();
            ctx.moveTo(0,0);
            ctx.quadraticCurveTo(-5*s, -20*s, -12*s, -35*s); 
            ctx.moveTo(0,0);
            ctx.quadraticCurveTo(5*s, -25*s, 10*s, -40*s); 
        }
    }

    class Mushroom extends Plant {
        constructor(x, y) {
            super(x, y);
            this.totalPathLength = 350 * this.scale;
            this.radius = 30 * this.scale; 
            this.type = Math.floor(random(0, 3));
            this.widthVar = random(0.8, 1.2);
        }
        drawPath(ctx) {
            const s = this.scale;
            const w = this.widthVar;
            ctx.beginPath();
            ctx.moveTo(0,0);
            
            if(this.type === 0) { // Klasik
                ctx.quadraticCurveTo(-5*s, -40*s, -8*s, -90*s);
                ctx.bezierCurveTo(-45*s*w, -90*s, -35*s*w, -140*s, 0, -140*s);
                ctx.bezierCurveTo(35*s*w, -140*s, 45*s*w, -90*s, 8*s, -90*s);
                ctx.quadraticCurveTo(5*s, -40*s, 0, 0);
            } else if (this.type === 1) { // Deštník
                ctx.quadraticCurveTo(-3*s, -30*s, -4*s, -70*s);
                ctx.bezierCurveTo(-55*s*w, -70*s, -45*s*w, -100*s, 0, -105*s);
                ctx.bezierCurveTo(45*s*w, -100*s, 55*s*w, -70*s, 4*s, -70*s);
                ctx.quadraticCurveTo(3*s, -30*s, 0, 0);
            } else { // Dvojče
                 ctx.quadraticCurveTo(-2*s, -15*s, -6*s, -35*s);
                 ctx.arc(-6*s, -35*s, 12*s, 0, Math.PI, true);
                 ctx.moveTo(0,0);
                 ctx.quadraticCurveTo(8*s, -20*s, 12*s, -45*s);
                 ctx.arc(12*s, -45*s, 10*s, 0, Math.PI, true);
            }
        }
    }

    // === NOVÁ TŘÍDA: STROM ===
    class Tree extends Plant {
        constructor(x, y) {
            super(x, y);
            this.totalPathLength = 800 * this.scale;
            // Stromy potřebují hodně místa kolem sebe
            this.radius = 70 * this.scale; 
            this.wind = random(-15, 15); // Náhodné ohnutí větrem
        }
        drawPath(ctx) {
            const s = this.scale;
            const w = this.wind;
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            
            // Kresleno jedním tahem (tam a zpět)
            // Kmen
            ctx.quadraticCurveTo(5*s, -60*s, 0+w*0.3, -120*s);
            
            // Levá větev
            ctx.quadraticCurveTo(-30*s, -140*s, -50*s+w, -170*s); // Tam
            ctx.quadraticCurveTo(-25*s, -150*s, 0+w*0.3, -120*s); // Zpět
            
            // Pokračování kmenu
            ctx.quadraticCurveTo(5*s, -180*s, 0+w*0.6, -240*s);
            
            // Pravá větev
            ctx.quadraticCurveTo(30*s, -260*s, 50*s+w, -290*s); // Tam
            ctx.quadraticCurveTo(25*s, -270*s, 0+w*0.6, -240*s); // Zpět
            
            // Špička
            ctx.quadraticCurveTo(-10*s+w, -300*s, 0+w, -360*s);
            
            // Návrat dolů (jen vizuální uzavření kmene, není nutné pro line-art, ale vypadá lépe)
            ctx.quadraticCurveTo(15*s+w*0.5, -180*s, 20*s, 0);
        }
    }

    // === BROUČCI (Nové varianty bez hlav) ===
    class Bug extends Entity {
        constructor() {
            const startLeft = Math.random() > 0.5;
            const y = random(height * 0.4, height * 0.95);
            const x = startLeft ? -60 : width + 60;
            
            super(x, y);
            
            this.direction = startLeft ? 1 : -1;
            this.speed = random(0.4, 0.9) * this.scale; 
            this.walkOffset = 0;
            this.radius = 0; 
            this.lifePhase = 'walking';
            
            // Varianta brouka: 0=Bochánek, 1=Stonožka, 2=Pavouček
            this.variant = Math.floor(random(0, 3));
        }

        update() {
            // Fade in/out na krajích
            if ((this.direction === 1 && this.x < 50) || (this.direction === -1 && this.x > width - 50)) {
                this.opacity = Math.min(this.opacity + 0.02, this.maxOpacity);
            } else if ((this.direction === 1 && this.x > width - 50) || (this.direction === -1 && this.x < 50)) {
                this.opacity -= 0.02;
            } else {
                this.opacity = this.maxOpacity;
            }

            this.x += this.speed * this.direction;
            this.walkOffset += 0.25; // Rychlost kmitání nohou
            
            if (this.opacity <= 0 && ((this.direction === 1 && this.x > width) || (this.direction === -1 && this.x < 0))) {
                this.markedForDeletion = true;
            }
            return !this.markedForDeletion;
        }

        draw(ctx) {
            this.setupContext(ctx);
            const s = this.scale;
            const legWiggle = Math.sin(this.walkOffset) * 4 * s;
            const legWiggleAlt = Math.cos(this.walkOffset) * 4 * s;

            ctx.scale(this.direction, 1); 
            ctx.beginPath();
            
            if (this.variant === 0) { 
                // === BOCHÁNEK (Klasický brouk) ===
                // Tělíčko (půlkruh)
                ctx.arc(0, -8*s, 10*s, Math.PI, 0);
                ctx.lineTo(-10*s, -8*s);
                // Nohy (2 páry)
                ctx.moveTo(5*s, -8*s); ctx.quadraticCurveTo(8*s, -2*s, 12*s + legWiggle, 0);
                ctx.moveTo(-5*s, -8*s); ctx.quadraticCurveTo(-8*s, -2*s, -12*s - legWiggle, 0);
            
            } else if (this.variant === 1) { 
                // === STONOŽKA (Dlouhá nízká) ===
                // Tělíčko (dlouhý ovál)
                ctx.moveTo(-15*s, -6*s);
                ctx.quadraticCurveTo(0, -12*s, 15*s, -6*s); // Horní oblouk
                ctx.lineTo(15*s, -6*s);
                // Nohy (3 páry)
                ctx.moveTo(10*s, -6*s); ctx.lineTo(12*s + legWiggle, 0);
                ctx.moveTo(0, -8*s);    ctx.lineTo(0 + legWiggleAlt, 0);
                ctx.moveTo(-10*s, -6*s); ctx.lineTo(-12*s + legWiggle, 0);

            } else { 
                // === PAVOUČEK (Vysoký) ===
                // Tělíčko (malá kulička nahoře)
                ctx.arc(0, -15*s, 6*s, 0, Math.PI*2);
                // Nohy (dlouhé lomené)
                ctx.moveTo(2*s, -15*s); ctx.lineTo(10*s, -20*s + legWiggle); ctx.lineTo(14*s, 0);
                ctx.moveTo(-2*s, -15*s); ctx.lineTo(-10*s, -20*s + legWiggleAlt); ctx.lineTo(-14*s, 0);
            }

            ctx.stroke();
            ctx.restore();
        }
    }

    // === LOGIKA KOLIZÍ ===
    function checkCollision(x, y, radius) {
        for (let ent of entities) {
            if (ent instanceof Bug) continue;
            
            const dx = x - ent.x;
            const dy = y - ent.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            // Součet poloměrů určuje minimální vzdálenost
            if (distance < (radius + ent.radius)) {
                return true;
            }
        }
        return false;
    }

    // === HLAVNÍ LOOP ===
    function animate(currentTime) {
        ctx.clearRect(0, 0, width, height);

        // 1. Spawnování Rostlin (Stromy, Houby, Tráva)
        // Méně entit pro čistší vzhled (cca 30-35)
        if (entities.filter(e => e instanceof Plant).length < 35) {
            let attempt = 0;
            let spawned = false;
            
            while (attempt < 15 && !spawned) {
                const x = random(60, width - 60);
                const y = random(height * 0.3, height * 0.95);
                
                // Výběr typu (vážený):
                const rand = Math.random();
                let candidate;
                
                if (rand < 0.08) { 
                    candidate = new Tree(x, y); // 8% šance na Strom
                } else if (rand < 0.40) {
                    candidate = new Mushroom(x, y); // 32% šance na Houbu
                } else {
                    candidate = new Grass(x, y); // 60% šance na Trávu
                }
                
                // Zkontrolujeme místo (s rezervou 1.2x)
                if (!checkCollision(x, y, candidate.radius * 1.2)) {
                    entities.push(candidate);
                    spawned = true;
                }
                attempt++;
            }
        }

        // 2. Spawnování Brouků (nezávisle)
        if (Math.random() < 0.008 && entities.filter(e => e instanceof Bug).length < 4) {
            entities.push(new Bug());
        }

        // Z-Sorting (aby věci vepředu byly přes věci vzadu)
        entities.sort((a, b) => a.y - b.y);

        entities = entities.filter(entity => {
            const isAlive = entity.update(currentTime);
            if (isAlive) entity.draw(ctx);
            return isAlive;
        });

        lastTime = currentTime;
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
});