import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DailyStats, MonthlyChart } from '@/types';
import { Calendar, TrendingUp } from 'lucide-react';

interface SecondaryPoint { date: string; value: number }

type SeriesScale = 'percent' | 'zeroToTen' | 'relative';

interface MultiSeries {
  id: string;
  label: string;
  color: string;
  values: SecondaryPoint[]; // date -> raw value
  scale?: SeriesScale; // how to normalize to 0-100
  unit?: string;
}

interface ProgressChartProps {
  monthlyChart: MonthlyChart;
  isCurrentMonth?: boolean;
  multiSeries?: MultiSeries[];
  compact?: boolean;
}

export function ProgressChart({ monthlyChart, isCurrentMonth = false, multiSeries = [], compact = false }: ProgressChartProps) {
  const chartHeight = compact ? 120 : 200;
  const [chartWidth, setChartWidth] = useState<number>(600);
  const padding = 40;
  const containerRef = useRef<HTMLDivElement | null>(null);

  // build day list for month
  const year = parseInt(monthlyChart.month.split('-')[0]);
  const month = parseInt(monthlyChart.month.split('-')[1]);
  const daysInMonth = new Date(year, month, 0).getDate();

  const allDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = `${monthlyChart.month}-${String(day).padStart(2, '0')}`;
    const stats = monthlyChart.dailyStats.find(s => s.date === date);
    return { day, date, percentage: stats?.percentage || 0, hasData: !!stats };
  });

  const denom = Math.max(1, daysInMonth - 1);

  // points for primary series (habits percentage)
  const habitPoints = allDays.map((d, i) => {
    const x = padding + (i / denom) * (chartWidth - 2 * padding);
    const y = chartHeight - padding - (d.percentage / 100) * (chartHeight - 2 * padding);
    return { ...d, x, y };
  });

  // build mapped series for each multiSeries entry
  const mappedSeries = multiSeries.map(s => {
    // compute max for relative scale
    const maxVal = s.scale === 'relative' ? Math.max(...s.values.map(v => v.value), 1) : 1;
    const coords = allDays.map((d, i) => {
      const found = s.values.find(v => v.date === d.date);
      const raw = found ? found.value : 0;
      let normalized = 0;
      if (s.scale === 'percent') normalized = Math.max(0, Math.min(100, raw));
      else if (s.scale === 'zeroToTen') normalized = Math.max(0, Math.min(10, raw)) * 10;
      else if (s.scale === 'relative') normalized = Math.round((raw / Math.max(1, maxVal)) * 100);
      const x = padding + (i / denom) * (chartWidth - 2 * padding);
      const y = chartHeight - padding - (normalized / 100) * (chartHeight - 2 * padding);
      return { x, y, raw, normalized, date: d.date, day: d.day };
    });
    const path = coords.reduce((p, pt, i) => `${p} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
    return { ...s, coords, path } as any;
  });

  const averagePerformance = monthlyChart.averagePerformance || 0;
  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return '#22c55e';
    if (percentage >= 60) return '#3b82f6';
    if (percentage >= 40) return '#f59e0b';
    return '#ef4444';
  };
  const chartColor = getPerformanceColor(averagePerformance);

  // tooltip/hover state
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; index: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth || 600;
      setChartWidth(Math.max(300, w));
    });
    ro.observe(el);
    setChartWidth(Math.max(300, el.clientWidth || 600));
    return () => ro.disconnect();
  }, []);

  const handleMouseMove = (ev: React.MouseEvent<SVGSVGElement>) => {
    const rect = (ev.currentTarget as SVGElement).getBoundingClientRect();
    const relX = ev.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, relX / rect.width));
    const idx = Math.round(ratio * (habitPoints.length - 1));
    setHoverIndex(idx);
    const px = habitPoints[idx]?.x ?? 0;
    setTooltip({ x: px, y: 8, index: idx });
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    setTooltip(null);
  };

  return (
    <Card className={isCurrentMonth ? 'border-primary/50 bg-primary/5' : ''}>
      <CardHeader>
        <div className={'flex items-center justify-between'}>
          <CardTitle className={'flex items-center space-x-2'}>
            <Calendar className={'h-5 w-5'} />
            <span>
              {new Date(monthlyChart.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
            {isCurrentMonth && (
              <Badge variant={'default'} className={'gradient-primary text-white border-0'}>Mês Atual</Badge>
            )}
          </CardTitle>
          <div className={'text-right'}>
            <div className={'text-2xl font-bold'} style={{ color: chartColor }}>{averagePerformance}%</div>
            <div className={'text-xs text-muted-foreground'}>Performance média</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div ref={containerRef} className={'mb-4 relative'}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMinYMin meet" width={'100%'} height={chartHeight}
            onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className={'border rounded-lg bg-background'}>
            <defs>
              <linearGradient id={`gradient-${monthlyChart.month}`} x1={'0%'} y1={'0%'} x2={'0%'} y2={'100%'}>
                <stop offset={'0%'} stopColor={chartColor} stopOpacity={'0.3'} />
                <stop offset={'100%'} stopColor={chartColor} stopOpacity={'0.1'} />
              </linearGradient>
            </defs>

            <rect width={chartWidth} height={chartHeight} fill={'transparent'} />

            {/* ref lines */}
            {[25, 50, 75, 100].map(p => {
              const y = chartHeight - padding - (p / 100) * (chartHeight - 2 * padding);
              return (
                <g key={p}>
                  <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke={'#e6e9ee'} strokeWidth={1} strokeDasharray={'4,4'} />
                </g>
              );
            })}

            {/* area under primary */}
            {habitPoints.length > 1 && (
              <path d={`${habitPoints.reduce((p, pt, i) => `${p} ${i===0?'M':'L'} ${pt.x} ${pt.y}`, '')} L ${chartWidth - padding} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`} fill={`url(#gradient-${monthlyChart.month})`} />
            )}

            {/* primary line */}
            {habitPoints.length > 1 && (
              <path d={habitPoints.reduce((p, pt, i) => `${p} ${i===0?'M':'L'} ${pt.x} ${pt.y}`, '')} fill={'none'} stroke={chartColor} strokeWidth={3} strokeLinecap={'round'} strokeLinejoin={'round'} />
            )}

            {/* other series lines */}
            {mappedSeries.map((s, i) => (
              <path key={s.id} d={s.path} fill={'none'} stroke={s.color} strokeWidth={2} strokeDasharray={'4,3'} strokeLinecap={'round'} />
            ))}

            {/* primary points */}
            {habitPoints.map((pt, i) => (
              <g key={i}>
                {pt.hasData && <circle cx={pt.x} cy={pt.y} r={4} fill={chartColor} stroke={'white'} strokeWidth={2} />}
              </g>
            ))}

            {/* series markers */}
            {mappedSeries.map((s) => s.coords.map((c: any, idx: number) => (
              <g key={`${s.id}-${idx}`}>{c.raw !== 0 && <circle cx={c.x} cy={c.y} r={3} fill={s.color} />}</g>
            )))}

            {/* hover line */}
            {hoverIndex !== null && hoverIndex >= 0 && hoverIndex < habitPoints.length && (
              <line x1={habitPoints[hoverIndex].x} y1={padding} x2={habitPoints[hoverIndex].x} y2={chartHeight - padding} stroke={'#9ca3af'} strokeWidth={1} strokeDasharray={'3,3'} />
            )}

            {/* x labels */}
            {habitPoints.filter((_, i) => i % 5 === 0 || i === habitPoints.length - 1).map((pt, idx) => (
              <text key={idx} x={pt.x} y={chartHeight - padding + 20} fontSize={12} fill={'#6b7280'} textAnchor={'middle'}>{pt.day}</text>
            ))}
          </svg>

          {/* tooltip */}
          {tooltip && (
            <div style={{ position: 'absolute', left: tooltip.x + 8, top: 8, background: 'white', border: '1px solid #e5e7eb', padding: 8, borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minWidth: 180 }}>
              <div className={'text-sm font-medium'}>Dia {allDays[tooltip.index].date}</div>
              <div className={'text-xs text-muted-foreground mt-1'}>
                <div>Hábitos: {allDays[tooltip.index].percentage}%</div>
                {mappedSeries.map((s) => {
                  const v = s.coords[tooltip.index];
                  return <div key={s.id}>{s.label}: {v.raw}{s.unit ? ' ' + s.unit : ''}</div>;
                })}
              </div>
            </div>
          )}
        </div>

        {/* month stats */}
        <div className={'grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'}>
          <div className={'text-center'}>
            <div className={'font-bold text-lg'} style={{ color: chartColor }}>{monthlyChart.totalDays}</div>
            <div className={'text-muted-foreground'}>Dias registrados</div>
          </div>

          <div className={'text-center'}>
            <div className={'font-bold text-lg text-green-600'}>{monthlyChart.completedDays}</div>
            <div className={'text-muted-foreground'}>Dias produtivos</div>
          </div>

          <div className={'text-center'}>
            <div className={'font-bold text-lg'}>{monthlyChart.bestDay ? new Date(monthlyChart.bestDay + 'T00:00:00').getDate() : '-'}</div>
            <div className={'text-muted-foreground'}>Melhor dia</div>
          </div>

          <div className={'text-center'}>
            <div className={'font-bold text-lg'}>{monthlyChart.completedDays > 0 ? Math.round((monthlyChart.completedDays / monthlyChart.totalDays) * 100) : 0}%</div>
            <div className={'text-muted-foreground'}>Taxa de sucesso</div>
          </div>
        </div>

        {/* Insights */}
        {monthlyChart.totalDays > 0 && (
          <div className={'mt-4 p-3 bg-muted/30 rounded-lg'}>
            <div className={'flex items-center space-x-2 mb-2'}>
              <TrendingUp className={'h-4 w-4 text-primary'} />
              <span className={'font-medium text-sm'}>Insights do Mês</span>
            </div>
            <div className={'text-xs text-muted-foreground space-y-1'}>
              {averagePerformance >= 80 && (
                <p>🎉 Excelente consistência! Você manteve uma performance alta durante o mês.</p>
              )}
              {averagePerformance >= 60 && averagePerformance < 80 && (
                <p>👍 Boa performance! Continue assim para alcançar a excelência.</p>
              )}
              {averagePerformance >= 40 && averagePerformance < 60 && (
                <p>⚡ Performance moderada. Foque em manter a consistência diária.</p>
              )}
              {averagePerformance < 40 && (
                <p>💪 Há espaço para melhoria. Pequenos passos diários fazem grande diferença!</p>
              )}

              {monthlyChart.completedDays > 0 && (
                <p>
                  Você teve {monthlyChart.completedDays} dias produtivos de {monthlyChart.totalDays} registrados.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}