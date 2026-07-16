import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BrandLogo } from "../components/BrandLogo";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { ScreenContainer } from "../components/ScreenContainer";
import { webAuthRedirect } from "../constants/env";
import { supabase } from "../services/supabase";

export function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit() {
    const trimmedEmail = email.trim();
    setError(null);
    setNotice(null);

    if (!trimmedEmail || !password) {
      setError("Email and password are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: webAuthRedirect("/profile/setup/"),
        },
      });
      if (signError) {
        setError(signError.message);
        return;
      }
      if (data.session) {
        router.replace("/(auth)/profile-setup");
        return;
      }
      setNotice("Check your email to confirm your account, then log in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <View className="items-center pt-12 pb-2">
        <BrandLogo size="large" />
      </View>

      <View className="pb-4 pt-6">
        <Text className="text-2xl font-bold text-ink">Create account</Text>
        <Text className="text-ink-muted mt-2">Start tracking your reading on Bookmarked.</Text>
      </View>

      <Input
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        label="Password"
        secureTextEntry
        autoComplete="new-password"
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text className="text-rust mb-3">{error}</Text> : null}
      {notice ? <Text className="text-emerald-700 mb-3">{notice}</Text> : null}

      <Button title="Sign up" onPress={onSubmit} loading={loading} />

      <Pressable onPress={() => router.back()} className="mt-8 items-center">
        <Text className="text-puce-red underline">Already have an account? Log in</Text>
      </Pressable>
    </ScreenContainer>
  );
}
