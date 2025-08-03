import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF, chunkText } from '../../../../lib/pdf-processor';
import { generateEmbedding } from '../../../../lib/gemini';
import { qdrantClient, COLLECTION_NAME } from '../../../../lib/qdrant';
import { turso } from '../../../../lib/db';
import { incrementPDFUpload } from '../../../../lib/user-utils';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or user ID' }, { status: 400 });
    }

    // Check if user can upload more PDFs
    console.log('Checking user upload limits for:', userId);
    const canUpload = await incrementPDFUpload(userId);
    if (!canUpload) {
      return NextResponse.json({ error: 'PDF upload limit reached' }, { status: 429 });
    }
    console.log('User can upload, proceeding...');

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text from PDF
    console.log('Starting PDF text extraction...');
    const text = await extractTextFromPDF(buffer);
    console.log('PDF text extraction completed, length:', text?.length);
    
    if (!text || text.trim().length < 50) {
      return NextResponse.json({ 
        error: 'Could not extract sufficient text from PDF',
        extractedLength: text?.length || 0,
        preview: text?.substring(0, 100) || 'No text extracted'
      }, { status: 400 });
    }

    // Save document to database
    console.log('Saving document to database...');
    const documentResult = await turso.execute({
      sql: 'INSERT INTO documents (user_id, filename, content) VALUES (?, ?, ?)',
      args: [userId, file.name, text],
    });

    const documentId = Number(documentResult.lastInsertRowid);
    console.log('Document saved with ID:', documentId);

    // Chunk the text
    console.log('Chunking text...');
    const chunks = await chunkText(text);
    console.log('Created chunks:', chunks.length);

    // Generate embeddings and store in Qdrant
    console.log('Generating embeddings...');
    const points = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Generating embedding for chunk ${i + 1}/${chunks.length}`);
      const embedding = await generateEmbedding(chunk);
      
      points.push({
        id: uuidv4(),
        vector: embedding,
        payload: {
          user_id: userId,
          document_id: documentId,
          content: chunk,
          filename: file.name,
          chunk_index: i,
          total_chunks: chunks.length,
        },
      });
    }

    // Upload points to Qdrant in batches
    console.log('Uploading embeddings to Qdrant...');
    const batchSize = 100;
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      console.log(`Uploading batch ${Math.floor(i/batchSize) + 1}...`);
      await qdrantClient.upsert(COLLECTION_NAME, {
        wait: true,
        points: batch,
      });
    }
    console.log('Successfully uploaded all embeddings to Qdrant');

    return NextResponse.json({
      success: true,
      documentId,
      filename: file.name,
      chunksCreated: chunks.length,
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // More detailed error reporting
    let errorMessage = 'Failed to process PDF';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined 
      },
      { status: 500 }
    );
  }
}