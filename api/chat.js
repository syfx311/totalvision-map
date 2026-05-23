import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import fs from 'fs';
import path from 'path';

// Load practices data
const practicesPath = path.join(process.cwd(), 'data', 'practices.json');
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

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400 }
      );
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

    return new Response(
      JSON.stringify({ 
        content: response.text,
        usage: {
          inputTokens: response.usage?.inputTokens,
          outputTokens: response.usage?.outputTokens
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        details: error.message 
      }),
      { status: 500 }
    );
  }
}
