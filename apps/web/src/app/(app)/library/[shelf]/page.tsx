import { Suspense } from "react";
import { getStaticShelfSlugs } from "@/lib/staticExport";
import ShelfPageClient from "./ShelfPageClient";
import { LoadingState } from "@/components/ui/LoadingState";

export function generateStaticParams() {
  return getStaticShelfSlugs();
}

export default function ShelfPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading shelf…" />}>
      <ShelfPageClient />
    </Suspense>
  );
}
