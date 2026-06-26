"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  href: string;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
  "aria-label"?: string;
};

function normalizePath(path: string): string {
  return path.endsWith("/") ? path : `${path}/`;
}

/**
 * App navbar links use full-page navigation because Next.js 16.2 client
 * routing is unreliable with `output: "export"` on GitHub Pages.
 */
export function AppNavLink({ href, className, onClick, children, ...rest }: Props) {
  const pathname = usePathname();

  return (
    <a
      href={href}
      className={className}
      {...rest}
      onClick={(event) => {
        onClick?.();

        if (href.includes("#")) return;

        const targetPath = normalizePath(new URL(href, window.location.origin).pathname);
        const currentPath = normalizePath(pathname);

        event.preventDefault();

        if (targetPath === currentPath) return;

        window.location.assign(href);
      }}
    >
      {children}
    </a>
  );
}
