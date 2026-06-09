import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LoginForm } from "@/components/auth/LoginForm";

type Props = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { redirect } = await searchParams;

  return (
    <>
      <Navbar variant="public" />
      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16"
      >
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-puce-red">Welcome back</h1>
          <p className="mt-2 text-text-muted">Sign in to your Bookmarked account.</p>
        </div>
        <div className="mt-8 w-full flex justify-center">
          <LoginForm redirect={redirect} />
        </div>
      </main>
      <Footer />
    </>
  );
}
