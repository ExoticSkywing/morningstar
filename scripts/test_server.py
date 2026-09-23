"""Regression checks for the optional Python static preview server."""
import http.client
from pathlib import Path
import sys
import tempfile
import threading
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server


class PreviewServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.original_root = server.ROOT
        server.ROOT = Path(cls.temp.name) / "dist"
        server.ROOT.mkdir()
        (server.ROOT / "index.html").write_text("NEBULUXE homepage")
        detail = server.ROOT / "morningstar" / "portfolio" / "example"
        detail.mkdir(parents=True)
        (detail / "index.html").write_text("Local detail")
        (server.ROOT / "model.glb").write_bytes(b"glTF\x00\x01")
        (server.ROOT.parent / "private.txt").write_text("outside build root")
        cls.httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.NebuluxeHandler)
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.thread.join()
        server.ROOT = cls.original_root
        cls.temp.cleanup()

    def get(self, path):
        connection = http.client.HTTPConnection(*self.httpd.server_address, timeout=5)
        try:
            connection.request("GET", path)
            response = connection.getresponse()
            return response.status, response.read()
        finally:
            connection.close()

    def test_home_and_query(self):
        for path in ["/", "/?preview=1"]:
            with self.subTest(path=path):
                self.assertEqual(self.get(path), (200, b"NEBULUXE homepage"))

    def test_nested_detail_and_binary(self):
        self.assertEqual(self.get("/morningstar/portfolio/example/"), (200, b"Local detail"))
        self.assertEqual(self.get("/model.glb"), (200, b"glTF\x00\x01"))

    def test_missing_and_traversal(self):
        for path in ["/missing.html", "/../private.txt", "/%2e%2e/private.txt"]:
            with self.subTest(path=path):
                status, body = self.get(path)
                self.assertEqual(status, 404)
                self.assertNotIn(b"outside build root", body)

    def test_backslash_path_stays_in_build_root(self):
        # Windows drops the invalid path component; POSIX treats it as a
        # missing filename. Neither may serve the file outside dist.
        status, body = self.get("/..%5cprivate.txt/")
        self.assertIn(status, (200, 404))
        self.assertNotIn(b"outside build root", body)


if __name__ == "__main__":
    unittest.main()
