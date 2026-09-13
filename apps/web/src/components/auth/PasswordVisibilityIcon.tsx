type Props = {
  visible: boolean;
  className?: string;
};

/** Bookmarked stroke icon — eye / eye-off (no emoji). */
export function PasswordVisibilityIcon({ visible, className }: Props) {
  const cls = className ?? "h-5 w-5 text-text-muted";
  if (visible) {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.5 12s3.5-6.5 8.5-6.5S20.5 12 20.5 12 17 18.5 12 18.5 3.5 12 3.5 12z"
        />
        <circle cx="12" cy="12" r="2.5" />
        <path strokeLinecap="round" d="M4 20L20 4" />
      </svg>
    );
  }

  return (
    <svg aria-hidden viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.5 12s3.5-6.5 8.5-6.5S20.5 12 20.5 12 17 18.5 12 18.5 3.5 12 3.5 12z"
      />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}
