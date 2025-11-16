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
    const prompt = `You are a helpful medical document assistant. Answer the user's question based on the provided document excerpts. Format your response in markdown and include direct quotes from the source material.

Context from documents:
${context}

User question: ${query}

Instructions:
1. Answer the question based ONLY on the provided context
2. Format your response in markdown with bullet points, headers, and emphasis where appropriate
3. For each key point, include a direct quote from the source material in quotation marks
4. After each quote, cite the source using [Source X - Document Name, Page Y] format
5. If the context doesn't contain enough information to fully answer the question, say so
6. Be specific and factual, especially for medical information
7. Use markdown formatting like **bold**, *italic*, bullet points, and > blockquotes for better readability

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
