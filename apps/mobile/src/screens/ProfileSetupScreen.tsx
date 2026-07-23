import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { BrandLogo } from "../components/BrandLogo";
import { Button } from "../components/Button";
import { CircleAvatarPicker } from "../components/CircleAvatarPicker";
import { Input } from "../components/Input";
import { LoadingState } from "../components/LoadingState";
import { ScreenContainer } from "../components/ScreenContainer";
import { ScreenHeader } from "../components/ScreenHeader";
import { queryClient } from "../lib/queryClient";
import { useProfile } from "../hooks/useProfile";
import { updateProfile, upsertProfile, validateProfileFields } from "../services/profile";
import {
  removeProfileAvatar,
  uploadProfileAvatar,
  type PickedImage,
} from "../services/storage";
import { useAuthStore } from "../store/authStore";
import { parseGenreList } from "../utils";
import {
  MAX_BIO_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_USERNAME_LENGTH,
} from "../../../../packages/utils/profileValidation";

type Mode = "setup" | "edit";

type Props = {
  mode?: Mode;
};

export function ProfileSetupScreen({ mode = "setup" }: Props) {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const { data: profile, isLoading } = useProfile();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [genres, setGenres] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(mode === "setup");

  useEffect(() => {
    if (mode !== "edit" || !profile || hydrated) return;
    setUsername(profile.username ?? "");
    setDisplayName(profile.display_name ?? "");
    setBio(profile.bio ?? "");
    setGenres(profile.favorite_genres?.join(", ") ?? "");
    setAvatarUrl(profile.avatar_url ?? null);
    setHydrated(true);
  }, [mode, profile, hydrated]);

  async function handleAvatarPicked(image: PickedImage) {
    setAvatarLoading(true);
    setError(null);
    const result = await uploadProfileAvatar(image);
    setAvatarLoading(false);
    if (result.error) {
      Alert.alert("Couldn't upload photo", result.error);
      return;
    }
    setAvatarUrl(result.url ?? null);
    if (userId) {
      await queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    }
    Alert.alert("Saved", "Profile photo updated.");
  }

  async function handleAvatarRemove() {
    setAvatarLoading(true);
    const result = await removeProfileAvatar();
    setAvatarLoading(false);
    if (result.error) {
      Alert.alert("Couldn't remove photo", result.error);
      return;
    }
    setAvatarUrl(null);
    if (userId) {
      await queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    }
    Alert.alert("Saved", "Profile photo removed.");
  }

  async function onSubmit() {
    if (!userId) {
      setError("You must be signed in.");
      return;
    }

    const validation = validateProfileFields({
      username,
      display_name: displayName,
      bio,
      favorite_genres: parseGenreList(genres),
    });
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const save = mode === "setup" ? upsertProfile : updateProfile;
      const result = await save(userId, {
        username: validation.value.username,
        display_name: validation.value.display_name || null,
        bio: validation.value.bio || null,
        favorite_genres: validation.value.favorite_genres,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["profile", userId] });

      if (mode === "edit") {
        Alert.alert("Saved", "Profile updated.", [
          { text: "OK", onPress: () => router.back() },
        ]);
        return;
      }

      router.replace("/");
    } finally {
      setLoading(false);
    }
  }

  if (mode === "edit" && (isLoading || !hydrated)) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Edit profile" />
        <LoadingState message="Loading profile…" />
      </View>
    );
  }

  const content = (
    <>
      {mode === "setup" ? (
        <View className="items-center pt-12 pb-2">
          <BrandLogo size="large" />
        </View>
      ) : null}

      <View className={mode === "setup" ? "pb-4 pt-6" : "pb-4 pt-2"}>
        <Text className="text-2xl font-bold text-ink">
          {mode === "edit" ? "Edit profile" : "Your profile"}
        </Text>
        <Text className="text-ink-muted mt-2">
          {mode === "edit"
            ? "Update how you appear to other readers."
            : "Tell other readers a bit about you. You can change this later."}
        </Text>
      </View>

      <CircleAvatarPicker
        imageUrl={avatarUrl}
        fallbackLabel={displayName || username || "You"}
        onImagePicked={(image) => void handleAvatarPicked(image)}
        onRemove={() => void handleAvatarRemove()}
        disabled={avatarLoading || loading}
      />

      <Input
        label="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
        maxLength={MAX_USERNAME_LENGTH}
      />
      <Input
        label="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        maxLength={MAX_DISPLAY_NAME_LENGTH}
      />
      <Input
        label="Bio"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        className="min-h-[100px] py-3"
        value={bio}
        onChangeText={setBio}
        maxLength={MAX_BIO_LENGTH}
      />
      <Input
        label="Favorite genres"
        placeholder="fiction, fantasy, history"
        value={genres}
        onChangeText={setGenres}
      />
      <Text className="text-xs text-ink-muted mb-3">Separate genres with commas.</Text>

      {error ? <Text className="text-rust mb-3">{error}</Text> : null}

      <Button
        title={mode === "edit" ? "Save changes" : "Save and continue"}
        onPress={onSubmit}
        loading={loading}
      />
    </>
  );

  if (mode === "edit") {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Edit profile" />
        <ScreenContainer scroll>{content}</ScreenContainer>
      </View>
    );
  }

  return <ScreenContainer scroll>{content}</ScreenContainer>;
}
