import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { layout } from "@/lib/constants/layout";
import { CONTACT_EMAIL } from "@/lib/constants/contact";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <div className="app-shell-gradient flex min-h-full flex-1 flex-col">
        <Navbar variant="public" />
        <main id="main-content" className={layout.prose}>
        <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Privacy Policy</h1>
        <p className="mt-4 text-sm text-text-muted">Last updated: June 2026</p>

        <div className="mx-auto mt-8 max-w-2xl space-y-6 text-pretty leading-relaxed text-text-muted">
          <section>
            <h2 className="text-lg font-semibold text-puce-red">What we collect</h2>
            <p className="mt-2">
              When you create an account, we store your profile, shelves, reading progress, reviews,
              and activity needed to run Bookmarked. Account data is stored in Supabase (PostgreSQL)
              and protected with row-level security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-puce-red">How we use your data</h2>
            <p className="mt-2">
              We use your information to provide the service, improve features, and communicate with
              you about Bookmarked. We do not sell your personal data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-puce-red">Your choices</h2>
            <p className="mt-2">
              You can update or delete account content from your profile and library. To delete your
              account, contact{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-puce-red underline hover:no-underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-puce-red">Contact</h2>
            <p className="mt-2">
              Questions about this policy? Email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-puce-red underline hover:no-underline">
                {CONTACT_EMAIL}
              </a>{" "}
              or return to the{" "}
              <Link href="/" className="text-puce-red underline hover:no-underline">
                home page
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
