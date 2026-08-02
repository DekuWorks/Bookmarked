import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";

type Props = {
  onNewMessage: () => void;
};

export function EmptyInboxState({ onNewMessage }: Props) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <p className="text-lg font-medium text-text">No messages yet</p>
      <p className="mt-2 text-sm text-text-muted">
        Start a conversation with another reader.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button type="button" onClick={onNewMessage} size="sm">
          New message
        </Button>
        <ButtonLink href="/feed" variant="outline" size="sm">
          Browse readers
        </ButtonLink>
      </div>
    </div>
  );
}
