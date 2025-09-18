import { CreditCard, Zap, TrendingUp } from "lucide-react";

export function BillingSection() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-emerald-400" />
          <h4 className="text-sm font-medium text-white/80">Billing & Usage</h4>
        </div>
        <p className="text-sm text-white/60">Monitor your plan and resource consumption.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-400" />
            <div className="text-xs text-white/60 font-medium">Current Plan</div>
          </div>
          <div className="text-lg font-semibold text-white/90">Pro</div>
          <div className="text-xs text-white/50">Unlimited conversations</div>
        </div>
        
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-400" />
            <div className="text-xs text-white/60 font-medium">Monthly Usage</div>
          </div>
          <div className="text-lg font-semibold text-white/90">12,480 tokens</div>
          <div className="text-xs text-white/50">68% of quota used</div>
        </div>
      </div>
    </div>
  );
}
