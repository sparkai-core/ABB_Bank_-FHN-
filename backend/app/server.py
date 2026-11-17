"""Local API. No third-party packages, so it runs on a fresh Python."""

import base64
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

from app import review
from app.extract import read_file


def _body(handler):
    length = int(handler.headers.get("Content-Length", 0))
    raw = handler.rfile.read(length) if length else b"{}"
    return json.loads(raw or b"{}")


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _file(self, filename, payload, content_type):
        data = payload.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = urlparse(self.path).path
        parts = path.strip("/").split("/")
        if path == "/api/review":
            self._send(200, review.snapshot())
            return
        if path == "/api/projects":
            self._send(200, {"projects": review.list_projects()})
            return
        if len(parts) == 3 and parts[:2] == ["api", "projects"]:
            if not review.open_project(parts[2]):
                self._send(404, {"detail": "Project was not found"})
                return
            self._send(200, review.snapshot())
            return
        if len(parts) == 4 and parts[:2] == ["api", "projects"] and parts[3] in {"report.csv", "report.txt"}:
            project_id = parts[2]
            if parts[3] == "report.csv":
                body = review.report_csv(project_id)
                kind = "text/csv; charset=utf-8"
                name = "smeta-report.csv"
            else:
                body = review.report_text(project_id)
                kind = "text/plain; charset=utf-8"
                name = "smeta-report.txt"
            if body is None:
                self._send(404, {"detail": "Project was not found"})
                return
            self._file(name, body, kind)
            return
        self._send(404, {"detail": "not found"})

    def do_POST(self):
        path = urlparse(self.path).path
        body = _body(self)
        if path == "/api/upload":
            filename = str(body.get("filename") or "tender")
            try:
                raw = base64.b64decode(body.get("content") or "", validate=True)
            except Exception:
                self._send(400, {"detail": "The file could not be read."})
                return
            if len(raw) > 8_000_000:
                self._send(400, {"detail": "The file is larger than 8 MB."})
                return
            try:
                rows, kind = read_file(filename, raw)
            except ValueError as err:
                self._send(400, {"detail": str(err)})
                return
            review.load_rows(filename, rows, kind)
            self._send(200, review.snapshot())
            return
        parts = path.strip("/").split("/")
        project_id = parts[2] if len(parts) >= 3 and parts[:2] == ["api", "projects"] else None
        if path == "/api/reset" or (len(parts) == 4 and parts[3] == "reset"):
            review.reset()
            self._send(200, review.snapshot())
            return
        if path == "/api/decision" or (len(parts) == 4 and parts[3] == "decision"):
            if not review.decide(body.get("choice", ""), body.get("note", ""), project_id):
                self._send(400, {"detail": "Choice must be accept, query, or reject"})
                return
            self._send(200, review.snapshot())
            return
        if len(parts) == 4 and parts[0] == "api" and parts[1] == "lines" and parts[3] == "confirm":
            if not review.confirm(parts[2], body.get("code", "")):
                self._send(404, {"detail": "Line or norm was not found"})
                return
            self._send(200, review.snapshot())
            return
        if len(parts) == 6 and parts[1] == "projects" and parts[3] == "lines" and parts[5] == "confirm":
            if not review.confirm(parts[4], body.get("code", ""), parts[2]):
                self._send(404, {"detail": "Line or norm was not found"})
                return
            self._send(200, review.snapshot())
            return
        if len(parts) == 4 and parts[0] == "api" and parts[1] == "lines" and parts[3] == "gap":
            if not review.set_gap(parts[2], bool(body.get("required"))):
                self._send(404, {"detail": "Missing line was not found"})
                return
            self._send(200, review.snapshot())
            return
        if len(parts) == 6 and parts[1] == "projects" and parts[3] == "lines" and parts[5] == "gap":
            if not review.set_gap(parts[4], bool(body.get("required")), parts[2]):
                self._send(404, {"detail": "Missing line was not found"})
                return
            self._send(200, review.snapshot())
            return
        self._send(404, {"detail": "not found"})

    def log_message(self, fmt, *args):
        print(f"{self.address_string()} {fmt % args}")


def main():
    server = ThreadingHTTPServer(("127.0.0.1", 8000), Handler)
    print("Smeta Yoxlama API on http://127.0.0.1:8000")
    server.serve_forever()


if __name__ == "__main__":
    main()
