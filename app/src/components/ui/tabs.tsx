"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Controlled active tab value. */
  value?: string;
  /** Default active tab (uncontrolled). */
  defaultValue?: string;
  /** Callback when the active tab changes. */
  onValueChange?: (value: string) => void;
}

export interface TabListProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface TabTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Unique value identifying this tab. */
  value: string;
}

export interface TabContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Must match a TabTrigger's value to be shown. */
  value: string;
}

export interface TabsContextValue {
  activeValue: string;
  setActiveValue: (value: string) => void;
  triggerRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tab* components must be used within <Tabs>");
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Tabs                                                               */
/* ------------------------------------------------------------------ */

function Tabs({
  value: controlledValue,
  defaultValue,
  onValueChange,
  children,
  className,
  ...props
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const triggerRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const activeValue = controlledValue ?? internalValue;

  const setActiveValue = useCallback(
    (v: string) => {
      if (controlledValue === undefined) setInternalValue(v);
      onValueChange?.(v);
    },
    [controlledValue, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ activeValue, setActiveValue, triggerRefs }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

Tabs.displayName = "Tabs";

/* ------------------------------------------------------------------ */
/*  TabList                                                            */
/* ------------------------------------------------------------------ */

const TabList = React.forwardRef<HTMLDivElement, TabListProps>(
  ({ className = "", children, ...props }, ref) => {
    const { activeValue, setActiveValue, triggerRefs } = useTabsContext();
    const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({
      left: 0,
      width: 0,
    });

    // Update indicator position when active tab changes
    useEffect(() => {
      const activeTrigger = triggerRefs.current.get(activeValue);
      if (activeTrigger) {
        const parent = activeTrigger.parentElement;
        if (parent) {
          const triggerRect = activeTrigger.getBoundingClientRect();
          const parentRect = parent.getBoundingClientRect();
          setIndicatorStyle({
            left: triggerRect.left - parentRect.left,
            width: triggerRect.width,
          });
        }
      }
    }, [activeValue, triggerRefs]);

    // --- Arrow-key navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        const values = Array.from(triggerRefs.current.keys());
        const currentIndex = values.indexOf(activeValue);
        let nextIndex = currentIndex;

        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          nextIndex = (currentIndex + 1) % values.length;
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          nextIndex = (currentIndex - 1 + values.length) % values.length;
        } else if (e.key === "Home") {
          e.preventDefault();
          nextIndex = 0;
        } else if (e.key === "End") {
          e.preventDefault();
          nextIndex = values.length - 1;
        } else {
          return;
        }

        const nextValue = values[nextIndex];
        setActiveValue(nextValue);
        triggerRefs.current.get(nextValue)?.focus();
      },
      [activeValue, setActiveValue, triggerRefs],
    );

    return (
      <div
        ref={ref}
        role="tablist"
        className={cn(
          "relative flex border-b border-gray-200",
          className,
        )}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
        {/* Active underline indicator */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-blue-600 transition-all duration-200 ease-out"
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        />
      </div>
    );
  },
);
TabList.displayName = "TabList";

/* ------------------------------------------------------------------ */
/*  TabTrigger                                                         */
/* ------------------------------------------------------------------ */

const TabTrigger = React.forwardRef<HTMLButtonElement, TabTriggerProps>(
  ({ value, className = "", onClick, ...props }, ref) => {
    const { activeValue, setActiveValue, triggerRefs } = useTabsContext();
    const isActive = activeValue === value;

    const internalRef = useCallback(
      (node: HTMLButtonElement | null) => {
        if (node) {
          triggerRefs.current.set(value, node);
          // Forward the ref
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        } else {
          triggerRefs.current.delete(value);
        }
      },
      [value, ref, triggerRefs],
    );

    return (
      <button
        ref={internalRef}
        type="button"
        role="tab"
        aria-selected={isActive}
        tabIndex={isActive ? 0 : -1}
        className={cn(
          "inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium",
          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500",
          isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700",
          className,
        )}
        onClick={(e) => {
          setActiveValue(value);
          onClick?.(e);
        }}
        {...props}
      />
    );
  },
);
TabTrigger.displayName = "TabTrigger";

/* ------------------------------------------------------------------ */
/*  TabContent                                                         */
/* ------------------------------------------------------------------ */

const TabContent = React.forwardRef<HTMLDivElement, TabContentProps>(
  ({ value, className = "", children, ...props }, ref) => {
    const { activeValue } = useTabsContext();

    if (activeValue !== value) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        tabIndex={0}
        className={cn(
          "mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          "animate-in fade-in slide-in-from-bottom-1 duration-200",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
TabContent.displayName = "TabContent";

export { Tabs, TabList, TabTrigger, TabContent };
