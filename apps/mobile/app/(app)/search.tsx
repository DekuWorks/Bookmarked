import { Text, View } from "react-native";
import { EmptyState } from "../../src/components/EmptyState";
import { ScreenContainer } from "../../src/components/ScreenContainer";

export default function SearchRoute() {
  return (
    <ScreenContainer scroll>
      <View className="pt-4">
        <Text className="text-2xl font-bold text-slate-900">Search</Text>
        <EmptyState
          title="Find your next read"
          description="Book search arrives in Phase 1."
        />
      </View>
    </ScreenContainer>
  );
}
