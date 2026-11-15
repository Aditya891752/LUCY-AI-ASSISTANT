"use client";

import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  label: string;
  unit?: string;
  className?: string;
}

export function ProgressRing({
  value,
  max,
  size = 110,
  strokeWidth = 9,
  colorClass = "text-accent",
  label,
  unit = "",
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const strokeDashoffset = circumference - percentage * circumference;

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-border"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Foreground Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={cn("transition-all duration-500 ease-out", colorClass)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>

        {/* Center Numbers */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
          <span className="text-base font-bold tabular-nums text-foreground tracking-tight leading-none">
            {value.toLocaleString()}
          </span>
          {unit && (
            <span className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5">
              {unit}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 text-center">
        <span className="text-xs font-semibold text-foreground block">{label}</span>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          of {max.toLocaleString()} {unit}
        </span>
      </div>
    </div>
  );
}
