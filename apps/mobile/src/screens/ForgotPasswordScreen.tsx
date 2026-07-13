import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { ScreenContainer } from "../components/ScreenContainer";
import { supabase } from "../services/supabase";

export function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim()
      );
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setMessage("If an account exists for this email, you will receive reset instructions.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <View className="pt-8 pb-4">
        <Text className="text-3xl font-bold text-ink">Reset password</Text>
        <Text className="text-ink-muted mt-2">
          Enter your email and we will send a reset link.
        </Text>
      </View>

      <Input
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />

      {error ? <Text className="text-rust mb-3">{error}</Text> : null}
      {message ? <Text className="text-emerald-700 mb-3">{message}</Text> : null}

      <Button title="Send reset link" onPress={onSubmit} loading={loading} />

      <Pressable onPress={() => router.back()} className="mt-8 items-center">
        <Text className="text-puce-red underline">Back to log in</Text>
      </Pressable>
    </ScreenContainer>
  );
}
