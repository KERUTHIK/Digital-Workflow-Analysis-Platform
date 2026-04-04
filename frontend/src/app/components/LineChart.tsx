interface LineDataPoint {
  label: string;
  value: number;
  value2?: number;
}

interface LineChartProps {
  data: LineDataPoint[];
  color?: string;
  color2?: string;
  label?: string;
  label2?: string;
  unit?: string;
  height?: number;
}

export function LineChart({
  data,
  color = "#6366f1",
  color2,
  label,
  label2,
  unit = "",
  height = 140,
}: LineChartProps) {
  if (!data || data.length === 0) return null;

  const W = 400;
  const H = height;
  const padL = 36;
  const padR = 16;
  const padT = 12;
  const padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const all1 = data.map((d) => d.value);
  const all2 = color2 ? data.map((d) => d.value2 ?? 0) : [];
  const allVals = [...all1, ...all2];
  const maxVal = Math.max(...allVals, 1);
  const minVal = Math.min(...allVals, 0);
  const range = maxVal - minVal || 1;

  const xStep = data.length > 1 ? chartW / (data.length - 1) : 0;

  function getBezierCurve(points: { x: number; y: number }[]) {
    if (points.length < 2) return "";
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      d += ` C ${cp1x},${p0.y} ${cp2x},${p1.y} ${p1.x},${p1.y}`;
    }
    return d;
  }

  function getBezierArea(points: { x: number; y: number }[]) {
    if (points.length < 2) return "";
    const curve = getBezierCurve(points);
    const last = points[points.length - 1];
    const bottom = padT + chartH;
    return `${curve} L ${last.x},${bottom} L ${points[0].x},${bottom} Z`;
  }

  const p1_pts = data.map((d, i) => {
    const x = padL + i * xStep;
    const y = padT + chartH - ((d.value - minVal) / range) * chartH;
    return { x, y };
  });

  const p2_pts = color2 ? data.map((d, i) => {
    const val = d.value2 ?? 0;
    const x = padL + i * xStep;
    const y = padT + chartH - ((val - minVal) / range) * chartH;
    return { x, y };
  }) : [];

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(
    (t) => Math.round(minVal + t * range)
  );

  return (
    <div className="w-full group/chart">
      {(label || label2) && (
        <div className="flex items-center gap-4 mb-2">
          {label && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="h-2 w-4 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </div>
          )}
          {label2 && color2 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="h-2 w-4 rounded-full" style={{ backgroundColor: color2 }} />
              {label2}
            </div>
          )}
        </div>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full transition-all duration-300"
        style={{ height }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="areaGradient1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.12" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          {color2 && (
            <linearGradient id="areaGradient2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color2} stopOpacity="0.08" />
              <stop offset="100%" stopColor={color2} stopOpacity="0" />
            </linearGradient>
          )}
        </defs>

        {/* Grid lines + Y ticks */}
        {yTicks.map((tick, i) => {
          const y = padT + chartH - ((tick - minVal) / range) * chartH;
          return (
            <g key={i}>
              <line
                x1={padL}
                y1={y}
                x2={W - padR}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="0.8"
                strokeDasharray={i === 0 ? "0" : "4 4"}
              />
              <text
                x={padL - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="8"
                fontWeight="500"
                fill="#94a3b8"
              >
                {tick}
                {unit}
              </text>
            </g>
          );
        })}

        {/* Area fills */}
        <path d={getBezierArea(p1_pts)} fill="url(#areaGradient1)" />
        {color2 && <path d={getBezierArea(p2_pts)} fill="url(#areaGradient2)" />}

        {/* Lines */}
        <path
          d={getBezierCurve(p1_pts)}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          className="transition-all duration-500"
        />
        {color2 && (
          <path
            d={getBezierCurve(p2_pts)}
            fill="none"
            stroke={color2}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="5 4"
            opacity="0.7"
          />
        )}

        {/* Dots */}
        {data.map((d, i) => {
          const x = padL + i * xStep;
          const y = padT + chartH - ((d.value - minVal) / range) * chartH;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3.5"
              fill="white"
              stroke={color}
              strokeWidth="2"
            />
          );
        })}
        {color2 &&
          data.map((d, i) => {
            const x = padL + i * xStep;
            const val = d.value2 ?? 0;
            const y = padT + chartH - ((val - minVal) / range) * chartH;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3.5"
                fill="white"
                stroke={color2}
                strokeWidth="2"
              />
            );
          })}

        {/* X-axis labels */}
        {data.map((d, i) => {
          const x = padL + i * xStep;
          const showEvery = data.length > 6 ? 2 : 1;
          if (i % showEvery !== 0) return null;
          return (
            <text
              key={i}
              x={x}
              y={H - 4}
              textAnchor="middle"
              fontSize="9"
              fill="#94a3b8"
            >
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
