import React from 'react';

interface Props {
  before: string; // image URL
  after: string; // image URL
  width?: number | string;
  height?: number | string;
}

export const BeforeAfterSlider: React.FC<Props> = ({ before, after, width = '100%', height = 300 }) => {
  const [pos, setPos] = React.useState(50);
  const ref = React.useRef<HTMLDivElement | null>(null);

  const onMove = (clientX: number) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)));
    setPos(pct);
  };

  return (
    <div
      ref={ref}
      className="relative select-none overflow-hidden rounded-lg"
      style={{ width, height }}
      onMouseMove={(e) => { if (e.buttons === 1) onMove(e.clientX); }}
      onTouchMove={(e) => { onMove(e.touches[0].clientX); }}
    >
      <img src={before} alt="before" className="absolute inset-0 w-full h-full object-cover" />
      <div
        className="absolute top-0 left-0 h-full overflow-hidden"
        style={{ width: `${pos}%` }}
      >
        <img src={after} alt="after" className="w-full h-full object-cover" />
      </div>

      {/* Divider */}
      <div
        className="absolute top-0 h-full w-0.5 bg-white/80"
        style={{ left: `${pos}%`, transform: 'translateX(-0.5px)' }}
      />

      {/* Handle */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-md flex items-center justify-center"
        style={{ left: `${pos}%`, top: '50%', width: 28, height: 28, touchAction: 'none', cursor: 'grab' }}
        onMouseDown={(e) => e.currentTarget.setPointerCapture((e as any).pointerId)}
      >
        <div style={{ width: 18, height: 18 }} className="rounded-full bg-gray-800/80" />
      </div>
    </div>
  );
};

export default BeforeAfterSlider;
