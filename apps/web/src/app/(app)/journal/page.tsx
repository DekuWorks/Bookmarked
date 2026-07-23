import { redirect } from "next/navigation";

/** Legacy Journal tab URL — redirects to Reading Room Trail. */
export default function JournalRedirectPage() {
  redirect("/reading-room/?tab=trail");
}
