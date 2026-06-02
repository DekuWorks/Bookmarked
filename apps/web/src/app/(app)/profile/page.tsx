import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/services/profile";
import { LogoutButton } from "@/components/auth/LogoutButton";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await getProfile(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-puce-red">Profile</h1>
        <p className="mt-1 text-text-muted">{user.email}</p>
      </header>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-2xl font-semibold text-text">
          {profile?.display_name || profile?.username || "Reader"}
        </p>
        {profile?.username ? (
          <p className="text-text-muted">@{profile.username}</p>
        ) : null}
        {profile?.bio ? (
          <p className="mt-4 leading-relaxed text-text">{profile.bio}</p>
        ) : null}
        {profile?.favorite_genres?.length ? (
          <p className="mt-4 text-sm text-text-muted">
            Genres: {profile.favorite_genres.join(", ")}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/profile/setup"
            className="inline-flex items-center justify-center rounded-lg border-2 border-primary px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/10"
          >
            Edit profile
          </Link>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
