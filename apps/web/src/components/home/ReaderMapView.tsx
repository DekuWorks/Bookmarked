"use client";

import { useEffect, useState } from "react";
import { READER_MAP_OPT_IN_COPY } from "@bookmarked/utils/locationPrivacy";
import { formatPublicDistanceKm } from "@bookmarked/utils/locationPrivacy";
import { haversineKm } from "@bookmarked/utils/locationPrivacy";
import {
  DEFAULT_READER_MAP_SETTINGS,
  applyReaderMapFilters,
  readerMapSocialAllowed,
  type ReaderMapFilters,
  type ReaderMapSettings,
  type VisibleReaderCard,
} from "@bookmarked/utils/readerMap";
import { DEFAULT_HOME_ELIGIBILITY_FLAGS, type AgeEligibilityStatus } from "@bookmarked/utils/homeEligibility";
import { loadHomeEligibilityFlags } from "@/lib/services/homeFlags";
import {
  listReaderMapMarkers,
  loadAgeStatus,
  loadReaderMapSettings,
  saveReaderMapSettings,
  upsertReaderMapPresence,
} from "@/lib/services/readerMap";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { OsmMapCanvas } from "@/components/home/OsmMapCanvas";
import { viewportFromCenter } from "@bookmarked/utils/mapProvider";

const DEFAULT_CENTER = { lat: 40.73, lng: -73.99 };

export function ReaderMapView() {
  const [settings, setSettings] = useState<ReaderMapSettings>(DEFAULT_READER_MAP_SETTINGS);
  const [ageStatus, setAgeStatus] = useState<AgeEligibilityStatus>("unknown");
  const [flags, setFlags] = useState(DEFAULT_HOME_ELIGIBILITY_FLAGS);
  const [cards, setCards] = useState<VisibleReaderCard[]>([]);
  const [filters, setFilters] = useState<ReaderMapFilters>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([loadReaderMapSettings(), loadAgeStatus(), loadHomeEligibilityFlags()])
      .then(([nextSettings, nextAge, nextFlags]) => {
        setSettings(nextSettings);
        setAgeStatus(nextAge);
        setFlags(nextFlags);
      })
      .finally(() => setLoading(false));
  }, []);

  const allowed = readerMapSocialAllowed({
    hasHome: true,
    settings,
    ageStatus,
    flags,
    extraTrustOk: true,
  });

  const visible = applyReaderMapFilters(cards, filters);

  const handleOptIn = async (optedIn: boolean) => {
    const next = { ...settings, opted_in: optedIn, discoverable: optedIn };
    setSettings(next);
    const result = await saveReaderMapSettings(next);
    if (result.error) setMessage(result.error);
  };

  const handleSearchArea = async () => {
    try {
      const viewport = viewportFromCenter(DEFAULT_CENTER, 8, 2);
      const rows = await listReaderMapMarkers(viewport.bounds);
      setCards(rows);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load Reader Map.");
    }
  };

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      setMessage("Location is unavailable. City search still works.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void upsertReaderMapPresence({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          cityLabel: settings.city_label ?? undefined,
        }).then((result) => {
          if (!result.ok) setMessage(result.error ?? "Could not update coarse location.");
          else void handleSearchArea();
        });
      },
      () => setMessage("Location denied. City or college filters still work."),
      { enableHighAccuracy: false, maximumAge: 60_000 }
    );
  };

  if (loading) return <LoadingState message="Loading Reader Map…" />;

  return (
    <div className="space-y-4">
      <section className="surface-card p-4">
        <h2 className="font-semibold text-puce-red">{READER_MAP_OPT_IN_COPY.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">{READER_MAP_OPT_IN_COPY.body}</p>
        {ageStatus !== "eligible" ? (
          <p className="mt-3 text-sm text-rust">
            Nearby readers and meetups stay off until age eligibility is known and meets the
            configured minimum. Bookmarked has not set that minimum yet.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant={settings.opted_in ? "secondary" : "primary"} onClick={() => void handleOptIn(!settings.opted_in)}>
            {settings.opted_in ? "Turn off discoverability" : "Opt in"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleNearMe} disabled={!settings.opted_in}>
            Update my coarse area
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void handleSearchArea()} disabled={!allowed}>
            Search this area
          </Button>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <p className="text-xs text-text-muted">
          Personality filter only includes readers who opted into DNA visibility. Home is not
          consent.
        </p>
        {(["city", "college", "personality", "genre"] as const).map((key) => (
          <input
            key={key}
            placeholder={key}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))}
          />
        ))}
      </div>

      <OsmMapCanvas
        center={DEFAULT_CENTER}
        markers={visible.map((card) => ({
          id: card.user_id,
          point: { lat: card.coarse_lat, lng: card.coarse_lng },
          label: card.display_name ?? card.username ?? "Reader",
          tone: "reader",
        }))}
        className="min-h-[20rem]"
      />

      <ul className="grid gap-3 md:grid-cols-2">
        {visible.map((card) => {
          const km = haversineKm(
            DEFAULT_CENTER,
            { lat: card.coarse_lat, lng: card.coarse_lng }
          );
          return (
            <li key={card.user_id} className="surface-card p-4">
              <p className="font-semibold text-puce-red">
                {card.display_name ?? card.username ?? "Reader"}
              </p>
              <p className="text-sm text-text-muted">{card.city_label ?? "Area hidden"}</p>
              {card.personality_label ? (
                <p className="mt-1 text-sm">{card.personality_label}</p>
              ) : null}
              <p className="mt-2 text-xs text-text-muted">{formatPublicDistanceKm(km)}</p>
              {card.public_club_names.length ? (
                <p className="mt-2 text-xs text-text-muted">
                  Public clubs: {card.public_club_names.join(", ")}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      {message ? <p className="text-sm text-text-muted">{message}</p> : null}
    </div>
  );
}
