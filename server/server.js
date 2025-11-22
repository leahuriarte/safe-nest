import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize Gemini with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// MindStudio configuration
const MINDSTUDIO_API_KEY = process.env.MINDSTUDIO_API_KEY;
const MINDSTUDIO_AGENT_ID = process.env.MINDSTUDIO_AGENT_ID;
const MINDSTUDIO_BASE_URL = 'https://api.mindstudio.ai';

// Helper function to find relevant chunks
function findRelevantChunks(query, chunks, topK = 5) {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);

  const scoredChunks = chunks.map(chunk => {
    const chunkLower = chunk.text.toLowerCase();
    let score = 0;

    const exactMatches = (chunkLower.match(new RegExp(queryLower, 'g')) || []).length;
    score += exactMatches * 10;

    queryWords.forEach(word => {
      if (word.length > 3) {
        const wordMatches = (chunkLower.match(new RegExp(word, 'g')) || []).length;
        score += wordMatches;
      }
    });

    return { chunk, score };
  });

  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => item.chunk);
}

// RAG endpoint
app.post('/api/rag', async (req, res) => {
  try {
    const { query, chunks } = req.body;
    console.log('RAG endpoint called with query:', query?.substring(0, 50));

    if (!query || !chunks || chunks.length === 0) {
      console.log('Missing query or chunks');
      return res.status(400).json({ error: 'Query and chunks are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.log('Gemini API key not configured');
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    console.log('Processing', chunks.length, 'chunks');

    // Find relevant chunks
    const relevantChunks = findRelevantChunks(query, chunks, 5);

    if (relevantChunks.length === 0) {
      return res.json({
        answer: "I couldn't find relevant information in the uploaded documents to answer your question.",
        sources: []
      });
    }

    // Create context from relevant chunks
    const context = relevantChunks
      .map((chunk, index) => {
        return `[Source ${index + 1} - ${chunk.documentName}, Page ${chunk.pageNumber}]:\n${chunk.text}`;
      })
      .join('\n\n---\n\n');

    // Create prompt for Gemini
    const prompt = `You are a compassionate medical document assistant specifically designed to help pregnant individuals understand their medical documents. Your role is to explain medical information in a gentle, accessible way that empowers expectant parents to make informed decisions about their health and pregnancy.

Context from documents:
${context}

User question: ${query}

Instructions:
1. **Audience**: You are speaking to pregnant individuals who may be feeling overwhelmed by medical terminology. Be supportive, clear, and reassuring while remaining accurate.

2. **Tone**: Use a warm, encouraging tone. Avoid medical jargon when possible, and when you must use medical terms, explain them in simple language.

3. **Content Guidelines**:
   - Answer based ONLY on the provided document context
   - Break down complex medical information into understandable concepts
   - Explain what medical findings mean for the pregnancy and baby's health
   - Include direct quotes from documents in quotation marks for transparency
   - Cite sources using [Source X - Document Name, Page Y] format
   - If information is unclear or missing, acknowledge this honestly

4. **Format**: Use markdown formatting for clarity:
   - **Bold** for important points
   - *Italic* for emphasis
   - Bullet points for lists
   - > Blockquotes for direct medical quotes
   - Headers to organize information

5. **Pregnancy-Specific Focus**:
   - Relate findings to pregnancy health and fetal development when relevant
   - Explain what normal vs. concerning findings mean
   - Suggest when to discuss results with healthcare providers
   - Provide reassurance when appropriate based on the medical information

6. **Empowerment**: Help the user understand their medical information so they can have informed conversations with their healthcare team.

Remember: You are a supportive guide helping someone navigate their pregnancy journey through better understanding of their medical documents.

Answer:`;

    console.log('Calling Gemini API...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();
    console.log('Gemini response received, length:', answer.length);

    // Extract sources that were actually cited in the answer
    const citedSources = relevantChunks.map((chunk, index) => {
      const sourceNumber = index + 1;
      if (answer.includes(`[Source ${sourceNumber}`)) {
        return {
          text: chunk.text.substring(0, 300) + (chunk.text.length > 300 ? '...' : ''),
          pageNumber: chunk.pageNumber,
          documentName: chunk.documentName
        };
      }
      return null;
    }).filter(s => s !== null);

    res.json({
      answer,
      sources: citedSources
    });
  } catch (error) {
    console.error('RAG error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to generate response', details: error.message });
  }
});

// Gemini Clinic Finder endpoint
app.post('/api/clinic-chat', async (req, res) => {
  try {
    const { message, location } = req.body;
    console.log('Clinic chat endpoint called with message:', message?.substring(0, 50));

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.log('Gemini API key not configured');
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    // Create prompt for Gemini to recommend clinics with full addresses
    const prompt = `You are a compassionate healthcare assistant helping pregnant individuals find reproductive health clinics and healthcare facilities in their area. Your role is to provide helpful, accurate clinic recommendations with complete addresses that can be searched on a map.

User location/area: ${location || 'Los Angeles, CA'}
User question: ${message}

Instructions:
1. **Provide Real Clinic Recommendations**: Suggest 2-3 real reproductive health clinics, Planned Parenthood locations, community health centers, or hospitals with OB/GYN services in the specified area.

2. **Include Complete Addresses**: For EACH clinic, provide:
   - Clinic name
   - Full street address with city, state, and ZIP code
   - Brief description of services (e.g., prenatal care, family planning, OB/GYN)
   - Phone number if commonly known

3. **Format**: Use this exact format for each clinic:
   **[Clinic Name]**
   📍 [Full Address including street, city, state, ZIP]
   📞 [Phone if available]
   Services: [Brief description]

4. **Tone**: Be warm, supportive, and non-judgmental. Acknowledge the user's needs with compassion.

5. **Safety & Privacy**: Remind users they can search these addresses directly in the SafeNest map above for directions and nearby resources.

6. **Additional Info**: If relevant, mention:
   - Clinics known for sliding-scale fees or accepting Medicaid
   - Same-day appointment availability when commonly known
   - Multilingual services if applicable

Example response format:
"Based on your location in [area], here are some reproductive health clinics that can help:

**Planned Parenthood - Downtown Health Center**
📍 123 Main Street, Los Angeles, CA 90012
📞 (213) 555-0123
Services: Prenatal care, family planning, abortion services, STI testing

**Community Women's Clinic**
📍 456 Health Avenue, Los Angeles, CA 90015
📞 (213) 555-0456
Services: OB/GYN care, ultrasounds, pregnancy counseling

You can click on any address above to search it in the SafeNest map and see nearby resources, risk factors, and get directions."

Remember: Provide REAL clinics with REAL addresses that can actually be searched on a map. Be helpful and supportive.

Answer:`;

    console.log('Calling Gemini API for clinic recommendations...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();
    console.log('Gemini clinic response received, length:', answer.length);

    res.json({
      response: answer
    });
  } catch (error) {
    console.error('Clinic chat error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Failed to generate response', details: error.message });
  }
});

// Store active sessions to maintain conversation continuity
const activeSessions = new Map();

// MindStudio webhook endpoint
app.post('/api/mindstudio', async (req, res) => {
  try {
    const { message, sessionId, userId } = req.body;
    console.log('MindStudio webhook called with message:', message?.substring(0, 50));

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!MINDSTUDIO_API_KEY || !MINDSTUDIO_AGENT_ID) {
      console.log('MindStudio credentials not configured');
      return res.status(500).json({ error: 'MindStudio credentials not configured' });
    }

    // Generate consistent session/user IDs
    const currentSessionId = sessionId || `session_${Date.now()}`;
    const currentUserId = userId || `user_${Date.now()}`;

    // Prepare the webhook payload according to MindStudio documentation
    const webhookPayload = {
      message: message,
      sessionId: currentSessionId,
      userId: currentUserId
    };

    console.log('Sending request to MindStudio...');
    console.log('Session ID:', currentSessionId);
    console.log('Agent ID:', MINDSTUDIO_AGENT_ID);
    console.log('API Key (first 10 chars):', MINDSTUDIO_API_KEY?.substring(0, 10) + '...');
    
    // Use the correct MindStudio API endpoint from documentation
    const endpoint = `${MINDSTUDIO_BASE_URL}/developer/v2/apps/run`;
    
    // Check if we have an existing session
    const existingSession = activeSessions.get(currentSessionId);

    // Build payload for MindStudio
    const mindstudioPayload = {
      agentId: MINDSTUDIO_AGENT_ID,
      variables: {
        userInput: message,
        sessionId: currentSessionId,
        userId: currentUserId,
        // Include conversation history if available
        ...(existingSession?.history ? { conversationHistory: existingSession.history } : {})
      },
      // Don't include callbackUrl for synchronous execution
      includeBillingCost: false
    };

    console.log('Using MindStudio apps/run endpoint:', endpoint);
    console.log('Payload:', JSON.stringify(mindstudioPayload, null, 2));
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MINDSTUDIO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mindstudioPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MindStudio API error:', response.status, errorText);
      throw new Error(`MindStudio API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('MindStudio response received');
    console.log('Thread name:', result.thread?.name);
    console.log('Is finished:', result.thread?.isFinished);
    console.log('Has content:', result.thread?.hasContent);
    console.log('Current step type:', result.thread?.currentContinuationAction?.step?.type);
    console.log('Result field:', result.result);
    console.log('Posts count:', result.thread?.posts?.length);

    // Extract the response according to MindStudio API documentation
    // The result field should contain the final output from the workflow
    let agentResponse;
    
    if (result.result) {
      // If there's a direct result, use it
      agentResponse = result.result;
    } else if (result.thread?.currentContinuationAction?.step?.type === 'userInput') {
      // Workflow is waiting for input - this means it's not configured correctly
      agentResponse = `⚠️ **Workflow Configuration Issue**

Your MindStudio agent is waiting for additional input instead of automatically processing your message. 

**To fix this:**
1. Go to your MindStudio dashboard
2. Edit your agent workflow
3. Remove any "User Input" steps that block automatic processing
4. Configure your workflow to automatically process the \`{{$launchVariables->userInput}}\` variable
5. Ensure the workflow returns a response without requiring additional user interaction

**Current Status:** The API connection is working correctly, but your workflow needs to be updated to provide automatic responses.`;
    } else {
      // Try to extract from thread posts or other fields
      agentResponse = result.thread?.posts?.find(post => post.type === 'assistant')?.content ||
                     result.thread?.posts?.[result.thread.posts.length - 1]?.content ||
                     'No response received from the agent. Please check your MindStudio workflow configuration.';
    }

    // Store session information for conversation continuity
    if (result.threadId && agentResponse && !agentResponse.includes('Workflow Configuration Issue')) {
      const sessionData = activeSessions.get(currentSessionId) || { history: [] };
      sessionData.history.push(
        { role: 'user', content: message, timestamp: Date.now() },
        { role: 'assistant', content: agentResponse, timestamp: Date.now() }
      );
      sessionData.threadId = result.threadId;
      activeSessions.set(currentSessionId, sessionData);
      
      // Clean up old sessions (keep only last 100)
      if (activeSessions.size > 100) {
        const oldestKey = activeSessions.keys().next().value;
        activeSessions.delete(oldestKey);
      }
    }

    res.json({
      success: true,
      response: agentResponse,
      sessionId: currentSessionId,
      agentId: MINDSTUDIO_AGENT_ID,
      threadId: result.threadId,
      billingCost: result.billingCost,
      conversationLength: activeSessions.get(currentSessionId)?.history?.length || 0
    });

  } catch (error) {
    console.error('MindStudio webhook error:', error);
    res.status(500).json({ 
      error: 'Failed to process MindStudio request', 
      details: error.message 
    });
  }
});

// MindStudio configuration test endpoint
app.get('/api/mindstudio/test', (req, res) => {
  res.json({
    configured: !!(MINDSTUDIO_API_KEY && MINDSTUDIO_AGENT_ID),
    hasApiKey: !!MINDSTUDIO_API_KEY,
    hasAgentId: !!MINDSTUDIO_AGENT_ID,
    agentId: MINDSTUDIO_AGENT_ID,
    apiKeyPrefix: MINDSTUDIO_API_KEY ? MINDSTUDIO_API_KEY.substring(0, 10) + '...' : 'Not set'
  });
});

// Reset MindStudio conversation
app.post('/api/mindstudio/reset', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId && activeSessions.has(sessionId)) {
    activeSessions.delete(sessionId);
    console.log('Reset conversation for session:', sessionId);
  }
  res.json({ success: true, message: 'Conversation reset' });
});

// Test MindStudio API key validity
app.get('/api/mindstudio/test-auth', async (req, res) => {
  try {
    console.log('Testing MindStudio authentication...');
    const response = await fetch(`${MINDSTUDIO_BASE_URL}/developer/v2/apps/load`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MINDSTUDIO_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    const result = await response.text();
    console.log('Auth test response:', response.status, result);

    res.json({
      status: response.status,
      ok: response.ok,
      response: result,
      headers: Object.fromEntries(response.headers.entries())
    });
  } catch (error) {
    console.error('Auth test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`SafeNest server running on port ${PORT}`);
  
  // Check Gemini configuration
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY environment variable not set');
    console.warn('Current env keys:', Object.keys(process.env).filter(k => k.includes('GEMINI')));
  } else {
    console.log('✅ Gemini API key loaded successfully');
  }
  
  // Check MindStudio configuration
  if (!MINDSTUDIO_API_KEY || !MINDSTUDIO_AGENT_ID) {
    console.warn('⚠️  MindStudio credentials not configured');
    console.warn('Set MINDSTUDIO_API_KEY and MINDSTUDIO_AGENT_ID in your .env file');
  } else {
    console.log('✅ MindStudio credentials loaded successfully');
    console.log('🤖 MindStudio Agent ID:', MINDSTUDIO_AGENT_ID);
  }
});
