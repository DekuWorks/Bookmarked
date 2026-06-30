import { isGiphyImageUrl } from "@/lib/utils/giphy";
import { cn } from "@/lib/utils/cn";

type Props = {
  url: string;
  className?: string;
};

export function CommentAttachment({ url, className }: Props) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("block", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={isGiphyImageUrl(url) ? "Comment GIF" : "Comment image"}
        className={cn(
          "max-h-64 max-w-full rounded-lg border border-border",
          isGiphyImageUrl(url) ? "object-contain bg-background" : "object-cover"
        )}
      />
    </a>
  );
}
