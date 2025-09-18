import { VoiceCard } from "./VoiceCard";
import { Sparkles, Mic } from "lucide-react";
import { useState } from "react";

interface VoiceModel {
  id: string;
  name: string;
  description: string;
  isPremium?: boolean;
}

interface VoiceSectionProps {
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
}

const voiceModels: VoiceModel[] = [
  {
    id: "alloy",
    name: "Alloy",
    description: "Neutral, balanced voice perfect for professional interactions and clear communication."
  },
  {
    id: "ash",
    name: "Ash",
    description: "Natural, earthy tone that brings warmth and authenticity to every conversation."
  },
  {
    id: "echo",
    name: "Echo",
    description: "Clear, professional tone ideal for business settings and formal communications."
  },
  {
    id: "sage",
    name: "Sage",
    description: "Wise, thoughtful voice that conveys knowledge and trustworthiness."
  },
  {
    id: "marin",
    name: "Marin",
    description: "Calm, soothing voice that creates a relaxing and welcoming atmosphere."
  },
  {
    id: "cedar",
    name: "Cedar",
    description: "Natural, grounded tone that feels stable and reassuring in all interactions."
  }
];

export function VoiceSection({
  selectedVoice,
  onVoiceChange
}: VoiceSectionProps) {
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

  const handlePreview = (voiceId: string) => {
    if (previewingVoice === voiceId) {
      setPreviewingVoice(null);
    } else {
      setPreviewingVoice(voiceId);
      // Here you would integrate with actual voice preview API
      console.log(`Previewing voice: ${voiceId}`);
      
      // Auto-stop preview after 3 seconds for demo
      setTimeout(() => {
        if (previewingVoice === voiceId) {
          setPreviewingVoice(null);
        }
      }, 3000);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white/90">Voice Model</h3>
        </div>
        <p className="text-sm text-white/60">
          Choose the voice personality that best fits your agent&apos;s character and communication style.
        </p>
      </div>

      {/* Available Models */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-white/80">Available Models</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {voiceModels.map((voice) => (
          <VoiceCard
            key={voice.id}
            id={voice.id}
            name={voice.name}
            description={voice.description}
            isSelected={selectedVoice === voice.id}
            isPremium={voice.isPremium}
            onSelect={onVoiceChange}
            onPreview={handlePreview}
          />
        ))}
        </div>
      </div>

      {/* Premium voices note */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <span className="text-xs text-amber-300">
          10 premium voice models available with advanced emotional range and natural pronunciation
        </span>
      </div>

    </div>
  );
}
