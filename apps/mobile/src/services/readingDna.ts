import { supabase } from "./supabase";
import type { ReadingDna } from "../../../../packages/utils/readingDna";
import { computeReadingDna } from "../../../../packages/utils/readingDna";
import {
  READING_DNA_PERSIST_DEBOUNCE_MS,
  readingDnaFingerprint,
  readingDnaPeriodKey,
  readingDnaSnapshotPayload,
  readingDnaTraitsPayload,
} from "../../../../packages/utils/readingDnaPersist";
import { getUserLibraryBooks } from "./library";
import { listUserReviews } from "./readingRoom";

type PersistState = {
  fingerprint: string;
  at: number;
  inflight: boolean;
};

const persistStateByUser = new Map<string, PersistState>();

export type PersistReadingDnaResult =
  | { ok: true; skipped?: boolean }
  | { ok: false; error: string };

export async function persistReadingDnaSnapshot(
  userId: string,
  dna: ReadingDna,
  options?: { force?: boolean }
): Promise<PersistReadingDnaResult> {
  const fingerprint = readingDnaFingerprint(dna);
  const now = Date.now();
  const prior = persistStateByUser.get(userId);

  if (
    !options?.force &&
    prior &&
    prior.fingerprint === fingerprint &&
    now - prior.at < READING_DNA_PERSIST_DEBOUNCE_MS
  ) {
    return { ok: true, skipped: true };
  }

  if (prior?.inflight && prior.fingerprint === fingerprint) {
    return { ok: true, skipped: true };
  }

  persistStateByUser.set(userId, { fingerprint, at: now, inflight: true });

  const { data, error } = await supabase.rpc("upsert_reading_dna", {
    p_summary: dna.summary,
    p_insight: dna.insight,
    p_confidence: dna.confidence,
    p_confidence_score: dna.confidenceScore,
    p_sample_size: dna.sampleSize,
    p_traits: readingDnaTraitsPayload(dna),
    p_write_snapshot: true,
    p_period_key: readingDnaPeriodKey(),
    p_payload: readingDnaSnapshotPayload(dna),
  });

  persistStateByUser.set(userId, {
    fingerprint,
    at: Date.now(),
    inflight: false,
  });

  if (error) {
    console.warn("[readingDna] persist failed:", error.message);
    return { ok: false, error: error.message };
  }

  const body = data as { ok?: boolean; error?: string } | null;
  if (body && body.ok === false) {
    return { ok: false, error: body.error ?? "Could not persist Reading DNA." };
  }

  return { ok: true };
}

export async function loadComputedReadingDna(
  userId: string,
  favoriteGenres: string[] = []
): Promise<ReadingDna> {
  const [books, reviews] = await Promise.all([
    getUserLibraryBooks(userId),
    listUserReviews(userId, 100),
  ]);

  return computeReadingDna({
    books: books.map((row) => ({
      subjects: row.books?.subjects ?? null,
      rating: row.rating,
      shelf_status: row.shelf_status,
    })),
    reviews: reviews.map((review) => ({
      feelings: review.feelings ?? null,
      rating: review.rating,
      review_body: review.review_body,
    })),
    shelves: favoriteGenres.map((genre) => ({ genre })),
  });
}
