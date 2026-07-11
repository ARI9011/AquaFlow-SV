import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  bright: boolean;
}

const PARTICLE_COUNT = 550;
// Vórtice (remolino) como fracción del tamaño del panel, similar a la referencia.
const VORTEX = { xFrac: 0.66, yFrac: 0.52, radius: 210 };

function spawnParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 220 + Math.random() * 340,
    size: Math.random() < 0.15 ? 1.5 + Math.random() * 1.3 : 0.6 + Math.random() * 0.9,
    bright: Math.random() < 0.18,
  };
}

export default function ParticleFlowHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let particles: Particle[] = [];
    let t = 0;
    let initialized = false;

    const applySize = (width: number, height: number) => {
      if (width <= 0 || height <= 0) return;
      canvas.width = width;
      canvas.height = height;
      if (!initialized) {
        initialized = true;
        particles = Array.from({ length: PARTICLE_COUNT }, () => spawnParticle(width, height));
        ctx.fillStyle = '#010405';
        ctx.fillRect(0, 0, width, height);
      }
    };

    // Lectura inmediata y síncrona del tamaño real al montar: no depender
    // solo del primer callback (asíncrono) de ResizeObserver, que dentro de
    // un contenedor con clip-path + overflow-hidden puede tardar o no
    // disparar a tiempo y dejar el canvas en 0x0 (por eso se veía en negro).
    const rect = canvas.getBoundingClientRect();
    applySize(rect.width, rect.height);

    const ro = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      applySize(entry.contentRect.width, entry.contentRect.height);
    });
    ro.observe(canvas);

    // Campo de flujo: un par de ondas superpuestas dan la corriente de fondo.
    const flowAngle = (x: number, y: number) =>
      Math.sin(x * 0.006 + t * 0.35) * 1.4 +
      Math.cos(y * 0.008 - t * 0.25) * 1.4 +
      Math.sin((x + y) * 0.004 + t * 0.15);

    const draw = () => {
      if (canvas.width === 0 || canvas.height === 0) {
        raf = requestAnimationFrame(draw);
        return;
      }
      t += 0.006;

      // No se limpia el frame: se pinta un negro casi opaco encima para
      // dejar una estela de luz detrás de cada partícula (efecto flujo).
      ctx.fillStyle = 'rgba(1, 4, 5, 0.14)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const vx0 = VORTEX.xFrac * canvas.width;
      const vy0 = VORTEX.yFrac * canvas.height;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const angle = flowAngle(p.x, p.y);
        let ax = Math.cos(angle) * 0.05;
        let ay = Math.sin(angle) * 0.05;

        // Remolino: velocidad tangencial alrededor del punto del vórtice,
        // con una leve atracción hacia el centro para que no se disperse.
        const dx = p.x - vx0;
        const dy = p.y - vy0;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.0001;
        if (dist < VORTEX.radius * 2.4) {
          const falloff = Math.min(1, VORTEX.radius / dist);
          const swirl = falloff * falloff * 0.95;
          ax += (-dy / dist) * swirl;
          ay += (dx / dist) * swirl;
          ax += (-dx / dist) * falloff * 0.02;
          ay += (-dy / dist) * falloff * 0.02;
        }

        p.vx = p.vx * 0.92 + ax * 0.4;
        p.vy = p.vy * 0.92 + ay * 0.4;

        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        if (
          p.life > p.maxLife ||
          p.x < -10 || p.x > canvas.width + 10 ||
          p.y < -10 || p.y > canvas.height + 10
        ) {
          particles[i] = spawnParticle(canvas.width, canvas.height);
          continue;
        }

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const alpha = Math.min(0.9, 0.25 + speed * 1.8) * (p.bright ? 1 : 0.55);
        ctx.beginPath();
        ctx.fillStyle = `rgba(125, 249, 245, ${alpha})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ background: '#010405' }} />;
}
