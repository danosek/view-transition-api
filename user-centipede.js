/**
 * user-centipede.js
 * Vyladěná stonožka: Menší hitbox, Kanibalismus (self-damage)
 */

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'user-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    
    let computedStyle = getComputedStyle(document.body);
    let strokeColor = '#aaaaaa'; 
    let bgColor = '#121212';
    
    let score = 0;
    let scoreOpacity = 0;
    let damageFlash = 0; 

    const updateColor = () => {
        const tempDiv = document.createElement('div');
        tempDiv.style.color = 'var(--text-secondary)'; 
        document.body.appendChild(tempDiv);
        const style = getComputedStyle(tempDiv);
        if(style.color) strokeColor = style.color;
        let bg = getComputedStyle(document.body).backgroundColor;
        if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') bgColor = bg;
        else { bg = getComputedStyle(document.documentElement).backgroundColor; if (bg !== 'rgba(0, 0, 0, 0)') bgColor = bg; }
        document.body.removeChild(tempDiv);
    };
    updateColor();

    let width, height;
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        updateColor();
    }
    window.addEventListener('resize', resize);
    resize();

    window.addEventListener('bugEscaped', (e) => {
        score -= e.detail.points; 
        scoreOpacity = 2.0;
    });

    const keys = { ArrowUp:false, ArrowDown:false, ArrowLeft:false, ArrowRight:false, w:false, s:false, a:false, d:false };
    window.addEventListener('keydown', (e) => { if(keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.key.toLowerCase())) { keys[e.key]=true; if(e.key.startsWith('Arrow')) e.preventDefault(); } });
    window.addEventListener('keyup', (e) => { if(keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key]=false; });

    class Centipede {
        constructor() {
            this.x = width / 2; this.y = height - 100;
            this.segmentCount = 8; this.segments = []; this.gap = 18; 
            for (let i = 0; i < this.segmentCount; i++) this.segments.push({ x: this.x, y: this.y + i * 5 });
            this.speed = 4.0; this.walkCycle = 0; this.moving = false;
            this.recoilTimer = 0; this.recoilDir = {x:0, y:0};
        }

        grow() {
            const tail = this.segments[this.segments.length - 1];
            this.segments.push({ x: tail.x, y: tail.y });
        }

        takeDamage(sourceX, sourceY) {
            if (this.recoilTimer > 0) return; 
            const dx = this.segments[0].x - sourceX;
            const dy = this.segments[0].y - sourceY;
            const len = Math.sqrt(dx*dx + dy*dy) || 1;
            this.recoilDir = { x: dx/len, y: dy/len };
            this.recoilTimer = 20; 
            score -= 50; scoreOpacity = 2.0; damageFlash = 1.0; 
        }

        update() {
            const head = this.segments[0];
            const depthFactor = Math.max(0.2, head.y / height);
            const lengthPenalty = Math.max(0.5, 1 - (this.segments.length * 0.01));
            const currentSpeed = this.speed * depthFactor * 1.5 * lengthPenalty;

            let dx = 0; let dy = 0; this.moving = false;
            if (this.recoilTimer > 0) {
                this.recoilTimer--; dx = this.recoilDir.x * 2; dy = this.recoilDir.y * 2; this.moving = true;
            } else {
                if (keys.ArrowUp || keys.w) dy -= 1;
                if (keys.ArrowDown || keys.s) dy += 1;
                if (keys.ArrowLeft || keys.a) dx -= 1;
                if (keys.ArrowRight || keys.d) dx += 1;
            }

            if (dx !== 0 || dy !== 0) {
                this.moving = true; this.walkCycle += 0.2;
                if (this.recoilTimer <= 0) { const length = Math.sqrt(dx*dx + dy*dy); dx /= length; dy /= length; }
                head.x += dx * currentSpeed; head.y += dy * currentSpeed;
                head.x = Math.max(0, Math.min(width, head.x)); head.y = Math.max(height * 0.2, Math.min(height, head.y));
            }

            for (let i = 1; i < this.segments.length; i++) {
                const prev = this.segments[i - 1]; const curr = this.segments[i];     
                const dx = prev.x - curr.x; const dy = prev.y - curr.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const angle = Math.atan2(dy, dx);
                const targetGap = this.gap * depthFactor;
                if (dist > targetGap) {
                    const moveDist = dist - targetGap;
                    curr.x += Math.cos(angle) * moveDist; curr.y += Math.sin(angle) * moveDist;
                }
            }
            
            // === NOVÉ: SAMO-POŠKOZENÍ (KANIBALISMUS) ===
            // Kontrolujeme kolizi hlavy s tělem (od 4. článku dál, abychom se nekousali do krku při zatáčení)
            if (this.recoilTimer <= 0 && this.segments.length > 5) {
                for (let i = 4; i < this.segments.length; i++) {
                    const seg = this.segments[i];
                    const dx = head.x - seg.x;
                    const dy = head.y - seg.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    
                    // Kolizní rádius těla
                    if (dist < 15 * depthFactor) {
                        this.takeDamage(seg.x, seg.y);
                        break; // Stačí jedno kousnutí
                    }
                }
            }

            // === LOVENÍ A KOLIZE ===
            if (window.forestEntities) {
                window.forestEntities.forEach(entity => {
                    if (entity.isBug && !entity.markedForDeletion) {
                        const dx = head.x - entity.x;
                        const dy = head.y - entity.y;
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        
                        // ZMĚNA: Menší rádius (25 místo 50). Musíš mířit přesněji hlavou.
                        const eatRadius = 25 * depthFactor; 

                        if (dist < eatRadius) {
                            if (entity.spiked) {
                                this.takeDamage(entity.x, entity.y);
                            } else {
                                entity.die(); 
                                score += (entity.points || 10);
                                scoreOpacity = 2.0; 
                                this.grow(); 
                            }
                        }
                    }
                });
            }
        }

        draw(ctx) {
            ctx.save();
            if (this.recoilTimer > 0 && Math.floor(Date.now() / 50) % 2 === 0) ctx.strokeStyle = '#ff5555';
            else ctx.strokeStyle = strokeColor;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = 1.0; 

            for (let i = this.segments.length - 1; i >= 0; i--) {
                const seg = this.segments[i];
                const scale = Math.max(0.2, seg.y / height);
                const segRadius = (i === 0 ? 14 : 10) * scale; 
                ctx.lineWidth = 1.5 * scale; ctx.beginPath();

                let angle;
                if (i > 0) angle = Math.atan2(seg.y - this.segments[i-1].y, seg.x - this.segments[i-1].x);
                else angle = Math.atan2(this.segments[1].y - seg.y, this.segments[1].x - seg.x) + Math.PI;

                const perpX = Math.cos(angle + Math.PI/2); const perpY = Math.sin(angle + Math.PI/2);
                const wiggle = this.moving ? Math.sin(this.walkCycle + i) * 5 * scale : 0;
                const legLen = 18 * scale;

                ctx.moveTo(seg.x + perpX * segRadius, seg.y + perpY * segRadius);
                ctx.quadraticCurveTo(seg.x + perpX*(segRadius+5*scale), seg.y + perpY*(segRadius+5*scale) - wiggle, seg.x + perpX*(segRadius+legLen) + (Math.cos(angle)*wiggle), seg.y + perpY*(segRadius+legLen) + (Math.sin(angle)*wiggle));
                ctx.moveTo(seg.x - perpX * segRadius, seg.y - perpY * segRadius);
                ctx.quadraticCurveTo(seg.x - perpX*(segRadius+5*scale), seg.y - perpY*(segRadius+5*scale) + wiggle, seg.x - perpX*(segRadius+legLen) + (Math.cos(angle)*wiggle), seg.y - perpY*(segRadius+legLen) + (Math.sin(angle)*wiggle));
                ctx.stroke();

                ctx.beginPath(); ctx.fillStyle = bgColor;
                ctx.arc(seg.x, seg.y, segRadius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

                if (i === 0) {
                    const eyeDist = 6 * scale; const eyeSize = 2 * scale;
                    const eyeX = Math.cos(angle + Math.PI/2); const eyeY = Math.sin(angle + Math.PI/2);
                    ctx.beginPath(); ctx.fillStyle = (this.recoilTimer > 0) ? '#ff5555' : strokeColor; 
                    ctx.arc(seg.x + eyeX * eyeDist + Math.cos(angle)*5*scale, seg.y + eyeY * eyeDist + Math.sin(angle)*5*scale, eyeSize, 0, Math.PI*2);
                    ctx.arc(seg.x - eyeX * eyeDist + Math.cos(angle)*5*scale, seg.y - eyeY * eyeDist + Math.sin(angle)*5*scale, eyeSize, 0, Math.PI*2);
                    ctx.fill();
                }
            }
            ctx.restore();
        }
    }

    const centipede = new Centipede();

    function drawUI() {
        if (scoreOpacity > 0.4) scoreOpacity -= 0.02;
        ctx.save();
        ctx.font = '200 48px sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
        if (damageFlash > 0 || score < 0) ctx.fillStyle = '#ff5555'; else ctx.fillStyle = strokeColor;
        ctx.globalAlpha = Math.min(1, scoreOpacity + (damageFlash > 0 ? 1 : 0)); 
        ctx.fillText(score, width - 40, 30);
        ctx.font = '300 14px sans-serif'; ctx.globalAlpha = 0.4;
        ctx.fillText('SCORE', width - 40, 80);
        ctx.restore();
        if (damageFlash > 0) { ctx.fillStyle = `rgba(255, 0, 0, ${damageFlash * 0.1})`; ctx.fillRect(0, 0, width, height); damageFlash -= 0.05; }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        centipede.update();
        centipede.draw(ctx);
        drawUI();
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
});