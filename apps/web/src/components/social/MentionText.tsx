"use client";

import Link from "next/link";
import { readerProfilePath } from "@/lib/routes/reader";
import { parseMentionSegments } from "@/lib/utils/mentions";
import { cn } from "@/lib/utils/cn";

type Props = {
  body: string;
  className?: string;
};

export function MentionText({ body, className }: Props) {
  const segments = parseMentionSegments(body);

  return (
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
}
