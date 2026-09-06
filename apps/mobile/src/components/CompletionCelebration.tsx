import { useEffect, useState } from "react";
import { AccessibilityInfo, Modal, Pressable, Text, View } from "react-native";
import { useThemeColors } from "../store/themeStore";

type Props = {
  visible: boolean;
  bookTitle: string;
  onClose: () => void;
};

/** Full-screen acknowledgement shown immediately after a successful completion. */
export function CompletionCelebration({ visible, bookTitle, onClose }: Props) {
  const colors = useThemeColors();
  const isDark = colors.background === "#1A1326";
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    return () => sub.remove();
  }, []);

  const overlay = isDark ? colors.background : "#642F37";
  const kicker = isDark ? colors.primary : "#F7C767";
  const title = isDark ? colors.ink : "#FFFFFF";
  const body = isDark ? colors.inkMuted : "rgba(255,255,255,0.85)";
  const buttonBg = isDark ? colors.primary : "#FFFFFF";
  const buttonText = isDark ? colors.background : "#642F37";

  return (
    <Modal
      transparent
      visible={visible}
      animationType={reduceMotion ? "none" : "fade"}
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center px-7"
        style={{ backgroundColor: overlay }}
        onPress={onClose}
      >
        <View className="items-center">
          <Text className="text-5xl" style={{ color: kicker }}>
            ✦ ✧ ✦
          </Text>
          <Text
            className="mt-7 text-xs font-bold uppercase tracking-[3px]"
            style={{ color: kicker }}
          >
            Book complete
          </Text>
          <Text className="mt-3 text-center text-3xl font-black" style={{ color: title }}>
            {bookTitle}
          </Text>
          <Text className="mt-3 text-center text-base" style={{ color: body }}>
            Another story saved to your reading life.
          </Text>
          <View className="mt-7 rounded-full px-5 py-3" style={{ backgroundColor: buttonBg }}>
            <Text className="font-bold" style={{ color: buttonText }}>
              Tap anywhere to celebrate
            </Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}
