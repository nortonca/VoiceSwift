"use client";

import clsx from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	startIcon?: React.ReactNode;
	endIcon?: React.ReactNode;
}

export function Input({ className, startIcon, endIcon, ...rest }: InputProps) {
	return (
		<div className={clsx("relative flex items-center", className)}>
			{startIcon && (
				<span className="absolute left-2 text-white/50 pointer-events-none">{startIcon}</span>
			)}
			<input
				className={clsx(
					"vs-input w-full placeholder:text-white/40 focus-visible:shadow-[var(--vs-color-ring)]",
					startIcon ? "pl-7" : "",
					endIcon ? "pr-7" : ""
				)}
				{...rest}
			/>
			{endIcon && (
				<span className="absolute right-2 text-white/70">{endIcon}</span>
			)}
		</div>
	);
}
