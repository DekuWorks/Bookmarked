import { supabase } from "./supabase";
import { getBlockedUserIds } from "./moderation";
import {
  cardModelFromSnapshot,
  unavailableShareCard,
  type MessageSharePayload,
  type SharePreviewCardModel,
} from "../../../../packages/utils/sharePreview";

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { at: number; model: SharePreviewCardModel }>();
const inflight = new Map<string, Promise<SharePreviewCardModel>>();

function cacheKey(payload: MessageSharePayload, viewerId: string): string {
  return `${viewerId}:${payload.contentType}:${payload.contentId}`;
}

export async function resolveSharePreview(
  payload: MessageSharePayload,
  viewerId: string
): Promise<SharePreviewCardModel> {
  const key = cacheKey(payload, viewerId);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.model;
  }

  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = resolveSharePreviewUncached(payload, viewerId)
    .then((model) => {
      cache.set(key, { at: Date.now(), model });
      return model;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

async function resolveSharePreviewUncached(
  payload: MessageSharePayload,
  viewerId: string
): Promise<SharePreviewCardModel> {
  const snapshotModel = cardModelFromSnapshot(payload);

  try {
    const blocked = new Set(await getBlockedUserIds());

    switch (payload.contentType) {
      case "post": {
        const { data } = await supabase
          .from("posts")
          .select("id, user_id")
          .eq("id", payload.contentId)
          .maybeSingle();
        if (!data) return unavailableShareCard(payload);
        if (blocked.has(data.user_id as string)) return unavailableShareCard(payload);
        return snapshotModel;
      }
      case "review": {
        const { data } = await supabase
          .from("reviews")
          .select("id, user_id, visibility")
          .eq("id", payload.contentId)
          .maybeSingle();
        if (!data) return unavailableShareCard(payload);
        if (blocked.has(data.user_id as string)) return unavailableShareCard(payload);
        if (data.visibility === "private") return unavailableShareCard(payload);
        return snapshotModel;
      }
      case "book": {
        const { data } = await supabase
          .from("books")
          .select("id")
          .eq("id", payload.contentId)
          .maybeSingle();
        if (!data) return unavailableShareCard(payload);
        return snapshotModel;
      }
      case "club": {
        const { data: club } = await supabase
          .from("book_clubs")
          .select("id, visibility, owner_id")
          .eq("id", payload.contentId)
          .maybeSingle();
        if (!club) return unavailableShareCard(payload);
        if (blocked.has(club.owner_id as string)) return unavailableShareCard(payload);
        if (club.visibility === "private" || club.visibility === "invite_only") {
          const { data: membership } = await supabase
            .from("book_club_members")
            .select("id")
            .eq("club_id", payload.contentId)
            .eq("user_id", viewerId)
            .maybeSingle();
          if (!membership && club.owner_id !== viewerId) {
            return unavailableShareCard(payload);
          }
        }
        return snapshotModel;
      }
      case "profile": {
        if (blocked.has(payload.contentId)) return unavailableShareCard(payload);
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", payload.contentId)
          .maybeSingle();
        if (!data) return unavailableShareCard(payload);
        return snapshotModel;
      }
      case "reading_dna": {
        if (blocked.has(payload.contentId)) return unavailableShareCard(payload);
        const { data } = await supabase
          .from("reading_dna_profiles")
          .select("visibility, public_top_traits_approved")
          .eq("user_id", payload.contentId)
          .maybeSingle();
        if (!data || data.visibility === "private" || !data.public_top_traits_approved) {
          return unavailableShareCard(payload);
        }
        return snapshotModel;
      }
      case "activity": {
        const { data } = await supabase
          .from("activity_events")
          .select("id, user_id, visibility")
          .eq("id", payload.contentId)
          .maybeSingle();
        if (!data) return unavailableShareCard(payload);
        if (blocked.has(data.user_id as string)) return unavailableShareCard(payload);
        if (data.visibility === "private" && data.user_id !== viewerId) {
          return unavailableShareCard(payload);
        }
        return snapshotModel;
      }
      case "reading_list":
      case "author":
      default:
        return snapshotModel;
    }
  } catch {
    return snapshotModel;
  }
}
