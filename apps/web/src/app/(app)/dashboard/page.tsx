import { redirect } from "next/navigation";

/** Dashboard merged into Reading Room — keep route for bookmarks and old links. */
export default function DashboardPage() {
  redirect("/reading-room/");
}
