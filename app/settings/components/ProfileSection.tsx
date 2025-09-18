import { User } from "lucide-react";
import { Field } from "../../build/components/Field";

interface ProfileSectionProps {
  name: string;
  onNameChange: (name: string) => void;
  email: string;
  onEmailChange: (email: string) => void;
  company: string;
  onCompanyChange: (company: string) => void;
}

export function ProfileSection({ name, onNameChange, email, onEmailChange, company, onCompanyChange }: ProfileSectionProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-emerald-400" />
          <h4 className="text-sm font-medium text-white/80">Profile Information</h4>
        </div>
        <p className="text-sm text-white/60">Update your personal and company details.</p>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full Name">
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Alex Thompson"
              className="w-full bg-transparent text-sm px-3 py-2 rounded-lg border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/20 transition-all"
            />
          </Field>
          <Field label="Email Address">
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="alex@example.com"
              className="w-full bg-transparent text-sm px-3 py-2 rounded-lg border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/20 transition-all"
            />
          </Field>
        </div>
        
        <Field label="Company">
          <input
            value={company}
            onChange={(e) => onCompanyChange(e.target.value)}
            placeholder="Annulus"
            className="w-full bg-transparent text-sm px-3 py-2 rounded-lg border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/20 transition-all"
          />
        </Field>
      </div>
    </div>
  );
}
