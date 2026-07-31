/**
 * Turns a list of token ids into the exact substrings they cover, by
 * decoding cumulative prefixes and diffing. This is what makes token
 * visualizations byte-accurate even when a multi-byte character (e.g. an
 * emoji or accented letter) is split across two tokens, and works the same
 * way regardless of the underlying tokenization scheme (BPE, WordPiece...).
 */
export function idsToSegments(
  ids: number[],
  decode: (slice: number[]) => string,
): string[] {
  const segments: string[] = [];
  let prevText = "";
  for (let i = 0; i < ids.length; i++) {
    const cumulative = decode(ids.slice(0, i + 1));
    segments.push(cumulative.slice(prevText.length));
    prevText = cumulative;
  }
  return segments;
}
