import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <>
      <Navbar variant="public" />
      <main id="main-content" className="mx-auto max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <h1 className="text-3xl font-bold text-puce-red">Terms of Service</h1>
        <p className="mt-6 leading-relaxed text-text-muted">
          Bookmarked is in early development. These terms are a placeholder until legal review.
          By using the service you agree to use it responsibly and not misuse other readers&apos;
          data. Full terms will be published before public launch.
        </p>
      </main>
      <Footer />
    </>
  );
}
