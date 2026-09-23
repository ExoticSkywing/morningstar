#!/usr/bin/env python3
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os
import sys

ROOT = Path(__file__).resolve().parent / "dist"

class NebuluxeHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # The standard handler normalizes URL paths inside the build directory,
        # including query strings, encoded traversal attempts and index files.
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, format, *args):
        sys.stdout.write("%s - %s\n" % (self.address_string(), format % args))
        sys.stdout.flush()

if __name__ == "__main__":
    if not (ROOT / "index.html").exists():
        raise SystemExit("Build NEBULUXE first: npm ci && npm run build")
    port = int(os.environ.get("PORT", sys.argv[1] if len(sys.argv) > 1 else "44116"))
    host = os.environ.get("HOST", "127.0.0.1")
    server = ThreadingHTTPServer((host, port), NebuluxeHandler)
    print(f"NEBULUXE preview: http://{host}:{port}/", flush=True)
    server.serve_forever()
