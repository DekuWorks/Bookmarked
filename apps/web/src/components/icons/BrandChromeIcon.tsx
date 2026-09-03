import { cn } from "@/lib/utils/cn";

export type BrandChromeIconName = "notes" | "clubs" | "save" | "library" | "search" | "home";

type Props = {
  name: BrandChromeIconName;
  className?: string;
};

/** waiting-on-assets: swap these purple strokes for Leighton's final chrome set. */
export function BrandChromeIcon({ name, className }: Props) {
  const cls = cn("h-5 w-5 shrink-0 text-puce-red", className);
  switch (name) {
    case "notes":
      return (
        <svg aria-hidden viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 4h8l4 4v12a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1z" />
          <path strokeLinecap="round" d="M9 12h6M9 16h4" />
        </svg>
      );
    case "clubs":
      return (
        <svg aria-hidden viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 19v-1.5A3.5 3.5 0 0012.5 14h-1A3.5 3.5 0 008 17.5V19M12 12.5a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
      );
    case "save":
      return (
        <svg aria-hidden viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10v16l-5-3-5 3V4z" />
        </svg>
      );
    case "library":
      return (
        <svg aria-hidden viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5V6.75A1.75 1.75 0 015.75 5h2.5A1.75 1.75 0 0110 6.75V19.5M10 19.5V8.75A1.75 1.75 0 0111.75 7h2.5A1.75 1.75 0 0116 8.75V19.5M3 19.5h18" />
        </svg>
      );
    case "search":
      return (
        <svg aria-hidden viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      );
    case "home":
      return (
        <svg aria-hidden viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-8 9 8v8a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-8z" />
        </svg>
      );
  }
}
