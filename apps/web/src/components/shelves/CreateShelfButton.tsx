"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CreateShelfModal } from "@/components/shelves/CreateShelfModal";
import type { UserShelf } from "@/types";

type Props = {
  userId: string;
  onCreated: (shelf: UserShelf) => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function CreateShelfButton({
  userId,
  onCreated,
  variant = "outline",
  size = "sm",
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        + Create shelf
      </Button>
      <CreateShelfModal
        open={open}
        userId={userId}
        onClose={() => setOpen(false)}
        onCreated={onCreated}
      />
    </>
  );
}
