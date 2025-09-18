interface FieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}

export function Field({ label, children, hint, error }: FieldProps) {
  return (
    <label className="block">
      <div className="text-xs text-white/60 mb-1">{label}</div>
      {children}
      <div className="min-h-[18px] mt-1 text-[11px]">
        {error ? (
          <span className="text-rose-400">{error}</span>
        ) : hint ? (
          <span className="text-white/40">{hint}</span>
        ) : null}
      </div>
    </label>
  );
}
