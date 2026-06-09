import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <Navbar variant="public" />
      <main id="main-content" className="mx-auto max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <h1 className="text-3xl font-bold text-puce-red">Privacy Policy</h1>
        <p className="mt-6 leading-relaxed text-text-muted">
          We store account and reading data in Supabase to power your shelves and reviews. We do
          not sell personal data. A complete privacy policy will be published before public
          launch. Contact hello@bookmarked.app with questions.
        </p>
      </main>
      <Footer />
    </>
  );
}
