const features = [
  {
    title: "Book search",
    description: "Discover titles via Open Library and save them to your library.",
    accent: "bg-royal-orange/20 text-rust",
  },
  {
    title: "Personal shelves",
    description: "Want to read, currently reading, and read — always in sync.",
    accent: "bg-primary/25 text-puce-red",
  },
  {
    title: "Reading progress",
    description: "Track pages and percent complete with start and finish dates.",
    accent: "bg-orange-yellow/30 text-puce-red",
  },
  {
    title: "Reviews",
    description: "Rate books, write reviews, and mark spoilers when it matters.",
    accent: "bg-primary/20 text-puce-red",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-surface px-4 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-puce-red">Features</h2>
        <p className="mt-2 max-w-2xl text-text-muted">
          Everything you need for a focused reading habit, designed mobile-first and ready for
          desktop.
        </p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <li
              key={f.title}
              className="rounded-xl border border-border bg-background p-6 shadow-sm"
            >
              <span
                className={`inline-block rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-wide ${f.accent}`}
              >
                {f.title}
              </span>
              <p className="mt-4 text-text-muted">{f.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
