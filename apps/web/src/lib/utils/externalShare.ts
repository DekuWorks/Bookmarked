import {
  buildExternalShareContent,
  type ExternalShareContent,
  type MessageSharePayload,
  type ShareComposerPayload,
} from "@bookmarked/utils/sharePreview";
import { SITE_URL } from "@/lib/seo/sharePreview";

export type ExternalShareResult = "shared" | "copied" | "cancelled" | "error";

export function toExternalShareContent(
  payload: ShareComposerPayload | MessageSharePayload
): ExternalShareContent {
  return buildExternalShareContent(payload, SITE_URL);
}

/** Native Web Share API with clipboard Copy Link fallback. */
export async function shareExternally(
  payload: ShareComposerPayload | MessageSharePayload
): Promise<ExternalShareResult> {
  const content = toExternalShareContent(payload);

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: content.title,
        text: content.text,
        url: content.url,
      });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
      // Fall through to copy link.
    }
  }

  return copyShareLink(content.url);
}

export async function copyShareLink(url: string): Promise<ExternalShareResult> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return "copied";
    }
  } catch {
    // fall through
  }

  try {
    const input = document.createElement("input");
    input.value = url;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(input);
    return ok ? "copied" : "error";
  } catch {
    return "error";
  }
}
