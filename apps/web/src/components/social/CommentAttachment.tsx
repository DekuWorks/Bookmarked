import { FeedImageMedia } from "@/components/social/FeedImageMedia";
import { isGiphyImageUrl } from "@/lib/utils/giphy";

type Props = {
  url: string;
  className?: string;
};

export function CommentAttachment({ url, className }: Props) {
  return (
    <FeedImageMedia
      url={url}
      alt={isGiphyImageUrl(url) ? "Comment GIF" : "Comment image"}
      compact
      className={className}
    />
  );
}
