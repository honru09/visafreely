// Gojuuon row of a Japanese country name — used to group the ja index
// pages the way pinyin.ts groups the zh-Hans ones. Kana initials map to
// their row; the handful of kanji-led names in the frozen glossary use
// the reading table (中国 ちゅうごく → た, 日本 にっぽん → な, …).
const KANA_ROW: Record<string, string> = {};
const ROWS: Array<[string, string]> = [
  ['あ', 'あいうえおアイウエオぁぃぅぇぉァィゥェォ'],
  ['か', 'かきくけこがぎぐげごカキクケコガギグゲゴ'],
  ['さ', 'さしすせそざじずぜぞサシスセソザジズゼゾ'],
  ['た', 'たちつてとだぢづでどタチツテトダヂヅデドっッ'],
  ['な', 'なにぬねのナニヌネノ'],
  ['は', 'はひふへほばびぶべぼぱぴぷぺぽハヒフヘホバビブベボパピプペポ'],
  ['ま', 'まみむめもマミムメモ'],
  ['や', 'やゆよヤユヨゃゅょャュョ'],
  ['ら', 'らりるれろラリルレロ'],
  ['わ', 'わをんワヲン'],
];
for (const [row, chars] of ROWS) for (const ch of chars) KANA_ROW[ch] = row;

const KANJI_ROW: Record<string, string> = {
  '中': 'た', // 中国 ちゅうごく / 中央 ちゅうおう
  '日': 'な', // 日本 にっぽん
  '韓': 'か', // 韓国 かんこく
  '北': 'か', // 北朝鮮 きたちょうせん / 北マケドニア きた
  '香': 'は', // 香港 ほんこん
  '台': 'た', // 台湾 たいわん
  '英': 'あ', // 英国 えいこく
  '南': 'ま', // 南アフリカ/南スーダン みなみ
  '赤': 'さ', // 赤道 せきどう
  '東': 'は', // 東ティモール ひがし
};

export function jaRow(name: string): string {
  const ch = (name || '').charAt(0);
  return KANA_ROW[ch] || KANJI_ROW[ch] || ch;
}
