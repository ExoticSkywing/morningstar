#!/usr/bin/env python3
"""Localize mirrored Morningstar Ventures HTML to Simplified Chinese.

Visible prose, interface copy, SEO descriptions, form states and accessibility
labels are translated. Brand, project names and industry terms remain in English.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import html as html_lib
import json
import re
import threading
import time
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

from lxml import html
from mirror import process_html

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
CACHE_FILE = ROOT / "RECON" / "zh-translation-cache.json"
REPORT_FILE = ROOT / "RECON" / "zh-localization-report.json"
PROTECTED_MANIFEST_FILE = ROOT / "RECON" / "zh-protected-source-manifest.json"

TRANSLATE_ATTRS = {"title", "placeholder", "aria-label", "alt"}
SKIP_TAGS = {"script", "style", "noscript", "svg", "code", "pre"}

# Exact UI strings get authored translations instead of machine wording.
EXACT = {
    "Morningstar Ventures - Backing Ambitious Founders": "Morningstar Ventures｜支持雄心勃勃的创始人",
    "Backing Ambitious Ideas": "支持雄心勃勃的构想",
    "Backing ambitious founders.": "支持雄心勃勃的创始人。",
    "We are a proprietary investment firm specializing in digital assets and blockchain technology.": "我们是一家专注于数字资产与区块链技术的自营投资机构。",
    "Home": "首页", "Portfolio": "投资组合", "Products": "产品", "Our Team": "我们的团队",
    "Mission": "使命", "Register for updates": "订阅动态", "Learn More": "了解更多",
    "Discover More": "了解更多", "Investment Announcement": "投资公告",
    "Investment Date": "投资日期", "Our Initiative": "我们的行动", "No items found.": "未找到任何项目。",
    "scroll": "滚动", "to explore": "继续探索", "back to": "返回", "top ^": "顶部 ^",
    "Start Exploring": "开始探索", "More": "更多", "Filters": "筛选", "Reset": "重置",
    "List": "列表", "Acquired": "已收购", "Live": "已上线", "Beta": "测试版",
    "Intro": "介绍", "About Us": "关于我们", "Projects": "项目", "Events": "活动",
    "Careers": "招聘", "Newsletter": "通讯", "Our Portfolio": "我们的投资组合",
    "Our Projects": "我们的项目", "Our Mission": "我们的使命", "Our Events": "我们的活动",
    "Join our Events": "参加我们的活动", "Explore Careers": "查看招聘机会",
    "Subscribe to our Newsletter": "订阅我们的通讯", "Load More": "加载更多",
    "Search": "搜索", "search": "搜索", "Next Page": "下一页", "Previous Page": "上一页",
    "Previous": "上一页", "Sign Up": "订阅", "Enter your email...": "请输入邮箱…",
    "Thank you! Your submission has been received!": "提交成功，感谢你的订阅。",
    "Error. Try again please!": "提交失败，请重试。",
    "Oops! Something went wrong while submitting the form.": "提交失败，请检查后重试。",
    "arrow": "箭头", "reset icon": "重置图标", "logo": "品牌标志",
    "twitter icon": "Twitter 图标", "telegram icon": "Telegram 图标",
    "linkedin icon": "LinkedIn 图标", "medium icon": "Medium 图标",
    "morningstar ventures": "Morningstar Ventures", "section": "章节",
    "Infrastructure": "基础设施", "Gaming": "游戏", "Guild": "公会",
    "Metaverse": "元宇宙", "BTC Ecosystem": "BTC 生态", "Launchpad": "Launchpad",
    "Community / Media": "社区 / 媒体", "Content & Media": "内容与媒体",
    "Equity": "Equity", "Tokens / Equity": "Token / Equity", "Wallet": "钱包",
    "Private Round": "私募轮", "Seed Round": "种子轮", "Strategic Round": "战略轮",
    "Series A Round": "A 轮", "Venture Round": "风险投资轮", "Funding Round": "融资轮",
    "Strategic Investment": "战略投资", "OK": "确认", "Please wait...": "请稍候…",
    "Pre-Seed Round": "Pre-Seed 轮", "$5M Funding Round": "500 万美元融资轮",
    "Seed & Private Round": "Seed 与 Private 轮", "Founder & CEO": "创始人兼 CEO",
    "Technical Advisor": "技术顾问", "Project Review - Chainflip": "项目回顾：Chainflip",
    "Project Review - Ringfence": "项目回顾：Ringfence",
    "Roundtable": "圆桌会议", "Roundable": "圆桌会议", "Project Review": "项目回顾", "Founder Stories": "创始人故事",
    "EGLD Interview": "EGLD 专访", "EGLD Podcast - Interview": "EGLD 播客专访", "Interview": "专访",
    "Co-founder": "联合创始人", "Co-Founder": "联合创始人", "co-Founder": "联合创始人",
    "Co-founders": "联合创始人", "Founder": "创始人", "founder": "创始人", "CEO": "CEO", "COO": "COO",
    "Chairman": "主席", "Executive Producer": "执行制片人", "VP of Operations": "运营副总裁", "VP Operation": "运营副总裁",
    "portfolio": "投资组合", "products": "产品", "team": "团队", "reform": "改革", "sign up": "订阅",
    "sec1": "sec1", "s": "s",
}

# Longer exact strings that need editorial translations instead of raw MT.
EDITORIAL: dict[str, str] = {
    "37x is a premier destination in the heart of Dubai, bringing together Web3 founders, investors, and creators.": "37x 是迪拜市中心的 Web3 地标空间，汇聚创始人、投资者与创作者。",
    "MSV GG is an invite-only community of web3 specialists supporting and investing in early-stage projects.": "MSV GG 是一个邀请制 Web3 专家社区，致力于支持并投资早期项目。",
    "MSV STUDIO is a dedicated in-house development, design, strategy, and marketing arm run and operated by Morningstar Ventures.": "MSV STUDIO 是由 Morningstar Ventures 运营的内部开发、设计、战略与营销团队。",
    "Crypto Atlas is a discovery hub to stay up to date and explore insights on a variety of interesting crypto projects.": "Crypto Atlas 是一个加密项目发现平台，帮助你掌握最新动态并探索项目洞察。",
    "Coin Explorers is a platform delivering up-to-date news and insights on the latest crypto projects.": "Coin Explorers 提供最新加密项目的新闻与洞察。",
    "The Morningstar Ventures team is global but primarily based in Dubai. Under the leadership of Founder & CEO Danilo S. Carlucci, our team consists of seasoned professionals who bring years of experience across various fields, such as technology, marketing, growth strategy, design, UI/UX, and more.": "Morningstar Ventures 团队遍布全球，主要位于迪拜。在创始人兼 CEO Danilo S. Carlucci 的带领下，团队汇集了来自技术、营销、增长战略、设计与 UI/UX 等领域的资深专业人士。",
    "We are not only investors, but also builders, having established multiple affiliate projects since our inception, such as our Web3 space and HQ 37xDubai, our consultancy MSV Studio, our software platform Atlas Technologies, and our guild MSV GG.": "我们不仅投资，也亲自建设。自成立以来，我们已推出多个关联项目，包括 Web3 空间与总部 37xDubai、咨询团队 MSV Studio、软件平台 Atlas Technologies，以及社区 MSV GG。",
    "We regularly organize events focused on Web3 technology to bring together crypto enthusiasts, investors, and builders. Our location, 37xDubai, is an exclusive and creative venue in the heart of Dubai. Check our calendar and sign up for upcoming events.": "我们定期举办 Web3 技术活动，让加密爱好者、投资者与建设者相聚。37xDubai 是位于迪拜市中心的独特创意空间。查看活动日历并报名参加即将举行的活动。",
    "We are a young, dynamic and entrepreneurial team spread across 10+ countries. Focused on crypto and blockchain projects, we are growing fast and constantly looking for new talents!": "我们是一支年轻、充满活力、富有创业精神的团队，遍布 10 多个国家。专注于加密和区块链项目，我们正在快速成长并不断寻找新的人才！",
}

# These are products, technologies, formats or brands. Preserve them wherever
# they occur inside translated prose.
PROTECTED_TERMS = [
    "Morningstar Ventures", "Danilo S. Carlucci", "37xDubai", "MSV Studio", "MSV GG",
    "Atlas Technologies", "Web3", "web3", "Web2", "web2", "DeFi", "Defi", "AI", "NFTs", "NFT",
    "BTC", "SocialFi", "dApp", "dApps", "Token", "Tokens", "RWA", "DePIN", "dePin", "GameFi",
    "DAO", "subDAO", "DEX", "AMM", "API", "APIs", "EVM", "CDP", "LLAMMA", "USD", "L1", "L2",
    "Layer 1", "Layer 2", "Ethereum", "Bitcoin", "Solana", "Polygon", "Immutable X", "MultiversX",
    "Elrond", "Arbitrum", "EigenLayer", "MiCA", "SVM", "HyperGrid", "XR", "MMORPG", "MMO",
    "Play-to-Earn", "Play-To-Earn", "play-to-earn", "Play to Own", "UI/UX", "CEO", "COO", "VP",
    "Medium", "YouTube", "EGLD", "GLB", "SVG", "PNG", "Twitter", "Telegram", "LinkedIn", "AIT Protocol", "021 GG", "gudchain", "cEthGas",
    "UNKJD", "unkjd", "indiGG", "beoble", "y8u", "zkLink", "Jambo", "jambo", "Blast Royale",
    "Bware Labs", "Cantina Royale", "DeFi Money", "Domi Online", "E Money Network", "Ethernal Labs",
    "Exotic Market", "Fare Protocol", "Fusionist", "Gull Network", "Gunzilla Games", "Highstreet Market",
    "Human Protocol", "Humans AI", "Itheum", "KIP Protocol", "Merkle Trade", "Moove Protocol",
    "Movement Labs", "Mystiko Network", "Nyan Heroes", "Ola Guild Games", "Omni Network", "OP Games",
    "Particle Network", "Pontem Network", "Primex Finance", "Roy Kombucha", "Solana SIM", "Sonic",
    "Swing Finance", "Taker Protocol", "Tap Protocol", "The Defiant", "Unstoppable Domains",
    "XLD Finance", "XY Finance", "Yield Guild Games", "Cross The Ages", "Biconomy", "bitsCrunch",
]

# English month names are replaced locally to avoid translating project names
# that happen to contain common English words.
MONTHS = {
    "Jan": "1月", "Feb": "2月", "Mar": "3月", "Apr": "4月", "May": "5月", "Jun": "6月",
    "Jul": "7月", "Aug": "8月", "Sep": "9月", "Oct": "10月", "Nov": "11月", "Dec": "12月",
}
DATE_RE = re.compile(r"\b(" + "|".join(MONTHS) + r")\s+(\d{1,2}),\s+(\d{4})\b")

# Short proper names and technical labels should not be sent to generic MT.
PRESERVE_EXACT = {
    "Morningstar Ventures", "DeFi", "AI", "NFT", "RWA", "SocialFi", "dePin", "SVG", "PNG",
    "Web3", "Token", "Tokens", "BTC", "GameFi", "Launchpad", "Twitter", "Telegram", "LinkedIn",
    "Medium", "YouTube", "Beta", "EGLD", "Persistence", "Olive", "Structure", "Inspect",
}

lock = threading.Lock()


def normalize(value: str) -> str:
    return " ".join(value.split())


def looks_translatable(text: str) -> bool:
    t = normalize(text)
    if not t or not re.search(r"[A-Za-z]", t):
        return False
    if t in PRESERVE_EXACT:
        return False
    if re.fullmatch(r"[A-Z0-9$._/+&-]{1,16}", t):
        return False
    if re.fullmatch(r"https?://\S+|\S+@\S+|#[\w-]+", t):
        return False
    # Long prose and phrases are translatable. One-to-three-word capitalized
    # labels default to proper names unless explicitly authored in EXACT.
    words = re.findall(r"[A-Za-z][A-Za-z'’.-]*", t)
    if len(words) <= 3 and not re.search(r"[.!?:]", t):
        if all(w[:1].isupper() or w.isupper() for w in words):
            return False
    return True


def load_protected_terms() -> list[str]:
    terms = set(PROTECTED_TERMS)
    if PROTECTED_MANIFEST_FILE.exists():
        manifest = json.loads(PROTECTED_MANIFEST_FILE.read_text(encoding="utf-8"))
        for key in ("projects", "card_names", "people", "products", "terms"):
            terms.update(manifest.get(key, []))
    return sorted((term for term in terms if term), key=len, reverse=True)


def protect_terms(text: str) -> tuple[str, dict[str, str]]:
    result = text
    tokens: dict[str, str] = {}
    for term in load_protected_terms():
        if term not in result:
            continue
        token = f"ZXQ{len(tokens):03d}QXZ"
        result = result.replace(term, token)
        tokens[token] = term
    return result, tokens


def restore_terms(text: str, tokens: dict[str, str]) -> str:
    result = text
    for token, term in tokens.items():
        # Google may add spaces around synthetic tokens.
        pattern = r"\s*" + re.escape(token) + r"\s*"
        result = re.sub(pattern, term, result)
    return result


def translate_remote(text: str) -> str:
    protected, tokens = protect_terms(text)
    query = urllib.parse.urlencode({
        "client": "gtx", "sl": "en", "tl": "zh-CN", "dt": "t", "q": protected,
    })
    url = "https://translate.googleapis.com/translate_a/single?" + query
    last_error: Exception | None = None
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=25) as response:
                payload = json.loads(response.read())
            translated = "".join(part[0] for part in payload[0] if part and part[0])
            return restore_terms(translated, tokens).strip()
        except Exception as exc:
            last_error = exc
            time.sleep(0.8 * (2 ** attempt))
    raise RuntimeError(f"translation failed: {text[:80]}: {last_error}")


def load_cache() -> dict[str, str]:
    if CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    return {}


def save_cache(cache: dict[str, str]) -> None:
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def translate_role(role: str) -> str:
    out = normalize(role)
    replacements = {
        "Co-founder & CEO": "联合创始人兼 CEO", "Co-Founder & CEO": "联合创始人兼 CEO",
        "Co-founder": "联合创始人", "Co-Founder": "联合创始人", "co-Founder": "联合创始人",
        "Co-founders": "联合创始人", "Founder": "创始人", "founder": "创始人",
        "CEO": "CEO", "COO": "COO", "Chairman": "主席", "Executive Producer": "执行制片人",
        "VP of Operations": "运营副总裁", "VP Operation": "运营副总裁",
    }
    for source, target in sorted(replacements.items(), key=lambda item: len(item[0]), reverse=True):
        out = out.replace(source, target)
    return out


def authored_translation(text: str) -> str | None:
    t = normalize(text)
    if t in EDITORIAL:
        return EDITORIAL[t]
    if t in EXACT:
        return EXACT[t]
    protected = load_protected_terms()
    project_review = re.fullmatch(r"Project Review\s*[-:]\s*(.+)", t)
    if project_review and project_review.group(1) in protected:
        return f"项目回顾：{project_review.group(1)}"
    founder_story = re.fullmatch(r"Founder Stories:\s*([^()]+)\s*\(([^)]+)\)", t)
    if founder_story and founder_story.group(1).strip() in protected:
        return f"创始人故事：{founder_story.group(1).strip()}（{translate_role(founder_story.group(2))}）"
    interview = re.fullmatch(r"(?:(EGLD Interview|Interview):)\s*([^()]+)\s*\(([^)]+)\)", t)
    if interview and interview.group(2).strip() in protected:
        prefix = "EGLD 专访" if interview.group(1) == "EGLD Interview" else "专访"
        return f"{prefix}：{interview.group(2).strip()}（{translate_role(interview.group(3))}）"
    m = DATE_RE.fullmatch(t)
    if m:
        return f"{m.group(3)}年{MONTHS[m.group(1)]}{m.group(2)}日"
    # Numbered navigation preserves numeric orientation.
    m = re.fullmatch(r"(\d{2})\s+(.+)", t)
    if m and m.group(2) in EXACT:
        return f"{m.group(1)} {EXACT[m.group(2)]}"
    return None


def collect_strings(files: list[Path], source_root: Path | None = None, site_root: Path | None = None) -> Counter[str]:
    strings: Counter[str] = Counter()
    for path in files:
        raw = path.read_bytes()
        if source_root is not None and site_root is not None:
            source = source_root / path.relative_to(site_root)
            if source.exists():
                raw = source.read_bytes()
        doc = html.document_fromstring(raw)
        for el in doc.iter():
            if not isinstance(el.tag, str) or el.tag.lower() in SKIP_TAGS:
                continue
            if el.text and re.search(r"[A-Za-z]", el.text):
                strings[normalize(el.text)] += 1
            if el.tail and re.search(r"[A-Za-z]", el.tail):
                strings[normalize(el.tail)] += 1
            for attr in TRANSLATE_ATTRS:
                value = el.get(attr)
                if value and re.search(r"[A-Za-z]", value):
                    strings[normalize(value)] += 1
            if el.tag.lower() == "meta":
                value = el.get("content", "")
                key = (el.get("name") or el.get("property") or "").lower()
                if value and re.search(r"[A-Za-z]", value) and any(x in key for x in ("description", "title")):
                    strings[normalize(value)] += 1
            if el.tag.lower() == "input" and el.get("type", "").lower() in {"submit", "button"}:
                value = el.get("value", "")
                if value and re.search(r"[A-Za-z]", value):
                    strings[normalize(value)] += 1
    return strings


def build_translations(strings: Counter[str], cache: dict[str, str], workers: int) -> tuple[dict[str, str], list[str]]:
    translations: dict[str, str] = {}
    remote: list[str] = []
    preserved: list[str] = []
    for text in strings:
        authored = authored_translation(text)
        if authored is not None:
            translations[text] = authored
        elif text in cache:
            translations[text] = cache[text]
        elif looks_translatable(text):
            remote.append(text)
        else:
            preserved.append(text)

    def task(text: str) -> tuple[str, str]:
        return text, translate_remote(text)

    if remote:
        with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
            for index, (source, target) in enumerate(pool.map(task, remote), 1):
                translations[source] = target
                with lock:
                    cache[source] = target
                    if index % 20 == 0:
                        save_cache(cache)
                print(f"translated {index:04d}/{len(remote):04d} {source[:54]} -> {target[:54]}")
        save_cache(cache)
    return translations, preserved


def normalize_terms(value: str) -> str:
    replacements = {
        "web3": "Web3", "web2": "Web2", "Defi": "DeFi", "dePin": "DePIN", "DApp": "dApp",
        "APIs": "API", "NFTs": "NFT", "Web3Gaming": "Web3 Gaming", "Web3APIs": "Web3 API",
    "GenerativeAI": "Generative AI", "Play to Ownweb3": "Play to Own Web3", "EGLD播客": "EGLD 播客",
    "VP操作": "运营副总裁", "Roundable": "圆桌会议", "DePin": "DePIN", "Market": "市场",
    "Web3在": "Web3 在", "Web3为": "Web3 为", "Web3游戏": "Web3 游戏", "Web3技术": "Web3 技术",
    "NFTs": "NFT", "NFT游戏": "NFT 游戏", "NFT市场": "NFT 市场", "AI在": "AI 在", "AI和": "AI 与",
    "dApp用户": "dApp 用户", "DAO的": "DAO 的", "Web3空间": "Web3 空间",
        }
    out = value
    for source, target in replacements.items():
        if source in {"Web3在", "Web3为", "Web3游戏", "Web3技术", "NFT游戏", "NFT市场", "AI在", "AI和", "dApp用户", "DAO的", "Web3空间", "Play to Ownweb3", "EGLD播客", "VP操作"}:
            out = out.replace(source, target)
        else:
            out = re.sub(rf"(?<![A-Za-z0-9]){re.escape(source)}(?![A-Za-z0-9])", target, out)
    return out


def apply_translation(value: str, translations: dict[str, str]) -> str:
    leading = value[: len(value) - len(value.lstrip())]
    trailing = value[len(value.rstrip()):]
    normalized = normalize(value)
    if normalized in translations:
        return leading + normalize_terms(translations[normalized]) + trailing
    # Convert standalone dates in mixed initiative titles while preserving names.
    return normalize_terms(DATE_RE.sub(lambda m: f"{m.group(3)}年{MONTHS[m.group(1)]}{m.group(2)}日", value))


def localize_html(raw: bytes, translations: dict[str, str]) -> tuple[str, int]:
    doc = html.document_fromstring(raw)
    changes = 0
    doc.set("lang", "zh-CN")
    for el in doc.xpath("//*[contains(concat(' ',normalize-space(@class),' '),' prin_h1 ')]/strong[normalize-space(.)='s']"):
        el.drop_tree()
        changes += 1
    for el in doc.iter():
        if not isinstance(el.tag, str) or el.tag.lower() in SKIP_TAGS:
            continue
        if el.text and re.search(r"[A-Za-z]", el.text):
            new = apply_translation(el.text, translations)
            if new != el.text:
                el.text = new; changes += 1
        if el.tail and re.search(r"[A-Za-z]", el.tail):
            new = apply_translation(el.tail, translations)
            if new != el.tail:
                el.tail = new; changes += 1
        for attr in TRANSLATE_ATTRS:
            value = el.get(attr)
            if value and re.search(r"[A-Za-z]", value):
                if attr == "data-wait" and value == "Please wait...":
                    el.set(attr, "请稍候…"); changes += 1
                    continue
                new = apply_translation(value, translations)
                if new != value:
                    el.set(attr, new); changes += 1
        data_wait = el.get("data-wait")
        if data_wait and re.search(r"[A-Za-z]", data_wait):
            new = "请稍候…" if data_wait == "Please wait..." else apply_translation(data_wait, translations)
            if new != data_wait:
                el.set("data-wait", new); changes += 1
        if el.tag.lower() == "meta":
            value = el.get("content", "")
            key = (el.get("name") or el.get("property") or "").lower()
            if value and re.search(r"[A-Za-z]", value) and any(x in key for x in ("description", "title")):
                new = apply_translation(value, translations)
                if new != value:
                    el.set("content", new); changes += 1
        if el.tag.lower() == "input" and el.get("type", "").lower() in {"submit", "button"}:
            value = el.get("value", "")
            if value and re.search(r"[A-Za-z]", value):
                new = apply_translation(value, translations)
                if new != value:
                    el.set("value", new); changes += 1
    rendered = html.tostring(doc, encoding="unicode", method="html", doctype="<!DOCTYPE html>")
    if not isinstance(rendered, str):
        rendered = rendered.decode("utf-8")
    return rendered, changes


def write_chinese_runtime_css() -> None:
    css = r"""
/* Chinese localization typography and the editorial Hero layer. */
:lang(zh-CN) body {
  font-family: "Simplon", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
}
:lang(zh-CN) .hero_h1,
:lang(zh-CN) .body_heading,
:lang(zh-CN) .cta_heading,
:lang(zh-CN) .btn_txt,
:lang(zh-CN) .hero_text--wrap,
:lang(zh-CN) .nav_content,
:lang(zh-CN) .w-form-done,
:lang(zh-CN) .w-form-fail {
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
}
:lang(zh-CN) .body_heading,
:lang(zh-CN) .cta_heading {
  line-height: 1.22;
}
:lang(zh-CN) .hero_h1 {
  max-width: 12em;
  text-wrap: balance;
  white-space: normal;
  word-break: keep-all;
  overflow-wrap: normal;
}
:lang(zh-CN) .hero_text--wrap {
  position: relative;
  z-index: 3;
}
:lang(zh-CN) .hero_poem_wrap {
  position: relative;
  z-index: 2;
  margin-top: 1.1rem;
  overflow: visible;
}
:lang(zh-CN) .hero_poem {
  position: relative;
  isolation: isolate;
  max-width: 26rem;
  margin: 0 auto;
  padding: .3rem .8rem;
  color: rgba(255,255,255,.88);
  font-family: "Punta", "Punta Light", "Iowan Old Style", "Baskerville", Georgia, serif;
  font-size: clamp(.95rem, 1.25vw, 1.3rem);
  font-weight: 300;
  font-style: italic;
  line-height: 1.2;
  letter-spacing: .04em;
  text-align: center;
  text-wrap: balance;
  text-shadow: 0 .15em 1.25em rgba(117,148,255,.34);
}
:lang(zh-CN) .hero_poem::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(5,8,18,.58) 0%, rgba(5,8,18,.24) 58%, transparent 84%);
}
:lang(zh-CN) .hero_poem::after {
  content: "“  ”";
  position: absolute;
  inset: -.2em 0;
  z-index: -1;
  color: rgba(119,161,255,.78);
  font-family: Georgia, serif;
  font-size: 1.35em;
  font-style: normal;
  line-height: 1;
  pointer-events: none;
}
@media (max-width: 479px) {
  :lang(zh-CN) .hero_h1 {
    font-size: 2rem;
    line-height: 1.16;
    max-width: 100%;
  }
  :lang(zh-CN) .hero_poem {
    max-width: 19rem;
    font-size: .92rem;
    letter-spacing: .02em;
  }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
"""
    (SITE / "clone-runtime.css").write_text(css, encoding="utf-8")


def remaining_english(files: list[Path]) -> Counter[str]:
    return collect_strings(files)


def translation_sources(source_root: Path, site_root: Path, files: list[Path]) -> list[Path]:
    sources: list[Path] = []
    for page in files:
        relative = page.relative_to(site_root)
        if relative == Path("index.html"):
            source = source_root / "home.html"
        elif relative.parts[0] == "portfolio":
            source = source_root / f"portfolio__{relative.parts[1]}.html"
        elif relative.parts[0] == "products":
            source = source_root / f"products__{relative.parts[1]}.html"
        elif relative.parts[0] == "_queries":
            source = source_root / "home.html"
        elif relative == Path("brand/index.html"):
            source = source_root / "brand.html"
        elif relative == Path("test/index.html"):
            source = source_root / "test.html"
        else:
            source = page
        sources.append(source if source.exists() else page)
    return sources


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--site", type=Path, default=SITE)
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    files = sorted(args.site.rglob("*.html"))
    print(f"HTML files: {len(files)}")
    source_root = ROOT / "RECON" / "source-html"
    source_files = translation_sources(source_root, args.site, files)
    strings = collect_strings(source_files)
    cache = load_cache()
    translations, preserved = build_translations(strings, cache, args.workers)
    if args.dry_run:
        print(json.dumps({"unique_strings": len(strings), "translated": len(translations), "preserved": len(preserved)}, ensure_ascii=False, indent=2))
        return 0
    total_changes = 0
    for path, source in zip(files, source_files):
        relative = path.relative_to(args.site)
        raw_source = source.read_text(encoding="utf-8", errors="replace")
        runtime_ready, _ = process_html(raw_source)
        rendered, changes = localize_html(runtime_ready.encode("utf-8"), translations)
        if "/clone-runtime.css" not in rendered:
            rendered = re.sub(r"</head\s*>", '<link rel="stylesheet" href="/clone-runtime.css">\n</head>', rendered, count=1, flags=re.I)
        path.write_text(rendered, encoding="utf-8")
        total_changes += changes
        print(f"localized {relative} changes={changes}")
    write_chinese_runtime_css()
    remaining = remaining_english(files)
    report = {
        "html_files": len(files),
        "source_unique_strings": len(strings),
        "translated_unique_strings": len(translations),
        "preserved_unique_strings": len(preserved),
        "dom_changes": total_changes,
        "cache_entries": len(cache),
        "preserved_samples": preserved[:300],
        "remaining_english_top": [
            {"text": text, "count": count} for text, count in remaining.most_common(500)
        ],
        "digest": hashlib.sha256("\n".join(sorted(translations)).encode()).hexdigest(),
    }
    REPORT_FILE.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: report[k] for k in ("html_files", "translated_unique_strings", "preserved_unique_strings", "dom_changes", "cache_entries")}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
