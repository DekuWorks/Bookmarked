import * as Linking from "expo-linking";

const WEB_HOSTS = new Set(["bookmarked.online", "www.bookmarked.online"]);

/**
 * Map an inbound URL (universal link, custom scheme, or relative path)
 * to an Expo Router href inside the app.
 */
export function mapInboundUrlToAppPath(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/")) {
    return normalizeAppHref(trimmed);
  }

  try {
    const parsed = Linking.parse(trimmed);
    const host = (parsed.hostname ?? "").toLowerCase();
    const scheme = (parsed.scheme ?? "").toLowerCase();

    if (scheme === "bookmarked") {
      const path = parsed.path ? `/${parsed.path}` : "/";
      const query = queryString(parsed.queryParams);
      return normalizeAppHref(`${path}${query}`);
    }

    if (scheme === "https" || scheme === "http") {
      if (!WEB_HOSTS.has(host)) return null;
      const path = parsed.path ? `/${parsed.path}` : "/";
      const query = queryString(parsed.queryParams);
      return normalizeAppHref(adaptWebPathToNative(`${path}${query}`));
    }
  } catch {
    return null;
  }

  return null;
}

function queryString(
  params: Record<string, string | string[] | undefined> | null | undefined
): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const entry of value) search.append(key, entry);
    } else {
      search.set(key, value);
    }
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : "";
}

/** Convert static-export web paths to Expo Router paths. */
export function adaptWebPathToNative(pathWithQuery: string): string {
  const [rawPath, query = ""] = pathWithQuery.split("?");
  const path = rawPath.replace(/\/+$/, "") || "/";
  const params = new URLSearchParams(query);

  const bookId = params.get("id");
  if (path === "/book" && bookId) {
    params.delete("id");
    const rest = params.toString();
    return `/book/${bookId}${rest ? `?${rest}` : ""}`;
  }

  if (path === "/clubs/club" && bookId) {
    const tab = params.get("tab");
    const discussion = params.get("discussion");
    const query = new URLSearchParams();
    if (tab) query.set("tab", tab);
    if (discussion) query.set("discussion", discussion);
    const rest = query.toString();
    return `/clubs/${bookId}${rest ? `?${rest}` : ""}`;
  }

  const username = params.get("username");
  if (path === "/reader" && username) {
    return `/reader/${username}`;
  }

  if (path === "/reading-dna" && username) {
    return `/reading-dna?username=${encodeURIComponent(username)}`;
  }

  if (path === "/feed") {
    const post = params.get("post");
    return post ? `/feed?post=${encodeURIComponent(post)}` : "/feed";
  }

  if (path === "/author" && bookId) {
    return `/author/${bookId}`;
  }

  if (path === "/series" && bookId) {
    return `/series/${bookId}`;
  }

  const rest = params.toString();
  return `${path}${rest ? `?${rest}` : ""}`;
}

function normalizeAppHref(path: string): string {
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  // Expo Router app routes live under /(app) for signed-in content.
  if (
    withSlash.startsWith("/(app)") ||
    withSlash.startsWith("/(auth)") ||
    withSlash === "/"
  ) {
    return withSlash;
  }
  return `/(app)${withSlash}`;
}
