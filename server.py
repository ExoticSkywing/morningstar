#!/usr/bin/env python3
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os
import sys
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parent / "site"

class MorningstarHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path: str) -> str:
        parsed = urlsplit(path)
        clean = unquote(parsed.path)
        if clean == "/favicon.ico":
            clean = "/vendor/cdn.prod.website-files.com/6218b09ec1cd76c58f838521/6218b26add781d1acc091b53_morningstar-favicon.png"
        target = ROOT / clean.lstrip("/")
        if parsed.query and clean == "/":
            # The mirrored homepage already contains all CMS items; return it
            # for Finsweet's query-based pagination so loading always settles.
            target = ROOT / "index.html"
        elif clean == "/" or clean.endswith("/"):
            target = target / "index.html"
        elif target.is_dir():
            target = target / "index.html"
        return str(target)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, format, *args):
        sys.stdout.write("%s - %s\n" % (self.address_string(), format % args))
        sys.stdout.flush()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", sys.argv[1] if len(sys.argv) > 1 else "44116"))
    server = ThreadingHTTPServer(("0.0.0.0", port), MorningstarHandler)
    print(f"Morningstar preview: http://0.0.0.0:{port}/", flush=True)
    server.serve_forever()
