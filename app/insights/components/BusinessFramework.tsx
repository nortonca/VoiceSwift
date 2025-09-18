import { Lightbulb } from "lucide-react";

export function BusinessFramework() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-emerald-400" />
          <h4 className="text-sm font-medium text-white/80">Business Decision Framework</h4>
        </div>
        <p className="text-sm text-white/60">Actionable recommendations based on your metrics</p>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
          <div className="text-sm text-white/70">Prioritize reducing average response time under 20s.</div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
          <div className="text-sm text-white/70">Escalate conversations open &gt; 24h for manual review.</div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
          <div className="text-sm text-white/70">Improve scripted replies for top 3 FAQ intents.</div>
        </div>
      </div>
    </div>
  );
}
