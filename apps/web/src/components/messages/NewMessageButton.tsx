"use client";

import { Button } from "@/components/ui/Button";

type Props = {
  onClick: () => void;
};

export function NewMessageButton({ onClick }: Props) {
  return (
    <Button type="button" onClick={onClick} size="sm">
      New message
    </Button>
  );
}
