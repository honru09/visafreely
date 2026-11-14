// Zhuyin (注音符號) initials for the first characters of the 199 zh-Hant
// country names in glossary.json — used to group the zh-Hant index pages
// by initial the way Taiwan dictionaries order entries (教育部國語辭典
// order). Zero-initial syllables group under their first zhuyin symbol
// (安 → ㄢ, 亞 → ㄧ, 烏 → ㄨ, 約 → ㄩ, 俄 → ㄜ …). The zhuyin block's
// code-point order is dictionary order, so the view's letters.sort()
// needs no custom comparator. Hand-mapped 2026-11-14 against the frozen
// zh-Hant glossary.
const INITIALS: Record<string, string> = {
  不: 'ㄅ', 中: 'ㄓ', 丹: 'ㄉ', 亞: 'ㄧ', 以: 'ㄧ', 伊: 'ㄧ', 俄: 'ㄜ',
  保: 'ㄅ', 克: 'ㄎ', 冰: 'ㄅ', 列: 'ㄌ', 利: 'ㄌ', 剛: 'ㄍ', 加: 'ㄐ',
  匈: 'ㄒ', 北: 'ㄅ', 千: 'ㄑ', 南: 'ㄋ', 卡: 'ㄎ', 印: 'ㄧ', 厄: 'ㄜ',
  古: 'ㄍ', 史: 'ㄕ', 吉: 'ㄐ', 吐: 'ㄊ', 哈: 'ㄏ', 哥: 'ㄍ', 喀: 'ㄎ',
  喬: 'ㄑ', 土: 'ㄊ', 坦: 'ㄊ', 埃: 'ㄞ', 塔: 'ㄊ', 塞: 'ㄙ', 墨: 'ㄇ',
  多: 'ㄉ', 奈: 'ㄋ', 奧: 'ㄠ', 委: 'ㄨ', 孟: 'ㄇ', 安: 'ㄢ', 宏: 'ㄏ',
  密: 'ㄇ', 寮: 'ㄌ', 尚: 'ㄕ', 尼: 'ㄋ', 巴: 'ㄅ', 布: 'ㄅ', 希: 'ㄒ',
  帛: 'ㄅ', 幾: 'ㄐ', 德: 'ㄉ', 愛: 'ㄞ', 拉: 'ㄌ', 挪: 'ㄋ', 捷: 'ㄐ',
  摩: 'ㄇ', 敘: 'ㄒ', 斐: 'ㄈ', 斯: 'ㄙ', 新: 'ㄒ', 日: 'ㄖ', 智: 'ㄓ',
  東: 'ㄉ', 查: 'ㄔ', 柬: 'ㄐ', 格: 'ㄍ', 梵: 'ㄈ', 模: 'ㄇ', 比: 'ㄅ',
  汶: 'ㄨ', 沙: 'ㄕ', 法: 'ㄈ', 波: 'ㄅ', 泰: 'ㄊ', 海: 'ㄏ', 澳: 'ㄠ',
  烏: 'ㄨ', 牙: 'ㄧ', 獅: 'ㄕ', 玻: 'ㄅ', 瑞: 'ㄖ', 瓜: 'ㄍ', 甘: 'ㄍ',
  白: 'ㄅ', 盧: 'ㄌ', 科: 'ㄎ', 秘: 'ㄅ', 突: 'ㄊ', 立: 'ㄌ', 約: 'ㄩ',
  納: 'ㄋ', 紐: 'ㄋ', 索: 'ㄙ', 維: 'ㄨ', 緬: 'ㄇ', 羅: 'ㄌ', 美: 'ㄇ',
  義: 'ㄧ', 聖: 'ㄕ', 肯: 'ㄎ', 臺: 'ㄊ', 芬: 'ㄈ', 英: 'ㄧ', 茅: 'ㄇ',
  荷: 'ㄏ', 莫: 'ㄇ', 菲: 'ㄈ', 萬: 'ㄨ', 葉: 'ㄧ', 葛: 'ㄍ', 葡: 'ㄆ',
  蒙: 'ㄇ', 蒲: 'ㄆ', 蓋: 'ㄍ', 薩: 'ㄙ', 蘇: 'ㄙ', 衣: 'ㄧ', 西: 'ㄒ',
  諾: 'ㄋ', 象: 'ㄒ', 貝: 'ㄅ', 賴: 'ㄌ', 賽: 'ㄙ', 赤: 'ㄔ', 越: 'ㄩ',
  辛: 'ㄒ', 迦: 'ㄐ', 阿: 'ㄚ', 韓: 'ㄏ', 香: 'ㄒ', 馬: 'ㄇ', 黎: 'ㄌ',
};

export function zhuyinInitial(ch: string): string {
  return INITIALS[ch] || '#';
}
