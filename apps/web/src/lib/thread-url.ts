/**
 * Build a thread URL in the format /:slug/:shortId
 * shortId is first 8 chars of UUID without hyphens
 */
export function buildThreadUrl(slug: string, id: string): string {
  const shortId = id.replace(/-/g, '').substring(0, 8);
  return `/${slug}/${shortId}`;
}

/**
 * For backward compat, also support full UUID format
 */
export function buildThreadUrlFull(slug: string, id: string): string {
  return `/${slug}/${id}`;
}
