"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FeedBookAttachment } from "@/components/social/FeedBookAttachment";
import { MentionText } from "@/components/social/MentionText";
import { postFeedPath } from "@/lib/routes/posts";
import { readerProfilePath } from "@/lib/routes/reader";
import type { PostWithAuthor } from "@/types";
import { FeedImageMedia } from "@/components/social/FeedImageMedia";
import { isGiphyImageUrl } from "@/lib/utils/giphy";

function authorLabel(author: PostWithAuthor["author"]): string {
  return author.display_name?.trim() || author.username?.trim() || "Reader";
}

type Props = {
  post: PostWithAuthor;
  linkToPost?: boolean;
};

export function RepostPreview({ post, linkToPost = true }: Props) {
  const router = useRouter();
  const profileHref = post.author.username
    ? readerProfilePath(post.author.username)
    : null;
  const postHref = postFeedPath(post.id);

  const content = (
    <>
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="text-xs text-text-muted">
          {profileHref ? (
            <Link href={profileHref} className="font-semibold text-puce-red hover:underline">
              {authorLabel(post.author)}
            </Link>
          ) : (
            <span className="font-semibold text-puce-red">{authorLabel(post.author)}</span>
          )}
        </p>
        {linkToPost ? (
          <Link href={postHref} className="shrink-0 text-xs font-medium text-primary hover:underline">
            View post
          </Link>
        ) : null}
      </div>
      {post.body.trim() ? (
        <div className="text-sm leading-relaxed text-text">
          <MentionText body={post.body} />
        </div>
      ) : null}
      {post.image_url ? (
        <div className="mt-2" onClick={(event) => event.stopPropagation()}>
          <FeedImageMedia
            url={post.image_url}
            alt={isGiphyImageUrl(post.image_url) ? "Post GIF" : "Post image"}
            compact
          />
        </div>
      ) : null}
      {post.book ? (
        <div className="mt-2" onClick={(event) => event.stopPropagation()}>
          <FeedBookAttachment book={post.book} variant="compact" />
        </div>
      ) : null}
    </>
  );

  if (!linkToPost) {
    return (
      <div className="rounded-lg border border-border bg-background/60 p-3">{content}</div>
    );
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(postHref)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(postHref);
        }
      }}
      className="cursor-pointer rounded-lg border border-border bg-background/60 p-3 transition hover:border-primary/40 hover:bg-background"
    >
      {content}
    </div>
  );
}
