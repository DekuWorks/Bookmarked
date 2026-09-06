"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { clearSupabaseAuthStorage, isRememberMeEnabled, persistRememberedEmail } from "@/lib/auth/rememberMe";
import { staticRedirect } from "@/lib/navigation/staticRedirect";
import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      clearSupabaseAuthStorage();
      if (!isRememberMeEnabled()) persistRememberedEmail(false);
      staticRedirect("/");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="ghost" size="sm" loading={loading} onClick={handleLogout}>
      Log out
    </Button>
  );
}
