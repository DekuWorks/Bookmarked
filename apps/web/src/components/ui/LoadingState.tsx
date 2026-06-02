export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-16" role="status">
      <p className="text-text-muted">{message}</p>
    </div>
  );
}
