import { Modal, Pressable, Text, View } from "react-native";

type Props = {
  visible: boolean;
  bookTitle: string;
  onClose: () => void;
};

/** Full-screen acknowledgement shown immediately after a successful completion. */
export function CompletionCelebration({ visible, bookTitle, onClose }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-puce-red/95 px-7" onPress={onClose}>
        <View className="items-center">
          <Text className="text-5xl text-orange-yellow">✦ ✧ ✦</Text>
          <Text className="mt-7 text-xs font-bold uppercase tracking-[3px] text-orange-yellow">
            Book complete
          </Text>
          <Text className="mt-3 text-center text-3xl font-black text-white">{bookTitle}</Text>
          <Text className="mt-3 text-center text-base text-white/85">
            Another story saved to your reading life.
          </Text>
          <View className="mt-7 rounded-full bg-white px-5 py-3">
            <Text className="font-bold text-puce-red">Tap anywhere to celebrate</Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}
