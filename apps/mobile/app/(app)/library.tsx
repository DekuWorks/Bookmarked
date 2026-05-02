import { Text, View } from "react-native";
import { EmptyState } from "../../src/components/EmptyState";
import { ScreenContainer } from "../../src/components/ScreenContainer";

export default function LibraryRoute() {
  return (
    <ScreenContainer scroll>
      <View className="pt-4">
        <Text className="text-2xl font-bold text-slate-900">Library</Text>
        <EmptyState
          title="Your shelves are empty"
          description="Phase 1 will let you add books and track progress."
        />
      </View>
    </ScreenContainer>
  );
}
