import { Image, Text, View } from "react-native";

type Props = {
  url?: string | null;
  name?: string | null;
  size?: number;
};

export function Avatar({ url, name, size = 40 }: Props) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();

  if (url) {
    return <Image source={{ uri: url }} style={dimension} className="bg-primary/30" />;
  }

  return (
    <View style={dimension} className="bg-primary items-center justify-center">
      <Text className="text-white font-bold" style={{ fontSize: size * 0.42 }}>
        {initial}
      </Text>
    </View>
  );
}
