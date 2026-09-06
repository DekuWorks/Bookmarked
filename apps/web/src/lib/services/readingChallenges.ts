import { listChallengeCatalog, joinChallenge } from "@/lib/services/challenges/ChallengeService";

export type ReadingChallenge = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  year: number;
  is_active: boolean;
};

export async function listActiveChallenges(): Promise<ReadingChallenge[]> {
  const catalog = await listChallengeCatalog();
  return [...catalog.featured, ...catalog.yours].map((card) => ({
    id: card.challenge.id,
    slug: card.challenge.slug,
    title: card.challenge.title,
    description: card.challenge.description,
    year: card.challenge.year,
    is_active: card.challenge.is_active,
  }));
}

export async function joinReadingChallenge(challengeId: string): Promise<{ error?: string }> {
  return joinChallenge(challengeId);
}
