/** Shared responsive layout tokens — mobile-first, centered by default. */
export const layout = {
  container: "mx-auto w-full max-w-7xl px-4 text-center sm:px-6 lg:px-8",
  section: "py-10 sm:py-14 lg:py-20",
  appMain:
    "mx-auto w-full max-w-7xl flex-1 overflow-x-hidden px-4 py-8 text-center sm:px-6 sm:py-10 lg:px-8",
  prose:
    "mx-auto w-full max-w-3xl flex-1 px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8",
  pageStack: "mx-auto w-full max-w-3xl space-y-8 overflow-x-hidden px-1 text-center sm:px-0",
  pageStackWide: "mx-auto w-full max-w-7xl space-y-8 text-center",
  pageHeader: "text-center",
  formPanel: "mx-auto w-full max-w-md text-left",
} as const;
