import { useState } from "react";
import { Alert, Share } from "react-native";
import { QUOTE_PDF_BRAND, quotesToShareText } from "../../../../packages/utils/quotePdf";
import { exportOwnQuotesPdf } from "../services/quoteExport";
import { Button } from "./Button";

type Props = {
  userId: string;
  ownerName?: string | null;
};

export function QuotePdfExportButton({ userId, ownerName }: Props) {
  const [exporting, setExporting] = useState(false);

  return (
    <Button
      title="Export my quotes"
      variant="ghost"
      loading={exporting}
      onPress={() => {
        void (async () => {
          setExporting(true);
          try {
            const result = await exportOwnQuotesPdf(userId, ownerName);
            if (result.error || !result.bytes) {
              Alert.alert("Export failed", result.error ?? "Could not export quotes.");
              return;
            }
            await Share.share({
              title: `${QUOTE_PDF_BRAND} quotes`,
              message: quotesToShareText(result.items ?? [], ownerName),
            });
          } finally {
            setExporting(false);
          }
        })();
      }}
    />
  );
}
