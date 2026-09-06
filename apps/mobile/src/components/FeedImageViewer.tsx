import { Image, Modal, Pressable, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  open: boolean;
  url: string;
  alt: string;
  onClose: () => void;
};

export function FeedImageViewer({ open, url, alt, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  return (
    <Modal
      visible={open}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View className="flex-1 bg-black/90" accessibilityLabel={alt}>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 8 }}
          className="self-end"
        >
          <Text className="text-base font-medium text-white">Close</Text>
        </Pressable>
        <View className="flex-1 items-center justify-center px-3 pb-6">
          <Image
            source={{ uri: url }}
            resizeMode="contain"
            accessibilityLabel={alt}
            style={{
              width: width - 24,
              height: Math.max(120, height - insets.top - insets.bottom - 72),
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
