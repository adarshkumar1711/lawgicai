# Vercel Deployment Setup for LawgicAI

**AI Models Used:**
- **Chat**: `gemini-2.0-flash-lite`
- **Embeddings**: `gemini-embedding-001` (768 dimensions)

---

## Environment Variables Setup

Add these environment variables in your Vercel dashboard:

### 1. Database Configuration
```
TURSO_DATABASE_URL=libsql://your-database-url.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here
```

### 2. Google Cloud Configuration
```
GOOGLE_PROJECT_ID=your-google-project-id
GOOGLE_REGION=us-central1
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account","project_id":"your-project",...}
```

### 3. Qdrant Configuration
```
QDRANT_URL=https://your-cluster-url.qdrant.tech
QDRANT_API_KEY=your-qdrant-api-key
```

### 4. App Configuration
```
# NEXT_PUBLIC_APP_URL is NOT required for this app
# Only add if you need absolute URLs for external integrations
```

## Service Account JSON Preparation

1. Download your service account JSON from Google Cloud Console
2. Minify it to a single line (remove all whitespace and newlines)
3. Copy the entire JSON string
4. In Vercel dashboard, add it as `GOOGLE_APPLICATION_CREDENTIALS`

## Quick Minify Command

```bash
# If you have jq installed:
cat service-account.json | jq -c .

# Or manually copy and remove all line breaks
```

## Deployment Steps

1. Connect your GitHub repository to Vercel
2. Add all environment variables listed above
3. Deploy!

The `vercel.json` configuration handles:
- 60-second timeout for PDF processing
- Proper environment variable mapping

## Post-Deployment

1. Visit `/api/init` to initialize database tables and Qdrant collection
2. Test upload with a small PDF
3. Verify chat functionality

## Troubleshooting

- Check Vercel function logs for errors
- Ensure all environment variables are set
- Verify service account has Vertex AI permissions
- Test database connectivity with Turso CLI