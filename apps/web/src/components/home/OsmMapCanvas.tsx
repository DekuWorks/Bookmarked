"use client";

import { useMemo } from "react";
import { latLngToTile, resolveMapProvider, type GeoPoint } from "@bookmarked/utils/mapProvider";
import { cn } from "@/lib/utils/cn";

type Marker = {
  id: string;
  point: GeoPoint;
  label: string;
  tone?: "place" | "reader" | "selected";
};

type Props = {
  center: GeoPoint;
  zoom?: number;
  markers?: Marker[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
};

export function OsmMapCanvas({
  center,
  zoom = 12,
  markers = [],
  selectedId,
  onSelect,
  className,
}: Props) {
  const provider = resolveMapProvider();
  const origin = latLngToTile(center.lat, center.lng, zoom);
  const tiles = useMemo(() => {
    const cells: { x: number; y: number; dx: number; dy: number }[] = [];
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        cells.push({ x: origin.x + dx, y: origin.y + dy, dx, dy });
      }
    }
    return cells;
  }, [origin.x, origin.y]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-[#d8e3d8]",
        className
      )}
      role="img"
      aria-label="Book Map"
    >
      <div className="relative h-full min-h-[22rem] w-full">
        {tiles.map((tile) => (
          <img
            key={`${tile.x}-${tile.y}`}
            alt=""
            src={provider.tileUrl({ x: tile.x, y: tile.y, z: zoom })}
            className="absolute h-1/3 w-1/3 max-w-none"
            style={{ left: `${(tile.dx + 1) * 33.333}%`, top: `${(tile.dy + 1) * 33.333}%` }}
          />
        ))}
        {markers.map((marker) => {
          const selected = marker.id === selectedId;
          return (
            <button
              key={marker.id}
              type="button"
              aria-label={marker.label}
              onClick={() => onSelect?.(marker.id)}
              className={cn(
                "absolute h-4 w-4 -translate-x-1/2 -translate-y-full rounded-sm border-2 shadow-sm",
                marker.tone === "reader"
                  ? "border-white bg-primary"
                  : "border-white bg-puce-red",
                selected && "h-5 w-5 bg-royal-orange"
              )}
              style={{
                left: `${50 + (marker.point.lng - center.lng) * 80}%`,
                top: `${50 - (marker.point.lat - center.lat) * 120}%`,
              }}
            />
          );
        })}
      </div>
      <p className="absolute bottom-2 right-2 rounded bg-white/80 px-2 py-0.5 text-[10px] text-text-muted">
        {provider.attribution}
      </p>
    </div>
  );
}
