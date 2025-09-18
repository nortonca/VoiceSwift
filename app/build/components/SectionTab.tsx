type Section = "general" | "voice" | "knowledge" | "tools";

interface SectionTabProps {
  id: Section;
  label: string;
  active: boolean;
  onClick: () => void;
}

export function SectionTab({ id, label, active, onClick }: SectionTabProps) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 text-xs rounded-full ${active ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}>
      {label}
    </button>
  );
}
