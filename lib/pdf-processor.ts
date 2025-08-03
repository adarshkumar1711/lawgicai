import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log('Attempting PDF text extraction with pdf-parse...');
    // First, try to extract text directly from PDF
    const data = await pdfParse(buffer);
    console.log('pdf-parse result:', { textLength: data.text?.length, pages: data.numpages });
    
    if (data.text && data.text.trim().length > 50) {
      console.log('Successfully extracted text from PDF');
      return data.text;
    }
    
    // For now, skip OCR in production to avoid serverless issues
    if (process.env.NODE_ENV === 'production') {
      throw new Error('PDF appears to be image-based. OCR processing is temporarily disabled in production.');
    }
    
    // If direct extraction fails or returns minimal text, use OCR
    console.log('Direct text extraction failed, using OCR...');
    return await extractTextWithOCR(buffer);
  } catch (error) {
    console.error('Error in PDF text extraction:', error);
    
    // In production, don't attempt OCR for now
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Fallback to OCR if direct extraction fails
    return await extractTextWithOCR(buffer);
  }
}

async function extractTextWithOCR(buffer: Buffer): Promise<string> {
  const worker = await createWorker('eng');
  
  try {
    const { data: { text } } = await worker.recognize(buffer);
    return text;
  } catch (error) {
    console.error('OCR extraction failed:', error);
    throw new Error('Failed to extract text from PDF');
  } finally {
    await worker.terminate();
  }
}

export async function chunkText(text: string): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 200,
    separators: ['\n\n', '\n', '. ', ' ', ''],
  });

  const chunks = await splitter.splitText(text);
  return chunks.filter(chunk => chunk.trim().length > 0);
}

export function validatePDFFile(file: File): boolean {
  if (!file) return false;
  if (file.type !== 'application/pdf') return false;
  if (file.size > 10 * 1024 * 1024) return false; // 10MB limit
  return true;
}