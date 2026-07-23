import { useState } from "react";
import { Alert, Linking, Pressable, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Button } from "./Button";
import { importGoodreadsCsv, type ImportSummary } from "../services/goodreadsImport";

type Props = {
  userId: string;
  onImportComplete?: () => void;
};

export function LibraryImportPanel({ userId, onImportComplete }: Props) {
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  async function pickCsv() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["text/csv", "text/comma-separated-values", "application/csv"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const name = asset.name?.toLowerCase() ?? "";
    if (!name.endsWith(".csv")) {
      Alert.alert("Invalid file", "Please upload a Goodreads CSV export.");
      return;
    }

    setImporting(true);
    setSummary(null);
    setShowDetails(false);

    try {
      const response = await fetch(asset.uri);
      const text = await response.text();
      const importResult = await importGoodreadsCsv(userId, text);
      setSummary(importResult);
      onImportComplete?.();

      if (importResult.errors > 0 || importResult.skipped > 0) {
        Alert.alert(
          "Import finished",
          `${importResult.imported} new, ${importResult.updated} updated, ${importResult.skipped} skipped, ${importResult.errors} errors.`
        );
      } else {
        Alert.alert(
          "Import complete",
          `Imported ${importResult.imported} books${importResult.updated ? `, updated ${importResult.updated}` : ""}.`
        );
      }
    } catch (error) {
      Alert.alert("Import failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setImporting(false);
    }
  }

  const problemRows =
    summary?.results.filter((row) => row.status === "skipped" || row.status === "error") ?? [];

  return (
    <View className="rounded-2xl border border-brand-border bg-surface p-4 mb-6">
      <Text className="text-base font-semibold text-puce-red">Import library</Text>
      <Text className="mt-1 text-sm text-ink-muted">
        Upload your Goodreads export CSV to add books to your shelves. We match titles via the
        catalog and preserve your shelf, dates, and ratings when available.
      </Text>

      <View className="mt-4 flex-row flex-wrap items-center gap-3">
        <Button
          title={importing ? "Importing…" : "Choose Goodreads CSV"}
          variant="secondary"
          loading={importing}
          onPress={() => void pickCsv()}
        />
        <Pressable
          onPress={() => void Linking.openURL("https://www.goodreads.com/review/import")}
          className="active:opacity-70"
        >
          <Text className="text-sm font-medium text-primary-dark">Export from Goodreads</Text>
        </Pressable>
      </View>

      <Text className="mt-3 text-xs text-ink-muted">
        Goodreads CSV only. Up to 200 rows per import. Books without a catalog match are skipped.
      </Text>

      {summary ? (
        <View className="mt-5 rounded-xl border border-brand-border bg-background/50 p-4">
          <Text className="font-semibold text-puce-red">Import summary</Text>
          <Text className="mt-2 text-sm text-ink-muted">
            {summary.total} rows · {summary.imported} imported · {summary.updated} updated ·{" "}
            {summary.skipped} skipped · {summary.errors} errors
          </Text>
          {problemRows.length > 0 ? (
            <Pressable onPress={() => setShowDetails((open) => !open)} className="mt-3">
              <Text className="text-sm font-medium text-primary-dark">
                {showDetails ? "Hide details" : "View details"}
              </Text>
            </Pressable>
          ) : null}
          {showDetails ? (
            <View className="mt-2 max-h-48">
              {problemRows.slice(0, 30).map((row, index) => (
                <Text key={`${row.title}-${index}`} className="text-xs text-ink-muted mb-1">
                  <Text className="font-medium text-ink">{row.title}</Text>
                  {row.message ? ` — ${row.message}` : ""}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
