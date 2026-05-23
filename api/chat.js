const { google } = require('@ai-sdk/google');
const { generateText } = require('ai');
const fs = require('fs');
const path = require('path');

const practicesPath = path.join(process.cwd(), 'data', 'practices.json');
let practicesData;

try {
  practicesData = JSON.parse(fs.readFileSync(practicesPath, 'utf-8'));
} catch (e) {
  console.error('[v0] Failed to load practices data:', e);
  practicesData = { practices: [] };
}

const practicesContext = `You are a helpful customer service chatbot for Total Vision California eye care clinics. 
You have access to information about our practice locations and services.

Here is the practice information:
${JSON.stringify(practicesData.practices || [], null, 2)}

Your role is to:
1. Answer questions about office hours, locations, and services
2. Provide doctor information and specialties
3. Help with scheduling and insurance questions
4. Recommend locations based on patient needs
5. Be friendly, professional, and helpful

Always provide specific details from the practice data when available. If asked about something not in your knowledge base, politely let the user know and suggest they call directly.`;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error('[v0] Missing GOOGLE_GENERATIVE_AI_API_KEY');
      return res.status(500).json({ error: 'API key not configured' });
    }

    const model = google('gemini-1.5-flash');

    const result = await generateText({
      model,
      system: practicesContext,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: 0.7,
      maxTokens: 500,
    });

    return res.status(200).json({
      content: result.text,
    });
  } catch (error) {
    console.error('[v0] Chat API Error:', error.message);
    return res.status(500).json({
      error: 'Failed to generate response',
      message: error.message,
    });
  }
};
