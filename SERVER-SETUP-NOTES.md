# Server Setup Notes

## Problem: Directory Listing Instead of index.html

### Issue
When running `http://localhost:3000/`, Python's built-in `http.server` shows a directory listing instead of automatically serving `index.html`.

### Root Cause
Python's `SimpleHTTPRequestHandler` does NOT automatically serve `index.html` for the root path `/`. It only serves files when explicitly requested, or shows a directory listing for directory paths.

### Solution
Use a custom HTTP handler that redirects `/` to `/index.html`:

```python
# server.py
import http.server
import socketserver

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.path = '/index.html'
        return super().do_GET()

PORT = 3000

with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
    print(f"Server running at http://localhost:{PORT}/")
    httpd.serve_forever()
```

### How to Run
**IMPORTANT**: Must run from the project directory where `index.html` is located:

```bash
cd "C:\Users\ozalp\Desktop\code\Cursor\bubble project"
python server.py
```

**This will NOT work:**
```bash
python "C:\Users\ozalp\Desktop\code\Cursor\bubble project\server.py"
```
Reason: Python's HTTP server serves files from the **current working directory**, not from where the script is located.

### Alternative (if server.py doesn't exist)
```bash
cd "C:\Users\ozalp\Desktop\code\Cursor\bubble project"
python -m http.server 3000
# Then navigate to http://localhost:3000/index.html (not just http://localhost:3000/)
```

### Key Learnings
1. Python's `http.server` requires explicit file paths or a custom handler
2. Always `cd` to the project directory before starting the server
3. The working directory matters more than the script location
4. ES6 modules require an HTTP server (cannot use `file://` protocol due to CORS)

