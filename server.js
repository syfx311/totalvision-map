const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// Load practices data
const practicesPath = path.join(__dirname, 'data', 'practices.json');
const practicesData = JSON.parse(fs.readFileSync(practicesPath, 'utf-8'));

const practicesContext = `You are a helpful customer service chatbot for Total Vision California eye care clinics. 
You have access to information about our 7 practice locations:

${JSON.stringify(practicesData.practices, null, 2)}

Your role is to:
1. Answer questions about office hours, locations, and services
2. Provide doctor information and specialties
3. Help with scheduling and insurance questions
4. Recommend locations based on patient needs
5. Be friendly, professional, and helpful

Always provide specific details from the practice data when available. If asked about something not in your knowledge base, politely let the user know and suggest they call a location directly.`;

function callGeminiAPI(messages) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      reject(new Error('API key not configured'));
      return;
    }

    // Build the request body
    const requestBody = {
      contents: messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      systemInstruction: {
        parts: [{ text: practicesContext }]
      },
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      }
    };

    const postData = JSON.stringify(requestBody);

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('[v0] Making request to Gemini API');

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.error) {
            reject(new Error(response.error.message || 'API error'));
          } else if (response.candidates && response.candidates[0] && response.candidates[0].content) {
            const text = response.candidates[0].content.parts[0].text;
            resolve(text);
          } else {
            reject(new Error('Unexpected response format'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.error('[v0] Request error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle chat API
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
          res.end(JSON.stringify({ error: 'Messages array required' }));
          return;
        }

        console.log('[v0] Chat request with', messages.length, 'messages');
        
        const responseText = await callGeminiAPI(messages);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ content: responseText }));
      } catch (error) {
        console.error('[v0] Chat API Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to generate response', message: error.message }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(__dirname, filePath);

  // Prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const contentType = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
    }[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[v0] Server running on http://localhost:${PORT}`);
});
