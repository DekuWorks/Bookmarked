export function AboutSection() {
  return (
    <section id="about" className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl text-center">
        <h2 className="text-3xl font-bold text-puce-red sm:text-4xl">About Bookmarked</h2>
        <p className="mx-auto mt-4 max-w-3xl text-pretty text-base leading-relaxed text-text-muted sm:text-lg">
          Bookmarked is a web-first reading platform built for people who love books. We blend
          the warmth of a neighborhood bookstore with modern tools: shelves, progress tracking,
          and thoughtful reviews — without the noise of a crowded social network.
        </p>
        <p className="mx-auto mt-4 max-w-3xl text-pretty leading-relaxed text-text-muted">
          Create an account on the web or iOS. Sign in with the same profile, shelves, and history
          everywhere.
        </p>
      </div>
    </section>
  );
}
