const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

http.createServer((req, res) => {
  const requested = decodeURIComponent((req.url || '/').split('?')[0]);
  const relative = requested === '/' ? 'index.html' : (requested === '/admin.html' ? 'admin-dashboard.html' : requested.replace(/^\/+/, ''));
  const file = path.resolve(root, relative);

  if (!file.startsWith(root + path.sep) && file !== path.join(root, 'index.html')) {
    res.writeHead(403); return res.end('Forbidden');
  }

  fs.stat(file, (statError, stat) => {
    if (statError || !stat.isFile()) {
      res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
      return res.end('Not found');
    }
    res.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream'});
    fs.createReadStream(file).pipe(res);
  });
}).listen(8123, '127.0.0.1', () => {
  console.log('Powerway website: http://127.0.0.1:8123/');
});
