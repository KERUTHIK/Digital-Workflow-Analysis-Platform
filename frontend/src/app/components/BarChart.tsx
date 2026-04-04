interface BarDataPoint {
  label: string;
  value: number;
  value2?: number;
  color?: string;
}

interface BarChartProps {
  data: BarDataPoint[];
  color?: string;
  color2?: string;
  label?: string;
  label2?: string;
  height?: number;
  unit?: string;
}

export function BarChart({
  data,
  color = "#6366f1",
  color2,
  label,
  label2,
  height = 140,
  unit = "",
}: BarChartProps) {
  if (!data || data.length === 0) return null;

  const W = 400;
  const H = height;
  const padL = 36;
  const padR = 16;
  const padT = 12;
  const padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const allVals = data.flatMap((d) =>
    color2 ? [d.value, d.value2 ?? 0] : [d.value]
  );
  const maxVal = Math.max(...allVals, 1);

  const groupW = chartW / data.length;
  const barPad = 8;
  const barW = color2
    ? (groupW - barPad * 2) / 2 - 2
    : groupW - barPad * 2;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) =>
    Math.round(t * maxVal)
  );

  return (
    <div className="w-full">
      {(label || label2) && (
        <div className="flex items-center gap-4 mb-2">
          {label && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="h-2 w-4 rounded-sm" style={{ backgroundColor: color }} />
              {label}
            </div>
          )}
          {label2 && color2 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="h-2 w-4 rounded-sm" style={{ backgroundColor: color2 }} />
              {label2}
            </div>
          )}
        </div>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid + Y ticks */}
        {yTicks.map((tick, i) => {
          const y = padT + chartH - (tick / maxVal) * chartH;
          return (
            <g key={i}>
              <line
                x1={padL}
                y1={y}
                x2={W - padR}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
              <text
                x={padL - 4}
                y={y + 4}
                textAnchor="end"
                fontSize="9"
                fill="#94a3b8"
              >
                {tick}
                {unit}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const groupX = padL + i * groupW + barPad;
          const barH1 = (d.value / maxVal) * chartH;
          const y1 = padT + chartH - barH1;

          return (
            <g key={i}>
              {/* Primary bar */}
              <rect
                x={groupX}
                y={y1}
                width={barW}
                height={barH1}
                fill={d.color ?? color}
                rx="3"
                ry="3"
                opacity={0.85}
              />

              {/* Secondary bar */}
              {color2 && d.value2 !== undefined && (
                <rect
                  x={groupX + barW + 2}
                  y={padT + chartH - (d.value2 / maxVal) * chartH}
                  width={barW}
                  height={(d.value2 / maxVal) * chartH}
                  fill={color2}
                  rx="3"
                  ry="3"
                  opacity={0.85}
                />
              )}

              {/* X label */}
              <text
                x={groupX + (color2 ? barW : barW / 2)}
                y={H - 4}
                textAnchor="middle"
                fontSize="9"
                fill="#94a3b8"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
