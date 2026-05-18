import { useEffect, useRef } from 'react';

interface Bubble {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  opacity: number;
  color: string;
  wobbleOffset: number;
  wobbleSpeed: number;
  wobbleAmplitude: number;
}

const COLORS = ['#00f2ea', '#00d1b2'];
const BUBBLE_COUNT = 22;
const REPULSE_RADIUS = 90;

function spawnBubble(w: number, h: number, spreadY = false): Bubble {
  const radius = 3 + Math.random() * 14;
  return {
    x: Math.random() * w,
    y: spreadY ? Math.random() * h : h + radius + Math.random() * 300,
    radius,
    speedY: 0.25 + Math.random() * 0.55,
    speedX: 0,
    opacity: 0.04 + Math.random() * 0.11,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    wobbleOffset: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.008 + Math.random() * 0.014,
    wobbleAmplitude: 0.3 + Math.random() * 0.5,
  };
}

export default function BubbleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let bubbles: Bubble[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const init = () => {
      resize();
      bubbles = Array.from({ length: BUBBLE_COUNT }, () =>
        spawnBubble(canvas.width, canvas.height, true)
      );
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseLeave = () => {
      mouse.current = { x: -9999, y: -9999 };
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];

        b.wobbleOffset += b.wobbleSpeed;
        b.x += Math.sin(b.wobbleOffset) * b.wobbleAmplitude + b.speedX;
        b.y -= b.speedY;

        const dx = b.x - mouse.current.x;
        const dy = b.y - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPULSE_RADIUS && dist > 0) {
          const force = ((REPULSE_RADIUS - dist) / REPULSE_RADIUS) * 0.55;
          b.speedX += (dx / dist) * force;
        }
        b.speedX *= 0.92;
        b.speedX = Math.max(-3, Math.min(3, b.speedX));

        if (b.x < -b.radius) b.x = canvas.width + b.radius;
        if (b.x > canvas.width + b.radius) b.x = -b.radius;

        if (b.y < -b.radius * 2) {
          bubbles[i] = spawnBubble(canvas.width, canvas.height);
        }

        ctx.save();
        ctx.globalAlpha = b.opacity;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 1;
        ctx.stroke();

        const grad = ctx.createRadialGradient(
          b.x - b.radius * 0.35,
          b.y - b.radius * 0.35,
          0,
          b.x,
          b.y,
          b.radius
        );
        grad.addColorStop(0, b.color + '2a');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };

    init();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
