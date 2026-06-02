import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("books").select("title").eq("id", id).maybeSingle();
  return { title: data?.title ?? "Book" };
}

export default async function BookDetailsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: book } = await supabase.from("books").select("*").eq("id", id).maybeSingle();

  if (!book) notFound();

  return (
    <div className="grid gap-8 md:grid-cols-[200px_1fr]">
      <div className="relative mx-auto aspect-[2/3] w-full max-w-[200px] overflow-hidden rounded-xl border border-border bg-background">
        {book.cover_url ? (
          <Image
            src={book.cover_url}
            alt={`Cover of ${book.title}`}
            fill
            className="object-cover"
            sizes="200px"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-text-muted">
            No cover
          </div>
        )}
      </div>
      <div>
        <h1 className="text-3xl font-bold text-puce-red">{book.title}</h1>
        {book.author ? <p className="mt-2 text-lg text-text-muted">{book.author}</p> : null}
        {book.description ? (
          <p className="mt-6 leading-relaxed text-text">{book.description}</p>
        ) : (
          <p className="mt-6 text-text-muted">No description yet.</p>
        )}
        <div className="mt-8 flex gap-3">
          <Link href="/library">
            <Button variant="outline">Back to library</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
