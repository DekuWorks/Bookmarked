import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

type Props = {
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  href?: string;
  className?: string;
};

const SPINE_COLORS = [
  "bg-puce-red",
  "bg-rust",
  "bg-royal-orange",
  "bg-primary",
  "bg-orange-yellow/80",
];

function hashTitle(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function BookSpine({ title, author, coverUrl, href, className }: Props) {
  const spineColor = SPINE_COLORS[hashTitle(title) % SPINE_COLORS.length];

  const content = (
    <div
      className={cn(
        "group relative flex h-44 w-11 flex-shrink-0 flex-col overflow-hidden rounded-t-sm transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02]",
        "book-spine-shadow",
        className
      )}
      title={author ? `${title} — ${author}` : title}
    >
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={`Cover of ${title}`}
          fill
          className="object-cover"
          sizes="44px"
          unoptimized
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center px-0.5",
            spineColor
          )}
        >
          <span
            className="max-h-[160px] overflow-hidden text-[9px] font-bold uppercase leading-tight tracking-wide text-white/95"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            {title}
          </span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-black/10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-0.5 bg-white/20" />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block flex-shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}
