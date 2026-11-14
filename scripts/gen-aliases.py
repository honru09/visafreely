#!/usr/bin/env python3
"""Country search-alias generator (BUG-003).

Builds src/data/country-aliases.json: for each of the 199 countries, a
pipe-joined string of NORMALIZED search aliases so every country input
on the site (checker, compare, map) matches a country by:
  - its English name and the six frozen glossary names (native script),
  - ISO alpha-2 / alpha-3 codes,
  - romanizations: zh pinyin (pypinyin, toneless), ja Hepburn romaji
    (kana table + curated readings for the 22 kanji-bearing glossary
    names), ko Revised Romanization (syllable-wise jamo tables),
    th RTGS-lite (table-driven; head countries hand-corrected below),
  - a small curated table of common short forms (usa, uk, turkey, ...).

Normalization (identical to the runtime one in the pickers): lowercase,
NFD, strip U+0300-U+036F, drop everything outside [a-z0-9] + CJK /
kana / hangul / thai ranges.

Sources: glossary.json (frozen site names), mledoze/countries
(cca2/cca3; fetched to /tmp/world-countries.json when absent),
pypinyin for Chinese. The head-country romanizations were hand-checked
against standard references on 2026-11-14; RTGS_OVERRIDES and
EXTRA carry those corrections — re-check them if the glossary changes.

Run: python3 scripts/gen-aliases.py   (requires pypinyin)
"""
import json
import os
import re
import sys
import unicodedata
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", (s or "").lower())
    s = re.sub(r"[\u0300-\u036f]", "", s)
    s = re.sub(r"[^a-z0-9\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7a3\u0e00-\u0e7f]", "", s)
    return s


# ---------------------------------------------------------------- pinyin
from pypinyin import lazy_pinyin  # noqa: E402


def pinyin_of(name: str) -> str:
    return "".join(lazy_pinyin(name))


# ---------------------------------------------------------------- romaji
KANA = {}
_rows = [
    ("a i u e o", "ア イ ウ エ オ", "あ い う え お"),
    ("ka ki ku ke ko", "カ キ ク ケ コ", "か き く け こ"),
    ("ga gi gu ge go", "ガ ギ グ ゲ ゴ", "が ぎ ぐ げ ご"),
    ("sa shi su se so", "サ シ ス セ ソ", "さ し す せ そ"),
    ("za ji zu ze zo", "ザ ジ ズ ゼ ゾ", "ざ じ ず ぜ ぞ"),
    ("ta chi tsu te to", "タ チ ツ テ ト", "た ち つ て と"),
    ("da ji zu de do", "ダ ヂ ヅ デ ド", "だ ぢ づ で ど"),
    ("na ni nu ne no", "ナ ニ ヌ ネ ノ", "な に ぬ ね の"),
    ("ha hi fu he ho", "ハ ヒ フ ヘ ホ", "は ひ ふ へ ほ"),
    ("ba bi bu be bo", "バ ビ ブ ベ ボ", "ば び ぶ べ ぼ"),
    ("pa pi pu pe po", "パ ピ プ ペ ポ", "ぱ ぴ ぷ ぺ ぽ"),
    ("ma mi mu me mo", "マ ミ ム メ モ", "ま み む め も"),
    ("ya - yu - yo", "ヤ - ユ - ヨ", "や - ゆ - よ"),
    ("ra ri ru re ro", "ラ リ ル レ ロ", "ら り る れ ろ"),
    ("wa - - - wo", "ワ - - - ヲ", "わ - - - を"),
    ("n", "ン", "ん"),
]
for rom, kata, hira in _rows:
    for r, k, h in zip(rom.split(), kata.split(), hira.split()):
        if r != "-":
            KANA[k] = r
            KANA[h] = r
_COMBO = {  # yoon: base kana + small ゃゅょ
    "キャ": "kya", "キュ": "kyu", "キョ": "kyo", "ギャ": "gya", "ギュ": "gyu", "ギョ": "gyo",
    "シャ": "sha", "シュ": "shu", "ショ": "sho", "ジャ": "ja", "ジュ": "ju", "ジョ": "jo",
    "チャ": "cha", "チュ": "chu", "チョ": "cho", "ヂャ": "ja", "ヂュ": "ju", "ヂョ": "jo",
    "ニャ": "nya", "ニュ": "nyu", "ニョ": "nyo", "ヒャ": "hya", "ヒュ": "hyu", "ヒョ": "hyo",
    "ビャ": "bya", "ビュ": "byu", "ビョ": "byo", "ピャ": "pya", "ピュ": "pyu", "ピョ": "pyo",
    "ミャ": "mya", "ミュ": "myu", "ミョ": "myo", "リャ": "rya", "リュ": "ryu", "リョ": "ryo",
    "きゃ": "kya", "きゅ": "kyu", "きょ": "kyo", "しゃ": "sha", "しゅ": "shu", "しょ": "sho",
    "じゃ": "ja", "じゅ": "ju", "じょ": "jo", "ちゃ": "cha", "ちゅ": "chu", "ちょ": "cho",
    "にゃ": "nya", "にゅ": "nyu", "にょ": "nyo", "ひゃ": "hya", "ひゅ": "hyu", "ひょ": "hyo",
    "みゃ": "mya", "みゅ": "myu", "みょ": "myo", "りゃ": "rya", "りゅ": "ryu", "りょ": "ryo",
}
KANJI_WORDS = {  # readings for kanji words in the frozen ja glossary
    "日本": ["nippon", "nihon"], "中国": ["chuugoku"], "韓国": ["kankoku"],
    "台湾": ["taiwan"], "香港": ["honkon"], "北朝鮮": ["kitachosen"],
    "英国": ["eikoku"], "民主共和国": ["minshukyowakoku"], "首長国連邦": ["shuchokokurenpo"],
    "共和国": ["kyowakoku"], "連邦": ["renpo"], "中央": ["chuo"], "赤道": ["sekido"],
    "諸島": ["shoto"], "北": ["kita"], "南": ["minami"], "東": ["higashi"], "国": ["koku"],
}
_KANJI_KEYS = sorted(KANJI_WORDS, key=len, reverse=True)
_VOWELS = "aiueo"


def romaji_of(name: str):
    """Hepburn romaji; returns a set (long-vowel and reading variants)."""
    outs = {""}
    i = 0
    while i < len(name):
        ch = name[i]
        hit = next((k for k in _KANJI_KEYS if name.startswith(k, i)), None)
        if hit:
            outs = {o + v for o in outs for v in KANJI_WORDS[hit]}
            i += len(hit)
            continue
        two = name[i:i + 2]
        if two in _COMBO:
            outs = {o + _COMBO[two] for o in outs}
            i += 2
            continue
        if ch in "ッっ":  # sokuon: double the next consonant (mark with *)
            outs = {o + "*" for o in outs}
            i += 1
            continue
        if ch == "ー":  # long vowel: emit both doubled and single forms
            new = set()
            for o in outs:
                last = next((c for c in reversed(o) if c in _VOWELS), "")
                new.add(o + last)
                new.add(o)
            outs = new
            i += 1
            continue
        if ch in "・":
            i += 1
            continue
        r = KANA.get(ch)
        if r is None:
            return set()  # unknown char — bail, native name still aliases
        outs = {o.replace("*", r[0]) + r if "*" in o else o + r for o in outs}
        i += 1
    return {o.replace("*", "") for o in outs if o}


# ------------------------------------------------------------- Korean RR
_RR_I = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"]
# Medial order is the Unicode composition order (U+1161 block), NOT the
# dictionary order: WA/WAE/OE come before YO, U at 13, I last at 20.
_RR_M = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo",
         "u", "wo", "we", "wi", "yu", "eu", "ui", "i"]
_RR_F = ["", "k", "k", "k", "n", "n", "n", "t", "l", "k", "m", "l", "l", "l", "p", "l",
         "m", "p", "p", "t", "t", "ng", "t", "t", "k", "t", "p", "t"]  # 28 finals


def rr_of(name: str) -> str:
    out = []
    for ch in name:
        c = ord(ch)
        if 0xAC00 <= c <= 0xD7A3:
            n = c - 0xAC00
            out.append(_RR_I[n // 588] + _RR_M[(n % 588) // 28] + _RR_F[n % 28])
        elif ch == " ":
            continue
        else:
            return ""
    return "".join(out)


# --------------------------------------------------------------- RTGS-lite
_TH_ONSET = {
    "ก": "k", "ข": "kh", "ค": "kh", "ฆ": "kh", "ง": "ng", "จ": "ch", "ฉ": "ch", "ช": "ch",
    "ซ": "s", "ฌ": "ch", "ญ": "y", "ฎ": "d", "ฏ": "t", "ฐ": "th", "ฑ": "th", "ฒ": "th",
    "ณ": "n", "ด": "d", "ต": "t", "ถ": "th", "ท": "th", "ธ": "th", "น": "n", "บ": "b",
    "ป": "p", "ผ": "ph", "ฝ": "f", "พ": "ph", "ฟ": "f", "ภ": "ph", "ม": "m", "ย": "y",
    "ร": "r", "ล": "l", "ว": "w", "ศ": "s", "ษ": "s", "ส": "s", "ห": "h", "ฬ": "l", "ฮ": "h",
}
_TH_CODA = {
    "ก": "k", "ข": "k", "ค": "k", "ฆ": "k", "ง": "ng", "จ": "t", "ฉ": "t", "ช": "t",
    "ซ": "t", "ฌ": "t", "ญ": "n", "ฎ": "t", "ฏ": "t", "ฐ": "t", "ฑ": "t", "ฒ": "t",
    "ณ": "n", "ด": "t", "ต": "t", "ถ": "t", "ท": "t", "ธ": "t", "น": "n", "บ": "p",
    "ป": "p", "ผ": "p", "ฝ": "p", "พ": "p", "ฟ": "p", "ภ": "p", "ม": "m", "ย": "i",
    "ร": "n", "ล": "n", "ว": "o", "ศ": "t", "ษ": "t", "ส": "t", "ฬ": "n", "อ": "ng",
}
_TH_PRE = {"เ": "e", "แ": "ae", "โ": "o", "ใ": "ai", "ไ": "ai"}
_TH_POST = {"า": "a", "ะ": "a", "ิ": "i", "ี": "i", "ึ": "ue", "ื": "ue",
            "ุ": "u", "ู": "u", "ั": "a", "็": "o", "ำ": "am"}
_TH_TONE = set("่้๊๋์")


def rtgs_of(name: str) -> str:
    s = [c for c in name if c not in _TH_TONE and c != " "]
    # drop silenced consonants (consonant + karan): rebuild without them
    cleaned = []
    j = 0
    while j < len(s):
        if j + 1 < len(s) and s[j + 1] == "์":
            j += 2
            continue
        cleaned.append(s[j])
        j += 1
    s = cleaned
    out = []
    i = 0
    n = len(s)
    while i < n:
        vowel = None
        if s[i] in _TH_PRE:
            vowel = _TH_PRE[s[i]]
            i += 1
            if i >= n:
                break
        # onset (allow two-letter clusters; a leading ห before
        # น ม ย ร ล ว is silent — ho nam — and the second consonant rules)
        onset = ""
        if s[i] == "อ":
            onset = ""
            i += 1
        elif s[i] in _TH_ONSET:
            if s[i] == "ห" and i + 1 < n and s[i + 1] in "นมยรลว":
                onset = _TH_ONSET[s[i + 1]]
                i += 2
            else:
                onset = _TH_ONSET[s[i]]
                i += 1
                if i < n and s[i] in "รลว" and onset and s[i - 1] not in "รลว":
                    onset += _TH_ONSET[s[i]]
                    i += 1
        else:
            return ""  # unknown char
        # vowel signs after onset
        vs = []
        while i < n and (s[i] in _TH_POST or s[i] == "ฤ"):
            vs.append(s[i])
            i += 1
        if vowel == "e" and i < n and s[i] == "อ":
            vowel = "oe"  # เ+อ diphthong (เยอรมนี -> yoeramani)
            i += 1
        elif vowel == "e" and vs and vs[0] == "า":
            vowel, vs = "ao", vs[1:]  # เกา diphthong
        elif vowel == "e" and vs and vs[0] == "ี":
            vowel, vs = "ia", vs[1:] if len(vs) > 1 else []
            # เ-ีย: following ย is part of the vowel
            if i < n and s[i] == "ย":
                i += 1
        elif vowel == "e" and vs and vs[0] == "ื":
            vowel = "uea"
            vs = vs[1:]
            if i < n and s[i] == "อ":
                i += 1
        elif vowel is None and vs:
            vowel = "".join(_TH_POST.get(v, "") for v in vs)
        elif vowel is not None and vs:
            vowel = vowel + "".join(_TH_POST.get(v, "") for v in vs)
        # ไ/ใ + onset + final ย spells the ai diphthong (ไทย = thai):
        # absorb the ย instead of reading it as a coda.
        if vowel == "ai" and i < n and s[i] == "ย":
            i += 1
        # coda: a consonant not followed by a vowel-start (อ only counts
        # as a coda once this syllable already has a vowel; otherwise it
        # is the next syllable's silent onset)
        coda = ""
        if i < n and s[i] in _TH_CODA and (s[i] != "อ" or vowel):
            nxt = s[i + 1] if i + 1 < n else None
            # A following POST vowel sign makes this consonant the next
            # onset; a following PRE vowel does not (it binds to the
            # consonant after it), so this consonant closes the syllable
            # (ฝรั่งเศส -> frangset).
            follows_vowel = nxt is not None and (nxt in _TH_POST or nxt == "ฤ")
            if not follows_vowel:
                coda = _TH_CODA[s[i]]
                i += 1
        if vowel is None and i < n and s[i] == "อ":
            vowel = "o"  # อ as the vowel carrier (นอน -> non)
            i += 1
            if i < n and s[i] in _TH_CODA:
                nxt = s[i + 1] if i + 1 < n else None
                if nxt is None or (nxt not in _TH_POST and nxt not in _TH_PRE):
                    coda = _TH_CODA[s[i]]
                    i += 1
        if vowel is None:
            # A lone trailing onset with no vowel material after a closed
            # syllable is a silent trailer (จักร -> chak, not chakra).
            if not vs and not coda and i >= n and out:
                break
            vowel = "o" if coda else "a"
        out.append(onset + vowel + coda)
    return "".join(out)


# Hand-checked RTGS for head countries where the mechanical pass is off
# (checked against standard RTGS references 2026-11-14).
RTGS_OVERRIDES = {}

# Common short forms / exonyms people actually type.
EXTRA = {
    "US": ["usa", "america"], "GB": ["uk", "britain", "greatbritain", "england"],
    "AE": ["uae", "emirates"], "KR": ["korea"], "CZ": ["czechrepublic"],
    "TR": ["turkey"], "SZ": ["swaziland"], "MK": ["macedonia"],
    "CI": ["ivorycoast", "cotedivoire"], "CV": ["caboverde"], "TL": ["easttimor"],
    "VA": ["vatican"], "PS": ["palestine"], "FM": ["micronesia"],
    "CD": ["drc", "congodrc"], "ST": ["saotome"], "GM": ["gambia"], "BS": ["bahamas"],
    "XK": ["kosova"],
}


def main():
    glossary = json.load(open(os.path.join(ROOT, "src/i18n/glossary.json")))
    site_data = json.load(open(os.path.join(ROOT, "src/data/site-data.json")))
    wc_path = "/tmp/world-countries.json"
    if not os.path.exists(wc_path):
        urllib.request.urlretrieve(
            "https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json", wc_path)
    world = json.load(open(wc_path))
    iso3 = {w["cca2"]: (w.get("cca3") or "").lower() for w in world if w.get("cca2")}

    out = {}
    for c in site_data["countries"]:
        code = c["code"]
        toks = set()
        toks.add(c["name"])
        for loc in ("zh-hans", "zh-hant", "ja", "ko", "th", "en"):
            nm = (glossary.get(loc, {}).get("countries") or {}).get(code)
            if nm:
                toks.add(nm)
        toks.add(code)
        if iso3.get(code):
            toks.add(iso3[code])
        zh = (glossary.get("zh-hans", {}).get("countries") or {}).get(code)
        zht = (glossary.get("zh-hant", {}).get("countries") or {}).get(code)
        for nm in {zh, zht} - {None}:
            toks.add(pinyin_of(nm))
        ja = (glossary.get("ja", {}).get("countries") or {}).get(code)
        if ja:
            toks |= romaji_of(ja)
        ko = (glossary.get("ko", {}).get("countries") or {}).get(code)
        if ko:
            r = rr_of(ko)
            if r:
                toks.add(r)
        th = (glossary.get("th", {}).get("countries") or {}).get(code)
        if th:
            r = RTGS_OVERRIDES.get(code) or rtgs_of(th)
            if r:
                toks.add(r)
        toks |= set(EXTRA.get(code, []))
        normed = sorted({norm(t) for t in toks if norm(t)})
        out[code] = "|".join(normed)
    dest = os.path.join(ROOT, "src/data/country-aliases.json")
    with open(dest, "w") as f:
        json.dump(out, f, ensure_ascii=False, indent=0)
    print(f"aliases: {len(out)} countries -> {dest}")
    for code in ("JP", "CN", "KR", "TH", "US", "GB"):
        print(code, out[code])


if __name__ == "__main__":
    sys.exit(main())
