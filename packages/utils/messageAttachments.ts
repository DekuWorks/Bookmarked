export const MESSAGE_ATTACHMENT_BUCKET = "message-attachments";

const STORAGE_PATH_MARKER = "/message-attachments/";

/** Parse a storage path from a stored path or legacy public URL. */
export function parseMessageAttachmentPath(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (!trimmed.startsWith("http")) {
    return trimmed;
  }

  const markerIndex = trimmed.indexOf(STORAGE_PATH_MARKER);
  if (markerIndex === -1) return null;

  const rawPath = trimmed.slice(markerIndex + STORAGE_PATH_MARKER.length).split("?")[0];
  if (!rawPath) return null;

  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}
