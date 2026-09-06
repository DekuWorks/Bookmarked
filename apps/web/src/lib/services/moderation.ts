import type {
  ContentReportReason,
  ReportableContentType,
} from "../../../../../packages/types";
import { createClient } from "@/lib/supabase/client";

export type { ContentReportReason, ReportableContentType };

export type ReportContentInput = {
  contentType: ReportableContentType;
  contentId: string;
  reportedUserId?: string | null;
  reason?: ContentReportReason;
  details?: string | null;
};

export type ServiceResult = { error?: string };

function getSupabase() {
  return createClient();
}

export async function reportContent(input: ReportContentInput): Promise<ServiceResult & { reportId?: string }> {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to report content." };

  const { data, error } = await supabase
    .from("content_reports")
    .insert({
      reporter_id: user.id,
      content_type: input.contentType,
      content_id: input.contentId,
      reported_user_id: input.reportedUserId ?? null,
      reason: input.reason ?? "other",
      details: input.details?.trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "You’ve already reported this." };
    }
    return { error: error.message };
  }
  return { reportId: data.id as string };
}

export async function blockUser(
  blockedId: string,
  options?: { reportId?: string; reason?: ContentReportReason; details?: string }
): Promise<ServiceResult> {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to block users." };
  if (user.id === blockedId) return { error: "You cannot block yourself." };

  let reportId = options?.reportId;
  if (!reportId) {
    const report = await reportContent({
      contentType: "profile",
      contentId: blockedId,
      reportedUserId: blockedId,
      reason: options?.reason ?? "harassment_bullying",
      details: options?.details ?? "User blocked — auto-reported for review.",
    });
    if (report.error) return { error: report.error };
    reportId = report.reportId;
  }

  const { error } = await supabase.from("user_blocks").insert({
    blocker_id: user.id,
    blocked_id: blockedId,
    report_id: reportId ?? null,
  });

  if (error) {
    if (error.code === "23505") return {};
    return { error: error.message };
  }
  return {};
}

export async function unblockUser(blockedId: string): Promise<ServiceResult> {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedId);

  if (error) return { error: error.message };
  return {};
}

export async function getBlockedUserIds(): Promise<string[]> {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id);

  if (error) return [];
  return (data ?? []).map((row) => row.blocked_id as string);
}

export async function isUserBlocked(blockedId: string): Promise<boolean> {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedId)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

export async function deleteAccount(): Promise<ServiceResult> {
  const supabase = getSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "You must be signed in." };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return { error: "Server misconfigured." };

  const response = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    return { error: body?.error ?? "Account deletion failed. Please try again." };
  }

  await supabase.auth.signOut();
  return {};
}

export function filterBlockedAuthors<T extends { author: { id: string } }>(
  entries: T[],
  blockedIds: Set<string>
): T[] {
  return entries.filter((entry) => !blockedIds.has(entry.author.id));
}

export function filterBlockedUserIds<T extends { user_id: string }>(
  rows: T[],
  blockedIds: Set<string>
): T[] {
  return rows.filter((row) => !blockedIds.has(row.user_id));
}
