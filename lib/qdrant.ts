import { QdrantClient } from '@qdrant/js-client-rest';

export const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY,
});

export const COLLECTION_NAME = 'legal_documents';

export async function initializeQdrantCollection() {
  try {
    // Check if collection exists
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections.some(
      (col) => col.name === COLLECTION_NAME
    );

    if (!collectionExists) {
      // Create collection with 768 dimensions for Gemini embeddings
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 768,
          distance: 'Cosine',
        },
      });
      console.log('Qdrant collection created successfully');
    }
  } catch (error) {
    console.error('Error initializing Qdrant collection:', error);
  }
}

export interface DocumentChunk {
  id: string;
  user_id: string;
  document_id: number;
  content: string;
  embedding: number[];
  metadata: {
    filename: string;
    chunk_index: number;
    total_chunks: number;
  };
}