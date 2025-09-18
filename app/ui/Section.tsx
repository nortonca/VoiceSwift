"use client";

import { Card } from "./Card";

interface SectionProps {
	title: string;
	description?: string;
	children: React.ReactNode;
}

export function Section({ title, description, children }: SectionProps) {
	return (
		<Card className="space-y-3">
			<div>
				<div className="text-sm text-white/85">{title}</div>
				{description && (
					<div className="text-xs text-white/50 mt-1">{description}</div>
				)}
			</div>
			{children}
		</Card>
	);
}
