import { redirect } from "next/navigation";

/** Legacy Journal URL. Trail now lives on a book. Without a book id, open Overview. */
export default function JournalRedirectPage() {
  redirect("/reading-room/");
}
