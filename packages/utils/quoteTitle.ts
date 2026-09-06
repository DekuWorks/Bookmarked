/** Quote titles are optional and no longer collected in create/edit UI. */

export function isQuoteTitleRequired(): false {
  return false;
}

export function noteContentIsValid(input: {
  quote?: string | null;
  note?: string | null;
  title?: string | null;
}): boolean {
  return Boolean(input.quote?.trim() || input.note?.trim());
}
