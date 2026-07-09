import * as React from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Value between 0 and 100. */
  value?: number;
  /** Show percentage text. */
  showLabel?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getProgressColor(value: number): string {
  if (value < 30) return "bg-red-500";
  if (value <= 70) return "bg-yellow-500";
  return "bg-green-500";
}

function getTrackColor(value: number): string {
  if (value < 30) return "bg-red-100";
  if (value <= 70) return "bg-yellow-100";
  return "bg-green-100";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className = "", value = 0, showLabel = false, ...props }, ref) => {
    const clamped = Math.max(0, Math.min(100, value));

    return (
      <div className="w-full" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} aria-label="进度">
        <div className="flex items-center gap-3">
          <div
            ref={ref}
            className={`relative h-3 w-full overflow-hidden rounded-full ${getTrackColor(clamped)} ${className}`}
            {...props}
          >
            <div
              className={[
                "h-full rounded-full transition-all duration-500 ease-in-out",
                getProgressColor(clamped),
              ].join(" ")}
              style={{ width: `${clamped}%` }}
            />
          </div>

          {showLabel && (
            <span className="min-w-[2.5rem] text-right text-sm font-medium tabular-nums text-gray-700">
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      </div>
    );
  },
);

Progress.displayName = "Progress";

export { Progress };
