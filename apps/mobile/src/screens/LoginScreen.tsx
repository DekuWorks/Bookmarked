import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BookmarkedLogo } from "../components/BookmarkedLogo";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { ScreenContainer } from "../components/ScreenContainer";
import {
  getRememberedEmail,
  hydrateRememberMePreference,
  persistRememberedEmail,
  setRememberMe,
} from "../services/rememberMe";
import { supabase } from "../services/supabase";

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMeChecked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const enabled = await hydrateRememberMePreference();
      setRememberMeChecked(enabled);
      if (enabled) {
        setEmail(await getRememberedEmail());
      }
    })();
  }, []);

  async function onSubmit() {
    const trimmedEmail = email.trim();
    setError(null);

    if (!trimmedEmail || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      await setRememberMe(rememberMe);
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (signError) {
        setError(signError.message);
        return;
      }
      await persistRememberedEmail(rememberMe, trimmedEmail);
      router.replace("/");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <View className="items-center pt-12 pb-2">
        <BookmarkedLogo size="large" />
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

      <Pressable
        onPress={() => setRememberMeChecked((current) => !current)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: rememberMe }}
        accessibilityLabel="Remember me"
        className="mb-4 min-h-[44px] flex-row items-start gap-3"
      >
        <View
          className={`mt-0.5 h-5 w-5 items-center justify-center rounded border ${
            rememberMe ? "border-puce-red bg-puce-red" : "border-brand-border bg-background"
          }`}
        >
          {rememberMe ? <Text className="text-xs font-bold text-white">✓</Text> : null}
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-ink">Remember me</Text>
          <Text className="mt-0.5 text-xs text-ink-muted">
            Stay signed in on this device until you log out.
          </Text>
        </View>
      </Pressable>

      {error ? <Text className="text-rust mb-3">{error}</Text> : null}

      <Button title="Log in" onPress={onSubmit} loading={loading} />

      <Text className="mt-4 text-center text-xs text-ink-muted px-2">
        By logging in, you agree to our Terms of Service and Community Guidelines on bookmarked.online.
      </Text>

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
