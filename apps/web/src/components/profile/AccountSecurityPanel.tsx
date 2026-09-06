"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";

function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "Current password is incorrect.";
  }
  if (lower.includes("same") && lower.includes("password")) {
    return "Choose a password that is different from your current one.";
  }
  if (lower.includes("email")) {
    return "Check the new email address and try again.";
  }
  return message;
}

export function AccountSecurityPanel() {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  async function reauth(password: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return { ok: false as const, error: "You must be signed in." };
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (error) return { ok: false as const, error: friendlyAuthError(error.message) };
    return { ok: true as const, supabase };
  }

  async function changeEmail() {
    if (!currentPassword || !newEmail.trim()) {
      toast.error("Enter your current password and a new email.");
      return;
    }
    setEmailSaving(true);
    const auth = await reauth(currentPassword);
    if (!auth.ok) {
      setEmailSaving(false);
      toast.error(auth.error);
      return;
    }
    const { error } = await auth.supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailSaving(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
      return;
    }
    setNewEmail("");
    setCurrentPassword("");
    toast.success("Check your inbox to confirm the new email address.");
  }

  async function changePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Enter your current password and confirm the new one.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword.length > 128) {
      toast.error("Password must be 128 characters or fewer.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    const auth = await reauth(currentPassword);
    if (!auth.ok) {
      setPasswordSaving(false);
      toast.error(auth.error);
      return;
    }
    const { error } = await auth.supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated.");
  }

  return (
    <section className="surface-card space-y-6 p-6">
      <div>
        <h2 className="text-lg font-semibold text-puce-red">Account security</h2>
        <p className="mt-1 text-sm text-text-muted">
          Change your email or password. We re-check your current password first.
        </p>
      </div>

      <Input
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
      />

      <div className="space-y-3 border-t border-border pt-4">
        <h3 className="font-medium text-text">Change email</h3>
        <Input
          label="New email"
          type="email"
          autoComplete="email"
          value={newEmail}
          onChange={(event) => setNewEmail(event.target.value)}
        />
        <Button type="button" variant="secondary" size="sm" loading={emailSaving} onClick={() => void changeEmail()}>
          Change email
        </Button>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <h3 className="font-medium text-text">Change password</h3>
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={passwordSaving}
          onClick={() => void changePassword()}
        >
          Change password
        </Button>
      </div>
    </section>
  );
}
