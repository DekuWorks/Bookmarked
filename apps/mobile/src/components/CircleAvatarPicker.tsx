import { Alert, Image, Pressable, Text, View } from "react-native";
import { pickImageFromLibrary, type PickedImage } from "../services/storage";

type Props = {
  imageUrl?: string | null;
  fallbackLabel: string;
  onImagePicked: (image: PickedImage) => void;
  onRemove?: () => void;
  disabled?: boolean;
  size?: number;
};

export function CircleAvatarPicker({
  imageUrl,
  fallbackLabel,
  onImagePicked,
  onRemove,
  disabled = false,
  size = 80,
}: Props) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };
  const label = fallbackLabel.trim() || "Club";

  async function handlePick() {
    if (disabled) return;
    const result = await pickImageFromLibrary();
    if (result.canceled) return;
    if (result.error || !result.image) {
      Alert.alert("Couldn't pick image", result.error ?? "Please try again.");
      return;
    }
    onImagePicked(result.image);
  }

  return (
    <View className="items-center gap-3 mb-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={imageUrl ? "Change avatar" : "Upload avatar"}
        onPress={handlePick}
        disabled={disabled}
        className="active:opacity-80"
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={dimension} className="bg-primary/20" />
        ) : (
          <View
            style={dimension}
            className="items-center justify-center bg-primary/20"
          >
            <Text className="font-bold text-puce-red" style={{ fontSize: size * 0.28 }}>
              {label.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
      </Pressable>

      <View className="flex-row gap-2">
        <Pressable
          accessibilityRole="button"
          onPress={handlePick}
          disabled={disabled}
          className="rounded-full bg-primary/15 px-4 py-2 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-puce-red">
            {imageUrl ? "Change photo" : "Upload photo"}
          </Text>
        </Pressable>
        {imageUrl && onRemove ? (
          <Pressable
            accessibilityRole="button"
            onPress={onRemove}
            disabled={disabled}
            className="rounded-full bg-primary/15 px-4 py-2 active:opacity-80"
          >
            <Text className="text-sm font-semibold text-ink-muted">Remove</Text>
          </Pressable>
        ) : null}
      </View>

      <Text className="text-xs text-ink-muted text-center px-4">
        JPEG, PNG, WebP, or GIF. Max 5 MB.
      </Text>
    </View>
  );
}
