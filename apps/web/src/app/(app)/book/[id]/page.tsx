import { Suspense } from "react";
import BookDetailsPage from "./BookDetailsPage";
import { LoadingState } from "@/components/ui/LoadingState";

/** Shell route for static export; any book ID loads client-side. */
export function generateStaticParams() {
  return [{ id: "index" }];
}

export default function BookPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading book…" />}>
      <BookDetailsPage />
    </Suspense>
  );
}
