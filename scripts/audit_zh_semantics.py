#!/usr/bin/env python3
"""Hard audit gates for Morningstar zh localization."""
from __future__ import annotations
import json, re, sys
from pathlib import Path
from lxml import html

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'site'
SOURCE=ROOT/'RECON'/'source-html'
MANIFEST=ROOT/'RECON'/'zh-protected-source-manifest.json'
OUT=ROOT/'RECON'/'zh-semantic-audit.json'
KNOWN_BAD=[
 '张俊','谢尔盖·戈尔布诺夫','大卫·约翰逊','西蒙·哈曼','弗拉维安·马内亚','阿瓦隆','跨时代',
 'Please wait...','Token / 股权','Web3Gaming','Web3APIs','GenerativeAI',
]
TECH_NORMALIZE_BAD=[r'(?i)\bweb3gaming\b',r'(?i)\bweb3apis\b',r'(?i)\bgenerativeai\b',r'\bDefi\b',r'\bdePin\b',r'\bDApp\b',r'\bAPIs\b']

def text(el): return ' '.join(el.text_content().split())
def load(path): return html.document_fromstring(path.read_bytes())
def source_for(relative:Path)->Path|None:
 if relative==Path('index.html'): return SOURCE/'home.html'
 if relative.parts[0]=='portfolio': return SOURCE/f'portfolio__{relative.parts[1]}.html'
 if relative.parts[0]=='products': return SOURCE/f'products__{relative.parts[1]}.html'
 if relative.parts[0]=='_queries': return SOURCE/'home.html'
 if relative==Path('brand/index.html'): return SOURCE/'brand.html'
 if relative==Path('test/index.html'): return SOURCE/'test.html'
 return None

def main():
 manifest=json.loads(MANIFEST.read_text())
 people=set(manifest['people']); projects=set(manifest['projects']); issues=[]; checked=0
 for page in sorted(SITE.rglob('*.html')):
  rel=page.relative_to(SITE); s=page.read_text(errors='ignore'); checked+=1
  if 'lang="zh-CN"' not in s: issues.append({'file':str(rel),'kind':'lang'})
  for bad in KNOWN_BAD:
   if bad in s: issues.append({'file':str(rel),'kind':'known_bad','value':bad})
  for pat in TECH_NORMALIZE_BAD:
   if re.search(pat,s): issues.append({'file':str(rel),'kind':'term_case','value':pat})
  doc=load(page)
  if doc.xpath("//*[contains(concat(' ',normalize-space(@class),' '),' prin_h1 ')]/strong[normalize-space(.)='s']"):
   issues.append({'file':str(rel),'kind':'orphan_s'})
  source=source_for(rel)
  if source and source.exists() and rel.parts[0]=='portfolio':
   src=load(source)
   expected=set()
   for node in src.xpath("//*[contains(concat(' ',normalize-space(@class),' '),' news_item--hl ')]"):
    t=text(node)
    for name in people:
     if len(name) >= 5 and name in t: expected.add(name)
   current='\n'.join(text(n) for n in doc.xpath("//*[contains(concat(' ',normalize-space(@class),' '),' news_item--hl ')]"))
   for name in expected:
    if name not in current: issues.append({'file':str(rel),'kind':'person_missing','value':name})
   title=' '.join(src.xpath('//title/text()'))
   project=re.split(r'\s*\|\s*Morningstar Ventures',title)[0].strip()
   source_desc=' '.join(src.xpath('//meta[@name="description"]/@content'))
   current_desc=' '.join(doc.xpath('//meta[@name="description"]/@content'))
   if project in source_desc and project not in current_desc:
    issues.append({'file':str(rel),'kind':'project_missing_description','value':project})
 report={'html_files':checked,'projects':len(projects),'people':len(people),'issues':issues,'pass':not issues}
 OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({k:report[k] for k in ('html_files','projects','people','pass')},ensure_ascii=False))
 if issues:
  print(json.dumps(issues[:100],ensure_ascii=False,indent=2));return 2
 return 0
if __name__=='__main__':raise SystemExit(main())
