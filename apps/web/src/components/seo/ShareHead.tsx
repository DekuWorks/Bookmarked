"use client";

import { useEffect } from "react";
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_TAGLINE,
  sharePreviewImageUrl,
} from "@/lib/seo/sharePreview";

type Props = {
  title?: string;
  description?: string;
  /** Book cover or avatar URL — composited into a branded share card when set. */
  image?: string | null;
};

function upsertMeta(
  key: string,
  content: string,
  attr: "property" | "name" = "property"
): void {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

/**
 * Updates document title and Open Graph / Twitter meta tags after client data loads.
 * iMessage and other preview crawlers that render the page will pick these up.
 */
export function ShareHead({ title, description, image }: Props) {
  useEffect(() => {
    const pageTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`;
    const pageDescription = description ?? SITE_TAGLINE;
    const ogImage = image ? sharePreviewImageUrl(image) : DEFAULT_OG_IMAGE;
    const pageUrl = window.location.href;

    document.title = pageTitle;

    upsertMeta("og:title", pageTitle);
    upsertMeta("og:description", pageDescription);
    upsertMeta("og:site_name", SITE_NAME);
    upsertMeta("og:type", "website");
    upsertMeta("og:url", pageUrl);
    upsertMeta("og:image", ogImage);

    upsertMeta("twitter:card", "summary_large_image", "name");
    upsertMeta("twitter:title", pageTitle, "name");
    upsertMeta("twitter:description", pageDescription, "name");
    upsertMeta("twitter:image", ogImage, "name");
  }, [title, description, image]);

  return null;
}
