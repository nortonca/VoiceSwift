import { Field } from "./Field";
import { User } from "lucide-react";

interface GeneralSectionProps {
  name: string;
  onNameChange: (name: string) => void;
  desc: string;
  onDescChange: (desc: string) => void;
  company: string;
  onCompanyChange: (company: string) => void;
  startMessage: string;
  onStartMessageChange: (startMessage: string) => void;
  systemInstructions: string;
  onSystemInstructionsChange: (systemInstructions: string) => void;
  errors: Record<string, string>;
}

export function GeneralSection({
  name,
  onNameChange,
  desc,
  onDescChange,
  company,
  onCompanyChange,
  startMessage,
  onStartMessageChange,
  systemInstructions,
  onSystemInstructionsChange,
  errors
}: GeneralSectionProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white/90">General</h3>
        </div>
        <p className="text-sm text-white/60">Configure your agent's identity and behavior.</p>
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-white/80">Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Agent name" error={errors.name}>
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className={`w-full bg-transparent text-sm px-3 py-2 rounded-lg border ${errors.name ? "border-rose-500/60" : "border-white/10"}`}
              placeholder="e.g., Lumi Receptionist"
            />
          </Field>
          <Field label="Company">
            <input
              value={company}
              onChange={(e) => onCompanyChange(e.target.value)}
              className="w-full bg-transparent text-sm px-3 py-2 rounded-lg border border-white/10"
              placeholder="Annulus"
            />
          </Field>
        </div>
      </div>
      
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-white/80">Agent Behavior</h4>
        <Field label="Description" hint="One or two sentences">
          <textarea
            value={desc}
            onChange={(e) => onDescChange(e.target.value)}
            rows={2}
            className="w-full bg-transparent text-sm px-3 py-2 rounded-lg border border-white/10 resize-none"
            placeholder="Greets callers, answers FAQs, books appointments."
          />
        </Field>

        <Field label="Start Message" hint="The first message your agent will send to users">
          <textarea
            value={startMessage}
            onChange={(e) => onStartMessageChange(e.target.value)}
            rows={2}
            className="w-full bg-transparent text-sm px-3 py-2 rounded-lg border border-white/10 resize-none"
            placeholder="Hello! I'm here to help you today. How can I assist you?"
          />
        </Field>

        <Field label="System Instructions" hint="Enter detailed instructions for how your agent should behave">
          <textarea
            value={systemInstructions}
            onChange={(e) => onSystemInstructionsChange(e.target.value)}
            rows={6}
            className="w-full bg-transparent text-sm px-3 py-2 rounded-lg border border-white/10 resize-y"
            placeholder="You are a helpful AI assistant representing this company. Always be polite and professional. When greeting customers, use a warm and welcoming tone. If you don't know the answer to something, politely direct them to speak with a human representative."
          />
        </Field>
      </div>
    </div>
  );
}
