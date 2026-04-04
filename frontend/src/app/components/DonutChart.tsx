interface DonutSegment {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
}

export function DonutChart({
  segments,
  size = 160,
  thickness = 22,
  centerLabel,
  centerSub,
}: DonutChartProps) {
  if (!segments || segments.length === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const R = (size - thickness) / 2 - 4;
  const C = 2 * Math.PI * R;
  const total = segments.reduce((s, d) => s + d.value, 0);

  let cumAngle = 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform transition-transform duration-500 group-hover:scale-105"
        >
          {/* Background ring */}
          <circle
            cx={cx}
            cy={cy}
            r={R}
            fill="none"
            stroke="#f8fafc"
            strokeWidth={thickness}
          />
          {segments.map((seg, i) => {
            const angle = (seg.value / total) * 360;
            const segLen = (seg.value / total) * C;
            const startAngle = cumAngle;
            cumAngle += angle;
            if (seg.value === 0) return null;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth={thickness}
                strokeDasharray={`${segLen} ${C - segLen}`}
                strokeDashoffset={0}
                strokeLinecap="round"
                transform={`rotate(${startAngle - 90} ${cx} ${cy})`}
                className="transition-all duration-700 ease-out"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }}
              />
            );
          })}
        </svg>
        {/* Center text - defaults to total if not provided */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-800 leading-none">
            {centerLabel || total}
          </span>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">
            {centerSub || "Total"}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 w-full pt-2">
        {segments.map((seg) => (
          <div key={seg.name} className="flex items-center justify-between group/item cursor-default">
            <div className="flex items-center gap-3">
              <div
                className="h-2.5 w-2.5 rounded-full flex-shrink-0 transition-transform group-hover/item:scale-125"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[13px] font-medium text-slate-600 group-hover/item:text-slate-900 transition-colors">
                {seg.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-slate-700">
                {seg.value}
              </span>
              <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                {total > 0 ? Math.round((seg.value / total) * 100) : 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
