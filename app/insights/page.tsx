"use client";

import { useMemo, useState } from "react";
import { KPI } from "./components/KPI";
import { PeriodSelector } from "./components/PeriodSelector";
import { BusinessFramework } from "./components/BusinessFramework";
import { BarChart3, RefreshCw } from "lucide-react";

const periods = ["24h", "7d", "30d", "90d"] as const;
type Period = typeof periods[number];

export default function InsightsPage() {
  const [period, setPeriod] = useState<Period>("24h");
  const [tick, setTick] = useState(0);

  const metrics = useMemo(() => {
    const base = {
      "24h": { convos: 42, rt: 18, csat: 92, rr: 78 },
      "7d": { convos: 268, rt: 21, csat: 90, rr: 81 },
      "30d": { convos: 1084, rt: 24, csat: 89, rr: 83 },
      "90d": { convos: 3260, rt: 26, csat: 88, rr: 84 },
    } as const;
    const b = base[period];
    const jitter = (n: number) => Math.max(0, Math.round(n + ((tick % 3) - 1) * 0.03 * n));
    return {
      conversations: jitter(b.convos),
      responseTime: jitter(b.rt),
      csat: jitter(b.csat),
      resolutionRate: jitter(b.rr),
      deltas: {
        conversations: period === "24h" ? +4 : period === "7d" ? +6 : +9,
        responseTime: period === "24h" ? -3 : -2,
        csat: period === "24h" ? +1 : 0,
        resolutionRate: period === "24h" ? +2 : +1,
      },
    };
  }, [period, tick]);

  return (
    <div className="flex-1 px-4 py-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Header Section */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white/90">Analytics Dashboard</h3>
          </div>
          <p className="text-sm text-white/60">Monitor your agent's performance and key business metrics.</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <PeriodSelector currentPeriod={period} onPeriodChange={setPeriod} />
          <button 
            onClick={() => setTick((t) => t + 1)} 
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/70 border border-white/10 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-white/80">Key Performance Indicators</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPI label="Conversations" value={metrics.conversations} delta={metrics.deltas.conversations} />
          <KPI label="Response Time" value={metrics.responseTime} suffix="s" delta={metrics.deltas.responseTime} />
          <KPI label="Satisfaction Score" value={metrics.csat} suffix="%" delta={metrics.deltas.csat} />
          <KPI label="Resolution Rate" value={metrics.resolutionRate} suffix="%" delta={metrics.deltas.resolutionRate} />
        </div>
      </div>

      <BusinessFramework />
    </div>
  );
}


