"""Local preview: serve the platform and proxy the live tablet under one origin."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--directory', required=True)
parser.add_argument('--port', type=int, default=8765)
args = parser.parse_args()

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw): super().__init__(*a, directory=args.directory, **kw)
    def do_GET(self):
        if not self.path.startswith('/tablet/'):
            return super().do_GET()
        try:
            request = Request('http://127.0.0.1:3019' + self.path, headers={'Accept': self.headers.get('Accept', '*/*')})
            with urlopen(request, timeout=30) as response:
                body = response.read()
                self.send_response(response.status)
                self.send_header('Content-Type', response.headers.get('Content-Type', 'application/octet-stream'))
                self.send_header('Cache-Control', 'no-store')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
        except (URLError, HTTPError) as error:
            self.send_error(502, 'Tablet preview unavailable; start Vite on 3019 with --base /tablet/')

ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
