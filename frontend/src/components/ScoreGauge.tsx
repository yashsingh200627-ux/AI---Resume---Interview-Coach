import React from 'react';

interface ScoreGaugeProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  label = 'Score',
  size = 'md',
  showLabel = true,
}) => {
  const normalized = Math.max(0, Math.min(100, Math.round(score)));

  const getColor = (val: number) => {
    if (val >= 80) return { stroke: '#10b981', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Strong' };
    if (val >= 65) return { stroke: '#6366f1', text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', label: 'Good' };
    if (val >= 50) return { stroke: '#f59e0b', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Fair' };
    return { stroke: '#ef4444', text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', label: 'Needs Improvement' };
  };

  const color = getColor(normalized);

  const dimensions = {
    sm: { size: 64, stroke: 6, text: 'text-base font-bold', sub: 'text-[10px]' },
    md: { size: 96, stroke: 8, text: 'text-2xl font-black', sub: 'text-xs' },
    lg: { size: 140, stroke: 10, text: 'text-4xl font-black', sub: 'text-sm' },
  }[size];

  const radius = (dimensions.size - dimensions.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalized / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={dimensions.size}
          height={dimensions.size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={dimensions.stroke}
            className="text-slate-800"
            fill="transparent"
          />
          {/* Value circle */}
          <circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={radius}
            stroke={color.stroke}
            strokeWidth={dimensions.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`${dimensions.text} ${color.text} tracking-tight`}>
            {normalized}%
          </span>
        </div>
      </div>

      {showLabel && (
        <div className="mt-2 text-center">
          <span className="text-xs font-semibold text-slate-300 block">{label}</span>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border inline-block mt-0.5 ${color.bg} ${color.text} ${color.border}`}>
            {color.label}
          </span>
        </div>
      )}
    </div>
  );
};
