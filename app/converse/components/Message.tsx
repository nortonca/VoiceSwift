import { User, Bot } from "lucide-react";

interface MessageProps {
  message: {
    id: string;
    from: "user" | "agent";
    text: string;
    ts: number;
  };
}

export function Message({ message }: MessageProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isUser = message.from === "user";

  return (
    <div className={`flex gap-3 group ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
        isUser 
          ? "bg-emerald-500/20 text-emerald-300" 
          : "bg-blue-500/20 text-blue-300"
      }`}>
{isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      
      {/* Message content */}
      <div className={`max-w-[70%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all duration-200 hover:shadow-lg ${
          isUser 
            ? "bg-emerald-500/10 text-white border border-emerald-500/20" 
            : "bg-white/5 text-white/90 border border-white/10"
        }`}>
          {message.text}
        </div>
        
        {/* Timestamp */}
        <span className={`text-xs text-white/40 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${
          isUser ? "text-right" : ""
        }`}>
          {formatTime(message.ts)}
        </span>
      </div>
    </div>
  );
}
