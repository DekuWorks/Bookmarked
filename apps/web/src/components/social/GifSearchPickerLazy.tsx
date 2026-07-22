"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { GifSearchPicker as GifSearchPickerComponent } from "@/components/social/GifSearchPicker";

type GifSearchPickerProps = ComponentProps<typeof GifSearchPickerComponent>;

export const GifSearchPicker = dynamic(
  () =>
    import("@/components/social/GifSearchPicker").then((mod) => ({
      default: mod.GifSearchPicker,
    })),
  { ssr: false, loading: () => null }
) as typeof GifSearchPickerComponent;
