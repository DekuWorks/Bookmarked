export const POST_NOTIFICATION_COPY = {
  turnOn: "Turn On Post Notifications",
  turnOff: "Turn Off Post Notifications",
  title: (name: string) => `${name} posted something new.`,
  body: "Tap to view the post.",
} as const;

export function postNotificationTitle(displayName: string): string {
  const name = displayName.trim() || "A reader";
  return POST_NOTIFICATION_COPY.title(name);
}
