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
    const canUpload = await incrementPDFUpload(userId);
    if (!canUpload) {
      return NextResponse.json({ error: 'PDF upload limit reached' }, { status: 429 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text from PDF
    const text = await extractTextFromPDF(buffer);
    
    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: 'Could not extract sufficient text from PDF' }, { status: 400 });
    }

    // Save document to database
    const documentResult = await turso.execute({
      sql: 'INSERT INTO documents (user_id, filename, content) VALUES (?, ?, ?)',
      args: [userId, file.name, text],
    });

    const documentId = Number(documentResult.lastInsertRowid);

    // Chunk the text
    const chunks = await chunkText(text);

    // Generate embeddings and store in Qdrant
    const points = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
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
    const batchSize = 100;
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      await qdrantClient.upsert(COLLECTION_NAME, {
        wait: true,
        points: batch,
      });
    }

    return NextResponse.json({
      success: true,
      documentId,
      filename: file.name,
      chunksCreated: chunks.length,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF' },
      { status: 500 }
    );
  }
}