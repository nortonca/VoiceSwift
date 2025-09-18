"use client";

import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	icon?: React.ReactNode;
	trailingIcon?: React.ReactNode;
	loading?: boolean;
}

export function Button({
	variant = "secondary",
	size = "md",
	icon,
	trailingIcon,
	loading,
	className,
	children,
	...rest
}: ButtonProps) {
	const base = "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-visible:outline-0";
	const sizes = {
		sm: "text-xs px-3 py-1.5",
		md: "text-sm px-4 py-2",
	};
	const variants = {
		primary:
			"bg-[var(--vs-brand)] text-white hover:bg-[var(--vs-brand-600)] active:bg-[var(--vs-brand-700)]",
		secondary:
			"bg-white/10 text-white hover:bg-white/15 border border-white/10",
		ghost:
			"text-white/80 hover:text-white hover:bg-white/10",
	};

	return (
		<button
			className={clsx(base, sizes[size], variants[variant], className)}
			aria-busy={loading}
			{...rest}
		>
			{icon}
			{children}
			{trailingIcon}
		</button>
	);
}
