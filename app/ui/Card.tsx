"use client";

import clsx from "clsx";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...rest }: CardProps) {
	return <div className={clsx("vs-card p-4", className)} {...rest} />;
}
