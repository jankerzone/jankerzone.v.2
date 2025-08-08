const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const postsFile = path.join(__dirname, 'posts.json');

function readPosts() {
  try {
    const data = fs.readFileSync(postsFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writePosts(posts) {
  fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/api/posts') {
    const posts = readPosts();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(posts));
  } else if (req.method === 'POST' && url.pathname === '/api/posts') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { text } = JSON.parse(body);
        const posts = readPosts();
        const newPost = { id: Date.now(), text };
        posts.push(newPost);
        writePosts(posts);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(newPost));
      } catch (err) {
        res.statusCode = 400;
        res.end('Invalid JSON');
      }
    });
  } else {
    // Serve static files
    let filePath = path.join(__dirname, 'public', url.pathname === '/' ? 'index.html' : url.pathname);
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.statusCode = 404;
        res.end('Not found');
      } else {
        const ext = path.extname(filePath);
        const type = ext === '.html' ? 'text/html' : 'text/plain';
        res.setHeader('Content-Type', type);
        res.end(content);
      }
    });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
