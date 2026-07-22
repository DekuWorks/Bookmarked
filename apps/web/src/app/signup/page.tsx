import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <>
      <div className="app-shell-gradient flex min-h-full flex-1 flex-col">
        <Navbar variant="public" />
        <main
          id="main-content"
          className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="w-full max-w-md text-center">
            <h1 className="text-3xl font-bold text-puce-red">Create your account</h1>
            <p className="mt-2 text-text-muted">Start tracking your reading on the web.</p>
          </div>
          <div className="mt-8 w-full flex justify-center">
            <div className="form-panel w-full max-w-md">
              <SignupForm />
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
