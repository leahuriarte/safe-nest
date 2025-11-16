import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize Gemini with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

    if (!query || !chunks || chunks.length === 0) {
      return res.status(400).json({ error: 'Query and chunks are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

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
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`SafeNest server running on port ${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY environment variable not set');
  }
});
