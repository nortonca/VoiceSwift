interface KPIProps {
  label: string;
  value: number;
  suffix?: string;
  delta?: number;
}

export function KPI({ label, value, suffix = "", delta }: KPIProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="text-xs text-white/50 font-medium">{label}</div>
      <div className="text-2xl font-semibold text-white/90">{value}{suffix}</div>
      {typeof delta === "number" && (
        <div className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
          delta >= 0 
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
            : "bg-red-500/20 text-red-400 border border-red-500/30"
        }`}>
          {delta >= 0 ? "+" : ""}{delta}% vs prev
        </div>
      )}
    </div>
  );
}
