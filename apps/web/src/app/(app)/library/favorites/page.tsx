import { Suspense } from "react";
import { LoadingState } from "@/components/ui/LoadingState";
import FavoritesPageClient from "./FavoritesPageClient";

export default function FavoritesPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading favorites…" />}>
      <FavoritesPageClient />
    </Suspense>
  );
}
