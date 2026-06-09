"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoadingState } from "@/components/ui/LoadingState";

function LoginContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? undefined;

  return (
    <>
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
          <LoginForm redirect={redirect} />
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading…" />}>
      <LoginContent />
    </Suspense>
  );
}
