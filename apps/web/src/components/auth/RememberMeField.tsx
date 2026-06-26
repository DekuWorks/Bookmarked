type Props = {
  defaultChecked?: boolean;
};

export function RememberMeField({ defaultChecked = true }: Props) {
  return (
    <label className="mb-4 flex min-h-[44px] cursor-pointer items-start justify-center gap-3 text-left text-sm text-text sm:items-center">
      <input
        type="checkbox"
        name="remember"
        value="on"
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      />
      <span>
        <span className="font-medium text-text">Remember me</span>
        <span className="mt-0.5 block text-text-muted">
          Stay signed in on this device after you close the browser.
        </span>
      </span>
    </label>
  );
}
