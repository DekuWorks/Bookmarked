"use client";

type Props = {
  open: boolean;
  bookTitle: string;
  onClose: () => void;
};

const SPARKLES = ["✦", "✧", "✦", "✧", "✦", "✧", "✦"];

/** Full-screen acknowledgement shown immediately after a successful completion. */
export function CompletionCelebration({ open, bookTitle, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Book completed"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-puce-red/90 p-6 text-center text-white backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="max-w-md space-y-5">
        <div className="flex justify-center gap-5 text-4xl text-orange-yellow" aria-hidden>
          {SPARKLES.map((sparkle, index) => (
            <span key={index} className={index % 2 ? "translate-y-3" : ""}>{sparkle}</span>
          ))}
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-yellow">Book complete</p>
        <h2 className="text-3xl font-bold">{bookTitle}</h2>
        <p className="text-white/85">Another story saved to your reading life.</p>
        <button type="button" className="rounded-full bg-white px-5 py-2.5 font-semibold text-puce-red" onClick={onClose}>
          Celebrate
        </button>
      </div>
    </div>
  );
}
