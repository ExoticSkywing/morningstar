#!/usr/bin/env python3
"""Build and audit a source-derived protected-name manifest for zh localization."""
from __future__ import annotations
import json, re
from pathlib import Path
from lxml import html

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "RECON" / "source-html"
OUT = ROOT / "RECON" / "zh-protected-source-manifest.json"

PERSON_PATTERNS = [
    r"(?:Interview|Founder Stories):\s*([^()]+?)\s*\(",
    r"EGLD Interview:\s*([^()]+?)\s*\(",
    r"Interview:\s*([^()]+?)\s*\(",
]

def texts(doc, class_name):
    xp = f"//*[contains(concat(' ',normalize-space(@class),' '),' {class_name} ')]"
    return [' '.join(e.text_content().split()) for e in doc.xpath(xp) if ' '.join(e.text_content().split())]

def main():
    projects=set(); card_names=set(); people=set(); headlines=set(); roles=set(); labels=set()
    for p in sorted(SOURCE.glob('*.html')):
        doc=html.document_fromstring(p.read_bytes())
        title=' '.join(doc.xpath('//title/text()')).strip()
        if p.name.startswith('portfolio__'):
            project=re.split(r'\s*\|\s*Morningstar Ventures',title)[0].strip()
            if project: projects.add(project)
        card_names.update(texts(doc,'port_names'))
        roles.update(texts(doc,'team_role'))
        labels.update(texts(doc,'prin_row--txt'))
        for text in texts(doc,'team_name'):
            people.add(text)
        for text in texts(doc,'news_item--hl'):
            headlines.add(text)
            for pat in PERSON_PATTERNS:
                for match in re.findall(pat,text,re.I):
                    for part in re.split(r'\s+(?:and|&)\s+',match):
                        name=part.strip(' "“”')
                        if name: people.add(name)
    # Explicit first-party brands and technical terms requested to remain Latin.
    products={'Morningstar Ventures','37xDubai','MSV Studio','MSV GG','Atlas Technologies','Crypto Atlas','Coin Explorers'}
    terms={'Web3','Web2','DeFi','AI','NFT','BTC','SocialFi','dApp','Token','Equity','GameFi','DePIN','RWA','DAO','subDAO','DEX','AMM','EVM','SVM','L1','L2','LRT','LRTfi','ERC-721','EGLD','INJ','FX','USD','MiCA','XR','API','MMORPG','MMO','CDP','LLAMMA','zk-SNARKs','Launchpad','Ethereum','Arbitrum','EigenLayer','Solana','MultiversX','Elrond','Immutable X','Polygon','Curve Finance'}
    data={k:sorted(v) for k,v in {'projects':projects,'card_names':card_names,'people':people,'headlines':headlines,'roles':roles,'investment_labels':labels,'products':products,'terms':terms}.items()}
    OUT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:len(v) for k,v in data.items()},ensure_ascii=False))
if __name__=='__main__': main()
