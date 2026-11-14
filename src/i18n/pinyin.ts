// Pinyin initials for the first characters of the 199 zh-Hans country
// names in glossary.json — used to group the zh-Hans index pages A–Z the
// way the English indexes group by first letter. Hand-mapped 2026-11-14
// against the frozen glossary (秘鲁 → B, 朝鲜 → C, 乍得 → Z incl.).
const INITIALS: Record<string, string> = {
  不: 'B', 东: 'D', 中: 'Z', 丹: 'D', 乌: 'W', 乍: 'Z', 也: 'Y', 亚: 'Y',
  以: 'Y', 伊: 'Y', 伯: 'B', 佛: 'F', 俄: 'E', 保: 'B', 克: 'K', 冈: 'G',
  冰: 'B', 几: 'J', 列: 'L', 刚: 'G', 利: 'L', 加: 'J', 匈: 'X', 北: 'B',
  南: 'N', 博: 'B', 卡: 'K', 卢: 'L', 印: 'Y', 危: 'W', 厄: 'E', 叙: 'X',
  古: 'G', 台: 'T', 吉: 'J', 哈: 'H', 哥: 'G', 喀: 'K', 图: 'T', 土: 'T',
  圣: 'S', 圭: 'G', 坦: 'T', 埃: 'A', 基: 'J', 塔: 'T', 塞: 'S', 墨: 'M',
  多: 'D', 奥: 'A', 委: 'W', 孟: 'M', 安: 'A', 密: 'M', 尼: 'N', 巴: 'B',
  布: 'B', 希: 'X', 帕: 'P', 德: 'D', 意: 'Y', 所: 'S', 拉: 'L', 挪: 'N',
  捷: 'J', 摩: 'M', 文: 'W', 斐: 'F', 斯: 'S', 新: 'X', 日: 'R', 智: 'Z',
  朝: 'C', 柬: 'J', 格: 'G', 梵: 'F', 比: 'B', 毛: 'M', 汤: 'T', 沙: 'S',
  法: 'F', 波: 'B', 泰: 'T', 津: 'J', 洪: 'H', 海: 'H', 澳: 'A', 爱: 'A',
  牙: 'Y', 特: 'T', 玻: 'B', 瑙: 'N', 瑞: 'R', 瓦: 'W', 白: 'B', 科: 'K',
  秘: 'B', 突: 'T', 立: 'L', 索: 'S', 约: 'Y', 纳: 'N', 缅: 'M', 罗: 'L',
  美: 'M', 老: 'L', 肯: 'K', 芬: 'F', 苏: 'S', 英: 'Y', 荷: 'H', 莫: 'M',
  莱: 'L', 菲: 'F', 萨: 'S', 葡: 'P', 蒙: 'M', 西: 'X', 贝: 'B', 赞: 'Z',
  赤: 'C', 越: 'Y', 阿: 'A', 韩: 'H', 香: 'X', 马: 'M', 黎: 'L', 黑: 'H',
};

export function pinyinInitial(ch: string): string {
  return INITIALS[ch] || '#';
}
