import { useEffect, useRef, useState } from 'react';
import { FaGamepad } from 'react-icons/fa';

interface MiniGameProps {
  language: 'es' | 'en';
}

export default function MiniGame({ language }: MiniGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover' | 'victory'>('idle');
  const [winnerName, setWinnerName] = useState('');
  const [winnerEmail, setWinnerEmail] = useState('');
  const [winnerPhone, setWinnerPhone] = useState('');
  const [submittingWinner, setSubmittingWinner] = useState(false);
  const [winnerRegistered, setWinnerRegistered] = useState(false);
  const [winnerSuccess, setWinnerSuccess] = useState('');
  const [winnerError, setWinnerError] = useState('');

  const handleWinnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingWinner(true);
    setWinnerError('');
    setWinnerSuccess('');

    try {
      const res = await fetch('/api/winners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: winnerName,
          email: winnerEmail,
          phone: winnerPhone
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (language === 'es' ? 'Error al registrar premio' : 'Error registering prize'));
      }

      setWinnerRegistered(true);
      setWinnerSuccess(language === 'es' ? 'Premio registrado con éxito. Revisa tu correo.' : 'Prize registered successfully. Check your email.');
    } catch (err: any) {
      setWinnerError(err.message || 'Error');
    } finally {
      setSubmittingWinner(false);
    }
  };

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('zetah_game_highscore') || '0');
  });
  const [hasWeapon, setHasWeapon] = useState(false);
  const [ammo, setAmmo] = useState(0);

  // Web Audio Context for 8-bit sound synthesis
  const playSound = (type: 'jump' | 'shoot' | 'explosion' | 'powerup') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      
      if (type === 'jump') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'shoot') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'explosion') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.25);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'powerup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(450, now + 0.08);
        osc.frequency.setValueAtTime(600, now + 0.16);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      // AudioContext might be blocked until user gesture, ignore
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = 250); // Increased height

    // Game variables
    const playerSize = 60; // Much bigger player size
    let playerY = height - 10 - playerSize;
    let playerVelocityY = 0;
    let isJumping = false;
    let hasGun = false;
    let ammoLeft = 0;
    let gameScore = 0;
    let speed = 1.8; // Slower speed
    
    const gravity = 0.24; // Floatier jump
    const jumpForce = -7.8; // High jump
    const playerX = 60;

    interface Obstacle {
      x: number;
      y: number;
      w: number;
      h: number;
      speed: number;
      destroyed?: boolean;
      type: 'thief' | 'bullet_low' | 'bullet_high';
    }

    interface Projectile {
      x: number;
      y: number;
      w: number;
      h: number;
      speed: number;
    }

    interface Item {
      x: number;
      y: number;
      size: number;
      active: boolean;
    }

    let obstacles: Obstacle[] = [];
    let projectiles: Projectile[] = [];
    let gunItem: Item = { x: -100, y: -100, size: 15, active: false };

    let spawnTimer = 0;
    let gunTimer = 0;
    let bgScroll = 0;

    // Reset game engine state
    const resetEngine = () => {
      playerY = height - 10 - playerSize;
      playerVelocityY = 0;
      isJumping = false;
      hasGun = false;
      ammoLeft = 0;
      gameScore = 0;
      speed = 1.8; // Reset to slower speed
      obstacles = [];
      projectiles = [];
      gunItem = { x: width + 500, y: height - 60 - Math.random() * 40, size: 26, active: true };
      spawnTimer = 0;
      gunTimer = 0;
      setHasWeapon(false);
      setAmmo(0);
      setScore(0);
    };

    // Make player jump
    const triggerJump = () => {
      if (!isJumping) {
        playerVelocityY = jumpForce;
        isJumping = true;
        playSound('jump');
      }
    };

    // Shoot laser
    const triggerShoot = () => {
      if (hasGun && ammoLeft > 0) {
        projectiles.push({
          x: playerX + playerSize,
          y: playerY + playerSize / 2 - 2,
          w: 12,
          h: 4,
          speed: 8
        });
        playSound('shoot');
        ammoLeft--;
        setAmmo(ammoLeft);
        if (ammoLeft <= 0) {
          hasGun = false;
          setHasWeapon(false);
          gunTimer = 0; // reset spawn timer
        }
      }
    };

    // Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        const curState = canvas.getAttribute('data-state') || 'idle';
        if (curState === 'playing') {
          triggerJump();
        } else if (curState === 'victory') {
          // Do nothing on space during victory to prevent resetting form
        } else {
          canvas.dispatchEvent(new CustomEvent('start-game'));
        }
      }
      if (e.code === 'KeyZ') {
        e.preventDefault();
        triggerShoot();
      }
    };

    const handleCanvasClick = (e: MouseEvent) => {
      e.preventDefault();
      const curState = canvas.getAttribute('data-state') || 'idle';
      if (curState === 'playing') {
        triggerJump();
      } else if (curState === 'victory') {
        // Do nothing on click during victory to prevent resetting form
      } else {
        canvas.dispatchEvent(new CustomEvent('start-game'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('click', handleCanvasClick);

    // Dynamic start handler bound to canvas
    const onStart = () => {
      resetEngine();
      canvas.setAttribute('data-state', 'playing');
      setGameState('playing');
    };
    canvas.addEventListener('start-game', onStart);

    // Resize monitor
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        width = canvas.width = containerRef.current.offsetWidth;
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Main loop
    const gameLoop = () => {
      const state = canvas.getAttribute('data-state') || 'idle';
      
      // Clear
      ctx.clearRect(0, 0, width, height);

      // Background Cyberpunk grid
      ctx.strokeStyle = 'rgba(112, 0, 255, 0.08)';
      ctx.lineWidth = 1;
      bgScroll -= state === 'playing' ? speed * 0.4 : 0.5;
      if (bgScroll <= -40) bgScroll = 0;
      
      // Vertical grid lines
      for (let x = bgScroll; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      // Horizontal grid lines
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Ground line
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(168, 85, 247, 0.5)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, height - 10);
      ctx.lineTo(width, height - 10);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      if (state === 'playing') {
        // Increment Score
        gameScore += 1;
        if (gameScore % 15 === 0) {
          const currentScore = Math.floor(gameScore / 10);
          setScore(currentScore);
          
          // Check victory (1000 points)
          if (currentScore >= 1000) {
            canvas.setAttribute('data-state', 'victory');
            setGameState('victory');
            playSound('powerup');
            return;
          }
        }

        // Increase difficulty slowly and smoothly
        if (gameScore > 0 && gameScore % 1200 === 0) {
          speed += 0.25;
        }

        // Player physics
        playerVelocityY += gravity;
        playerY += playerVelocityY;

        // Ground constraint
        if (playerY >= height - 10 - playerSize) {
          playerY = height - 10 - playerSize;
          playerVelocityY = 0;
          isJumping = false;
        }

        // Spawning obstacles (Only high and mid bullets, no thieves)
        spawnTimer++;
        if (spawnTimer > Math.max(90, 200 - speed * 18 - Math.random() * 60)) {
          spawnTimer = 0;
          const bulletY = Math.random() * (height - 80) + 40; // between 40px and height-40
          obstacles.push({
            x: width + 20,
            y: bulletY,
            w: 28,
            h: 12,
            speed: speed + 0.6,
            type: 'bullet'
          });
        }

        // Spawning Gun Power-up
        if (!hasGun && !gunItem.active) {
          gunTimer++;
          if (gunTimer > 400) {
            gunTimer = 0;
            gunItem.x = width + 50;
            gunItem.y = height - 60 - Math.random() * 45;
            gunItem.active = true;
          }
        }
      }

      // Draw Powerup
      if (gunItem.active) {
        if (state === 'playing') {
          gunItem.x -= speed * 0.9;
          if (gunItem.x < -30) gunItem.active = false;

          // Collision check with player
          const dist = Math.hypot(playerX + playerSize / 2 - gunItem.x, playerY + playerSize / 2 - gunItem.y);
          if (dist < (playerSize / 2 + gunItem.size / 2)) {
            gunItem.active = false;
            hasGun = true;
            ammoLeft = 15;
            setAmmo(15);
            setHasWeapon(true);
            playSound('powerup');
          }
        }

        // Draw gun pickup icon
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(gunItem.x, gunItem.y, gunItem.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw a tiny "G" inside
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', gunItem.x, gunItem.y);
        ctx.shadowBlur = 0;
      }

      // Draw & update projectiles
      projectiles.forEach((p, idx) => {
        if (state === 'playing') {
          p.x += p.speed;
          if (p.x > width + 20) {
            projectiles.splice(idx, 1);
            return;
          }

          // Check collision with obstacles
          obstacles.forEach((obs) => {
            if (!obs.destroyed && 
                p.x < obs.x + obs.w && 
                p.x + p.w > obs.x && 
                p.y < obs.y + obs.h && 
                p.y + p.h > obs.y) {
              
              obs.destroyed = true;
              projectiles.splice(idx, 1);
              playSound('explosion');
              
              // Spark particle effects
              ctx.fillStyle = '#ff7300';
              ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            }
          });
        }

        // Draw laser
        ctx.fillStyle = '#00d2ff';
        ctx.shadowColor = '#00d2ff';
        ctx.shadowBlur = 10;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.shadowBlur = 0;
      });

      // Draw & update obstacles
      obstacles.forEach((obs, idx) => {
        if (state === 'playing') {
          obs.x -= obs.speed;
          
          if (obs.x < -40) {
            obstacles.splice(idx, 1);
            return;
          }

          // Collision check with player
          if (!obs.destroyed && 
              playerX < obs.x + obs.w - 4 && 
              playerX + playerSize - 4 > obs.x && 
              playerY < obs.y + obs.h - 4 && 
              playerY + playerSize - 4 > obs.y) {
            
            // Hit! Game Over
            playSound('explosion');
            canvas.setAttribute('data-state', 'gameover');
            setGameState('gameover');
            
            // Update high score
            const finalScore = Math.floor(gameScore / 10);
            if (finalScore > highScore) {
              setHighScore(finalScore);
              localStorage.setItem('zetah_game_highscore', finalScore.toString());
            }
          }
        }

        // Draw obstacle
        if (!obs.destroyed) {
          if (obs.type === 'thief') {
            // Draw Thief (Ladrón)
            ctx.save();
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 8;
            ctx.strokeStyle = '#374151'; // beanie grey
            ctx.lineWidth = 1.5;

            const tx = obs.x;
            const ty = obs.y;
            const tw = obs.w;
            const th = obs.h;

            // Head (robber beanie/mask)
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(tx + tw/2, ty + 6, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Robber eye band
            ctx.fillStyle = '#000000';
            ctx.fillRect(tx + tw/2 - 5, ty + 4, 10, 3);
            
            // Robber glowing eyes
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(tx + tw/2 - 3, ty + 5, 2, 1);
            ctx.fillRect(tx + tw/2 + 1, ty + 5, 2, 1);

            // Torso (striped shirt)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(tx + 4, ty + 12, tw - 8, 14);
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(tx + 4, ty + 16);
            ctx.lineTo(tx + tw - 4, ty + 16);
            ctx.moveTo(tx + 4, ty + 21);
            ctx.lineTo(tx + tw - 4, ty + 21);
            ctx.stroke();

            // Gun (pistol pointing left)
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(tx - 3, ty + 14, 7, 3); // barrel
            ctx.fillRect(tx + 1, ty + 15, 3, 4); // handle

            // Legs (swinging)
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2.5;
            const thiefSwing = Math.sin(Date.now() * 0.01 + tx * 0.05);
            ctx.beginPath();
            ctx.moveTo(tx + tw/2, ty + 26);
            ctx.lineTo(tx + tw/2 - 4 + thiefSwing * 3, ty + th);
            ctx.moveTo(tx + tw/2, ty + 26);
            ctx.lineTo(tx + tw/2 + 4 - thiefSwing * 3, ty + th);
            ctx.stroke();

            ctx.restore();
          } else {
            // Draw Bullet
            ctx.save();
            ctx.fillStyle = obs.type === 'bullet_high' ? '#f59e0b' : '#ef4444'; // Orange high bullet, Red low bullet
            ctx.shadowColor = obs.type === 'bullet_high' ? '#f59e0b' : '#ef4444';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 3);
            ctx.fill();

            // Bullet light core
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(obs.x + obs.w - 5, obs.y + 2, 4, obs.h - 4);
            ctx.restore();
          }
        }
      });

      // Draw Player (Running Boy / Muchacho) - Extra Large & Highly Noticeable Z
      const runCycle = state === 'playing' ? Date.now() * 0.008 : 0;
      const swing = Math.sin(runCycle);

      ctx.save();
      // Neon style glow setup
      ctx.shadowColor = hasGun ? '#10b981' : '#a855f7';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = hasGun ? '#10b981' : '#a855f7';
      ctx.fillStyle = hasGun ? 'rgba(16, 185, 129, 0.2)' : 'rgba(168, 85, 247, 0.2)';
      ctx.lineWidth = 4.5; // Thicker lines for better visibility

      // Draw Head (Larger)
      const headX = playerX + playerSize / 2;
      const headY = playerY + 12;
      ctx.beginPath();
      ctx.arc(headX, headY, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing cap/visor (Muchacho style)
      ctx.fillStyle = '#00d2ff';
      ctx.shadowColor = '#00d2ff';
      ctx.beginPath();
      ctx.arc(headX, headY - 7, 5, Math.PI, 0); // cap top
      ctx.lineTo(headX + 12, headY - 7); // visor
      ctx.stroke();

      // Draw Body (Torso)
      ctx.strokeStyle = hasGun ? '#10b981' : '#a855f7';
      ctx.shadowColor = hasGun ? '#10b981' : '#a855f7';
      ctx.beginPath();
      ctx.moveTo(headX, headY + 11);
      ctx.lineTo(headX, playerY + 42);
      ctx.stroke();

      // Removed chest logo
      ctx.shadowBlur = 12; // Reset back to player's glow

      // Draw Legs
      const hipX = headX;
      const hipY = playerY + 42;
      const legLength = 18;

      if (isJumping) {
        // Jumping legs bent
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(hipX - 10, hipY + 9);
        ctx.lineTo(hipX - 5, hipY + 18);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(hipX + 7, hipY + 7);
        ctx.lineTo(hipX + 13, hipY + 14);
        ctx.stroke();
      } else {
        // Running legs swinging
        const leg1X = hipX + swing * 12;
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(leg1X, hipY + legLength);
        ctx.stroke();

        const leg2X = hipX - swing * 12;
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(leg2X, hipY + legLength);
        ctx.stroke();
      }

      // Draw Arms
      const shoulderY = headY + 12;
      if (hasGun) {
        // Aiming gun forward
        ctx.beginPath();
        ctx.moveTo(headX, shoulderY);
        ctx.lineTo(playerX + playerSize + 8, shoulderY);
        ctx.stroke();

        // Gun barrel emitter
        ctx.fillStyle = '#10b981';
        ctx.fillRect(playerX + playerSize, shoulderY - 5, 12, 8);
      } else {
        // Swing arms
        const arm1X = headX - swing * 10;
        ctx.beginPath();
        ctx.moveTo(headX, shoulderY);
        ctx.lineTo(arm1X, shoulderY + 12);
        ctx.stroke();

        const arm2X = headX + swing * 10;
        ctx.beginPath();
        ctx.moveTo(headX, shoulderY);
        ctx.lineTo(arm2X, shoulderY + 12);
        ctx.stroke();
      }

      // Draw Ammo count inside the canvas when player has gun
      if (hasGun && state === 'playing') {
        ctx.save();
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 6;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(language === 'es' ? `BALAS: ${ammoLeft}` : `AMMO: ${ammoLeft}`, 15, 25);
        ctx.restore();
      }

      ctx.restore();

      // Draw Screen Overlays (No Emojis)
      if (state === 'idle') {
        ctx.fillStyle = 'rgba(5, 2, 12, 0.8)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(language === 'es' ? 'MINIJUEGO: ZETAH RUNNER' : 'MINIGAME: ZETAH RUNNER', width / 2, height / 2 - 20);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '11px monospace';
        ctx.fillText(language === 'es' ? 'CLICK O [ESPACIO] PARA EMPEZAR / SALTAR' : 'CLICK OR [SPACE] TO START / JUMP', width / 2, height / 2 + 15);
      } else if (state === 'gameover') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.fillText('GAME OVER', width / 2, height / 2 - 15);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.fillText(language === 'es' ? 'CLICK O [ESPACIO] PARA VOLVER A JUGAR' : 'CLICK OR [SPACE] TO RETRY', width / 2, height / 2 + 20);
      } else if (state === 'victory') {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 8;
        ctx.fillText(language === 'es' ? '¡VICTORIA!' : 'VICTORY!', width / 2, height / 2 - 15);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.fillText(language === 'es' ? 'COMPLETA EL FORMULARIO DE ABAJO PARA RECLAMAR TU PREMIO' : 'COMPLETE THE FORM BELOW TO CLAIM YOUR PRIZE', width / 2, height / 2 + 20);
      }

      animId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('start-game', onStart);
      resizeObserver.disconnect();
    };
  }, [highScore, language]);

  const finalScore = score;

  return (
    <section className="container" style={{ marginBottom: '4rem', marginTop: '4rem' }}>
      <div ref={containerRef} className="glass" style={{ padding: '1rem', border: '1px solid rgba(168, 85, 247, 0.25)', position: 'relative', overflow: 'hidden' }}>
        
        {/* Win Banner Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '0.8rem',
          padding: '0.4rem 1rem',
          background: 'rgba(168, 85, 247, 0.1)',
          borderBottom: '1px dashed rgba(168, 85, 247, 0.3)',
          fontSize: '0.85rem',
          fontFamily: 'monospace',
          color: 'var(--accent-cyan)',
          fontWeight: 'bold',
          letterSpacing: '0.05em'
        }}>
          {language === 'es' 
            ? '¡SI LLEGAS A 1000 PUNTOS GANAS UNA SESIÓN DE FOTOS GRATIS!' 
            : 'REACH 1000 POINTS AND WIN A FREE PHOTOSHOOT!'}
        </div>

        {/* Header HUD */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0 0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaGamepad style={{ color: 'var(--accent-purple)', fontSize: '1.2rem' }} />
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
              ZETAH RUNNER
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '1.5rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>HI:</span>{' '}
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{highScore.toString().padStart(5, '0')}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>SCORE:</span>{' '}
              <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>{finalScore.toString().padStart(5, '0')}</span>
            </div>
          </div>
        </div>

        {/* Play canvas */}
        <canvas 
          ref={canvasRef} 
          style={{ 
            width: '100%', 
            height: '250px', 
            background: 'rgba(5, 2, 12, 0.4)', 
            borderRadius: '8px', 
            cursor: 'pointer',
            display: 'block',
            border: '1px solid rgba(255, 255, 255, 0.04)'
          }}
          data-state="idle"
        />

        {/* Weapons tutorial / instructions (No Emojis) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '0 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
          <span>[Space]: {language === 'es' ? 'Saltar' : 'Jump'}</span>
          {hasWeapon ? (
            <span style={{ color: '#10b981', animation: 'pulse 1s infinite alternate' }}>
              {language === 'es' ? `ARMA OBTENIDA! [Z] PARA DISPARAR (${ammo} BALAS)` : `WEAPON OBTAINED! [Z] TO SHOOT (${ammo} BULLETS)`}
            </span>
          ) : (
            <span>{language === 'es' ? 'Recoge energia para disparar' : 'Collect energy to shoot'}</span>
          )}
          <span>{language === 'es' ? 'Esquiva las balas' : 'Avoid bullets'}</span>
        </div>

        {/* Winner Registration Form */}
        {gameState === 'victory' && (
          <div style={{
            marginTop: '1.2rem',
            padding: '1.2rem',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '6px',
            color: '#ffffff',
            fontFamily: 'monospace',
            animation: 'fadeIn 0.5s ease'
          }}>
            <h3 style={{ color: '#10b981', marginTop: 0, marginBottom: '0.4rem', textAlign: 'center', fontSize: '1rem', fontWeight: 'bold' }}>
              {language === 'es' ? '¡VICTORIA! ¡GANASTE UNA SESIÓN DE FOTOS GRATIS!' : 'VICTORY! YOU WON A FREE PHOTOSHOOT!'}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center' }}>
              {language === 'es' 
                ? 'Ingresa tus datos para registrar tu premio. Te enviaremos un correo con instrucciones.' 
                : 'Enter your details to register your prize. We will send you an email with instructions.'}
            </p>
            
            <form onSubmit={handleWinnerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                  {language === 'es' ? 'Nombre Completo:' : 'Full Name:'}
                </label>
                <input 
                  type="text" 
                  required 
                  disabled={winnerRegistered || submittingWinner}
                  value={winnerName}
                  onChange={e => setWinnerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(5, 2, 12, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 180px' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                    {language === 'es' ? 'Correo Electrónico:' : 'Email:'}
                  </label>
                  <input 
                    type="email" 
                    required 
                    disabled={winnerRegistered || submittingWinner}
                    value={winnerEmail}
                    onChange={e => setWinnerEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(5, 2, 12, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
                
                <div style={{ flex: '1 1 180px' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                    {language === 'es' ? 'Número Celular:' : 'Cell Phone:'}
                  </label>
                  <input 
                    type="text" 
                    required 
                    disabled={winnerRegistered || submittingWinner}
                    value={winnerPhone}
                    onChange={e => setWinnerPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(5, 2, 12, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>
              
              {!winnerRegistered && (
                <button 
                  type="submit" 
                  disabled={submittingWinner}
                  style={{
                    padding: '0.6rem',
                    background: '#10b981',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: '0.3rem',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace'
                  }}
                >
                  {submittingWinner ? '...' : (language === 'es' ? 'Registrar Premio' : 'Register Prize')}
                </button>
              )}
            </form>
            
            {winnerError && (
              <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.4rem', textAlign: 'center' }}>
                {winnerError}
              </div>
            )}
            {winnerSuccess && (
              <div style={{ color: '#10b981', fontSize: '0.75rem', marginTop: '0.4rem', textAlign: 'center', fontWeight: 'bold' }}>
                {winnerSuccess}
              </div>
            )}

            {winnerRegistered && (
              <button 
                type="button"
                onClick={() => {
                  const canvas = canvasRef.current;
                  if (canvas) {
                    setWinnerRegistered(false);
                    setWinnerName('');
                    setWinnerEmail('');
                    setWinnerPhone('');
                    setWinnerSuccess('');
                    setWinnerError('');
                    canvas.dispatchEvent(new CustomEvent('start-game'));
                  }
                }}
                style={{
                  padding: '0.6rem',
                  background: 'var(--accent-purple)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: '0.8rem',
                  width: '100%',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace'
                }}
              >
                {language === 'es' ? 'Volver a Jugar' : 'Play Again'}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
