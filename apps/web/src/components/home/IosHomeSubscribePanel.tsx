"use client";

import { IOS_HOME_SUBSCRIBE_COPY } from "@bookmarked/utils/subscription";
import { IosSubscribePanel } from "@/components/challenges/IosSubscribePanel";

export function IosHomeSubscribePanel({ title }: { title: string }) {
  return <IosSubscribePanel title={title} copy={IOS_HOME_SUBSCRIBE_COPY} />;
}
