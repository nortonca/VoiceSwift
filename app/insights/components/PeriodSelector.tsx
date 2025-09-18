const periods = ["24h", "7d", "30d", "90d"] as const;
type Period = typeof periods[number];

interface PeriodSelectorProps {
  currentPeriod: Period;
  onPeriodChange: (period: Period) => void;
}

export function PeriodSelector({ currentPeriod, onPeriodChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
      {periods.map((period) => (
        <button
          key={period}
          onClick={() => onPeriodChange(period)}
          className={`px-3 py-1.5 text-xs rounded-full ${currentPeriod === period ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/10"}`}
          aria-pressed={currentPeriod === period}
        >
          {period}
        </button>
      ))}
    </div>
  );
}
