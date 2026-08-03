import { Platform, Share } from "react-native";
import {
  buildExternalShareContent,
  type ExternalShareContent,
  type MessageSharePayload,
  type ShareComposerPayload,
} from "../../../../packages/utils/sharePreview";
import { env } from "../constants/env";

export type ExternalShareResult = "shared" | "copied" | "cancelled" | "error";

export function toExternalShareContent(
  payload: ShareComposerPayload | MessageSharePayload
): ExternalShareContent {
  return buildExternalShareContent(payload, env.siteUrl);
}

/** iOS Share Sheet (and Android share intent) with Copy Link fallback. */
export async function shareExternally(
  payload: ShareComposerPayload | MessageSharePayload
): Promise<ExternalShareResult> {
  const content = toExternalShareContent(payload);

  try {
    const result = await Share.share(
      Platform.OS === "ios"
        ? {
            message: content.text,
            url: content.url,
          }
        : {
            message: `${content.text}\n\n${content.url}`,
            title: content.title,
          }
    );

    if (result.action === Share.dismissedAction) return "cancelled";
    return "shared";
  } catch {
    return copyShareLink(content.url);
  }
}

/**
 * Present the system share sheet with the URL so the user can Copy / share.
 * Avoids expo-clipboard, which requires a native rebuild when newly added.
 */
export async function copyShareLink(url: string): Promise<ExternalShareResult> {
  try {
    const result = await Share.share(
      Platform.OS === "ios"
        ? { url }
        : { message: url }
    );
    if (result.action === Share.dismissedAction) return "cancelled";
    return "shared";
  } catch {
    return "error";
  }
}
