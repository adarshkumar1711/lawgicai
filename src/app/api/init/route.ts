import { NextResponse } from 'next/server';
import { initializeDatabase } from '../../../../lib/db';
import { initializeQdrantCollection } from '../../../../lib/qdrant';

export async function GET() {
  try {
    await initializeDatabase();
    await initializeQdrantCollection();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database and vector store initialized successfully' 
    });
  } catch (error) {
    console.error('Initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize services' },
      { status: 500 }
    );
  }
}