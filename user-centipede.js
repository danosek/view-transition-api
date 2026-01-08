// /**
//  * user-centipede.js -> NEON TUBE RUNNER v2
//  * UI Dock vpravo, barevné zóny (zrychlení/zpomalení), světlejší pozadí.
//  */

// document.addEventListener('DOMContentLoaded', () => {
//     const canvas = document.createElement('canvas');
//     canvas.id = 'user-canvas';
//     document.body.appendChild(canvas);
//     const ctx = canvas.getContext('2d', { alpha: false });

//     // --- BARVY A KONFIGURACE ---
//     let width, height;
//     let gameWidth, sidebarWidth;
    
//     // Paleta
//     const colors = {
//         bg: '#1a1a24',        // Světlejší "noc" (ne úplně černá)
//         uiBg: '#111118',      // Tmavší panel pro UI
//         grid: '#2a2a35',      // Barva mřížky v pozadí
//         wireframe: '#444455', // Barva kruhů tunelu
//         uiText: '#eeeeee',
//         red: '#ff2a2a',       // Smrt
//         yellow: '#ffd700',    // Zpomalení
//         green: '#00ff99',     // Zrychlení
//         ship: '#ffffff'
//     };

//     const resize = () => {
//         width = canvas.width = window.innerWidth;
//         height = canvas.height = window.innerHeight;
        
//         // Rozdělení: 75% hra, 25% UI (minimálně 250px)
//         sidebarWidth = Math.max(width * 0.25, 250);
//         gameWidth = width - sidebarWidth;
        
//         ctx.lineJoin = 'round';
//     };
//     window.addEventListener('resize', resize);
//     resize();

//     // --- OVLÁDÁNÍ ---
//     const keys = { ArrowLeft: false, ArrowRight: false, a: false, d: false, ' ': false };
    
//     window.addEventListener('keydown', (e) => {
//         if (keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key] = true;
//     });
//     window.addEventListener('keyup', (e) => {
//         if (keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key] = false;
//     });

//     // --- HERNÍ LOGIKA ---
    
//     class TunnelGame {
//         constructor() {
//             this.reset();
//         }

//         reset() {
//             this.segments = [];
//             this.segmentCount = 28; 
//             this.segmentDepth = 80; 
//             this.fov = 350; 
            
//             this.playerAngle = 0;
//             this.speed = 10;
//             this.baseSpeed = 10; // Cílová rychlost (pro návrat po zrychlení/zpomalení)
//             this.score = 0;
//             this.distance = 0;
//             this.gameOver = false;
//             this.rotationSpeed = 0;
//             this.effectMessage = ""; // Zpráva "BOOST!", "SLOW!"
//             this.effectTimer = 0;

//             // Inicializace tunelu (bezpečný start)
//             for (let i = 0; i < this.segmentCount; i++) {
//                 this.segments.push(this.createSegment(i * this.segmentDepth, true));
//             }
//         }

//         createSegment(z, safe = false) {
//             let obstacle = null;
            
//             // Logika generování překážek
//             if (!safe && Math.random() < 0.45) { // 45% šance na něco v segmentu
//                 const centerAngle = Math.random() * Math.PI * 2;
//                 const size = Math.random() * 1.2 + 0.6;
                
//                 // Typ překážky
//                 const rnd = Math.random();
//                 let type = 'red'; // Default smrt
//                 if (rnd > 0.75) type = 'yellow'; // 15% šance zpomalení
//                 if (rnd > 0.90) type = 'green';  // 10% šance zrychlení

//                 obstacle = {
//                     type: type,
//                     start: centerAngle - size/2,
//                     end: centerAngle + size/2,
//                     center: centerAngle
//                 };
//             }
//             return { z: z, obstacle: obstacle };
//         }

//         update() {
//             if (this.gameOver) {
//                  if (keys[' ']) this.restartWithTransition();
//                  return;
//             }

//             // Rotace
//             if (keys.ArrowLeft || keys.a) this.rotationSpeed -= 0.006;
//             if (keys.ArrowRight || keys.d) this.rotationSpeed += 0.006;
//             this.rotationSpeed *= 0.92; // Tlumení
//             this.playerAngle += this.rotationSpeed;
//             this.playerAngle = (this.playerAngle % (Math.PI * 2));
//             if (this.playerAngle < 0) this.playerAngle += Math.PI * 2;

//             // Rychlost a návrat k normálu
//             if (this.speed > this.baseSpeed) this.speed *= 0.99; // Zpomalování po boostu
//             if (this.speed < this.baseSpeed) this.speed += 0.1;  // Zrychlování po blátě
            
//             this.baseSpeed += 0.002; // Hra se časem zrychluje globálně
//             this.distance += this.speed;
//             this.score += Math.floor(this.speed / 5);

//             // UI Timer efektů
//             if (this.effectTimer > 0) this.effectTimer--;

//             // Posun segmentů
//             const lastZ = Math.max(...this.segments.map(s => s.z));
            
//             for (let i = 0; i < this.segments.length; i++) {
//                 let seg = this.segments[i];
//                 seg.z -= this.speed;

//                 if (seg.z < -this.fov) {
//                     seg.z = lastZ + this.segmentDepth; // Recyklace
//                     const newSegData = this.createSegment(seg.z);
//                     seg.obstacle = newSegData.obstacle;
//                 }

//                 // --- KOLIZE ---
//                 if (seg.z > -20 && seg.z < 20 && seg.obstacle) {
//                     // Výpočet relativního úhlu
//                     let relativeObstacleCenter = seg.obstacle.center - this.playerAngle;
//                     relativeObstacleCenter = Math.atan2(Math.sin(relativeObstacleCenter), Math.cos(relativeObstacleCenter));
//                     const playerPos = Math.PI / 2; // Hráč je dole
//                     const diff = Math.abs(relativeObstacleCenter - playerPos);
                    
//                     // Kontakt!
//                     if (diff < (seg.obstacle.end - seg.obstacle.start)/2) {
//                         this.handleCollision(seg.obstacle.type);
//                         // Odstraníme překážku po kolizi, aby neblikala
//                         seg.obstacle = null; 
//                     }
//                 }
//             }
//             this.segments.sort((a, b) => b.z - a.z);
//         }

//         handleCollision(type) {
//             if (type === 'red') {
//                 this.gameOver = true;
//                 if (document.startViewTransition) document.startViewTransition(() => {}); // Jen trigger pro efekt
//             } else if (type === 'yellow') {
//                 this.speed = 2; // Drastické zpomalení
//                 this.effectMessage = "SLOW DOWN!";
//                 this.effectTimer = 60;
//                 // Screen shake by šel přidat, ale nechme to čisté
//             } else if (type === 'green') {
//                 this.speed += 30; // Boost
//                 this.score += 500;
//                 this.effectMessage = "BOOST +500!";
//                 this.effectTimer = 60;
//             }
//         }

//         async restartWithTransition() {
//             if (document.startViewTransition) {
//                 const transition = document.startViewTransition(() => {
//                     this.reset();
//                 });
//                 await transition.finished;
//             } else {
//                 this.reset();
//             }
//         }

//         draw(ctx) {
//             // 1. Vykreslení Pozadí (Hra)
//             ctx.fillStyle = colors.bg;
//             ctx.fillRect(0, 0, gameWidth, height);

//             // Střed tunelu (v levé části obrazovky)
//             const cx = gameWidth / 2;
//             const cy = height / 2;

//             const project = (angle, z, radius) => {
//                 const scale = this.fov / (this.fov + z);
//                 const x = Math.cos(angle - this.playerAngle) * radius * scale;
//                 const y = Math.sin(angle - this.playerAngle) * radius * scale;
//                 return { x: cx + x, y: cy + y, scale: scale };
//             };

//             // 2. Vykreslení Tunelu
//             ctx.lineWidth = 2;
//             for (let i = 0; i < this.segments.length; i++) {
//                 const seg = this.segments[i];
//                 if (seg.z < -this.fov + 10) continue;

//                 const radius = 250;
//                 const alpha = Math.min(1, (1 - seg.z / (this.segmentCount * this.segmentDepth)) * 1.5);
//                 if (alpha <= 0) continue;

//                 // Kruh
//                 ctx.beginPath();
//                 ctx.strokeStyle = `rgba(68, 68, 85, ${alpha})`; // Barva wireframe
//                 for(let a=0; a<Math.PI*2; a+=0.3) {
//                    const p = project(a, seg.z, radius);
//                    if(a===0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
//                 }
//                 ctx.closePath();
//                 ctx.stroke();

//                 // Překážka / Zóna
//                 if (seg.obstacle) {
//                     const type = seg.obstacle.type;
//                     let color = colors.red;
//                     if (type === 'yellow') color = colors.yellow;
//                     if (type === 'green') color = colors.green;

//                     ctx.beginPath();
//                     ctx.strokeStyle = color;
//                     ctx.fillStyle = color; 
                    
//                     // U zón (žlutá/zelená) uděláme poloprůhlednou výplň
//                     const opacity = (type === 'red') ? 0.8 : 0.3;
//                     ctx.globalAlpha = alpha * opacity;

//                     const step = 0.1;
//                     // Vykreslení výseče
//                     for (let a = seg.obstacle.start; a <= seg.obstacle.end; a += step) {
//                         const p = project(a, seg.z, radius - 5);
//                         if (a === seg.obstacle.start) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
//                     }
//                     for (let a = seg.obstacle.end; a >= seg.obstacle.start; a -= step) {
//                         const p = project(a, seg.z, radius - (type==='red'?0:40)); // Zóny jsou "hlubší"
//                         ctx.lineTo(p.x, p.y);
//                     }
//                     ctx.closePath();
//                     ctx.fill();
//                     if(type === 'red') ctx.stroke(); // Červená má i obrys
//                     ctx.globalAlpha = 1.0;
//                 }
//             }

//             // Spojovací čáry (jen pro efekt rychlosti)
//             ctx.globalAlpha = 0.1;
//             ctx.strokeStyle = colors.uiText;
//             for(let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
//                 const p1 = project(a, 0, 250);
//                 const p2 = project(a, 1000, 250);
//                 ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
//             }
//             ctx.globalAlpha = 1.0;

//             // 3. Hráč
//             if (!this.gameOver) {
//                 ctx.save();
//                 ctx.translate(cx, cy + 160); 
//                 ctx.rotate(this.rotationSpeed * 8); // Náklon
                
//                 // Glow efekt lodi
//                 ctx.shadowBlur = 15;
//                 ctx.shadowColor = (this.effectTimer > 0 && this.effectMessage.includes("BOOST")) ? colors.green : colors.ship;

//                 ctx.fillStyle = colors.ship;
//                 ctx.beginPath();
//                 ctx.moveTo(0, -10); ctx.lineTo(-12, 15); ctx.lineTo(0, 8); ctx.lineTo(12, 15);
//                 ctx.closePath();
//                 ctx.fill();
//                 ctx.restore();
//             }

//             // 4. EFEKT Text ve hře (nad lodí)
//             if (this.effectTimer > 0) {
//                 ctx.save();
//                 ctx.textAlign = 'center';
//                 ctx.font = 'bold 24px sans-serif';
//                 ctx.fillStyle = this.effectMessage.includes("SLOW") ? colors.yellow : colors.green;
//                 ctx.fillText(this.effectMessage, cx, cy + 80 - (60 - this.effectTimer)); // Text stoupá
//                 ctx.restore();
//             }

//             // 5. UI PANEL (Pravá strana)
//             this.drawUI(ctx);
//         }

//         drawUI(ctx) {
//             // Pozadí panelu
//             ctx.fillStyle = colors.uiBg;
//             ctx.fillRect(gameWidth, 0, sidebarWidth, height);
            
//             // Oddělovací čára
//             ctx.beginPath();
//             ctx.moveTo(gameWidth, 0);
//             ctx.lineTo(gameWidth, height);
//             ctx.strokeStyle = '#333';
//             ctx.lineWidth = 2;
//             ctx.stroke();

//             const centerX = gameWidth + (sidebarWidth / 2);
//             const padding = 30;

//             ctx.fillStyle = colors.uiText;
//             ctx.textAlign = 'center';

//             // -- HEADER --
//             ctx.font = '700 32px sans-serif';
//             ctx.fillText("NEON TUBE", centerX, 60);
            
//             ctx.font = '14px sans-serif';
//             ctx.fillStyle = '#888';
//             ctx.fillText("High Velocity Runner", centerX, 85);

//             // -- SCORE BOARD --
//             let y = 150;
            
//             // Skóre
//             ctx.fillStyle = colors.uiText;
//             ctx.font = '16px sans-serif';
//             ctx.fillText("SCORE", centerX, y);
//             ctx.font = '200 48px sans-serif'; // Tenký velký font
//             ctx.fillText(this.score, centerX, y + 50);

//             // Vzdálenost
//             y += 100;
//             ctx.fillStyle = '#aaa';
//             ctx.font = '14px sans-serif';
//             ctx.fillText("DISTANCE", centerX, y);
//             ctx.fillStyle = colors.uiText;
//             ctx.font = '24px sans-serif';
//             ctx.fillText(Math.floor(this.distance / 100) + " km", centerX, y + 30);

//             // Rychlost (Speedometer)
//             y += 80;
//             ctx.fillStyle = '#aaa';
//             ctx.font = '14px sans-serif';
//             ctx.fillText("SPEED", centerX, y);
            
//             // Grafický bar rychlosti
//             const barWidth = sidebarWidth - 60;
//             const barHeight = 6;
//             ctx.fillStyle = '#333';
//             ctx.fillRect(centerX - barWidth/2, y + 15, barWidth, barHeight);
            
//             const speedPercent = Math.min((this.speed / 40), 1); // Max speed cca 40
//             let barColor = colors.uiText;
//             if (this.speed > 25) barColor = colors.green;
//             if (this.speed < 5) barColor = colors.yellow;
            
//             ctx.fillStyle = barColor;
//             ctx.fillRect(centerX - barWidth/2, y + 15, barWidth * speedPercent, barHeight);
            
//             // -- LEGENDA --
//             y += 80;
//             ctx.font = '12px sans-serif';
//             ctx.fillStyle = '#666';
//             ctx.fillText("OBSTACLES", centerX, y);
            
//             const legendItem = (color, text, ly) => {
//                 ctx.fillStyle = color;
//                 ctx.fillRect(centerX - 60, ly - 10, 10, 10);
//                 ctx.fillStyle = '#aaa';
//                 ctx.textAlign = 'left';
//                 ctx.fillText(text, centerX - 40, ly);
//                 ctx.textAlign = 'center';
//             };
            
//             legendItem(colors.red, "CRASH (Game Over)", y + 30);
//             legendItem(colors.yellow, "SLUDGE (Slow)", y + 55);
//             legendItem(colors.green, "BOOST (Speed)", y + 80);

//             // -- STATUS / GAME OVER --
//             y = height - 100;
//             if (this.gameOver) {
//                 ctx.fillStyle = colors.red;
//                 ctx.font = 'bold 36px sans-serif';
//                 ctx.fillText("CRASHED", centerX, y);
                
//                 // Blikající text
//                 if (Math.floor(Date.now() / 500) % 2 === 0) {
//                     ctx.fillStyle = colors.uiText;
//                     ctx.font = '16px sans-serif';
//                     ctx.fillText("PRESS [SPACE] TO RESTART", centerX, y + 40);
//                 }
//             } else {
//                 ctx.fillStyle = '#444';
//                 ctx.font = '14px sans-serif';
//                 ctx.fillText("Use Arrows or A/D to rotate", centerX, y + 40);
//             }
//         }
//     }

//     // Spuštění
//     const game = new TunnelGame();
//     function loop() {
//         ctx.clearRect(0,0,width,height);
//         game.update();
//         game.draw(ctx);
//         requestAnimationFrame(loop);
//     }
//     loop();
// });