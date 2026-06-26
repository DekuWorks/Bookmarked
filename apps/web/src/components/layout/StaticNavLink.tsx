"use client";

import Link from "next/link";
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
 * Navbar links on static export (GitHub Pages). Next.js 16.2 client routing can
 * fail when leaving pages that use search params, so we use full navigation.
 */
export function StaticNavLink({ href, className, onClick, children, ...rest }: Props) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      prefetch={false}
      className={className}
      {...rest}
      onClick={(event) => {
        onClick?.();

        const targetPath = normalizePath(new URL(href, window.location.origin).pathname);
        const currentPath = normalizePath(pathname);

        if (targetPath === currentPath) {
          event.preventDefault();
          return;
        }

        event.preventDefault();
        window.location.assign(href);
      }}
    >
      {children}
    </Link>
  );
}
