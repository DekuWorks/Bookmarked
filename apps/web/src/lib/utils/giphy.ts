const GIPHY_HOSTS = ["giphy.com", "www.giphy.com", "media.giphy.com", "i.giphy.com"] as const;

function isGiphyHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return GIPHY_HOSTS.some((host) => lower === host || lower.endsWith(`.${host}`));
}

/** Whether a URL points at Giphy-hosted media. */
export function isGiphyImageUrl(url: string): boolean {
  try {
    return isGiphyHost(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Whether a pasted post image URL is allowed (Giphy only for external URLs). */
export function isAllowedPostImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    return isGiphyHost(parsed.hostname);
  } catch {
    return false;
  }
}

/** Normalize a Giphy page or media URL to a direct GIF URL for image_url storage. */
export function resolveGiphyImageUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (!isGiphyHost(url.hostname)) return null;

    const mediaMatch = url.pathname.match(/\/media\/([^/]+)\//);
    if (mediaMatch) {
      return `https://media.giphy.com/media/${mediaMatch[1]}/giphy.gif`;
    }

    const directMatch = url.pathname.match(/^\/([^/.]+)\.gif$/i);
    if (directMatch && url.hostname.toLowerCase() === "i.giphy.com") {
      return `https://i.giphy.com/${directMatch[1]}.gif`;
    }

    const gifsMatch = url.pathname.match(/\/gifs\/(?:[^/]*-)?([a-zA-Z0-9]+)$/);
    if (gifsMatch) {
      return `https://media.giphy.com/media/${gifsMatch[1]}/giphy.gif`;
    }

    if (url.pathname.endsWith(".gif")) {
      return trimmed;
    }

    return null;
  } catch {
    return null;
  }
}
