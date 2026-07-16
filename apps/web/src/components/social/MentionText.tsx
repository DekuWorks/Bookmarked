"use client";

import Link from "next/link";
import { ProfanityBlur } from "@/components/social/ProfanityBlur";
import { readerProfilePath } from "@/lib/routes/reader";
import { parseMentionSegments } from "@/lib/utils/mentions";
import { cn } from "@/lib/utils/cn";

type Props = {
  body: string;
  className?: string;
  /** When false, skip profanity blur (e.g. nested inside another gate). Default true. */
  blurProfanity?: boolean;
};

export function MentionText({ body, className, blurProfanity = true }: Props) {
  const segments = parseMentionSegments(body);

  const content = (
    <span className={cn("whitespace-pre-wrap", className)}>
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return <span key={index}>{segment.value}</span>;
        }

        return (
          <Link
            key={index}
            href={readerProfilePath(segment.username)}
            className="font-medium text-puce-red hover:underline"
          >
            @{segment.username}
          </Link>
        );
      })}
    </span>
  );

  if (!blurProfanity) return content;

  return <ProfanityBlur text={body}>{content}</ProfanityBlur>;
}
