import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

/** Legacy route — canonical book URL is /book/[id]. */
export default async function LegacyBookRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/book/${id}`);
}
