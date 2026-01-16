
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameObject, WeaponType, CritEffect, JuiceParticle } from '../types';
import { FRUITS, BOMBS, GRAVITY, WEAPON_CONFIGS } from '../constants';

interface FloatingScore {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vx: number;
  vy: number;
  size: number;
}

interface ComboState {
  count: number;
  lastSliceTime: number;
}

interface Arrow {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  life: number;
}

interface GameCanvasProps {
  weapon: WeaponType;
  isPlaying: boolean;
  onScoreUpdate: (points: number, isCrit: boolean) => void;
  onGameOver: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ weapon, isPlaying, onScoreUpdate, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const objectsRef = useRef<GameObject[]>([]);
  const trailRef = useRef<{ x: number, y: number, life: number }[]>([]);
  const critsRef = useRef<CritEffect[]>([]);
  const particlesRef = useRef<JuiceParticle[]>([]);
  const scoresRef = useRef<FloatingScore[]>([]);
  const arrowsRef = useRef<Arrow[]>([]);
  const comboRef = useRef<ComboState>({ count: 0, lastSliceTime: 0 });
  
  const lastShotRef = useRef<number>(0);
  const shakeRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      objectsRef.current = [];
      arrowsRef.current = [];
      return;
    }

    const interval = setInterval(() => {
      const isBomb = Math.random() > 0.92;
      const fruitData = FRUITS[Math.floor(Math.random() * FRUITS.length)];
      const canvas = canvasRef.current;
      if (!canvas) return;

      const side = Math.random() > 0.5 ? 'left' : 'right';
      
      const newObj: GameObject = {
        id: Math.random().toString(36),
        x: side === 'left' ? Math.random() * (canvas.width * 0.3) : canvas.width - Math.random() * (canvas.width * 0.3),
        y: canvas.height + 50,
        vx: side === 'left' ? 3 + Math.random() * 5 : -3 - Math.random() * 5,
        vy: -14 - Math.random() * 8,
        radius: 35,
        type: isBomb ? 'bomb' : 'fruit',
        color: isBomb ? BOMBS.color : fruitData.color,
        emoji: isBomb ? BOMBS.emoji : fruitData.emoji,
        isSliced: false,
        angle: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
      };

      objectsRef.current.push(newObj);
    }, 125);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const createJuice = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: Math.random().toString(36),
        x,
        y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12 - 3,
        life: 1.0,
        color,
        size: Math.random() * 5 + 2
      });
    }
  };

  const handleInteraction = useCallback((x: number, y: number) => {
    if (!isPlaying) return;
    mouseRef.current = { x, y };
    const now = Date.now();
    const config = WEAPON_CONFIGS[weapon];

    if (now - lastShotRef.current < config.cooldown) return;
    
    // Weapon Specific Visual Trigger
    if (weapon === WeaponType.BOW) {
      const angle = -Math.PI / 2; // Upwards
      arrowsRef.current.push({
        id: Math.random().toString(36),
        x: x,
        y: y,
        vx: 0,
        vy: -25,
        angle: angle,
        life: 1.0
      });
      lastShotRef.current = now;
    } else {
      lastShotRef.current = now;
      trailRef.current.push({ x, y, life: 1.0 });
    }

    const radiusImpact = weapon === WeaponType.CANNON ? 160 : (weapon === WeaponType.BOW ? 0 : 40);

    // Collision for Katana/Cannon (Direct)
    if (weapon !== WeaponType.BOW) {
      checkCollision(x, y, radiusImpact);
    }
  }, [isPlaying, weapon]);

  const checkCollision = (x: number, y: number, radius: number) => {
    let fruitsSliced = 0;
    const now = Date.now();

    objectsRef.current.forEach(obj => {
      if (obj.isSliced) return;
      const dist = Math.sqrt(Math.pow(obj.x - x, 2) + Math.pow(obj.y - y, 2));
      if (dist < obj.radius + radius) {
        processSlice(obj);
        if (obj.type === 'fruit') fruitsSliced++;
      }
    });

    if (fruitsSliced > 0) handleCombo(fruitsSliced, x, y, now);
  };

  const processSlice = (obj: GameObject) => {
    obj.isSliced = true;
    if (obj.type === 'bomb') {
      shakeRef.current = 20;
      createJuice(obj.x, obj.y, '#000000', 30);
      scoresRef.current.push({
        id: Math.random().toString(36),
        x: obj.x, y: obj.y,
        text: `-50`,
        color: '#ff0000',
        life: 1.0,
        vx: 0, vy: -2,
        size: 40
      });
      onScoreUpdate(-50 / 10, false);
    } else {
      const critChance = weapon === WeaponType.BOW ? 0.25 : 0.15;
      const isCrit = Math.random() < critChance;
      const points = (weapon === WeaponType.BOW ? 15 : 10) * (isCrit ? 3 : 1);
      createJuice(obj.x, obj.y, obj.color, isCrit ? 25 : 10);
      scoresRef.current.push({
        id: Math.random().toString(36),
        x: obj.x, y: obj.y,
        text: `+${points}${isCrit ? '!' : ''}`,
        color: isCrit ? '#ffff00' : '#ffffff',
        life: 1.0,
        vx: (Math.random() - 0.5) * 2,
        vy: -3 - Math.random() * 2,
        size: isCrit ? 28 : 20
      });
      onScoreUpdate(weapon === WeaponType.BOW ? 15 : 10, isCrit);
    }
  };

  const handleCombo = (count: number, x: number, y: number, now: number) => {
    const comboTimeLimit = 350;
    if (now - comboRef.current.lastSliceTime < comboTimeLimit) {
      comboRef.current.count += count;
    } else {
      comboRef.current.count = count;
    }
    comboRef.current.lastSliceTime = now;

    if (comboRef.current.count >= 3) {
      let comboText = `${comboRef.current.count} COMBO`;
      let scale = 1.0;
      if (comboRef.current.count > 8) {
        comboText = `🔥 EXTREME ${comboRef.current.count} 🔥`;
        scale = 2.0;
        shakeRef.current = 15;
      } else if (comboRef.current.count >= 3) {
        comboText = `⚡ GREAT ${comboRef.current.count} ⚡`;
        scale = 1.4;
        shakeRef.current = 5;
      }
      critsRef.current.push({
        id: Math.random().toString(36),
        x, y: y - 50,
        life: 1.0, text: comboText, scale
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      
      if (shakeRef.current > 0) {
        const sx = (Math.random() - 0.5) * shakeRef.current;
        const sy = (Math.random() - 0.5) * shakeRef.current;
        ctx.translate(sx, sy);
        shakeRef.current *= 0.9;
      }

      // 1. Update and Draw Arrows
      arrowsRef.current.forEach(arrow => {
        arrow.x += arrow.vx;
        arrow.y += arrow.vy;
        
        // Visual Arrow
        ctx.save();
        ctx.translate(arrow.x, arrow.y);
        ctx.rotate(arrow.angle);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 30);
        ctx.stroke();
        // Arrow head
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(-5, 5);
        ctx.lineTo(0, -5);
        ctx.lineTo(5, 5);
        ctx.fill();
        ctx.restore();

        // Check arrow collision with objects
        objectsRef.current.forEach(obj => {
          if (!obj.isSliced) {
            const dist = Math.sqrt(Math.pow(obj.x - arrow.x, 2) + Math.pow(obj.y - arrow.y, 2));
            if (dist < obj.radius + 20) {
              processSlice(obj);
              arrow.life = 0; // Destroy arrow on hit
              handleCombo(1, arrow.x, arrow.y, Date.now());
            }
          }
        });

        if (arrow.y < -100) arrow.life = 0;
      });
      arrowsRef.current = arrowsRef.current.filter(a => a.life > 0);

      // 2. Scores
      scoresRef.current.forEach(s => {
        ctx.save();
        ctx.globalAlpha = s.life;
        ctx.fillStyle = s.color;
        ctx.font = `bold ${s.size}px "Inter"`;
        ctx.textAlign = 'center';
        ctx.fillText(s.text, s.x, s.y);
        s.x += s.vx; s.y += s.vy; s.life -= 0.015;
        ctx.restore();
      });
      scoresRef.current = scoresRef.current.filter(s => s.life > 0);

      // 3. Particles
      particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life -= 0.02;
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // 4. Trail
      ctx.beginPath();
      ctx.lineWidth = 6;
      ctx.strokeStyle = WEAPON_CONFIGS[weapon].trailColor;
      trailRef.current.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
        p.life -= 0.08;
      });
      ctx.stroke();
      trailRef.current = trailRef.current.filter(p => p.life > 0);

      // 5. Objects
      objectsRef.current.forEach((obj) => {
        obj.x += obj.vx;
        obj.y += obj.vy;
        obj.vy += GRAVITY;
        obj.angle += obj.rotationSpeed;

        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.rotate(obj.angle);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (obj.isSliced) {
          ctx.font = '40px serif';
          ctx.globalAlpha = Math.max(0, 0.8 - (obj.vy/20));
          ctx.fillText(obj.emoji, -15, 0);
          ctx.fillText(obj.emoji, 15, 0);
        } else {
          ctx.font = '55px serif';
          ctx.shadowBlur = 10;
          ctx.shadowColor = obj.color;
          ctx.fillText(obj.emoji, 0, 0);
        }
        ctx.restore();
      });

      // 6. UI Crits
      critsRef.current.forEach(crit => {
        ctx.save();
        ctx.translate(crit.x, crit.y);
        crit.y -= 1.0; crit.life -= 0.025;
        ctx.scale(crit.scale, crit.scale);
        ctx.globalAlpha = crit.life;
        ctx.font = 'bold 32px "Bungee"';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText(crit.text, 0, 0);
        const grad = ctx.createLinearGradient(-50, 0, 50, 0);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.5, crit.text.includes('EXTREME') ? '#ffcc00' : '#00ccff');
        grad.addColorStop(1, '#fff');
        ctx.fillStyle = grad;
        ctx.fillText(crit.text, 0, 0);
        ctx.restore();
      });
      critsRef.current = critsRef.current.filter(c => c.life > 0);

      ctx.restore();
      objectsRef.current = objectsRef.current.filter(obj => obj.y < canvas.height + 150);
      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [weapon]);

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={(e) => handleInteraction(e.clientX, e.clientY)}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        handleInteraction(touch.clientX, touch.clientY);
      }}
      className="absolute inset-0 w-full h-full cursor-none z-10"
    />
  );
};

export default GameCanvas;
