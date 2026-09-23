#!/usr/bin/env python3
"""Advisory comparison of likely proper nouns in source and localized prose."""
from __future__ import annotations
import json,re
from pathlib import Path
from lxml import html
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'site';SOURCE=ROOT/'RECON'/'source-html';OUT=ROOT/'RECON'/'zh-proper-noun-audit.json'
COMMON={'Morningstar Ventures','Private Round','Seed Round','Strategic Round','Series A Round','Funding Round','Venture Round','Project Review','Founder Stories','Our Initiative','Discover More','Learn More','Roundtable','EGLD Interview','EGLD Podcast','Web3 Gaming','Web3 Infrastructure','DeFi','GameFi','Layer 1','Layer 2','Artificial Intelligence','Virtual Reality','Machine Learning','Digital Assets','Blockchain Technology'}
PAT=re.compile(r"\b(?:[A-Z][A-Za-z0-9.'&+-]*|[A-Z]{2,})(?:\s+(?:[A-Z][A-Za-z0-9.'&+-]*|[A-Z]{2,})){1,5}\b")
def source_for(rel):
 if rel==Path('index.html'):return SOURCE/'home.html'
 if rel.parts[0]=='portfolio':return SOURCE/f'portfolio__{rel.parts[1]}.html'
 if rel.parts[0]=='products':return SOURCE/f'products__{rel.parts[1]}.html'
 if rel.parts[0]=='_queries':return SOURCE/'home.html'
 if rel==Path('brand/index.html'):return SOURCE/'brand.html'
 if rel==Path('test/index.html'):return SOURCE/'test.html'
def text(path):
 d=html.document_fromstring(path.read_bytes())
 for n in d.xpath('//script|//style|//noscript|//svg'):n.drop_tree()
 return ' '.join(d.text_content().split())
def main():
 missing=[];checked=0
 for p in sorted(SITE.rglob('*.html')):
  rel=p.relative_to(SITE);src=source_for(rel)
  if not src or not src.exists():continue
  a=text(src);b=text(p);candidates=set(PAT.findall(a))
  candidates={name for name in candidates if len(name)<=64 and not re.search(r'[a-z][A-Z]',name)}
  for name in sorted(candidates):
   name=name.strip(' .,:;!?“”"')
   if not name or name in COMMON:continue
   words=name.split()
   if all(w in {'The','A','An','And','Of','For','To','In','On','With','By','Our','New','First','Future','Building','Interview','Founder','Co','CEO','COO','Roundtable','Project','Review'} for w in words):continue
   checked+=1
   if name not in b:missing.append({'file':str(rel),'value':name})
 report={'advisory':True,'candidates_checked':checked,'missing':missing,'missing_count':len(missing)}
 OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'candidates_checked':checked,'missing_count':len(missing)},ensure_ascii=False))
 return 0
if __name__=='__main__':raise SystemExit(main())
