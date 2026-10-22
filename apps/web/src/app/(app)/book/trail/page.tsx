"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FullBookTrail } from "@/components/books/FullBookTrail";
import { BackNav } from "@/components/ui/BackNav";
import { LoadingState } from "@/components/ui/LoadingState";

function BookTrailPageContent() {
  const bookId = useSearchParams().get("id")?.trim() ?? "";
  if (!bookId) {
    return (
      <div className="space-y-4">
        <BackNav label="home" fallbackHref="/reading-room/" href="/reading-room/" />
        <p className="text-text-muted">No book selected.</p>
      </div>
    );
  }
  return <FullBookTrail bookId={bookId} />;
}

export default function BookTrailPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading trail…" />}>
      <BookTrailPageContent />
    </Suspense>
  );
}
