import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BrandLogo } from "../components/BrandLogo";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { ScreenContainer } from "../components/ScreenContainer";
import { supabase } from "../services/supabase";

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    const trimmedEmail = email.trim();
    setError(null);

    if (!trimmedEmail || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (signError) {
        setError(signError.message);
        return;
      }
      router.replace("/");
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
        <Text className="text-2xl font-bold text-ink">Welcome back</Text>
        <Text className="text-ink-muted mt-2">Sign in to continue to Bookmarked.</Text>
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
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text className="text-rust mb-3">{error}</Text> : null}

      <Button title="Log in" onPress={onSubmit} loading={loading} />

      <View className="flex-row flex-wrap gap-2 justify-center mt-6">
        <Pressable onPress={() => router.push("/(auth)/signup")}>
          <Text className="text-puce-red underline">Create account</Text>
        </Pressable>
        <Text className="text-ink-muted">·</Text>
        <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
          <Text className="text-puce-red underline">Forgot password?</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
