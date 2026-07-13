import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { ScreenContainer } from "../components/ScreenContainer";
import { queryClient } from "../lib/queryClient";
import { supabase } from "../services/supabase";
import { useAuthStore } from "../store/authStore";
import { parseGenreList } from "../utils";

export function ProfileSetupScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [genres, setGenres] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (!userId) {
      setError("You must be signed in.");
      return;
    }
    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setError("Username is required.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const favorite_genres = parseGenreList(genres);

      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          username: trimmedUser,
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          favorite_genres,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (upsertError) {
        setError(upsertError.message);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      router.replace("/");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <View className="pt-8 pb-4">
        <Text className="text-3xl font-bold text-ink">Your profile</Text>
        <Text className="text-ink-muted mt-2">
          Tell other readers a bit about you. You can change this later.
        </Text>
      </View>

      <Input label="Username" autoCapitalize="none" value={username} onChangeText={setUsername} />
      <Input label="Display name" value={displayName} onChangeText={setDisplayName} />
      <Input
        label="Bio"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        className="min-h-[100px] py-3"
        value={bio}
        onChangeText={setBio}
      />
      <Input
        label="Favorite genres"
        placeholder="fiction, fantasy, history"
        value={genres}
        onChangeText={setGenres}
      />
      <Text className="text-xs text-ink-muted mb-3">Separate genres with commas.</Text>

      {error ? <Text className="text-rust mb-3">{error}</Text> : null}

      <Button title="Save and continue" onPress={onSubmit} loading={loading} />
    </ScreenContainer>
  );
}
