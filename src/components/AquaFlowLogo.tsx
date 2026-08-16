interface AquaFlowLogoProps {
  size?: number;
  className?: string;
  variant?: 'cyan' | 'dark' | 'white' | 'light-bg';
  showText?: boolean;
}

export default function AquaFlowLogo({
  size = 40,
  className = '',
  variant = 'cyan',
  showText = false
}: AquaFlowLogoProps) {

  // Definición de colores según variantes
  // variant='cyan': gota cyan, nodos azul oscuro, ondas cyan
  // variant='dark': gota azul oscuro, nodos cyan, ondas cyan
  // variant='white': gota blanca, nodos cyan, ondas blancas
  // variant='light-bg': gota azul oscuro, nodos cyan, fondo claro

  let dropColor = '#00f2ea'; // cyan por defecto
  let nodeLineColor = '#0d2137'; // azul oscuro
  let centerNodeColor = '#0d2137';
  let waveColor = '#00f2ea';

  if (variant === 'dark' || variant === 'light-bg') {
    dropColor = '#0c3552';
    nodeLineColor = '#00f2ea';
    centerNodeColor = '#ffffff';
    waveColor = '#00f2ea';
  } else if (variant === 'white') {
    dropColor = '#ffffff';
    nodeLineColor = '#0d2137';
    centerNodeColor = '#00f2ea';
    waveColor = '#ffffff';
  }

  // Coordenadas del pentágono interno (Centro en 50,68)
  const cx = 50;
  const cy = 68;
  const r = 16;
  // 5 vértices
  const nodes = Array.from({ length: 5 }).map((_, i) => {
    const angle = (i * 72 - 90) * (Math.PI / 180);
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    };
  });

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 135"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-300 hover:scale-105"
      >
        {/* GOTA DE AGUA */}
        <path
          d="M 50 12 C 28 48 18 64 18 80 C 18 98 32 108 50 108 C 68 108 82 98 82 80 C 82 64 72 48 50 12 Z"
          fill={dropColor}
        />

        {/* LÍNEAS CONECTORES DEL PENTÁGONO */}
        {/* Líneas externas del pentágono */}
        {nodes.map((node, i) => {
          const next = nodes[(i + 1) % 5];
          return (
            <line
              key={`outer-${i}`}
              x1={node.x}
              y1={node.y}
              x2={next.x}
              y2={next.y}
              stroke={nodeLineColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          );
        })}

        {/* Líneas del centro a cada nodo */}
        {nodes.map((node, i) => (
          <line
            key={`inner-${i}`}
            x1={cx}
            y1={cy}
            x2={node.x}
            y2={node.y}
            stroke={nodeLineColor}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        ))}

        {/* NODO CENTRAL */}
        <circle cx={cx} cy={cy} r="4.2" fill={centerNodeColor} />

        {/* 5 NODOS PERIMETRALES */}
        {nodes.map((node, i) => (
          <circle key={`node-${i}`} cx={node.x} cy={node.y} r="3" fill={nodeLineColor} />
        ))}

        {/* ONDAS DE AGUA INFERIORES */}
        {/* Onda 1 */}
        <path
          d="M 22 118 Q 36 110 50 118 T 78 118"
          stroke={waveColor}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Onda 2 */}
        <path
          d="M 28 127 Q 39 121 50 127 T 72 127"
          stroke={waveColor}
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-black text-ink tracking-tight text-lg">
            AquaFlow <span className="text-aqua-cyan">SV</span>
          </span>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            Monitoreo Hídrico IoT
          </span>
        </div>
      )}
    </div>
  );
}
