/** Live-schema fallbacks until pending migrations are applied. */

export const POST_SELECT_CORE =
  "id, user_id, body, image_url, book_id, repost_of_post_id, source_type, source_id, moderation_meta, created_at, updated_at";

export const POST_SELECT_WITH_QUOTE_GRAPHIC = `${POST_SELECT_CORE}, quote_graphic_id`;

type SchemaError = { message?: string | null; code?: string | null } | null | undefined;

export type CompatQueryError = { message?: string; code?: string } | null;

let quoteGraphicColumnEnabled = true;
let sessionMoodsColumnEnabled = true;

export function postSelectColumns(): string {
  return quoteGraphicColumnEnabled ? POST_SELECT_WITH_QUOTE_GRAPHIC : POST_SELECT_CORE;
}

export function disableQuoteGraphicColumn(): void {
  quoteGraphicColumnEnabled = false;
}

export function isQuoteGraphicColumnEnabled(): boolean {
  return quoteGraphicColumnEnabled;
}

export function isMissingQuoteGraphicSchema(error: SchemaError): boolean {
  return isMissingNamedSchema(error, ["quote_graphic_id", "quote_graphics"]);
}

export function isSessionMoodsColumnEnabled(): boolean {
  return sessionMoodsColumnEnabled;
}

export function disableSessionMoodsColumn(): void {
  sessionMoodsColumnEnabled = false;
}

export function isMissingMoodsColumn(error: SchemaError): boolean {
  return isMissingNamedSchema(error, ["moods"]);
}

export function isMissingNamedSchema(error: SchemaError, names: readonly string[]): boolean {
  if (!error) return false;
  const message = error.message ?? "";
  const code = error.code ?? "";
  const mentionsName = names.some((name) => message.toLowerCase().includes(name.toLowerCase()));
  if (!mentionsName) return false;
  return (
    code === "PGRST204" ||
    code === "PGRST205" ||
    code === "42703" ||
    /could not find/i.test(message) ||
    /schema cache/i.test(message) ||
    /does not exist/i.test(message) ||
    /column/i.test(message)
  );
}

function toCompatError(error: SchemaError): CompatQueryError {
  if (!error) return null;
  return {
    message: error.message ?? undefined,
    code: error.code ?? undefined,
  };
}

export async function withQuoteGraphicSelect(
  run: (columns: string) => PromiseLike<{ data: unknown; error: SchemaError }>
): Promise<{ data: unknown; error: CompatQueryError }> {
  const first = await run(postSelectColumns());
  const result =
    first.error && isMissingQuoteGraphicSchema(first.error)
      ? (disableQuoteGraphicColumn(), await run(postSelectColumns()))
      : first;
  return { data: result.data ?? null, error: toCompatError(result.error) };
}
