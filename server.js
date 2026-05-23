const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// Load practices data
const practicesPath = path.join(__dirname, 'data', 'practices.json');
const practicesData = JSON.parse(fs.readFileSync(practicesPath, 'utf-8'));

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/api/chat' && req.method === 'POST') {
    console.log('[v0] Chat request received');
    let body = '';

    req.on('data', (chunk) => {
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

        const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
        let response = '';

        if (lastMessage.includes('hour') || lastMessage.includes('open') || lastMessage.includes('close')) {
          response = `Total Vision California has multiple locations with varying hours:

• Bonita: Mon-Fri 8:00 AM - 5:00 PM, Sat 9:00 AM - 2:00 PM
• Sacramento: Mon-Fri 8:30 AM - 5:30 PM, Sat by appointment
• Chico: Mon-Fri 9:00 AM - 5:00 PM, Sat 9:00 AM - 1:00 PM
• Los Gatos: Mon-Fri 8:00 AM - 5:00 PM, Sat 9:00 AM - 2:00 PM

For other locations or specific hours, please call 1-800-VISION.`;
        } else if (lastMessage.includes('doctor') || lastMessage.includes('optometrist') || lastMessage.includes('ophthalmologist')) {
          response = `We have experienced optometrists and ophthalmologists at each location specializing in:
• Comprehensive eye exams
• Contact lens fittings
• Cataract surgery and management
• Treatment of eye diseases
• Laser vision correction consultations

Please contact a location directly at 1-800-VISION to learn about specific doctors.`;
        } else if (lastMessage.includes('service') || lastMessage.includes('offer')) {
          response = `Our services include:
• Comprehensive eye exams
• Eyeglass and contact lens fittings
• Dry eye treatment
• Cataract evaluations and surgery
• Glaucoma management
• Diabetic eye care
• Retinal care
• Pediatric eye care

Call 1-800-VISION to schedule an appointment.`;
        } else if (lastMessage.includes('insurance') || lastMessage.includes('pay') || lastMessage.includes('cost')) {
          response = `We accept most major insurance plans. For specific insurance questions and billing information:
• Call 1-800-VISION
• Visit any of our 7 locations
• Check your insurance card for vision coverage details`;
        } else if (lastMessage.includes('location') || lastMessage.includes('where') || lastMessage.includes('address')) {
          response = `Total Vision has 7 convenient locations:
• Bonita
• Sacramento
• Chico
• Los Gatos
• Laguna La Paz
• Crown Valley
• Long Beach

For directions and addresses, call 1-800-VISION or visit our website.`;
        } else {
          response = `Hello! I'm the Total Vision chatbot. I can help with information about our office locations, hours, doctors, services, and insurance. What would you like to know?`;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ content: response }));
      } catch (error) {
        console.error('[v0] Error:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to process request' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[v0] Chatbot server running on http://localhost:${PORT}`);
});
