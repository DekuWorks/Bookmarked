import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { ScreenContainer } from "../components/ScreenContainer";
import { supabase } from "../services/supabase";

export function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const { data, error: signError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
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
      <View className="pt-8 pb-4">
        <Text className="text-3xl font-bold text-slate-900">Create account</Text>
        <Text className="text-slate-600 mt-2">Start tracking your reading on Bookmarked.</Text>
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

      {error ? <Text className="text-red-600 mb-3">{error}</Text> : null}
      {notice ? <Text className="text-emerald-700 mb-3">{notice}</Text> : null}

      <Button title="Sign up" onPress={onSubmit} loading={loading} />

      <Pressable onPress={() => router.back()} className="mt-8 items-center">
        <Text className="text-slate-700 underline">Already have an account? Log in</Text>
      </Pressable>
    </ScreenContainer>
  );
}
