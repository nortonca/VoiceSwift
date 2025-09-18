"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Zap, Hammer, MessageSquare, BarChart3, Settings } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const items: Array<{ href: string; label: string; icon: React.ComponentType<any> }> = [
    { href: "/", label: "Live", icon: Zap },
    { href: "/build", label: "Build", icon: Hammer },
    { href: "/converse", label: "Converse", icon: MessageSquare },
    { href: "/insights", label: "Insights", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/30 border-b border-white/5">
      <div className="mx-auto w-full max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium tracking-wide text-white/70 uppercase">VoiceSwift</div>
          <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            {items.map((item) => {
              const active = pathname === item.href;
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs transition-colors",
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                >
                  <IconComponent className="h-3 w-3" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}


