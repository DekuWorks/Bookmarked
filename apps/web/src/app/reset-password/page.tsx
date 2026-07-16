import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <>
      <div className="app-shell-gradient flex min-h-full flex-1 flex-col">
        <Navbar variant="public" />
        <main
          id="main-content"
          className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="w-full max-w-md text-center">
            <h1 className="text-3xl font-bold text-puce-red">Choose a new password</h1>
            <p className="mt-2 text-text-muted">
              Enter a new password for your Bookmarked account.
            </p>
          </div>
          <div className="mt-8 flex w-full justify-center">
            <ResetPasswordForm />
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
