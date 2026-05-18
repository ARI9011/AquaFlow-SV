import { useEffect, useState } from 'react';

// ── Glass geometry (SVG viewBox 0 0 100 145) ──────────────────────
const CX         = 50;
const GLASS_TOP  = 10;
const GLASS_BOT  = 130;
const GLASS_H    = GLASS_BOT - GLASS_TOP; // 120
const RIM_W      = 78;
const BASE_W     = 64;
const RL = CX - RIM_W  / 2;  // 11  (rim left)
const RR = CX + RIM_W  / 2;  // 89  (rim right)
const BL = CX - BASE_W / 2;  // 18  (base left)
const BR = CX + BASE_W / 2;  // 82  (base right)
const GLASS_PTS = `${RL},${GLASS_TOP} ${RR},${GLASS_TOP} ${BR},${GLASS_BOT} ${BL},${GLASS_BOT}`;

// ── Wave path (Y=0 is the water surface, opens downward to y=200) ──
const PERIOD = 28;
const AMP    = 5;
const N      = 9;

function buildWave(): string {
  const sx = -PERIOD;
  let d = `M${sx},0`;
  for (let i = 0; i < N; i++) {
    const x = sx + i * PERIOD;
    d += ` C${x + PERIOD * 0.25},${-AMP} ${x + PERIOD * 0.75},${AMP} ${x + PERIOD},0`;
  }
  d += ` L${sx + N * PERIOD},200 L${sx},200 Z`;
  return d;
}
const WAVE_PATH = buildWave();

const getLabel = (p: number) =>
  p < 25  ? 'Iniciando sistema...'  :
  p < 55  ? 'Cargando módulos...'   :
  p < 80  ? 'Conectando sensores...' :
  p < 100 ? 'Casi listo...'         :
             '¡Sistema listo!';

// ─────────────────────────────────────────────────────────────────
export default function LoadingScreen({ onFinish }: { onFinish: () => void }) {
  const [fillPct, setFillPct] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const FILL_MS = 2800;
    const TICK    = 16;
    let elapsed   = 0;

    const id = setInterval(() => {
      elapsed += TICK;
      const t     = Math.min(elapsed / FILL_MS, 1);
      const eased = 1 - Math.pow(1 - t, 2.5);     // ease-out
      setFillPct(Math.round(eased * 100));

      if (t >= 1) {
        clearInterval(id);
        setTimeout(() => {
          setExiting(true);
          setTimeout(onFinish, 650);
        }, 450);
      }
    }, TICK);

    return () => clearInterval(id);
  }, [onFinish]);

  const waterH   = (fillPct / 100) * (GLASS_H - 2);
  const waterTop = GLASS_BOT - waterH;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-aqua-dark"
      style={{ opacity: exiting ? 0 : 1, transition: 'opacity 0.65s ease' }}
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 50% 50%, rgba(0,242,234,0.06) 0%, transparent 70%)',
        }}
      />

      {/* ── Branding ── */}
      <div className="mb-12 text-center relative z-10">
        <h1 className="text-4xl font-black tracking-tighter text-white">
          AquaFlow <span style={{ color: '#00f2ea' }}>SV</span>
        </h1>
        <p
          className="text-[10px] uppercase tracking-[0.45em] font-bold mt-1"
          style={{ color: 'rgba(0,242,234,0.28)' }}
        >
          Sistema de Monitoreo Hídrico
        </p>
      </div>

      {/* ── Glass SVG ── */}
      <div className="relative z-10">
        <svg width="130" height="160" viewBox="0 0 100 145">
          <defs>
            <clipPath id="glassClip">
              <polygon points={GLASS_PTS} />
            </clipPath>

            <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#00f2ea" stopOpacity="0.78" />
              <stop offset="55%"  stopColor="#00c4d4" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#005f8a" stopOpacity="0.96" />
            </linearGradient>

            <linearGradient id="glassBg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#00f2ea" stopOpacity="0.07" />
              <stop offset="50%"  stopColor="#00f2ea" stopOpacity="0.015" />
              <stop offset="100%" stopColor="#00f2ea" stopOpacity="0.07" />
            </linearGradient>
          </defs>

          {/* Glass background tint */}
          <polygon points={GLASS_PTS} fill="url(#glassBg)" />

          {/* ── Water fill (wave, clipped to glass) ── */}
          {waterH > 1 && (
            <g clipPath="url(#glassClip)">
              {/* Outer <g>: vertical position driven by React state */}
              <g style={{ transform: `translateY(${waterTop}px)` }}>
                {/* Inner <g>: horizontal wave scroll via CSS animation */}
                <g className="aqua-wave">
                  <path d={WAVE_PATH} fill="url(#waterGrad)" />
                </g>
              </g>
            </g>
          )}

          {/* ── Bubbles (clipped to glass only) ── */}
          {waterH > 18 && (
            <g clipPath="url(#glassClip)">
              <circle cx="34" cy={GLASS_BOT - 6}  r="2.2" fill="rgba(0,242,234,0.45)" className="bubble-a" />
              <circle cx="52" cy={GLASS_BOT - 4}  r="1.5" fill="rgba(0,242,234,0.32)" className="bubble-b" />
              <circle cx="67" cy={GLASS_BOT - 9}  r="1.8" fill="rgba(0,242,234,0.40)" className="bubble-c" />
            </g>
          )}

          {/* ── Glass outline ── */}
          <polygon
            points={GLASS_PTS}
            fill="none"
            stroke="rgba(0,242,234,0.38)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Rim top bar */}
          <line
            x1={RL} y1={GLASS_TOP} x2={RR} y2={GLASS_TOP}
            stroke="rgba(0,242,234,0.55)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Left shine */}
          <line
            x1={RL + 7}  y1={GLASS_TOP + 10}
            x2={BL + 6}  y2={GLASS_BOT - 12}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Subtle right shine */}
          <line
            x1={RR - 8}  y1={GLASS_TOP + 8}
            x2={BR - 7}  y2={GLASS_BOT - 10}
            stroke="rgba(255,255,255,0.025)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ── Percentage + status ── */}
      <div className="mt-8 text-center relative z-10">
        <p className="text-5xl font-black font-mono leading-none" style={{ color: '#00f2ea' }}>
          {fillPct}
          <span className="text-2xl ml-0.5" style={{ color: 'rgba(0,242,234,0.45)' }}>%</span>
        </p>
        <p
          className="text-[11px] uppercase tracking-[0.28em] font-bold mt-3"
          style={{ color: 'rgba(255,255,255,0.26)' }}
        >
          {getLabel(fillPct)}
        </p>
      </div>
    </div>
  );
}
