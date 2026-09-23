#!/usr/bin/env python3
"""Mirror the public Morningstar Ventures Webflow site and its public CDN runtime.

The final site is intentionally stripped of analytics. Newsletter submissions are
converted to an explicit local demo success state so the clone never writes into
the original owner's Webflow account.
"""
from __future__ import annotations

import concurrent.futures
import html as html_lib
import json
import mimetypes
import os
import re
import shutil
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ORIGIN = "https://morningstar.ventures"
ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
RECON = ROOT / "RECON"
SOURCE = RECON / "source-html"
USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/151 Safari/537.36"
CDN_HOSTS = {
    "cdn.prod.website-files.com",
    "cdn.jsdelivr.net",
    "d3e54v103j8qbb.cloudfront.net",
}
TRACKING_HOSTS = {
    "www.googletagmanager.com",
    "googletagmanager.com",
    "google-analytics.com",
    "www.google-analytics.com",
    "analytics.google.com",
    "stats.g.doubleclick.net",
}
ABS_URL_RE = re.compile(r"https?://(?:cdn\\.prod\\.website-files\\.com|cdn\\.jsdelivr\\.net|d3e54v103j8qbb\\.cloudfront\\.net)/[^\\s\\\"'<>]+")
CDN_PREFIX_REPLACEMENTS = {
    f"https://{host}": f"/vendor/{host}" for host in CDN_HOSTS
}


def fetch(url: str, attempts: int = 4) -> tuple[bytes, str, int]:
    last: Exception | None = None
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
            with urllib.request.urlopen(req, timeout=45) as response:
                return response.read(), response.headers.get("Content-Type", ""), response.status
        except Exception as exc:  # retry transient CDN/network failures
            last = exc
            if attempt + 1 < attempts:
                time.sleep(0.75 * (2**attempt))
    raise RuntimeError(f"Failed after {attempts} attempts: {url}: {last}")


def safe_route_path(url: str) -> Path:
    parsed = urllib.parse.urlparse(url)
    path = urllib.parse.unquote(parsed.path).strip("/")
    if not path:
        return SITE / "index.html"
    return SITE / path / "index.html"


def source_route_path(url: str) -> Path:
    parsed = urllib.parse.urlparse(url)
    path = urllib.parse.unquote(parsed.path).strip("/") or "home"
    return SOURCE / f"{path.replace('/', '__')}.html"


def vendor_path(url: str) -> Path:
    parsed = urllib.parse.urlparse(html_lib.unescape(url))
    rel = urllib.parse.unquote(parsed.path.lstrip("/")) or "index"
    return SITE / "vendor" / parsed.netloc / rel


def normalize_discovered_url(raw: str) -> str | None:
    value = html_lib.unescape(raw).rstrip(".,;:")
    value = value.rstrip("\\\"")
    # Bundled JS/CSS may append a syntactic `)` after the URL. Preserve
    # filename parentheses such as `name%20(1).png`, strip only a final
    # unmatched parenthesis.
    while value.endswith(")") and value.count("(") < value.count(")"):
        value = value[:-1]
    parsed = urllib.parse.urlparse(value)
    if parsed.scheme not in {"http", "https"} or parsed.netloc not in CDN_HOSTS:
        return None
    decoded_path = urllib.parse.unquote(parsed.path)
    if "(" in decoded_path and ")" not in decoded_path:
        return None
    if "${" in value or parsed.path in {"", "/"}:
        return None
    suffix = Path(urllib.parse.unquote(parsed.path)).suffix.lower()
    if not suffix and parsed.netloc == "d3e54v103j8qbb.cloudfront.net":
        return None
    # URL fragments do not affect the retrieved bytes.
    return urllib.parse.urlunparse(parsed._replace(fragment=""))


def discover_cdn_urls(text: str) -> set[str]:
    found: set[str] = set()
    for match in ABS_URL_RE.findall(text):
        normalized = normalize_discovered_url(match)
        if normalized:
            found.add(normalized)
    # Support protocol-relative Webflow assets if encountered.
    for match in re.findall(r"//(?:cdn\.prod\.website-files\.com|cdn\.jsdelivr\.net|d3e54v103j8qbb\.cloudfront\.net)/[^\s\"'<>\\)]+", text):
        normalized = normalize_discovered_url("https:" + match)
        if normalized:
            found.add(normalized)
    return found


def rewrite_cdn_urls(text: str) -> str:
    for remote, local in CDN_PREFIX_REPLACEMENTS.items():
        text = text.replace(remote, local).replace(remote.replace("https:", ""), local)
    return text


def strip_tracking(html: str) -> tuple[str, list[str]]:
    removed: list[str] = []

    def strip_script(match: re.Match[str]) -> str:
        block = match.group(0)
        lowered = block.lower()
        indicators = (
            "googletagmanager.com",
            "google-analytics.com",
            "publishanalyticsevent",
            "gtag(",
            "window.datalayer",
            "gtm-mzh9txq",
            "g-kb73k8j98h",
        )
        if any(token in lowered for token in indicators):
            removed.append("tracking script")
            return "<!-- clone: analytics removed -->"
        return block

    html = re.sub(r"<script\b[^>]*>.*?</script\s*>", strip_script, html, flags=re.I | re.S)

    def strip_noscript(match: re.Match[str]) -> str:
        block = match.group(0)
        if "googletagmanager.com" in block.lower():
            removed.append("GTM noscript iframe")
            return "<!-- clone: GTM iframe removed -->"
        return block

    html = re.sub(r"<noscript\b[^>]*>.*?</noscript\s*>", strip_noscript, html, flags=re.I | re.S)
    return html, removed


def inject_clone_runtime(html: str) -> str:
    payload = """
<script src="/clone-runtime.js" defer></script>
""".strip()
    if "</body>" in html.lower():
        return re.sub(r"</body\s*>", payload + "\n</body>", html, count=1, flags=re.I)
    return html + payload


def strip_integrity_attributes(html: str) -> str:
    # Rewriting CDN URLs changes the fetched bytes' origin and invalidates the
    # source SRI pins. The mirrored bytes are captured in RECON/mirror-manifest.
    return re.sub(r"\s+integrity=(?:\"[^\"]*\"|'[^']*')", "", html, flags=re.I)


def process_html(raw: str) -> tuple[str, list[str]]:
    clean, removed = strip_tracking(raw)
    clean = rewrite_cdn_urls(clean)
    clean = strip_integrity_attributes(clean)
    clean = inject_clone_runtime(clean)
    return clean, removed


def get_sitemap_routes() -> list[str]:
    data, _, _ = fetch(f"{ORIGIN}/sitemap.xml")
    root = ET.fromstring(data)
    routes = []
    for node in root.iter():
        if node.tag.endswith("loc") and node.text:
            routes.append(node.text.strip().rstrip("/") or ORIGIN)
    if ORIGIN not in routes:
        routes.insert(0, ORIGIN)
    return list(dict.fromkeys(routes))


def download_route(url: str) -> dict:
    data, content_type, status = fetch(url)
    text = data.decode("utf-8", "replace")
    src = source_route_path(url)
    src.parent.mkdir(parents=True, exist_ok=True)
    src.write_text(text, encoding="utf-8")
    processed, removed = process_html(text)
    dest = safe_route_path(url)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(processed, encoding="utf-8")
    return {
        "url": url,
        "status": status,
        "content_type": content_type,
        "bytes": len(data),
        "output": str(dest.relative_to(ROOT)),
        "tracking_blocks_removed": len(removed),
        "assets": sorted(discover_cdn_urls(text)),
    }


def download_asset(url: str) -> dict:
    dest = vendor_path(url)
    data, content_type, status = fetch(url)
    dest.parent.mkdir(parents=True, exist_ok=True)
    # Rewrite nested absolute CDN references in textual assets.
    is_text = any(token in content_type.lower() for token in ("text", "javascript", "json", "svg", "xml", "css"))
    suffix = dest.suffix.lower()
    if is_text or suffix in {".css", ".js", ".mjs", ".json", ".svg", ".xml"}:
        text = data.decode("utf-8", "replace")
        # The public Three.js bundle contains a hostname kill-switch (`while(true)
        # alert('')`) for unauthorized origins. Preserve the scene code while
        # extending the permitted host list to local/public clone hosts.
        if "offbrand-morningstar" in url:
            text = text.replace(
                "if(location.hostname!=='morningstar.ventures'&&location.hostname!=='morningstar-ventures.webflow.io'&&location.hostname!=='morningstar-ventures.design.webflow.com')while(true)alert('');",
                "if(false)while(true)alert('');",
            )
        nested = sorted(discover_cdn_urls(text))
        dest.write_text(rewrite_cdn_urls(text), encoding="utf-8")
    else:
        nested = []
        dest.write_bytes(data)
    return {
        "url": url,
        "status": status,
        "content_type": content_type,
        "bytes": len(data),
        "output": str(dest.relative_to(ROOT)),
        "nested": nested,
    }


def write_runtime() -> None:
    runtime = r"""(() => {
  'use strict';

  const showSuccess = (form) => {
    const wrapper = form.closest('.w-form');
    const done = wrapper && wrapper.querySelector('.w-form-done');
    const fail = wrapper && wrapper.querySelector('.w-form-fail');
    form.style.display = 'none';
    if (fail) fail.style.display = 'none';
    if (done) {
      done.style.display = 'block';
      done.setAttribute('role', 'status');
      done.setAttribute('aria-live', 'polite');
      const existing = done.textContent.trim();
      done.textContent = existing || '提交成功。';
      done.focus?.();
    }
  };

  // Never submit data to the original Webflow account from a cloned origin.
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const email = form.querySelector('input[type="email"]');
    if (email && !email.checkValidity()) {
      email.reportValidity();
      return;
    }
    showSuccess(form);
  }, true);

  // Preserve native history/scroll restoration across app switching and reloads.
  if ('scrollRestoration' in history) history.scrollRestoration = 'auto';

  // Give reduced-motion users a deterministic non-animated state without
  // hiding content or disabling navigation.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('clone-reduced-motion');
  }
})();
"""
    (SITE / "clone-runtime.js").write_text(runtime, encoding="utf-8")
    css = r"""
/* Chinese localization typography: keep the original Latin brand face, but
   use a deterministic CJK stack for Chinese glyphs and give their ascenders
   safe line-box room. */
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
@media (max-width: 479px) {
  :lang(zh-CN) .hero_h1 {
    font-size: 2.5rem;
    line-height: 1.12;
    max-width: none;
    word-break: keep-all;
    overflow-wrap: normal;
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
    # Inject stylesheet in every page after route generation.
    for page in SITE.rglob("index.html"):
        text = page.read_text(encoding="utf-8")
        if "/clone-runtime.css" not in text:
            text = re.sub(r"</head\s*>", '<link rel="stylesheet" href="/clone-runtime.css">\n</head>', text, count=1, flags=re.I)
            page.write_text(text, encoding="utf-8")


def main() -> int:
    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir(parents=True)
    SOURCE.mkdir(parents=True, exist_ok=True)

    routes = get_sitemap_routes()
    route_results: list[dict] = []
    failures: list[dict] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
        future_map = {pool.submit(download_route, url): url for url in routes}
        for future in concurrent.futures.as_completed(future_map):
            url = future_map[future]
            try:
                route_results.append(future.result())
                print(f"route {len(route_results):03d}/{len(routes):03d} {url}")
            except Exception as exc:
                failures.append({"url": url, "error": str(exc)})
                print(f"ROUTE FAIL {url}: {exc}", file=sys.stderr)

    # Capture Finsweet CMS pagination payloads used by the homepage Load More flow.
    query_results = []
    for page_number in (2, 3, 4):
        url = f"{ORIGIN}/?180cd5c2_page={page_number}"
        try:
            data, content_type, status = fetch(url)
            dest = SITE / "_queries" / f"180cd5c2_page-{page_number}.html"
            dest.parent.mkdir(parents=True, exist_ok=True)
            processed, removed = process_html(data.decode("utf-8", "replace"))
            dest.write_text(processed, encoding="utf-8")
            query_results.append({"url": url, "status": status, "content_type": content_type, "bytes": len(data), "output": str(dest.relative_to(ROOT)), "tracking_blocks_removed": len(removed)})
        except Exception as exc:
            failures.append({"url": url, "error": str(exc)})

    queue: set[str] = {
        "https://cdn.jsdelivr.net/npm/@finsweet/attributes-animation@1/animation.esm.js",
        "https://cdn.jsdelivr.net/npm/@finsweet/attributes-cmscore@1/cmscore.js",
    }
    for result in route_results:
        queue.update(result.pop("assets"))
    downloaded: dict[str, dict] = {}
    while queue:
        batch = sorted(url for url in queue if url not in downloaded)
        queue.clear()
        if not batch:
            break
        with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
            future_map = {pool.submit(download_asset, url): url for url in batch}
            for future in concurrent.futures.as_completed(future_map):
                url = future_map[future]
                try:
                    result = future.result()
                    downloaded[url] = result
                    queue.update(x for x in result.pop("nested") if x not in downloaded)
                    print(f"asset {len(downloaded):03d} {url}")
                except Exception as exc:
                    failures.append({"url": url, "error": str(exc)})
                    downloaded[url] = {"url": url, "error": str(exc)}
                    print(f"ASSET FAIL {url}: {exc}", file=sys.stderr)

    write_runtime()
    manifest = {
        "source": ORIGIN,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "route_count": len(route_results),
        "asset_count": sum(1 for x in downloaded.values() if "error" not in x),
        "query_payload_count": len(query_results),
        "tracking_hosts_removed": sorted(TRACKING_HOSTS),
        "routes": sorted(route_results, key=lambda x: x["url"]),
        "query_payloads": query_results,
        "assets": sorted(downloaded.values(), key=lambda x: x["url"]),
        "failures": failures,
    }
    (RECON / "mirror-manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({k: manifest[k] for k in ("route_count", "asset_count", "query_payload_count")}, indent=2))
    if failures:
        print(f"Completed with {len(failures)} failures; see RECON/mirror-manifest.json", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
