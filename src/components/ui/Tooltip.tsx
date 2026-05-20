"use client";

import { ReactNode, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function Tooltip({
  content,
  children,
  side = "top"
}: {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom";
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setPosition(null);
      return;
    }

    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({
        top: side === "top" ? rect.top - 8 : rect.bottom + 8,
        left: rect.left + rect.width / 2
      });
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, side]);

  const tooltip =
    open && position
      ? createPortal(
          <span
            id={id}
            role="tooltip"
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              transform: side === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)"
            }}
            className="pointer-events-none z-[200] w-64 max-w-[min(16rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface-elevated p-3 text-left text-xs leading-relaxed text-muted shadow-card"
          >
            {content}
          </span>,
          document.body
        )
      : null;

  return (
    <>
      <span
        ref={triggerRef}
        className="relative inline-flex"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <span aria-describedby={open ? id : undefined}>{children}</span>
      </span>
      {tooltip}
    </>
  );
}
