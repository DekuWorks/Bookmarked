import { supabase } from "./supabase";
import {
  computeReadingDna,
  deriveReadingPersonality,
  readingDnaStructuredSummary,
  type ReadingDna,
  type ReadingDnaMatchVector,
} from "../../../../packages/utils/readingDna";
import {
  READING_DNA_PERSIST_DEBOUNCE_MS,
  readingDnaFingerprint,
  readingDnaFromCachedPayload,
  readingDnaPeriodKeys,
  readingDnaSnapshotPayload,
  readingDnaTraitsPayload,
} from "../../../../packages/utils/readingDnaPersist";
import {
  DEFAULT_READING_DNA_PRIVACY,
  parseReadingDnaVisibility,
  type ReadingDnaPrivacyState,
} from "../../../../packages/utils/readingDnaPrivacy";
import { READING_DNA_VERSION } from "../../../../packages/utils/readingDnaConfig";
import { getUserLibraryBooks } from "./library";
import { listUserReviews } from "./readingRoom";
import { listUserReadingSessions } from "./readingSessions";
import { scoreBookDnaMatches, type ReadingDnaBookMatch } from "../../../../packages/utils/readingDnaRecs";
import { compareReadingDnaSnapshots, type ReadingDnaSnapshotCompareRow } from "../../../../packages/utils/readingDnaCompare";
import { cosineReadingDnaMatch, sharesEnoughGenres } from "../../../../packages/utils/readingDnaMatch";

type PersistState = {
  fingerprint: string;
  at: number;
  inflight: boolean;
};

const persistStateByUser = new Map<string, PersistState>();

export type PersistReadingDnaResult =
  | { ok: true; skipped?: boolean }
  | { ok: false; error: string };

const DNA_BOOK_SELECT =
  "id, shelf_status, rating, is_favorite, finished_at, started_at, dnf, read_count, tracking_format, completion_tags, books(subjects, format)";

type DnaBookRow = {
  shelf_status: string | null;
  rating: number | null;
  is_favorite: boolean | null;
  finished_at: string | null;
  started_at: string | null;
  dnf: boolean | null;
  read_count: number | null;
  tracking_format: string | null;
  completion_tags: string[] | null;
  books: { subjects: string[] | null; format: string | null } | null;
};

export async function markReadingDnaStale(): Promise<void> {
  await supabase.rpc("mark_reading_dna_stale");
}

export async function loadReadingDnaPrivacy(): Promise<ReadingDnaPrivacyState> {
  const { data } = await supabase
    .from("reading_dna_profiles")
    .select("visibility, match_enabled, public_top_traits_approved, share_personality_on_reader_map")
    .maybeSingle();
  if (!data) return DEFAULT_READING_DNA_PRIVACY;
  return {
    visibility: parseReadingDnaVisibility(data.visibility),
    matchEnabled: data.match_enabled as boolean | null,
    publicTopTraitsApproved: Boolean(data.public_top_traits_approved),
    sharePersonalityOnReaderMap: Boolean(data.share_personality_on_reader_map),
  };
}

export async function saveReadingDnaPrivacy(
  next: Partial<ReadingDnaPrivacyState> & { visibility: ReadingDnaPrivacyState["visibility"] }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc("update_reading_dna_privacy", {
    p_visibility: next.visibility,
    p_match_enabled: next.matchEnabled ?? null,
    p_public_top_traits_approved: next.publicTopTraitsApproved ?? null,
    p_share_personality_on_reader_map: next.sharePersonalityOnReaderMap ?? null,
  });
  if (error) return { ok: false, error: error.message };
  const body = data as { ok?: boolean; error?: string } | null;
  if (body && body.ok === false) return { ok: false, error: body.error ?? "Could not save DNA privacy." };
  return { ok: true };
}

async function loadCachedProfile(userId: string): Promise<{
  dna: ReadingDna | null;
  stale: boolean;
  privacy: ReadingDnaPrivacyState;
}> {
  const { data } = await supabase
    .from("reading_dna_profiles")
    .select(
      "summary, insight, confidence, confidence_score, sample_size, data_points_count, forming, match_vector, dna_version, stale_at, visibility, match_enabled, public_top_traits_approved, share_personality_on_reader_map"
    )
    .eq("user_id", userId)
    .maybeSingle();

  const privacy: ReadingDnaPrivacyState = data
    ? {
        visibility: parseReadingDnaVisibility(data.visibility),
        matchEnabled: data.match_enabled as boolean | null,
        publicTopTraitsApproved: Boolean(data.public_top_traits_approved),
        sharePersonalityOnReaderMap: Boolean(data.share_personality_on_reader_map),
      }
    : DEFAULT_READING_DNA_PRIVACY;

  if (!data?.match_vector || typeof data.match_vector !== "object") {
    return { dna: null, stale: true, privacy };
  }

  const { data: traits } = await supabase
    .from("reading_dna_traits")
    .select("category, label, score, percent, emoji, persona, is_top_trait")
    .eq("user_id", userId);

  const traitRows = (traits ?? []) as Array<{
    category: ReadingDna["traits"][number]["category"];
    label: string;
    score: number;
    percent: number;
    emoji: string | null;
    persona: string | null;
    is_top_trait: boolean;
  }>;
  const mapped = traitRows.map((row) => ({
    category: row.category,
    label: row.label,
    score: Number(row.score),
    percent: Number(row.percent),
    emoji: row.emoji ?? "📖",
    persona: row.persona ?? undefined,
    confidence: 1,
  }));
  const dna: ReadingDna = {
    dnaVersion: (data.dna_version as string) ?? READING_DNA_VERSION,
    topTraits: mapped.filter((_, index) => traitRows[index]?.is_top_trait),
    personaTraits: mapped.filter((trait) => trait.category !== "habit").slice(0, 5),
    traits: mapped,
    categories: (["genre", "vibe", "emotion", "trope"] as const).map((category) => ({
      category,
      title:
        category === "genre"
          ? "Genre DNA"
          : category === "vibe"
            ? "Vibe DNA"
            : category === "emotion"
              ? "Emotion DNA"
              : "Trope DNA",
      subtitle: "",
      emptyCopy: "",
      traits: mapped.filter((trait) => trait.category === category),
    })),
    habits: mapped
      .filter((trait) => trait.category === "habit")
      .map((trait) => ({
        ...trait,
        habitId: trait.label.replace(/\s+/g, "_") as ReadingDna["habits"][number]["habitId"],
        evidenceCount: trait.score,
      })),
    summary: (data.summary as string) ?? "",
    insight: (data.insight as string) ?? "",
    confidence: (data.confidence as ReadingDna["confidence"]) ?? "low",
    confidenceScore: Number(data.confidence_score ?? 0),
    sampleSize: Number(data.sample_size ?? 0),
    dataPointsCount: Number(data.data_points_count ?? 0),
    forming: Boolean(data.forming),
    matchVector: data.match_vector as ReadingDnaMatchVector,
  };
  return { dna, stale: Boolean(data.stale_at), privacy };
}

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
  const personality = deriveReadingPersonality(dna);
  const periods = readingDnaPeriodKeys();
  const payload = readingDnaSnapshotPayload(dna);
  const traits = readingDnaTraitsPayload(dna);

  const write = (periodType: "monthly" | "yearly", periodKey: string) =>
    supabase.rpc("upsert_reading_dna", {
      p_summary: dna.summary,
      p_insight: dna.insight,
      p_confidence: dna.confidence,
      p_confidence_score: dna.confidenceScore,
      p_sample_size: dna.sampleSize,
      p_traits: traits,
      p_write_snapshot: true,
      p_period_key: periodKey,
      p_payload: payload,
      p_match_vector: dna.matchVector,
      p_data_points_count: dna.dataPointsCount,
      p_dna_version: dna.dnaVersion,
      p_forming: dna.forming,
      p_period_type: periodType,
      p_personality_label: personality?.label ?? null,
      p_personality_explanation: personality?.explanation ?? null,
    });

  const yearly = await write(periods.yearly.periodType, periods.yearly.periodKey);
  const monthly = await write(periods.monthly.periodType, periods.monthly.periodKey);
  persistStateByUser.set(userId, { fingerprint, at: Date.now(), inflight: false });

  const error = yearly.error ?? monthly.error;
  if (error) {
    console.warn("[readingDna] persist failed:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function computeReadingDnaFromLibrary(
  userId: string,
  favoriteGenres: string[] = []
): Promise<ReadingDna> {
  const [booksRes, reviews, sessions] = await Promise.all([
    supabase.from("user_books").select(DNA_BOOK_SELECT).eq("user_id", userId),
    listUserReviews(userId, 100),
    listUserReadingSessions(userId, 200),
  ]);
  const rows = (booksRes.data ?? []) as unknown as DnaBookRow[];
  return computeReadingDna({
    books: rows.map((row) => ({
      subjects: row.books?.subjects ?? null,
      rating: row.rating,
      isFavorite: Boolean(row.is_favorite),
      dnf: Boolean(row.dnf),
      reread: (row.read_count ?? 1) > 1,
      readCount: row.read_count,
      shelfStatus: row.shelf_status,
      format: row.tracking_format ?? row.books?.format ?? null,
      finishedAt: row.finished_at,
      startedAt: row.started_at,
      tropeTags: row.completion_tags,
    })),
    reviews: reviews.map((review) => ({
      feelings: review.feelings ?? null,
      rating: review.rating,
    })),
    sessions: sessions.map((session) => ({
      sessionDate: session.session_date,
      createdAt: session.created_at,
      pagesRead: session.pages_read,
      listeningSeconds: session.listening_seconds,
      mood: session.mood,
      sessionFormat: session.session_format,
    })),
    shelves: favoriteGenres.map((genre) => ({ genre })),
  });
}

export async function loadComputedReadingDna(
  userId: string,
  favoriteGenres: string[] = []
): Promise<ReadingDna> {
  const cached = await loadCachedProfile(userId);
  if (cached.dna && !cached.stale) return cached.dna;
  return computeReadingDnaFromLibrary(userId, favoriteGenres);
}

export async function loadReadingDnaBundle(
  userId: string,
  favoriteGenres: string[] = []
): Promise<{ dna: ReadingDna; privacy: ReadingDnaPrivacyState; fromCache: boolean }> {
  const cached = await loadCachedProfile(userId);
  if (cached.dna && !cached.stale) {
    return { dna: cached.dna, privacy: cached.privacy, fromCache: true };
  }
  const dna = await computeReadingDnaFromLibrary(userId, favoriteGenres);
  return { dna, privacy: cached.privacy, fromCache: false };
}

export async function loadReadingDnaComparisons(userId: string): Promise<{
  yoy: ReadingDnaSnapshotCompareRow[];
  mom: ReadingDnaSnapshotCompareRow[];
}> {
  const { data } = await supabase
    .from("reading_dna_snapshots")
    .select("period_type, period_key, payload")
    .eq("user_id", userId)
    .order("period_key", { ascending: false });
  const rows = data ?? [];
  const yearly = rows.filter((row) => row.period_type === "yearly");
  const monthly = rows.filter((row) => row.period_type === "monthly");
  const toDna = (payload: unknown) =>
    readingDnaFromCachedPayload((payload ?? {}) as Record<string, unknown>);
  return {
    yoy:
      yearly.length >= 2 && toDna(yearly[1]?.payload) && toDna(yearly[0]?.payload)
        ? compareReadingDnaSnapshots(toDna(yearly[1]!.payload)!, toDna(yearly[0]!.payload)!)
        : [],
    mom:
      monthly.length >= 2 && toDna(monthly[1]?.payload) && toDna(monthly[0]?.payload)
        ? compareReadingDnaSnapshots(toDna(monthly[1]!.payload)!, toDna(monthly[0]!.payload)!)
        : [],
  };
}

export async function loadDnaBookMatches(userId: string, dna: ReadingDna): Promise<ReadingDnaBookMatch[]> {
  const books = await getUserLibraryBooks(userId);
  return scoreBookDnaMatches(
    dna,
    books
      .filter((row) => row.shelf_status === "want_to_read" || row.shelf_status === "currently_reading")
      .map((row) => ({
        id: row.books?.id ?? row.id,
        title: row.books?.title ?? "Untitled",
        subjects: row.books?.subjects ?? [],
      }))
  ).slice(0, 6);
}

export type ReadingDnaSimilarReader = {
  userId: string;
  displayName: string;
  percent: number;
  personalityLabel: string | null;
};

export async function loadSimilarReaders(dna: ReadingDna): Promise<ReadingDnaSimilarReader[]> {
  const { data, error } = await supabase.rpc("list_reading_dna_match_candidates", { p_limit: 20 });
  if (error || !data) return [];
  return (data as Array<{
    user_id: string;
    display_name: string | null;
    username: string | null;
    match_vector: ReadingDnaMatchVector;
    personality_label: string | null;
  }>)
    .filter((row) => sharesEnoughGenres(dna.matchVector, row.match_vector))
    .map((row) => ({
      userId: row.user_id,
      displayName: row.display_name ?? row.username ?? "Reader",
      percent: cosineReadingDnaMatch(dna.matchVector, row.match_vector),
      personalityLabel: row.personality_label,
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 8);
}

export function dnaCompanionContext(dna: ReadingDna): string {
  return JSON.stringify(readingDnaStructuredSummary(dna));
}
