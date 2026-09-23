#!/usr/bin/env python3
"""Apply Morningstar's homepage editorial direction without touching route content."""
from __future__ import annotations

from pathlib import Path
from lxml import html

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "site" / "index.html"
QUOTE = "I am not the same, having seen the moon shine on the other side of the world"


def one(doc, xpath: str):
    nodes = doc.xpath(xpath)
    if not nodes:
        raise RuntimeError(f"Missing homepage node: {xpath}")
    return nodes[0]


def set_text(doc, xpath: str, value: str) -> None:
    node = one(doc, xpath)
    node.text = value
    for child in list(node):
        node.remove(child)


def set_hero_title(doc) -> None:
    node = one(doc, '//section[@id="hero"]//h1[contains(@class,"hero_h1")]')
    node.text = "世界不是你眼中的世界，"
    for child in list(node):
        node.remove(child)
    br = html.Element("br")
    br.set("aria-hidden", "true")
    node.append(br)
    br.tail = "生活也不止你眼前的生活"


def main() -> int:
    doc = html.document_fromstring(PAGE.read_bytes())
    doc.set("lang", "zh-CN")

    # Hero: the Chinese slogan remains the first focal point. The English line
    # is a separate editorial layer so the original CTA/scroll contract stays.
    # Chinese headline is intentionally locked as a complete thought on small
    # screens; the poetic English subtitle owns the expressive line breaks.
    set_hero_title(doc)
    hero_wrap = one(doc, '//section[@id="hero"]//*[contains(concat(" ",normalize-space(@class)," ")," hero_text--wrap ")]')
    # Rebuild this editorial layer idempotently. Only remove the direct poem
    # wrapper; keep the neighboring overflow-hidden node for Token / Equity.
    for wrapper in hero_wrap.xpath('./div[contains(concat(" ",normalize-space(@class)," ")," hero_poem_wrap ")]'):
        hero_wrap.remove(wrapper)
    old_overflow = one(hero_wrap, './div[contains(concat(" ",normalize-space(@class)," ")," overflow-hidden ")]')
    poem_wrap = html.Element("div", {"class": "hero_poem_wrap overflow-hidden"})
    poem = html.Element("p", {
        "class": "hero_poem",
        "aria-label": QUOTE,
        "role": "doc-subtitle",
    })
    poem.text = "I am not the same,"
    br1 = html.Element("br")
    poem.append(br1)
    br1.tail = "having seen the moon shine"
    br2 = html.Element("br")
    poem.append(br2)
    br2.tail = "on the other side of the world"
    poem_wrap.append(poem)
    old_overflow.addprevious(poem_wrap)

    # Narrative arc: keep real project names and existing links, rewrite only
    # the editorial layer around the new point of view.
    set_text(doc, '//section[@id="about"]//h2[contains(@class,"body_heading")]',
             "换一个角度，世界会显露另一种光。我们寻找尚未被看见的可能，也陪伴它们抵达更远的地方。")
    set_text(doc, '//section[@id="about"]//a[contains(@class,"btn_wrap")]//div[contains(@class,"btn_txt")]',
             "探索星群")
    set_text(doc, '//section[@id="portfolio"]//h3[contains(@class,"body_heading")]',
             "每一颗星，都在改写远方")
    set_text(doc, '//section[@id="projects"]//h3[contains(@class,"body_heading")]',
             "让想象先抵达")

    product_copy = [
        "37xDubai 把陌生的灵感带到同一张桌边：Web3 创始人、投资者与创作者，在迪拜的星光里交换下一种可能。",
        "MSV GG 聚集那些仍在远方寻找答案的人，以一份邀请，连接 Web3 专家、早期项目与愿意同行的目光。",
        "MSV STUDIO 让想法拥有被看见的形状：从开发、设计到战略与营销，与 Morningstar Ventures 一起把想象推向现实。",
        "Crypto Atlas 是一张不断展开的加密星图，带你穿过噪声，找到值得继续凝视的项目与洞察。",
        "Coin Explorers 记录最新加密项目的潮汐，让每一次发现都成为下一次出发的坐标。",
    ]
    product_nodes = doc.xpath('//section[@id="projects"]//*[contains(concat(" ",normalize-space(@class)," ")," prod_sdesc ")]')
    if len(product_nodes) != len(product_copy):
        raise RuntimeError(f"Expected {len(product_copy)} project descriptions, found {len(product_nodes)}")
    for node, value in zip(product_nodes, product_copy):
        node.text = value

    set_text(doc, '//section[@id="mission"]//h3[contains(@class,"body_heading")]',
             "让未见之境成为日常")
    mission_copy = [
        "世界不会因为被定义而停止生长。Morningstar Ventures 由来自世界各地的伙伴组成，在 Danilo S. Carlucci 的带领下，把技术、增长、设计与 UI/UX 的经验，织成一张通往未来的网。",
        "我们既投资，也亲自建设。37xDubai、MSV Studio、Atlas Technologies 与 MSV GG，是我们把远方带回当下的方式：让一个念头拥有空间、工具、伙伴与时间，慢慢长成真实。",
    ]
    mission_nodes = doc.xpath('//section[@id="mission"]//p[contains(@class,"paragraph")]')
    if len(mission_nodes) < 2:
        raise RuntimeError("Missing mission paragraphs")
    for node, value in zip(mission_nodes[:2], mission_copy):
        node.text = value

    set_text(doc, '//section[@id="events"]//h3[contains(@class,"body_heading")]',
             "在星光交汇处相遇")
    set_text(doc, '//section[@id="events"]//p[contains(@class,"paragraph")]',
             "有些新世界，只会在相遇之后出现。我们在 37xDubai 让 Web3 的热望彼此看见，让加密爱好者、投资者与建设者围坐在一起，交换一束尚未命名的光。")
    set_text(doc, '//section[@id="events"]//a[contains(@class,"btn_wrap")]//div[contains(@class,"btn_txt")]',
             "走进星光相遇的地方")

    set_text(doc, '//section[@id="careers"]//h3[contains(@class,"body_heading")]',
             "寻找下一位同行者")
    set_text(doc, '//section[@id="careers"]//p[contains(@class,"paragraph")]',
             "如果你也相信，生活不止眼前的生活，那么下一段远行，也许正等你加入。Morningstar Ventures 汇聚来自 10 多个国家的伙伴，正在寻找愿意把想象变成现实的人。")
    set_text(doc, '//section[@id="careers"]//a[contains(@class,"btn_wrap")]//div[contains(@class,"btn_txt")]',
             "加入这场远行")

    set_text(doc, '//*[contains(concat(" ",normalize-space(@class)," ")," cta_heading ")]',
             "把远方的星光寄给你")

    meta_description = "换一个角度，世界会显露另一种光。我们寻找尚未被看见的可能，也陪伴它们抵达更远的地方。"
    meta_title = "Morningstar Ventures｜世界不是你眼中的世界，生活也不止你眼前的生活"
    for selector in [
        '//title',
        '//meta[@property="og:title"]',
        '//meta[@name="twitter:title"]',
    ]:
        nodes = doc.xpath(selector)
        for node in nodes:
            if node.tag == "title":
                node.text = meta_title
            else:
                node.set("content", meta_title)
    for selector in [
        '//meta[@name="description"]',
        '//meta[@property="og:description"]',
        '//meta[@name="twitter:description"]',
    ]:
        nodes = doc.xpath(selector)
        for node in nodes:
            node.set("content", meta_description)

    rendered = html.tostring(doc, encoding="unicode", method="html", doctype="<!DOCTYPE html>")
    PAGE.write_text(rendered if isinstance(rendered, str) else rendered.decode("utf-8"), encoding="utf-8")
    print(f"updated {PAGE}")
    print(f"hero_quote={QUOTE}")
    print(f"project_descriptions={len(product_nodes)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
