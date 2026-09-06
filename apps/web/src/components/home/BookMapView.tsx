"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BOOK_MAP_EMPTY_CAFE_COPY,
  BOOK_MAP_FILTERS,
  BOOK_MAP_PLACE_REPORT_LABELS,
  BOOK_MAP_PLACE_REPORT_REASONS,
  osMapsDirectionsUrl,
  type BookMapFilter,
} from "@bookmarked/utils/bookMap";
import { viewportFromCenter, type BookMapPlace, type GeoPoint } from "@bookmarked/utils/mapProvider";
import { listBookMapPlaces, reportBookMapPlace } from "@/lib/services/bookMap";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { OsmMapCanvas } from "@/components/home/OsmMapCanvas";

const DEFAULT_CENTER: GeoPoint = { lat: 40.73, lng: -73.99 };

export function BookMapView() {
  const [places, setPlaces] = useState<BookMapPlace[] | null>(null);
  const [filter, setFilter] = useState<BookMapFilter>("all");
  const [query, setQuery] = useState("");
  const [center, setCenter] = useState<GeoPoint>(DEFAULT_CENTER);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [areaPlaces, setAreaPlaces] = useState<BookMapPlace[] | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const load = useCallback(async (next?: { city?: string; text?: string }) => {
    const rows = await listBookMapPlaces({
      category: filter,
      text: next?.text ?? query,
      city: next?.city,
    });
    setPlaces(rows);
    setAreaPlaces(null);
  }, [filter, query]);

  useEffect(() => {
    void load().catch(() => setPlaces([]));
  }, [load]);

  const visible = areaPlaces ?? places ?? [];
  const selected = visible.find((place) => place.id === selectedId) ?? visible[0] ?? null;

  const markers = useMemo(
    () =>
      visible.map((place) => ({
        id: place.id,
        point: { lat: place.lat, lng: place.lng },
        label: place.name,
        tone: "place" as const,
      })),
    [visible]
  );

  const handleSearchArea = async () => {
    const viewport = viewportFromCenter(center, 12);
    const rows = await listBookMapPlaces({ category: filter, bounds: viewport.bounds, text: query });
    setAreaPlaces(rows);
  };

  const handleNearMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const near = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(near);
        void listBookMapPlaces({ category: filter, near }).then((rows) => {
          setPlaces(rows);
          setAreaPlaces(null);
        });
      },
      () => undefined,
      { enableHighAccuracy: false, maximumAge: 60_000 }
    );
  };

  if (places === null) return <LoadingState message="Loading Book Map…" />;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {BOOK_MAP_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                filter === item.id
                  ? "bg-puce-red text-white"
                  : "border border-border bg-surface text-text"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="City, ZIP, or place name"
            className="min-w-[12rem] flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm"
          />
          <Button size="sm" variant="secondary" onClick={() => void load()}>
            Search
          </Button>
          <Button size="sm" variant="outline" onClick={() => void handleSearchArea()}>
            Search this area
          </Button>
          <Button size="sm" variant="ghost" onClick={handleNearMe}>
            Near me
          </Button>
        </div>
        <OsmMapCanvas
          center={selected ? { lat: selected.lat, lng: selected.lng } : center}
          markers={markers}
          selectedId={selected?.id}
          onSelect={setSelectedId}
          className="min-h-[24rem]"
        />
        {filter === "reading_cafe" && visible.length === 0 ? (
          <p className="text-sm text-text-muted">{BOOK_MAP_EMPTY_CAFE_COPY}</p>
        ) : null}
      </div>

      <aside className="space-y-3">
        <ul className="space-y-2">
          {visible.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(place.id);
                  setCenter({ lat: place.lat, lng: place.lng });
                }}
                className={`w-full rounded-xl border px-3 py-3 text-left ${
                  selected?.id === place.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface"
                }`}
              >
                <p className="font-semibold text-puce-red">{place.name}</p>
                <p className="text-xs uppercase tracking-wide text-text-muted">{place.category}</p>
                {place.city ? <p className="mt-1 text-sm text-text-muted">{place.city}</p> : null}
              </button>
            </li>
          ))}
        </ul>

        {selected ? (
          <article className="surface-card p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">
              {selected.verified ? "Verified" : "Unverified"} · {selected.active ? "Active" : "Inactive"}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-puce-red">{selected.name}</h2>
            {selected.address_text ? (
              <p className="mt-1 text-sm text-text-muted">{selected.address_text}</p>
            ) : null}
            {selected.website ? (
              <a href={selected.website} className="mt-2 inline-block text-sm text-primary underline">
                Website
              </a>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => window.open(osMapsDirectionsUrl(selected, "web"), "_blank")}
              >
                Directions
              </Button>
              <Link href="/reader-map/" className="text-sm text-primary underline">
                Reader Map
              </Link>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium text-text-muted">Report this place</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {BOOK_MAP_PLACE_REPORT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    className="rounded-full border border-border px-2 py-1 text-xs"
                    onClick={() => {
                      void reportBookMapPlace(selected.id, reason).then((result) => {
                        setReportError(result.error ?? "Reported. Thank you.");
                      });
                    }}
                  >
                    {BOOK_MAP_PLACE_REPORT_LABELS[reason]}
                  </button>
                ))}
              </div>
              {reportError ? <p className="mt-2 text-xs text-text-muted">{reportError}</p> : null}
            </div>
          </article>
        ) : null}
      </aside>
    </div>
  );
}
