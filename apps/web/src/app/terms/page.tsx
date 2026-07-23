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
        <p className="mt-4 text-sm text-text-muted">Last updated: July 2026</p>

        <div className="mx-auto mt-8 max-w-2xl space-y-6 text-pretty leading-relaxed text-text-muted">
          <section>
            <h2 className="text-lg font-semibold text-puce-red">Using Bookmarked</h2>
            <p className="mt-2">
              Bookmarked is a reading platform where you can search books, manage shelves, track
              progress, write reviews, and connect with other readers. By creating an account or
              using the service, you agree to these Terms of Service and our{" "}
              <Link href="/privacy" className="text-puce-red underline hover:no-underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section id="community">
            <h2 className="text-lg font-semibold text-puce-red">Community Guidelines</h2>
            <p className="mt-2">
              Bookmarked has <strong>zero tolerance</strong> for objectionable content or abusive
              users. You may not post content that is harassing, hateful, sexually explicit,
              threatening, spam, or otherwise harmful to other readers.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Be respectful in reviews, posts, comments, messages, and club discussions.</li>
              <li>Do not impersonate others or share private information without consent.</li>
              <li>Do not use Bookmarked to promote unlawful activity or scrape the service.</li>
            </ul>
            <p className="mt-3">
              We use automated profanity filtering on compose and display, and readers can report
              posts, comments, messages, reviews, and profiles. You can also block abusive users;
              blocked content is removed from your feed immediately and the block is reported to
              our team.
            </p>
            <p className="mt-3">
              <strong>We review all content reports within 24 hours</strong> and may remove content,
              warn users, or permanently suspend accounts that violate these guidelines.
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
            <h2 className="text-lg font-semibold text-puce-red">Account deletion</h2>
            <p className="mt-2">
              You may permanently delete your account at any time from Account settings in the app
              or website. Deletion removes your profile, library, reviews, posts, messages, and
              other personal data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-puce-red">Acceptable use</h2>
            <p className="mt-2">
              Do not harass other readers, attempt to access others&apos; private data, or use
              Bookmarked for unlawful purposes. We may suspend or terminate accounts that violate
              these terms without notice.
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
              Questions about these terms or to report urgent safety issues? Email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-puce-red underline hover:no-underline">
                {CONTACT_EMAIL}
              </a>
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
