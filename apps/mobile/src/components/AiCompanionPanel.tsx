import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { requestAiCompanion } from "../services/aiCompanion";
import { AI_COMPANION_ACTIONS, endingExplanationBlocked } from "../../../../packages/utils/aiCompanionSafety";

export function AiCompanionPanel() {
  const [action, setAction] = useState<(typeof AI_COMPANION_ACTIONS)[number]>("discussion_questions");
  const [bookTitle, setBookTitle] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [endingConfirmed, setEndingConfirmed] = useState(false);

  return (
    <View className="gap-3">
      <Text className="text-sm text-ink-muted">
        Progress-aware companion. Ending thoughts need an extra confirm if you have not finished.
      </Text>
      <TextInput
        value={bookTitle}
        onChangeText={setBookTitle}
        placeholder="Book title"
        className="rounded-lg border border-brand-border px-3 py-2"
      />
      <Pressable
        onPress={() =>
          setAction(AI_COMPANION_ACTIONS[(AI_COMPANION_ACTIONS.indexOf(action) + 1) % AI_COMPANION_ACTIONS.length]!)
        }
      >
        <Text className="text-sm text-primary">Action: {action.replaceAll("_", " ")}</Text>
      </Pressable>
      {action === "ending_explanation" &&
      endingExplanationBlocked({ shelfStatus: "currently_reading" }, endingConfirmed) ? (
        <Pressable onPress={() => setEndingConfirmed((value) => !value)}>
          <Text className="text-sm text-puce-red">
            {endingConfirmed ? "Confirmed" : "Tap to confirm ending thoughts before you finish"}
          </Text>
        </Pressable>
      ) : null}
      <Pressable
        className="rounded-lg bg-primary px-3 py-2"
        onPress={() => {
          void requestAiCompanion({
            action,
            bookTitle,
            endingConfirmed,
            shelfStatus: "currently_reading",
          }).then((response) => {
            if ("error" in response && response.error) setError(response.error);
            else setResult(JSON.stringify(response.result ?? {}, null, 2));
          });
        }}
      >
        <Text className="text-center font-semibold text-white">Ask companion</Text>
      </Pressable>
      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
      {result ? <Text className="text-xs text-ink-muted">{result}</Text> : null}
    </View>
  );
}
