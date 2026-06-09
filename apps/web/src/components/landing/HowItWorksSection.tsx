const steps = [
  { step: "1", title: "Create your account", body: "Sign up in seconds with email and password." },
  { step: "2", title: "Set up your profile", body: "Choose a username, bio, and favorite genres." },
  { step: "3", title: "Search & shelve", body: "Find books and add them to want, reading, or read." },
  { step: "4", title: "Track & review", body: "Log progress and share what you thought." },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold text-puce-red">How it works</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li key={s.step} className="relative rounded-xl border border-border bg-surface p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                {s.step}
              </span>
              <h3 className="mt-4 font-semibold text-text">{s.title}</h3>
              <p className="mt-2 text-sm text-text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
