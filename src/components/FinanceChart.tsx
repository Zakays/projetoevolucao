import React, { useMemo, useState, useRef, useEffect } from 'react';

interface Props {
  data: number[]; // index 0 -> day 1
  monthLabel?: string;
  heightPx?: number; // optional height in pixels
  breakdown?: { income: number; expenses: number; profit: number }[];
}

export const FinanceChart: React.FC<Props> = ({ data, monthLabel, heightPx = 360, breakdown }) => {
  const days = data.length || 0;

  const [svgWidth, setSvgWidth] = useState<number>(Math.max(600, days * 30));

  const { points, width, min, max } = useMemo(() => {
    const paddingX = 20;
    const w = svgWidth || Math.max(600, days * 30);
    const h = heightPx;

    let localMin = Infinity;
    let localMax = -Infinity;
    data.forEach(v => { if (v < localMin) localMin = v; if (v > localMax) localMax = v; });
    if (!isFinite(localMin)) { localMin = 0; localMax = 0; }

    // Use a symmetric range around zero to keep zero centered
    const maxAbs = Math.max(Math.abs(localMin), Math.abs(localMax), 1);
    const minBound = -maxAbs;
    const maxBound = maxAbs;

    const usableW = Math.max(0, w - paddingX * 2);
    const usableH = h - 40; // leave space for labels

    const pts = data.map((v, i) => {
      const x = paddingX + (usableW * (i / Math.max(1, days - 1)));
      const y = 20 + (usableH * (1 - (v - minBound) / (maxBound - minBound)));
      return { x, y, value: v };
    });

    return { points: pts, width: w, min: minBound, max: maxBound };
  }, [data, days, heightPx]);

  const polyPoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; day: number; income: number; expenses: number; profit?: number } | null>(null);

  const handlePointEnter = (ev: React.MouseEvent, idx: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const clientX = ev.clientX;
    const clientY = ev.clientY;
    const info = breakdown && breakdown[idx] ? breakdown[idx] : { income: 0, expenses: 0, profit: data[idx] ?? 0 };

    // position relative to container so it's close to cursor
    const left = rect ? clientX - rect.left + 8 : clientX + 8;
    const top = rect ? clientY - rect.top + 8 : clientY + 8;

    setTooltip({ x: left, y: top, day: idx + 1, income: info.income, expenses: info.expenses, profit: info.profit });
  };

  const handlePointMove = (ev: React.MouseEvent) => {
    if (!tooltip) return;
    const rect = containerRef.current?.getBoundingClientRect();
    const clientX = ev.clientX;
    const clientY = ev.clientY;
    const left = rect ? clientX - rect.left + 8 : clientX + 8;
    const top = rect ? clientY - rect.top + 8 : clientY + 8;
    setTooltip({ ...tooltip, x: left, y: top });
  };

  const handlePointLeave = () => setTooltip(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth || Math.max(600, days * 30);
      setSvgWidth(Math.max(w, days * 30));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [days]);

  return (
    <div ref={containerRef} className="w-full relative" data-testid="finance-chart">
      <svg width={svgWidth} height={heightPx} viewBox={`0 0 ${svgWidth} ${heightPx}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="profitGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* baseline grid lines */}
        <g stroke="#e6e6e6" strokeWidth={1}>
          <line x1={0} y1={20} x2={svgWidth} y2={20} />
          <line x1={0} y1={heightPx - 20} x2={svgWidth} y2={heightPx - 20} />
        </g>

        {/* zero baseline */}
        {typeof min === 'number' && typeof max === 'number' && (
          (() => {
            const usableH = heightPx - 40;
            const zeroY = 20 + (usableH * (1 - (0 - (min)) / (max - (min))));
            return (
              <line key="zero" x1={0} y1={zeroY} x2={svgWidth} y2={zeroY} stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="4 4" />
            );
          })()
        )}

        {/* filled area under line (optional) */}
        {points.length > 0 && (
          <polyline
            points={`${points.map(p => `${p.x},${p.y}`).join(' ')} ${points[points.length-1].x},${heightPx-20} ${points[0].x},${heightPx-20}`}
            fill="url(#profitGrad)"
            stroke="none"
            data-testid="finance-area"
          />
        )}

        {/* line */}
        {points.length > 0 && (
          <polyline
            points={polyPoints}
            fill="none"
            stroke="#2563eb"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            data-testid="finance-line"
          />
        )}

        {/* points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={6}
              fill={p.value >= 0 ? '#16a34a' : '#ef4444'}
              data-testid={`finance-point-${i+1}`}
              onMouseEnter={(ev) => handlePointEnter(ev, i)}
              onMouseMove={handlePointMove}
              onMouseLeave={handlePointLeave}
            />
          </g>
        ))}

        {/* x labels */}
        <g fontSize={10} fill="#6b7280">
          {points.map((p, i) => (
            <text key={i} x={p.x} y={heightPx - 4} textAnchor="middle">{i+1}</text>
          ))}
        </g>
      </svg>

      {tooltip && (
        <div
          data-testid="finance-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
          className="absolute z-50 bg-white border shadow px-3 py-2 rounded text-sm"
        >
          <div className="font-semibold">Dia {tooltip.day ?? '?'}</div>
          <div className="text-xs text-green-600">Receitas: R$ {(tooltip.income ?? 0).toFixed(2)}</div>
          <div className="text-xs text-red-600">Despesas: R$ {(tooltip.expenses ?? 0).toFixed(2)}</div>
          <div className="text-xs text-gray-800 font-medium">Lucro: R$ {((typeof tooltip.profit === 'number' ? tooltip.profit : ((tooltip.income ?? 0) - (tooltip.expenses ?? 0)))).toFixed(2)}</div>
        </div>
      )}

      {monthLabel && (
        <div className="text-sm text-muted-foreground mt-2 text-center">{monthLabel}</div>
      )}
    </div>
  );
};

export default FinanceChart;
