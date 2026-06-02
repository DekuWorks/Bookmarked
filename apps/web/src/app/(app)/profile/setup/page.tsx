import { ProfileSetupForm } from "@/components/auth/ProfileSetupForm";

export const metadata = { title: "Set up profile" };

export default function ProfileSetupPage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-3xl font-bold text-puce-red">Set up your profile</h1>
      <p className="mt-2 text-text-muted">
        Tell other readers a bit about you. You can change this anytime.
      </p>
      <div className="mt-8">
        <ProfileSetupForm />
      </div>
    </div>
  );
}
