import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { layout } from "@/lib/constants/layout";
import { CONTACT_EMAIL } from "@/lib/constants/contact";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <>
      <div className="app-shell-gradient flex min-h-full flex-1 flex-col">
        <Navbar variant="public" />
        <main id="main-content" className={layout.prose}>
        <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Terms of Service</h1>
        <p className="mt-4 text-sm text-text-muted">Last updated: June 2026</p>

        <div className="mx-auto mt-8 max-w-2xl space-y-6 text-pretty leading-relaxed text-text-muted">
          <section>
            <h2 className="text-lg font-semibold text-puce-red">Using Bookmarked</h2>
            <p className="mt-2">
              Bookmarked is a reading platform where you can search books, manage shelves, track
              progress, write reviews, and connect with other readers. By creating an account or
              using the site, you agree to use the service responsibly and in good faith.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-puce-red">Your content</h2>
            <p className="mt-2">
              You keep ownership of reviews and profile content you post. You grant Bookmarked a
              license to display that content as part of the service (for example, on your profile,
              in feeds, or on public shelves you choose to share).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-puce-red">Acceptable use</h2>
            <p className="mt-2">
              Do not harass other readers, scrape the service, attempt to access others&apos; private
              data, or use Bookmarked for unlawful purposes. We may suspend accounts that violate
              these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-puce-red">Service changes</h2>
            <p className="mt-2">
              Bookmarked is actively developed. Features may change, and the service is provided as
              available without warranties. We will aim to communicate significant changes that
              affect your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-puce-red">Contact</h2>
            <p className="mt-2">
              Questions about these terms? Email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-puce-red underline hover:no-underline">
                {CONTACT_EMAIL}
              </a>{" "}
              or read our{" "}
              <Link href="/privacy" className="text-puce-red underline hover:no-underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
      </div>
      <Footer />
    </>
  );
}
