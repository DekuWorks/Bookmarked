import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button } from "./Button";
import {
  importGoodreadsCsv,
  parseGoodreadsCsv,
  type GoodreadsRow,
  type GoodreadsImportUndoSnapshot,
  type ImportSummary,
  undoGoodreadsImport,
} from "../services/goodreadsImport";

type Props = {
  userId: string;
  onImportComplete?: () => void;
};

const undoStorageKey = (userId: string) => `bookmarked.goodreads-import-undo:${userId}`;

export function LibraryImportPanel({ userId, onImportComplete }: Props) {
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [previewRows, setPreviewRows] = useState<GoodreadsRow[]>([]);
  const [pendingCsv, setPendingCsv] = useState<string | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<GoodreadsImportUndoSnapshot | null>(null);

  useEffect(() => {
    void AsyncStorage.getItem(undoStorageKey(userId)).then((raw) => {
      setUndoSnapshot(raw ? (JSON.parse(raw) as GoodreadsImportUndoSnapshot) : null);
    });
  }, [userId]);

  async function pickCsv() {
    let DocumentPicker: typeof import("expo-document-picker");
    try {
      DocumentPicker = await import("expo-document-picker");
    } catch {
      Alert.alert(
        "Rebuild required",
        "Goodreads import needs a native rebuild. Run npm run ios from apps/mobile, then try again."
      );
      return;
    }

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

    setSummary(null);
    setShowDetails(false);

    try {
      const response = await fetch(asset.uri);
      const text = await response.text();
      const rows = parseGoodreadsCsv(text);
      if (!rows.length) {
        Alert.alert("Invalid export", "We couldn't find Goodreads rows in that CSV.");
        return;
      }
      setPendingCsv(text);
      setPreviewRows(rows.slice(0, 200));
    } catch (error) {
      Alert.alert("Import failed", error instanceof Error ? error.message : "Please try again.");
    }
  }

  async function runImport() {
    if (!pendingCsv) return;
    setImporting(true);
    try {
      const importResult = await importGoodreadsCsv(userId, pendingCsv);
      setSummary(importResult);
      const snapshot: GoodreadsImportUndoSnapshot = {
        userId,
        createdAt: new Date().toISOString(),
        createdUserBookIds: importResult.results
          .filter((row) => row.createdUserBook && row.userBookId)
          .map((row) => row.userBookId!),
        bookIds: importResult.results.filter((row) => row.bookId).map((row) => row.bookId!),
      };
      if (snapshot.createdUserBookIds.length) {
        await AsyncStorage.setItem(undoStorageKey(userId), JSON.stringify(snapshot));
        setUndoSnapshot(snapshot);
      }
      setPendingCsv(null);
      setPreviewRows([]);
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

  function confirmUndo() {
    if (!undoSnapshot || importing) return;
    Alert.alert(
      "Undo last import?",
      "This removes only shelves newly created by the import. Existing books that were updated are kept.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Undo import",
          style: "destructive",
          onPress: () => void undoLastImport(),
        },
      ]
    );
  }

  async function undoLastImport() {
    if (!undoSnapshot) return;
    setImporting(true);
    const result = await undoGoodreadsImport(userId, undoSnapshot);
    setImporting(false);
    if (result.error) {
      Alert.alert("Couldn't undo import", result.error);
      return;
    }
    await AsyncStorage.removeItem(undoStorageKey(userId));
    setUndoSnapshot(null);
    onImportComplete?.();
    Alert.alert("Import undone", `Removed ${result.deleted} newly imported book${result.deleted === 1 ? "" : "s"}.`);
  }

  function confirmImport() {
    const missingDates = previewRows.filter((row) => row.exclusiveShelf === "read" && !row.dateRead);
    if (!missingDates.length) {
      void runImport();
      return;
    }
    Alert.alert(
      "Completion dates needed",
      `${missingDates.length} finished book(s) have no completion date. They will be skipped so goals and statistics are never assigned the import date.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Import dated books", onPress: () => void runImport() },
      ]
    );
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
        {undoSnapshot ? (
          <Button
            title="Undo last import"
            variant="secondary"
            disabled={importing}
            onPress={confirmUndo}
          />
        ) : null}
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

      {previewRows.length ? (
        <View className="mt-5 rounded-xl border border-primary-dark/30 bg-primary/5 p-4">
          <Text className="font-semibold text-puce-red">Import preview</Text>
          <Text className="mt-1 text-sm text-ink-muted">
            {previewRows.length} rows ready ·{" "}
            {previewRows.filter((row) => row.exclusiveShelf === "read" && !row.dateRead).length}{" "}
            finished books need completion dates.
          </Text>
          {previewRows.slice(0, 5).map((row) => (
            <Text key={row.bookId} className="mt-1 text-xs text-ink-muted">
              {row.title} — {row.exclusiveShelf ?? "TBR"}
            </Text>
          ))}
          <View className="mt-3">
            <Button title={importing ? "Importing…" : "Confirm import"} loading={importing} onPress={confirmImport} />
          </View>
        </View>
      ) : null}

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
