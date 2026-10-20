"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { NavHistoryIcon } from "@bookmarked/utils/navigationHistory";
import { useNavHistory } from "@/lib/navigation/NavHistoryProvider";

const ICONS: Record<NavHistoryIcon, string> = {
  overview: "⌂",
  library: "▦",
  shelf: "▤",
  book: "▣",
  feed: "☰",
  search: "⌕",
  discover: "✧",
  clubs: "☺",
  challenges: "🏆",
  events: "▦",
  map: "⌖",
  messages: "✉",
  profile: "☺",
  settings: "⚙",
  notes: "✎",
  reviews: "★",
  stats: "▥",
  generic: "›",
};

export function HistoryMenuButton() {
  const { previous, jump } = useNavHistory();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, maxHeight: 240 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    const items = menu?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
    items?.[0]?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const list = [...(menu?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])];
      if (list.length === 0) return;
      event.preventDefault();
      const current = list.indexOf(document.activeElement as HTMLButtonElement);
      const next =
        event.key === "ArrowDown"
          ? (current + 1) % list.length
          : (current - 1 + list.length) % list.length;
      list[next]?.focus();
    }

    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  if (previous.length === 0) return null;

  function placeMenu() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 240;
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const openAbove = spaceBelow < 140 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(96, Math.min(240, openAbove ? spaceAbove : spaceBelow));
    setPosition({
      top: openAbove ? Math.max(8, rect.top - maxHeight - 6) : rect.bottom + 6,
      left,
      maxHeight,
    });
  }

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    placeMenu();
    setOpen(true);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-lg text-puce-red hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label="Show previous screens"
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            placeMenu();
            setOpen(true);
          }
        }}
      >
        ▾
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label="Previous screens"
              className="fixed z-[80] w-60 overflow-auto rounded-xl border border-border bg-surface p-1 text-left shadow-lg"
              style={{ top: position.top, left: position.left, maxHeight: position.maxHeight }}
            >
              {previous.map((item) => (
                <button
                  key={`${item.index}:${item.key}`}
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
                  aria-label={`Go to ${item.title}`}
                  onClick={() => {
                    setOpen(false);
                    jump(item.index);
                  }}
                >
                  <span aria-hidden className="w-4 text-center text-puce-red">
                    {ICONS[item.icon]}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.title}</span>
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </>
  );
}

export function BackCluster({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex max-w-full items-center gap-0.5">
      {children}
      <HistoryMenuButton />
    </div>
  );
}
