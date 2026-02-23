import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

const COLORS = {
  red: '#c40000',
  black: '#111111',
  darkBg: '#0a0a0a',
  white: '#ffffff',
  gray: '#333333',
  accent: '#ff3333',
};

const Circle: React.FC<{ cx: number; cy: number; r: number; fill?: string; stroke?: string; strokeWidth?: number; opacity?: number }> = ({ cx, cy, r, fill, stroke, strokeWidth, opacity }) => (
  <div
    style={{
      position: 'absolute',
      left: cx - r,
      top: cy - r,
      width: r * 2,
      height: r * 2,
      borderRadius: '50%',
      backgroundColor: fill,
      border: stroke ? `${strokeWidth || 1}px solid ${stroke}` : undefined,
      opacity: opacity || 1,
    }}
  />
);

export const GlobeAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const centerX = width / 2;
  const centerY = height / 2;
  const globeRadius = Math.min(width, height) * 0.25;

  const globeScale = spring({ frame, fps, config: { damping: 15, stiffness: 50 } });
  const rotation = interpolate(frame, [0, 300], [0, 360]);
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const pulseScale = spring({ frame, fps, config: { damping: 10, stiffness: 30 } });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.darkBg }}>
      <div style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.1 }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={`grid-v-${i}`} style={{ position: 'absolute', left: `${i * 5}%`, top: 0, bottom: 0, width: 1, backgroundColor: COLORS.gray }} />
        ))}
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={`grid-h-${i}`} style={{ position: 'absolute', top: `${i * 5}%`, left: 0, right: 0, height: 1, backgroundColor: COLORS.gray }} />
        ))}
      </div>

      <div style={{ position: 'absolute', transform: `scale(${globeScale})`, opacity }}>
        <div style={{ position: 'absolute', width: globeRadius * 2.5, height: globeRadius * 2.5, borderRadius: '50%', background: `radial-gradient(circle, ${COLORS.red}22 0%, transparent 70%)`, left: centerX - globeRadius * 1.25, top: centerY - globeRadius * 1.25, transform: `scale(${pulseScale})` }} />

        <Circle cx={centerX} cy={centerY} r={globeRadius} fill={COLORS.black} stroke={COLORS.red} strokeWidth={4} />

        {[...Array(5)].map((_, i) => {
          const offset = interpolate(i, [0, 4], [-globeRadius * 0.7, globeRadius * 0.7]);
          const ellipseWidth = interpolate(Math.abs(offset), [0, globeRadius * 0.7], [globeRadius * 0.9, globeRadius * 0.2]);
          return (
            <div key={`lon-${i}`} style={{ position: 'absolute', left: centerX + offset - ellipseWidth / 2, top: centerY - globeRadius * 0.85, width: ellipseWidth, height: globeRadius * 1.7, borderRadius: '50%', border: `1px ${COLORS.red}44`, transform: `rotate(${rotation * 0.5 + i * 30}deg)` }} />
          );
        })}

        {[...Array(5)].map((_, i) => {
          const offset = interpolate(i, [0, 4], [-globeRadius * 0.7, globeRadius * 0.7]);
          const ellipseWidth = interpolate(Math.abs(offset), [0, globeRadius * 0.7], [globeRadius * 1.8, globeRadius * 0.4]);
          return (
            <div key={`lat-${i}`} style={{ position: 'absolute', left: centerX - ellipseWidth / 2, top: centerY + offset - 1, width: ellipseWidth, height: 2, backgroundColor: `${COLORS.red}44` }} />
          );
        })}

        <Circle cx={centerX} cy={centerY} r={6} fill={COLORS.red} />
      </div>

      {[...Array(15)].map((_, i) => {
        const particleX = interpolate(frame, [0, 200 + i * 30], [(i * 50) % width, ((i * 50) + 200) % width]);
        const particleY = interpolate(frame, [0, 200 + i * 30], [(i * 80) % height, ((i * 80) - 100) % height]);
        const particleOpacity = interpolate(frame, [0, 50 + i * 10, 150 + i * 10, 200 + i * 30], [0, 0.8, 0.8, 0]);
        return <Circle key={`particle-${i}`} cx={particleX} cy={particleY} r={2} fill={i % 2 === 0 ? COLORS.red : COLORS.white} opacity={particleOpacity * 0.6} />;
      })}

      <div style={{ position: 'absolute', bottom: height * 0.15, left: 0, right: 0, textAlign: 'center', opacity: interpolate(frame, [60, 90, 270, 300], [0, 1, 1, 0]) }}>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: COLORS.white, letterSpacing: 4, textTransform: 'uppercase' }}>Cenário Internacional</div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: COLORS.red, marginTop: 8, letterSpacing: 2 }}>Notícias que movem o mundo</div>
      </div>
    </AbsoluteFill>
  );
};
