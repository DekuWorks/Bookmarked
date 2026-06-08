import { ButtonLink } from "@/components/ui/ButtonLink";

type Props = {
  className?: string;
};

export function EmptyShelfMessage({ className }: Props) {
  return (
    <div className={className}>
      <p className="text-sm text-text-muted">No books on this shelf yet.</p>
      <ButtonLink href="/search" variant="secondary" size="sm" className="mt-3">
        Search for books
      </ButtonLink>
    </div>
  );
}
