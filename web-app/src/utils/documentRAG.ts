import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - use local file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export interface DocumentChunk {
  text: string;
  pageNumber: number;
  chunkIndex: number;
  documentName: string;
}

export interface RAGResponse {
  answer: string;
  sources: {
    text: string;
    pageNumber: number;
    documentName: string;
  }[];
}

// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function initializeGemini() {
  // No longer needed - API key is handled on backend
  console.log('Gemini initialized (API key handled server-side)');
}

/**
 * Extract text from a PDF file
 */
export async function extractTextFromPDF(file: File): Promise<{ text: string; pageTexts: string[] }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageTexts: string[] = [];
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      pageTexts.push(pageText);
      fullText += pageText + '\n\n';
    }

    return { text: fullText, pageTexts };
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from a text file
 */
export async function extractTextFromTextFile(file: File): Promise<string> {
  return await file.text();
}

/**
 * Chunk text into smaller pieces for better RAG performance
 */
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks;
}

/**
 * Create document chunks from a file
 */
export async function createDocumentChunks(file: File): Promise<DocumentChunk[]> {
  const chunks: DocumentChunk[] = [];
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  console.log('Processing file:', file.name, 'Extension:', fileExtension, 'Type:', file.type);

  try {
    if (fileExtension === 'pdf') {
      const { pageTexts } = await extractTextFromPDF(file);

      pageTexts.forEach((pageText, pageIndex) => {
        const textChunks = chunkText(pageText, 1000, 200);
        textChunks.forEach((chunk, chunkIndex) => {
          chunks.push({
            text: chunk,
            pageNumber: pageIndex + 1,
            chunkIndex,
            documentName: file.name,
          });
        });
      });
    } else if (fileExtension === 'txt') {
      const text = await extractTextFromTextFile(file);
      const textChunks = chunkText(text, 1000, 200);

      textChunks.forEach((chunk, chunkIndex) => {
        chunks.push({
          text: chunk,
          pageNumber: 1,
          chunkIndex,
          documentName: file.name,
        });
      });
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}. Only PDF and TXT files are supported.`);
    }

    return chunks;
  } catch (error) {
    console.error('Error in createDocumentChunks:', error);
    throw error;
  }
}

/**
 * Generate an answer using RAG with Gemini (via backend)
 */
export async function generateRAGResponse(
  query: string,
  allChunks: DocumentChunk[]
): Promise<RAGResponse> {
  try {
    const response = await fetch(`${API_URL}/api/rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        chunks: allChunks,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating RAG response:', error);
    throw new Error('Failed to generate response. Make sure the backend server is running.');
  }
}
