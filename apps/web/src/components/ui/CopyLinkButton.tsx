"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { absoluteAppUrl, copyTextToClipboard } from "@/lib/utils/copyLink";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils/cn";

type Props = {
  path: string;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline" | "ghost";
};

export function CopyLinkButton({
  path,
  label = "Copy link",
  className,
  size = "sm",
  variant = "ghost",
}: Props) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = absoluteAppUrl(path);
    const ok = await copyTextToClipboard(url);
    if (!ok) {
      toast.error("Could not copy link.");
      return;
    }
    setCopied(true);
    toast.success("Link copied.");
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={() => void handleCopy()}
      aria-label={label}
    >
      {copied ? "Copied!" : label}
    </Button>
  );
}
