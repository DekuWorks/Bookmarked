import { Image, Text, View } from "react-native";

type Props = {
  url?: string | null;
  title?: string | null;
  /** Tailwind width/height classes, e.g. "w-16 h-24". */
  sizeClassName?: string;
};

export function BookCover({ url, title, sizeClassName = "w-16 h-24" }: Props) {
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        className={`${sizeClassName} rounded-md bg-primary/20`}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      className={`${sizeClassName} rounded-md bg-primary/25 items-center justify-center p-1`}
    >
      <Text
        numberOfLines={3}
        className="text-[10px] text-puce-red text-center font-medium"
      >
        {title?.trim() || "No cover"}
      </Text>
    </View>
  );
}
