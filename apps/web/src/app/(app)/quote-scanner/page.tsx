"use client";

import { useState } from "react";
import Link from "next/link";
import { PremiumFeatureLock } from "@/components/premium/PremiumFeatureLock";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { scanQuoteImage } from "@/lib/services/quoteScanner";
import { QUOTE_SCANNER_COPY, quoteScanIsSavable } from "@bookmarked/utils/quoteScanner";
import { layout } from "@/lib/constants/layout";

export default function QuoteScannerPage() {
  const user = useAuthUser();
  const { canAccess, loading } = useSubscription(user?.id);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  if (loading || user === undefined) return <p className="p-6 text-sm text-text-muted">Loading…</p>;
  if (!canAccess("quote_scanner")) {
    return (
      <div className={layout.pageStack}>
        <PremiumFeatureLock
          title={QUOTE_SCANNER_COPY.title}
          description="Scan a page, edit the text, then save it yourself. Subscribe in the iOS app."
        />
      </div>
    );
  }

  return (
    <div className={layout.pageStack}>
      <header className={layout.pageHeader}>
        <h1 className="text-3xl font-bold text-puce-red">{QUOTE_SCANNER_COPY.title}</h1>
        <p className="mt-2 text-sm text-text-muted">{QUOTE_SCANNER_COPY.hint}</p>
      </header>
      <input
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setScanning(true);
          setError(null);
          const reader = new FileReader();
          reader.onload = () => {
            const result = String(reader.result ?? "");
            const base64 = result.split(",")[1] ?? "";
            void scanQuoteImage(base64, file.type).then((scanned) => {
              setScanning(false);
              if ("error" in scanned && scanned.error) setError(scanned.error);
              else setText(scanned.text ?? "");
            });
          };
          reader.readAsDataURL(file);
        }}
      />
      {scanning ? <p className="text-sm text-text-muted">Reading the photo… it will not be kept.</p> : null}
      {error ? <p className="text-sm text-rust">{error}</p> : null}
      <Textarea
        label="Editable preview"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Scanned text appears here. Nothing is saved until you copy or add it as a quote."
      />
      <p className="text-xs text-text-muted">{QUOTE_SCANNER_COPY.neverAutoSave}</p>
      <Button type="button" disabled={!quoteScanIsSavable(text)} onClick={() => void navigator.clipboard.writeText(text)}>
        Copy edited text
      </Button>
      <Link href="/quote-graphics/" className="text-sm font-medium text-primary hover:underline">
        Open quote graphics
      </Link>
    </div>
  );
}
