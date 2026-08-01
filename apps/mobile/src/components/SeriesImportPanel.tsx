import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Button } from "./Button";
import {
  importSeriesRows,
  previewSeriesImport,
  type SeriesImportRow,
  type SeriesImportSummary,
} from "../services/seriesImport";

export function SeriesImportPanel({ userId }: { userId: string }) {
  const [rows, setRows] = useState<SeriesImportRow[]>([]);
  const [summary, setSummary] = useState<SeriesImportSummary | null>(null);
  const [importing, setImporting] = useState(false);

  async function pickCsv() {
    const DocumentPicker = await import("expo-document-picker");
    const result = await DocumentPicker.getDocumentAsync({ type: ["text/csv", "text/comma-separated-values", "application/csv"], copyToCacheDirectory: true, multiple: false });
    if (result.canceled || !result.assets?.[0]) return;
    try {
      const text = await (await fetch(result.assets[0].uri)).text();
      setSummary(null);
      setRows(await previewSeriesImport(text));
    } catch (error) {
      Alert.alert("Couldn't read CSV", error instanceof Error ? error.message : "Please try again.");
    }
  }

  async function confirmImport() {
    setImporting(true);
    try {
      const result = await importSeriesRows(userId, rows);
      setSummary(result);
      setRows([]);
      Alert.alert("Series import complete", `${result.imported} imported · ${result.skipped} skipped · ${result.errors} errors`);
    } catch (error) {
      Alert.alert("Series import failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setImporting(false);
    }
  }

  const ready = rows.filter((row) => row.status === "ready");
  return (
    <View className="rounded-2xl border border-brand-border bg-surface p-4 mb-6">
      <Text className="text-base font-semibold text-puce-red">Import series spreadsheet</Text>
      <Text className="mt-1 text-sm text-ink-muted">
        CSV columns: series_name, book_title, author, position, entry_type. Exact catalog matches are linked; existing entries are skipped.
      </Text>
      <View className="mt-4 self-start">
        <Button title="Choose series CSV" variant="secondary" disabled={importing} onPress={() => void pickCsv()} />
      </View>
      {rows.length ? (
        <View className="mt-4 rounded-xl border border-primary-dark/30 bg-primary/5 p-4">
          <Text className="font-semibold text-puce-red">Import preview</Text>
          <Text className="mt-1 text-sm text-ink-muted">{ready.length} ready · {rows.length - ready.length} skipped or needs attention</Text>
          {rows.slice(0, 12).map((row, index) => (
            <Text key={`${row.seriesName}-${row.bookTitle}-${index}`} className="mt-2 text-xs text-ink-muted">
              <Text className="font-medium text-ink">{row.seriesName}</Text> — {row.bookTitle} ({row.entryType}){row.message ? ` · ${row.message}` : ""}
            </Text>
          ))}
          <View className="mt-3 self-start">
            <Button title={`Confirm ${ready.length} entr${ready.length === 1 ? "y" : "ies"}`} disabled={!ready.length || importing} loading={importing} onPress={() => void confirmImport()} />
          </View>
        </View>
      ) : null}
      {summary ? <Text className="mt-4 text-sm text-ink-muted">{summary.imported} imported · {summary.skipped} skipped · {summary.errors} errors</Text> : null}
    </View>
  );
}
