# LawgicAI - Legal Document AI Assistant

LawgicAI is a web-based AI assistant that helps users understand legal documents like contracts, agreements, NDAs, and terms of service by simply uploading a PDF and asking questions in plain English.

## 🚀 Features

- **PDF Upload with OCR Fallback**: Supports both text-based and image-based PDFs using `pdf-parse` and `tesseract.js`
- **Smart Document Processing**: Chunks text using LangChain and creates vector embeddings with Gemini
- **RAG-based Q&A**: Uses Qdrant vector database for similarity search and Gemini 2.0 Flash Lite for answers
- **Usage Limits**: Free tier with 1 PDF upload and 4 questions, with upgrade prompts
- **Chat History**: Persistent chat history per document
- **Dark Modern UI**: Beautiful dark theme inspired by modern legal tech tools

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Lucide React
- **Backend**: Next.js API Routes
- **Database**: Turso (SQLite)
- **Vector Database**: Qdrant
- **AI**: Google Vertex AI (Gemini 2.0 Flash Lite, Gemini Embedding 001)
- **PDF Processing**: pdf-parse, tesseract.js
- **Text Processing**: LangChain

## 📋 Prerequisites

Before running the application, you need to set up:

1. **Google Cloud Project** with Vertex AI enabled
2. **Turso Database** account
3. **Qdrant** vector database instance
4. **Service Account** JSON file from Google Cloud

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token

# Google Vertex AI
GOOGLE_PROJECT_ID=your_google_project_id
GOOGLE_REGION=us-central1

# Qdrant Vector Database
QDRANT_URL=your_qdrant_cluster_url
QDRANT_API_KEY=your_qdrant_api_key

# App Configuration  
# NEXT_PUBLIC_APP_URL is not required for this app
```

## 🔑 Google Cloud Setup

1. Create a new Google Cloud project
2. Enable the Vertex AI API
3. Create a service account with Vertex AI permissions
4. Download the service account JSON file
5. For development: Place the JSON file as `service-account.json` in the root directory
6. For production: Store the JSON content as an environment variable

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lawgicai
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables (see above)

4. Place your Google service account JSON file in the root directory (for development)

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🚀 Deployment to Vercel

1. **Prepare your service account**:
   - Convert your service account JSON to a single line string
   - In Vercel dashboard, add it as an environment variable named `GOOGLE_APPLICATION_CREDENTIALS`

2. **Set up environment variables in Vercel**:
   - Add all the environment variables from your `.env.local`
   - Make sure `GOOGLE_APPLICATION_CREDENTIALS` contains your service account JSON as a string

3. **Deploy**:
```bash
vercel --prod
```

4. **Important**: The `vercel.json` file is configured to handle long-running functions (60s timeout) for PDF processing.

## 🎯 Usage

1. **First Visit**: Enter your name when prompted
2. **Upload PDF**: Drag and drop or select a legal document (max 10MB)
3. **Ask Questions**: Use natural language to ask about any aspect of the document
4. **Get Answers**: Receive clear, professional explanations with relevant context

## 📊 Usage Limits

- **Free Tier**: 1 PDF upload, 4 questions total
- **Upgrade**: Contact form appears when limits are reached

## 🏗️ Architecture

1. **PDF Processing**: Text extraction → Chunking (800 chars, 200 overlap)
2. **Vector Storage**: Gemini Embedding 001 (768 dimensions) → Qdrant
3. **Question Answering**: Question embedding → Similarity search → Context retrieval → Gemini 2.0 Flash Lite response
4. **User Management**: Cookie-based user tracking → Turso database

## 🔧 API Endpoints

- `POST /api/upload` - Upload and process PDF
- `POST /api/question` - Ask questions about documents
- `GET/POST /api/user` - User management and chat history
- `GET /api/init` - Initialize database and vector store

## 🎨 UI Components

- `PDFUpload` - Drag-and-drop file upload
- `ChatInterface` - Real-time Q&A interface
- `NameModal` - User onboarding
- `LimitModal` - Upgrade prompts

## 🐛 Troubleshooting

### Common Issues:

1. **Google Auth Errors**: Ensure service account has proper permissions and JSON is valid
2. **PDF Processing Fails**: Check file size (<10MB) and format (PDF only)
3. **Database Errors**: Verify Turso connection and credentials
4. **Vector Search Issues**: Confirm Qdrant cluster is running and accessible

### Development Tips:

- Check browser console for client-side errors
- Monitor Next.js API route logs for server issues
- Use the `/api/init` endpoint to reinitialize services

## 📄 License

This project is private and proprietary.

## 🤝 Support

For support or subscription inquiries, contact: adarshkumar1711@gmail.com