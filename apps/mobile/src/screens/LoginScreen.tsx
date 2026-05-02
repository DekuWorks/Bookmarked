import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
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
    setError(null);
    setLoading(true);
    try {
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
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
      <View className="pt-8 pb-4">
        <Text className="text-3xl font-bold text-slate-900">Welcome back</Text>
        <Text className="text-slate-600 mt-2">Sign in to continue to Bookmarked.</Text>
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

      {error ? <Text className="text-red-600 mb-3">{error}</Text> : null}

      <Button title="Log in" onPress={onSubmit} loading={loading} />

      <View className="flex-row flex-wrap gap-2 justify-center mt-6">
        <Pressable onPress={() => router.push("/(auth)/signup")}>
          <Text className="text-slate-700 underline">Create account</Text>
        </Pressable>
        <Text className="text-slate-400">·</Text>
        <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
          <Text className="text-slate-700 underline">Forgot password?</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
