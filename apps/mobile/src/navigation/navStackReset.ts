const pending = new Set<string>();

export function requestStackReset(stack: string) {
  pending.add(stack);
}

export function consumeStackReset(stack: string): boolean {
  if (!pending.has(stack)) return false;
  pending.delete(stack);
  return true;
}

export function clearStackResets() {
  pending.clear();
}
