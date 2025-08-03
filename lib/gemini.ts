import { VertexAI } from '@google-cloud/vertexai';
import { getGoogleCredentials } from './auth';

// For Vercel deployment, we'll use environment variables instead of service account file
const credentials = getGoogleCredentials();

const vertex_ai = new VertexAI({
  project: process.env.GOOGLE_PROJECT_ID!,
  location: process.env.GOOGLE_REGION || 'us-central1',
  ...(credentials && { googleAuthOptions: { credentials } }),
});

// Get the generative model
export const generativeModel = vertex_ai.getGenerativeModel({
  model: 'gemini-2.0-flash-lite',
});

// Get the embedding model
export const embeddingModel = vertex_ai.getGenerativeModel({
  model: 'gemini-embedding-001',
});

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const request = {
      contents: [{ role: 'user', parts: [{ text }] }],
    };

    const result = await embeddingModel.generateContent(request);
    const embedding = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!embedding) {
      throw new Error('No embedding generated');
    }

    // Parse the embedding response and limit to 768 dimensions
    const embeddingArray = JSON.parse(embedding);
    return embeddingArray.slice(0, 768);
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

const SYSTEM_PROMPT = `You are a professional legal assistant helping users understand legal documents they have uploaded.
Your task is to analyze the provided contract excerpts and answer the user's questions by:
Providing clear, accurate legal reasoning based on the text.
Offering plain English summaries that are easy to understand.
Explaining legal terms or concepts when needed.
Referring to specific relevant clauses or sections by name or number whenever helpful.

Important guidelines:

If the user's question asks about content not included in the provided excerpts, respond precisely with:
"This clause doesn't appear to be included in the document."
Do not guess, invent, or assume any information that is not present in the excerpts.
Avoid overly technical or complex legal jargon, unless the user specifically requests such detail.
Keep all responses concise, accurate, and directly focused on the user's question.
Maintain a professional, clear, and helpful tone throughout.`;

export async function generateAnswer(context: string, question: string): Promise<string> {
  try {
    const request = {
      contents: [
        { 
          role: 'user', 
          parts: [{ text: SYSTEM_PROMPT }] 
        },
        { 
          role: 'model', 
          parts: [{ text: 'I understand. I am ready to help you analyze legal documents. Please provide the document excerpts and your question.' }] 
        },
        { 
          role: 'user', 
          parts: [{ 
            text: `Document excerpts:
${context}

Question: ${question}` 
          }] 
        }
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.3,
      },
    };

    const result = await generativeModel.generateContent(request);
    return result.response.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I could not generate a response.';
  } catch (error) {
    console.error('Error generating answer:', error);
    throw error;
  }
}