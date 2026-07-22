"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoadingState } from "@/components/ui/LoadingState";

function normalizeAppPath(path: string): string {
  if (!path.startsWith("/")) return path;
  return path.endsWith("/") ? path : `${path}/`;
}

export default function LoginPage() {
  const [redirect, setRedirect] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("redirect");
    setRedirect(next ? normalizeAppPath(next) : undefined);
    setReady(true);
  }, []);

  if (!ready) {
    return <LoadingState message="Loading…" />;
  }

  return (
    <>
      <div className="app-shell-gradient flex min-h-full flex-1 flex-col">
        <Navbar variant="public" />
        <main
          id="main-content"
          className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="w-full max-w-md text-center">
            <h1 className="text-3xl font-bold text-puce-red">Welcome back</h1>
            <p className="mt-2 text-text-muted">Sign in to your Bookmarked account.</p>
          </div>
          <div className="mt-8 flex w-full justify-center">
            <div className="form-panel w-full max-w-md">
              <LoginForm redirect={redirect} />
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
