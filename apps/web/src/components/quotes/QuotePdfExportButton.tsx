"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { exportOwnQuotesPdf } from "@/lib/services/quoteExport";

type Props = {
  userId: string;
  ownerName?: string | null;
};

export function QuotePdfExportButton({ userId, ownerName }: Props) {
  const toast = useToast();
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const result = await exportOwnQuotesPdf(userId, ownerName);
      if (result.error || !result.bytes || !result.filename) {
        toast.error(result.error ?? "Could not export quotes.");
        return;
      }
      const bytes = Uint8Array.from(result.bytes);
      const blob = new Blob([bytes.buffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Quote PDF downloaded.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" loading={exporting} onClick={() => void handleExport()}>
      Export my quotes (PDF)
    </Button>
  );
}
