"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** When true, clicking the overlay does nothing. */
  persistent?: boolean;
  className?: string;
}

export interface DialogOverlayProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface DialogContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface DialogHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface DialogTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

export interface DialogDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export interface DialogFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export interface DialogCloseProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

/* ------------------------------------------------------------------ */
/*  Overlay                                                            */
/* ------------------------------------------------------------------ */

const DialogOverlay = React.forwardRef<HTMLDivElement, DialogOverlayProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        "animate-in fade-in duration-200",
        className,
      )}
      {...props}
    />
  ),
);
DialogOverlay.displayName = "DialogOverlay";

/* ------------------------------------------------------------------ */
/*  Content Card                                                       */
/* ------------------------------------------------------------------ */

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className = "", children, ...props }, ref) => (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      className={cn(
        "relative z-50 mx-auto mt-[10vh] w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl",
        "animate-in zoom-in-95 fade-in duration-200",
        "outline-none",
        "max-h-[80vh] overflow-y-auto",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
DialogContent.displayName = "DialogContent";

/* ------------------------------------------------------------------ */
/*  Header / Title / Description                                       */
/* ------------------------------------------------------------------ */

const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5", className)}
      {...props}
    />
  ),
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className = "", ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight text-gray-900", className)}
      {...props}
    />
  ),
);
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  DialogDescriptionProps
>(({ className = "", ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  ),
);
DialogFooter.displayName = "DialogFooter";

/* ------------------------------------------------------------------ */
/*  Close Button                                                       */
/* ------------------------------------------------------------------ */

const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ className = "", ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label="关闭"
      className={cn(
        "absolute right-4 top-4 rounded-lg p-1.5 text-gray-400",
        "transition-colors hover:bg-gray-100 hover:text-gray-600",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        className,
      )}
      {...props}
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  ),
);
DialogClose.displayName = "DialogClose";

/* ------------------------------------------------------------------ */
/*  Main Dialog Component (composable)                                 */
/* ------------------------------------------------------------------ */

/**
 * Usage:
 *   <Dialog open={open} onClose={setOpen}>
 *     <DialogOverlay />
 *     <DialogContent>
 *       <DialogClose onClick={onClose} />
 *       <DialogHeader>
 *         <DialogTitle>标题</DialogTitle>
 *         <DialogDescription>描述</DialogDescription>
 *       </DialogHeader>
 *       {/* body *\/}
 *       <DialogFooter>...</DialogFooter>
 *     </DialogContent>
 *   </Dialog>
 */

function Dialog({ open, onClose, children, persistent, className }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // --- Escape key handler
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !persistent) onClose();
    },
    [onClose, persistent],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  // --- Click outside handler
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current && !persistent) {
        onClose();
      }
    },
    [onClose, persistent],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <DialogOverlay ref={overlayRef} onClick={handleOverlayClick} />
      <div className="relative z-50 flex items-start justify-center">
        {React.Children.map(children, (child) =>
          child
            ? React.cloneElement(child as React.ReactElement<{ className?: string }>, {
                className: cn(
                  (child as React.ReactElement<{ className?: string }>).props.className,
                  className,
                ),
              })
            : child,
        )}
      </div>
    </div>
  );
}

Dialog.displayName = "Dialog";

export {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
};
