// Thai country-name grouping for the th index pages — the way pinyin.ts
// groups zh-Hans, japanese.ts groups ja and korean.ts groups ko. Thai
// dictionary order sorts by initial consonant; a name written with a
// preposed vowel (เ แ โ ใ ไ) belongs to the consonant that carries the
// vowel (เกาหลี → ก, เอสวาตินี → อ), not to the vowel sign, so the group
// is the following character. Group labels are single Thai consonants,
// whose codepoint order is the dictionary order, so the view's plain
// letters.sort() stays correct.
const PREPOSED = new Set(['เ', 'แ', 'โ', 'ใ', 'ไ']);

export function thInitial(name: string): string {
  const n = name || '';
  const ch = n.charAt(0);
  if (PREPOSED.has(ch)) return n.charAt(1) || ch;
  return ch;
}
