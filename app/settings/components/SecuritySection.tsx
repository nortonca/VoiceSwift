import { Shield } from "lucide-react";

interface SecuritySectionProps {
  twofa: boolean;
  onTwofaChange: (enabled: boolean) => void;
}

export function SecuritySection({ twofa, onTwofaChange }: SecuritySectionProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-400" />
          <h4 className="text-sm font-medium text-white/80">Security</h4>
        </div>
        <p className="text-sm text-white/60">Configure security settings for your account.</p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5">
          <div>
            <div className="text-sm text-white/80 font-medium">Two‑factor authentication</div>
            <div className="text-xs text-white/50 mt-1">Extra sign‑in security for your account</div>
          </div>
          <button onClick={() => onTwofaChange(!twofa)} className={`relative inline-flex h-6 w-11 items-center rounded-full ${twofa ? "bg-emerald-500" : "bg-white/10"}`}>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${twofa ? "translate-x-5" : "translate-x-1"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
