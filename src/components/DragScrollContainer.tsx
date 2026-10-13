"use client";

import { useEffect, useRef } from "react";

export function useDragScroll() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Do not hijack clicks on form elements, links, or buttons
      if (
        ["SELECT", "INPUT", "BUTTON", "LABEL", "A", "TEXTAREA"].includes(target.tagName) ||
        target.closest("select, input, button, label, a, textarea")
      ) {
        return;
      }
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
    };

    const onMouseLeave = () => {
      isDown = false;
      el.style.cursor = "default";
      el.style.removeProperty("user-select");
    };

    const onMouseUp = () => {
      isDown = false;
      el.style.cursor = "default";
      el.style.removeProperty("user-select");
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      el.scrollLeft = scrollLeft - walk;
    };

    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mouseleave", onMouseLeave);
    el.addEventListener("mouseup", onMouseUp);
    el.addEventListener("mousemove", onMouseMove);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mouseleave", onMouseLeave);
      el.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return ref;
}

export default function DragScrollContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const scrollRef = useDragScroll();

  return (
    <div
      ref={scrollRef}
      role="region"
      aria-label="Tabel dapat digeser secara horizontal"
      tabIndex={0}
      className={`max-w-full touch-pan-x overscroll-x-contain overflow-x-auto select-none cursor-grab active:cursor-grabbing ${className}`}
    >
      {children}
    </div>
  );
}

