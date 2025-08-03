'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';
import { Scale, MessageSquare, Upload, ArrowRight } from 'lucide-react';
import PDFUpload from '../../components/PDFUpload';
import ChatInterface from '../../components/ChatInterface';
import NameModal from '../../components/NameModal';
import LimitModal from '../../components/LimitModal';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function Home() {
  const [userId, setUserId] = useState<string>('');
  const [currentDocumentId, setCurrentDocumentId] = useState<number | null>(null);
  const [currentFilename, setCurrentFilename] = useState<string>('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitType, setLimitType] = useState<'pdf' | 'questions'>('questions');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database and services
      await fetch('/api/init');

      // Get or create user ID
      let storedUserId = Cookies.get('lawgic_user_id');
      if (!storedUserId) {
        storedUserId = uuidv4();
        Cookies.set('lawgic_user_id', storedUserId, { expires: 365 });
        setShowNameModal(true);
      }
      setUserId(storedUserId);

      // Check if user exists in database
      const userResponse = await fetch(`/api/user?userId=${storedUserId}`);
      const userData = await userResponse.json();
      
      if (!userData.user) {
        await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', userId: storedUserId }),
        });
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('App initialization error:', error);
      setIsInitialized(true);
    }
  };

  const handleNameSubmit = async (name: string) => {
    try {
      await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateName', userId, name }),
      });
      setShowNameModal(false);
    } catch (error) {
      console.error('Error updating name:', error);
    }
  };

  const handleUploadSuccess = async (documentId: number, filename: string) => {
    setCurrentDocumentId(documentId);
    setCurrentFilename(filename);
    
    // Load chat history for this document
    try {
      const response = await fetch(`/api/user?userId=${userId}&documentId=${documentId}`);
      const data = await response.json();
      
      if (data.chatHistory) {
        const messages: Message[] = data.chatHistory.map((msg: any) => [
          {
            id: `${msg.id}-q`,
            type: 'user' as const,
            content: msg.question,
            timestamp: new Date(msg.created_at),
          },
          {
            id: `${msg.id}-a`,
            type: 'assistant' as const,
            content: msg.answer,
            timestamp: new Date(msg.created_at),
          },
        ]).flat();
        
        setChatMessages(messages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleUploadError = (error: string) => {
    if (error.includes('limit')) {
      setLimitType('pdf');
      setShowLimitModal(true);
    } else {
      alert(error);
    }
  };

  const handleQuestionLimitReached = () => {
    setLimitType('questions');
    setShowLimitModal(true);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Initializing LawgicAI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Scale className="w-8 h-8 text-blue-500" />
              <h1 className="text-xl font-bold">LawgicAI</h1>
            </div>
            {currentDocumentId && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MessageSquare className="w-4 h-4" />
                <span>{currentFilename}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentDocumentId ? (
          /* Upload Section */
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Understand Legal Documents with AI
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Upload contracts, NDAs, or any legal document and ask questions in plain English
              </p>
              
              <div className="flex items-center justify-center gap-8 mb-12">
                <div className="flex items-center gap-3 text-gray-400">
                  <Upload className="w-5 h-5 text-blue-500" />
                  <span>Upload PDF</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-600" />
                <div className="flex items-center gap-3 text-gray-400">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  <span>Ask Questions</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-600" />
                <div className="flex items-center gap-3 text-gray-400">
                  <Scale className="w-5 h-5 text-purple-500" />
                  <span>Get Clear Answers</span>
                </div>
              </div>
            </div>

            <PDFUpload
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              userId={userId}
            />

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 mt-16">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Smart Upload</h3>
                <p className="text-gray-400">
                  Automatically extracts text from PDFs, with OCR fallback for image-based documents
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Natural Q&A</h3>
                <p className="text-gray-400">
                  Ask questions in plain English and get clear, accurate explanations
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Scale className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Legal Expertise</h3>
                <p className="text-gray-400">
                  AI trained to understand legal language and provide professional insights
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Chat Section */
          <div className="h-[calc(100vh-120px)] bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="bg-gray-700/50 px-6 py-4 border-b border-gray-600">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  {currentFilename}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Ask any question about your document
                </p>
              </div>
              
              <div className="flex-1 min-h-0">
                <ChatInterface
                  documentId={currentDocumentId}
                  userId={userId}
                  onQuestionLimitReached={handleQuestionLimitReached}
                  initialMessages={chatMessages}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <NameModal
        isOpen={showNameModal}
        onClose={handleNameSubmit}
      />
      
      <LimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        limitType={limitType}
      />
    </div>
  );
}
