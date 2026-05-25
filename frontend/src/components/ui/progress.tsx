"use client";

import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("w-full bg-black/40 rounded-full h-2.5 overflow-hidden", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
