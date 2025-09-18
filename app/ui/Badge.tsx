"use client";

import clsx from "clsx";

type Tone = "ok" | "warn" | "info";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
	icon?: React.ReactNode;
	tone?: Tone;
}

export function Badge({ className, tone = "info", icon, children, ...rest }: BadgeProps) {
	const tones = {
		ok: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
		warn: "border-amber-500/30 bg-amber-500/10 text-amber-300",
		info: "border-white/15 bg-white/5 text-white/70",
	};
	return (
		<span
			className={clsx(
				"inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] border",
				tones[tone],
				className
			)}
			{...rest}
		>
			{icon}
			{children}
		</span>
	);
}
