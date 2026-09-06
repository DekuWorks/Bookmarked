import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { CONCIERGE_COPY } from "../../../../packages/utils/homeConcierge";
import { IOS_HOME_SUBSCRIBE_COPY } from "../../../../packages/utils/subscription";
import { Button } from "../../src/components/Button";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { useSubscription } from "../../src/hooks/useSubscription";
import { TAB_BAR_SPACE } from "../../src/navigation/TabBarScroll";
import { submitFeatureRequest, submitSupportTicket } from "../../src/services/homeExperiences";

export default function ConciergeScreen() {
  const { canAccess } = useSubscription();
  const hasHome = canAccess("concierge");
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Concierge" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE, gap: 12 }}>
        {!hasHome ? (
          <Text className="text-ink-muted">{IOS_HOME_SUBSCRIBE_COPY.body}</Text>
        ) : (
          <>
            <Text className="font-semibold text-puce-red">Priority Feature Request</Text>
            <Text className="text-sm text-ink-muted">{CONCIERGE_COPY.featureRequestBlurb}</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="Title" className="rounded-xl border border-brand-border bg-surface px-3 py-2 text-ink" />
            <TextInput value={problem} onChangeText={setProblem} placeholder="Problem" className="rounded-xl border border-brand-border bg-surface px-3 py-2 text-ink" />
            <TextInput value={description} onChangeText={setDescription} placeholder="Description" multiline className="min-h-[80px] rounded-xl border border-brand-border bg-surface px-3 py-2 text-ink" />
            <Button
              title="Submit request"
              onPress={() => {
                void submitFeatureRequest({ title, description, category: "other", problem }).then((result) => {
                  setMessage(result.ok ? "Request sent with Home priority." : result.error ?? "Could not send.");
                });
              }}
            />
            <Text className="mt-4 font-semibold text-puce-red">{CONCIERGE_COPY.prioritySupportTag}</Text>
            <Text className="text-sm text-ink-muted">{CONCIERGE_COPY.noSla}</Text>
            <TextInput value={subject} onChangeText={setSubject} placeholder="Subject" className="rounded-xl border border-brand-border bg-surface px-3 py-2 text-ink" />
            <TextInput value={body} onChangeText={setBody} placeholder="How can we help?" multiline className="min-h-[80px] rounded-xl border border-brand-border bg-surface px-3 py-2 text-ink" />
            <Button
              title="Send ticket"
              variant="secondary"
              onPress={() => {
                void submitSupportTicket(subject, body).then((result) => {
                  setMessage(result.ok ? `Ticket sent${result.priority_tag ? ` · ${result.priority_tag}` : ""}.` : result.error ?? "Could not send.");
                });
              }}
            />
            {message ? <Text className="text-sm text-ink-muted">{message}</Text> : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
