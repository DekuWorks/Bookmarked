import { FeedImageMedia } from "./FeedImageMedia";

type Props = {
  url: string;
  /** Rounded style; defaults to a medium radius. */
  rounded?: boolean;
  /** Smaller max height for embeds and comments. */
  compact?: boolean;
};

/**
 * Feed / attachment image. Sizing lives in `FeedImageMedia` so posts,
 * comments, and message attachments share one contain renderer.
 */
export function AttachmentImage({ url, rounded = true, compact = false }: Props) {
  return <FeedImageMedia url={url} compact={compact} rounded={rounded} />;
}
