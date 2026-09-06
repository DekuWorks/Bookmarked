import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { HOME_HUB_NAV_LABEL, HOME_MEMBERSHIP_LABEL } from "../../../../packages/utils/bookMap";
import { CONCIERGE_COPY } from "../../../../packages/utils/homeConcierge";
import { IOS_HOME_SUBSCRIBE_COPY } from "../../../../packages/utils/subscription";
import { Button } from "../../src/components/Button";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { useSubscription } from "../../src/hooks/useSubscription";
import { TAB_BAR_SPACE } from "../../src/navigation/TabBarScroll";

export default function HomeHubScreen() {
  const router = useRouter();
  const { canAccess } = useSubscription();
  const hasHome = canAccess("home_hub");

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={HOME_HUB_NAV_LABEL} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE, gap: 12 }}>
        <Text className="text-sm text-ink-muted">
          {HOME_HUB_NAV_LABEL} is the {HOME_MEMBERSHIP_LABEL} dashboard. It does not replace Overview.
        </Text>
        {!hasHome ? (
          <Text className="text-ink-muted">{IOS_HOME_SUBSCRIBE_COPY.body}</Text>
        ) : (
          <>
            <Button title="Book Map" onPress={() => router.push("/(app)/book-map")} />
            <Button title="Reader Map" variant="secondary" onPress={() => router.push("/(app)/reader-map")} />
            <Button title="Experiences" variant="ghost" onPress={() => router.push("/(app)/events")} />
            <Button title="Reading DNA" variant="ghost" onPress={() => router.push("/(app)/reading-dna")} />
            <Button title="Concierge" variant="ghost" onPress={() => router.push("/(app)/concierge")} />
            <Text className="text-xs text-ink-muted">{CONCIERGE_COPY.featureRequestBlurb}</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}
