import * as React from "react";

/* ------------------------------------------------------------------ */
/*  Variants                                                           */
/* ------------------------------------------------------------------ */

const variantClasses = {
  default: "bg-blue-100 text-blue-700 border-blue-200",
  secondary: "bg-gray-100 text-gray-700 border-gray-200",
  destructive: "bg-red-100 text-red-700 border-red-200",
  outline: "bg-transparent text-gray-700 border-gray-300",
} as const;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type BadgeVariant = keyof typeof variantClasses;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = "", variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        variantClasses[variant],
        className,
      ].join(" ")}
      {...props}
    />
  ),
);

Badge.displayName = "Badge";

export { Badge };
