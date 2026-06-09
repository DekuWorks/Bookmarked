import { BookCard } from "@/components/books/BookCard";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ShelfBadge } from "@/components/shelves/ShelfBadge";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function PreviewDashboardSection() {
  return (
    <section className="bg-gradient-to-b from-background to-primary/10 px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-puce-red">Preview your dashboard</h2>
            <p className="mt-2 max-w-xl text-text-muted">
              A calm home for what you are reading now and what is up next.
            </p>
          </div>
          <Link
            href="/signup"
            className={cn(
              "inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 font-semibold text-puce-red hover:opacity-90 sm:w-auto"
            )}
          >
            Start reading
          </Link>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <DashboardCard title="Currently reading" className="lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <BookCard
                title="The Night Circus"
                author="Erin Morgenstern"
                shelfStatus="currently_reading"
                progressPercent={42}
              />
              <BookCard
                title="Piranesi"
                author="Susanna Clarke"
                shelfStatus="currently_reading"
                progressPercent={18}
              />
            </div>
          </DashboardCard>
          <DashboardCard title="Shelves">
            <div className="flex flex-wrap gap-2">
              <ShelfBadge status="want_to_read" />
              <ShelfBadge status="currently_reading" />
              <ShelfBadge status="read" />
            </div>
            <p className="mt-4 text-sm text-text-muted">
              Organize every title in one place — synced when mobile arrives.
            </p>
          </DashboardCard>
        </div>
      </div>
    </section>
  );
}
