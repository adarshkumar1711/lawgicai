import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding, generateAnswer } from '../../../../lib/gemini';
import { qdrantClient, COLLECTION_NAME } from '../../../../lib/qdrant';
import { turso } from '../../../../lib/db';
import { incrementQuestionCount } from '../../../../lib/user-utils';

export async function POST(request: NextRequest) {
  try {
    const { question, documentId, userId } = await request.json();

    if (!question || !documentId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user can ask more questions
    const canAsk = await incrementQuestionCount(userId);
    if (!canAsk) {
      return NextResponse.json({ error: 'Question limit reached' }, { status: 429 });
    }

    // Generate embedding for the question
    const questionEmbedding = await generateEmbedding(question);

    // Search for relevant chunks in Qdrant
    const searchResult = await qdrantClient.search(COLLECTION_NAME, {
      vector: questionEmbedding,
      filter: {
        must: [
          {
            key: 'user_id',
            match: { value: userId },
          },
          {
            key: 'document_id',
            match: { value: documentId },
          },
        ],
      },
      limit: 5,
      score_threshold: 0.7,
    });

    // Extract relevant content
    const relevantChunks = searchResult.map((result) => result.payload?.content).filter(Boolean);
    const context = relevantChunks.join('\n\n');

    if (!context.trim()) {
      return NextResponse.json({
        answer: "This clause doesn't appear to be included in the document.",
      });
    }

    // Generate answer using Gemini
    const answer = await generateAnswer(context, question);

    // Save chat history
    await turso.execute({
      sql: 'INSERT INTO chat_history (user_id, document_id, question, answer) VALUES (?, ?, ?, ?)',
      args: [userId, documentId, question, answer],
    });

    return NextResponse.json({ answer });

  } catch (error) {
    console.error('Question processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
}