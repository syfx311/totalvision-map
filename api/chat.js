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

    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    let response = '';

    if (lastMessage.includes('hour') || lastMessage.includes('open') || lastMessage.includes('close') || lastMessage.includes('time')) {
      response = `Total Vision California has multiple locations with varying hours. Here are our key locations:

• Bonita: Monday-Friday 8:00 AM - 5:00 PM, Saturday 9:00 AM - 2:00 PM
• Sacramento: Monday-Friday 8:30 AM - 5:30 PM, Saturday by appointment
• Chico: Monday-Friday 9:00 AM - 5:00 PM, Saturday 9:00 AM - 1:00 PM
• Los Gatos: Monday-Friday 8:00 AM - 5:00 PM, Saturday 9:00 AM - 2:00 PM
• Laguna La Paz: Monday-Friday 8:00 AM - 5:00 PM
• Crown Valley: Monday-Friday 9:00 AM - 5:30 PM
• Long Beach: Monday-Friday 8:00 AM - 5:00 PM, Saturday 10:00 AM - 2:00 PM

For specific location hours or holidays, please call us at 1-800-VISION (1-800-847-4266).`;
    } else if (lastMessage.includes('doctor') || lastMessage.includes('optometrist') || lastMessage.includes('ophthalmologist') || lastMessage.includes('staff')) {
      response = `We have experienced optometrists and ophthalmologists at each of our seven locations. Our doctors specialize in:

• Comprehensive eye exams
• Contact lens fittings
• Treatment of eye diseases
• Cataract surgery and management
• Dry eye treatment
• Laser vision correction consultations
• Glaucoma management
• Pediatric eye care

To learn more about our doctors at a specific location, please call 1-800-VISION (1-800-847-4266) or visit any of our clinics.`;
    } else if (lastMessage.includes('service') || lastMessage.includes('offer') || lastMessage.includes('do you') || lastMessage.includes('what do')) {
      response = `Total Vision offers a comprehensive range of eye care services including:

• Comprehensive eye exams
• Eyeglass and contact lens fittings
• Dry eye treatment and management
• Cataract evaluations and surgery
• Glaucoma management and treatment
• Diabetic eye care
• Retinal care
• Pediatric eye care
• Corneal disease treatment
• Post-operative care

We use the latest technology and equipment to provide the best possible care. Contact us at 1-800-VISION to learn more or schedule an appointment.`;
    } else if (lastMessage.includes('insurance') || lastMessage.includes('pay') || lastMessage.includes('cost') || lastMessage.includes('billing')) {
      response = `We accept most major insurance plans. For specific insurance questions and billing information:

• Call us at 1-800-VISION (1-800-847-4266)
• Visit any of our seven locations in person
• Check your insurance card for your vision coverage details

Our staff can verify your coverage and answer questions about co-pays and deductibles. We also offer various payment options to make quality eye care accessible.`;
    } else if (lastMessage.includes('location') || lastMessage.includes('where') || lastMessage.includes('address') || lastMessage.includes('bonita') || lastMessage.includes('sacramento') || lastMessage.includes('chico') || lastMessage.includes('los gatos') || lastMessage.includes('laguna') || lastMessage.includes('crown') || lastMessage.includes('long beach')) {
      response = `Total Vision California has 7 convenient locations:

• Bonita
• Sacramento  
• Chico
• Los Gatos
• Laguna La Paz
• Crown Valley
• Long Beach

For detailed directions, addresses, and phone numbers for any of our locations, please call 1-800-VISION (1-800-847-4266) or visit our website. We're located throughout California to serve you better.`;
    } else if (lastMessage.includes('appointment') || lastMessage.includes('schedule') || lastMessage.includes('book')) {
      response = `To schedule an appointment at Total Vision:

• Call us at 1-800-VISION (1-800-847-4266)
• Visit any of our seven locations in person
• Ask about online scheduling availability

Our staff will help you find a convenient time that works for your schedule. New patients are always welcome, and we offer same-day appointments when available.`;
    } else if (lastMessage.includes('contact') || lastMessage.includes('phone') || lastMessage.includes('call')) {
      response = `Contact Total Vision California:

Main Phone Number: 1-800-VISION (1-800-847-4266)

We have 7 locations throughout California:
• Bonita
• Sacramento
• Chico
• Los Gatos
• Laguna La Paz
• Crown Valley
• Long Beach

For location-specific information or to reach a particular clinic directly, please call our main number and we'll connect you.`;
    } else {
      response = `Hello! I'm the Total Vision chatbot. I can help you with information about our:
• Office locations and hours
• Doctors and eye care specialists
• Services we offer
• Insurance and payment options
• How to schedule an appointment

What would you like to know?`;
    }

    return res.status(200).json({
      content: response,
    });
  } catch (error) {
    console.error('[v0] Chat API Error:', error.message);
    return res.status(500).json({
      error: 'Failed to generate response',
      message: error.message,
    });
  }
};
