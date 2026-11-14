// Initial-jamo (초성) group of a Korean country name — used to group the
// ko index pages the way pinyin.ts groups the zh-Hans ones and
// japanese.ts groups the ja ones. Hangul syllables decompose
// arithmetically (U+AC00 block: initial = floor((code - 0xAC00) / 588));
// tense initials (ㄲ ㄸ ㅃ ㅆ ㅉ) fold into their plain group, the way
// Korean dictionary indexes group them (14 groups). Non-Hangul initials
// (should not occur in the frozen glossary) group under themselves.
const GROUPS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const INITIALS = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const FOLD: Record<string, string> = { 'ㄲ': 'ㄱ', 'ㄸ': 'ㄷ', 'ㅃ': 'ㅂ', 'ㅆ': 'ㅅ', 'ㅉ': 'ㅈ' };

export function koInitial(name: string): string {
  const ch = (name || '').charAt(0);
  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const ini = INITIALS[Math.floor((code - 0xac00) / 588)];
    return FOLD[ini] || ini;
  }
  return GROUPS.includes(ch) ? ch : ch;
}
