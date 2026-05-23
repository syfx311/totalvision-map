const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { google } = require('@ai-sdk/google');
const { generateText } = require('ai');

// Load practices data
const practicesPath = path.join(__dirname, 'data', 'practices.json');
const practicesData = JSON.parse(fs.readFileSync(practicesPath, 'utf-8'));

const practicesContext = `You are a helpful customer service chatbot for Total Vision California eye care clinics. 
You have access to information about our 7 practice locations:

${JSON.stringify(practicesData.practices, null, 2)}

Your role is to:
1. Answer questions about practice locations, hours, doctors, and pricing
2. Help patients find the right location and doctor for their needs
3. Provide contact information and directions
4. Answer questions about services, insurance, and scheduling policies
5. Be friendly, professional, and helpful

When answering:
- Always provide specific location information when relevant
- Mention hours clearly
- Include phone numbers for scheduling
- Note any insurance restrictions or special policies
- Be concise but thorough`;

const PORT = 3000;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Handle API route
  if (pathname === '/api/chat' && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { messages } = JSON.parse(body);

        if (!messages || !Array.isArray(messages)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request format' }));
          return;
        }

        const model = google('gemini-1.5-flash');

        const response = await generateText({
          model,
          system: practicesContext,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          content: response.text,
          usage: {
            inputTokens: response.usage?.inputTokens,
            outputTokens: response.usage?.outputTokens
          }
        }));
      } catch (error) {
        console.error('Chat API error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Failed to process chat request',
          details: error.message
        }));
      }
    });
    return;
  }

  // Serve static files
  if (pathname === '/') {
    pathname = '/index.html';
  }

  let filePath = path.join(__dirname, pathname);

  // Security: prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - Not Found</h1>');
      return;
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Chat page available at http://localhost:${PORT}/chat.html`);
});
