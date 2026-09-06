import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { Button } from "./Button";
import { Input } from "./Input";
import { supabase } from "../services/supabase";

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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  async function reauth() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return { error: "You must be signed in." };
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (error) return { error: friendlyAuthError(error.message) };
    return {};
  }

  async function changeEmail() {
    if (!currentPassword || !newEmail.trim()) {
      Alert.alert("Missing details", "Enter your current password and a new email.");
      return;
    }
    setEmailSaving(true);
    const auth = await reauth();
    if (auth.error) {
      setEmailSaving(false);
      Alert.alert("Couldn't change email", auth.error);
      return;
    }
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailSaving(false);
    if (error) {
      Alert.alert("Couldn't change email", friendlyAuthError(error.message));
      return;
    }
    setNewEmail("");
    setCurrentPassword("");
    Alert.alert("Check your inbox", "Confirm the new email address to finish the change.");
  }

  async function changePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Missing details", "Enter your current password and confirm the new one.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Password too short", "Password must be at least 6 characters.");
      return;
    }
    if (newPassword.length > 128) {
      Alert.alert("Password too long", "Password must be 128 characters or fewer.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords do not match", "Re-enter the new password.");
      return;
    }
    setPasswordSaving(true);
    const auth = await reauth();
    if (auth.error) {
      setPasswordSaving(false);
      Alert.alert("Couldn't change password", auth.error);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) {
      Alert.alert("Couldn't change password", friendlyAuthError(error.message));
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    Alert.alert("Password updated", "Your password has been changed.");
  }

  return (
    <View className="mb-6 rounded-2xl border border-brand-border bg-surface p-4">
      <Text className="text-base font-semibold text-puce-red">Account security</Text>
      <Text className="mt-1 text-sm text-ink-muted">
        Change your email or password. We re-check your current password first.
      </Text>
      <View className="mt-4">
        <Input
          label="Current password"
          secureTextEntry
          autoComplete="password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <Input
          label="New email"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={newEmail}
          onChangeText={setNewEmail}
        />
        <Button title="Change email" loading={emailSaving} onPress={() => void changeEmail()} />
        <View className="mt-4">
          <Input
            label="New password"
            secureTextEntry
            autoComplete="password-new"
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <Input
            label="Confirm new password"
            secureTextEntry
            autoComplete="password-new"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <Button
            title="Change password"
            variant="secondary"
            loading={passwordSaving}
            onPress={() => void changePassword()}
          />
        </View>
      </View>
    </View>
  );
}
