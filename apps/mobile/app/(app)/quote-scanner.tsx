import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PremiumFeatureLock } from "../../src/components/PremiumFeatureLock";
import { useSubscription } from "../../src/hooks/useSubscription";
import { scanQuoteImage } from "../../src/services/quoteScanner";
import { QUOTE_SCANNER_COPY, quoteScanIsSavable } from "../../../../packages/utils/quoteScanner";
import { TAB_BAR_SPACE } from "../../src/navigation/TabBarScroll";

export default function QuoteScannerRoute() {
  const { canAccess, loading } = useSubscription();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  async function pickAndScan(library: boolean) {
    const result = library
      ? await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.6 })
      : await ImagePicker.launchCameraAsync({ base64: true, quality: 0.6 });
    if (result.canceled || !result.assets[0]?.base64) return;
    setScanning(true);
    setError(null);
    const scanned = await scanQuoteImage(result.assets[0].base64, result.assets[0].mimeType);
    setScanning(false);
    if ("error" in scanned && scanned.error) setError(scanned.error);
    else setText(scanned.text ?? "");
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={QUOTE_SCANNER_COPY.title} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE, gap: 12 }}>
        {loading ? (
          <Text className="text-sm text-ink-muted">Loading…</Text>
        ) : !canAccess("quote_scanner") ? (
          <PremiumFeatureLock
            title={QUOTE_SCANNER_COPY.title}
            description={QUOTE_SCANNER_COPY.hint}
          />
        ) : (
          <>
            <Text className="text-sm text-ink-muted">{QUOTE_SCANNER_COPY.hint}</Text>
            <Pressable className="rounded-lg bg-primary px-3 py-2" onPress={() => void pickAndScan(false)}>
              <Text className="text-center font-semibold text-white">Camera</Text>
            </Pressable>
            <Pressable className="rounded-lg border border-brand-border px-3 py-2" onPress={() => void pickAndScan(true)}>
              <Text className="text-center font-semibold text-puce-red">Photo library</Text>
            </Pressable>
            {scanning ? <Text className="text-sm text-ink-muted">Reading the photo… it will not be kept.</Text> : null}
            {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
            <TextInput
              multiline
              value={text}
              onChangeText={setText}
              placeholder="Editable preview"
              className="min-h-[140px] rounded-lg border border-brand-border px-3 py-2"
            />
            <Text className="text-xs text-ink-muted">{QUOTE_SCANNER_COPY.neverAutoSave}</Text>
            {!quoteScanIsSavable(text) ? (
              <Text className="text-xs text-ink-muted">Edit the text before you save it as a quote.</Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
