export function AboutSection() {
  return (
    <section id="about" className="px-4 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-puce-red">About Bookmarked</h2>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-text-muted">
          Bookmarked is a web-first reading platform built for people who love books. We blend
          the warmth of a neighborhood bookstore with modern tools: shelves, progress tracking,
          and thoughtful reviews — without the noise of a crowded social network.
        </p>
        <p className="mt-4 max-w-3xl leading-relaxed text-text-muted">
          Create an account on the web today. When our mobile app launches, you will sign in with
          the same profile, shelves, and history.
        </p>
      </div>
    </section>
  );
}
