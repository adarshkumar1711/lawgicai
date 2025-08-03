import { NextResponse } from 'next/server';

export async function GET() {
  const envCheck = {
    TURSO_DATABASE_URL: !!process.env.TURSO_DATABASE_URL,
    TURSO_AUTH_TOKEN: !!process.env.TURSO_AUTH_TOKEN,
    GOOGLE_PROJECT_ID: !!process.env.GOOGLE_PROJECT_ID,
    GOOGLE_REGION: !!process.env.GOOGLE_REGION,
    GOOGLE_APPLICATION_CREDENTIALS: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
    QDRANT_URL: !!process.env.QDRANT_URL,
    QDRANT_API_KEY: !!process.env.QDRANT_API_KEY,
  };

  return NextResponse.json({
    message: 'Environment variable check',
    variables: envCheck,
    allPresent: Object.values(envCheck).every(Boolean),
  });
}