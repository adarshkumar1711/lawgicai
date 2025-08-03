'use client';

import { useState, useRef } from 'react';
import { Upload, File, X, Loader } from 'lucide-react';

interface PDFUploadProps {
  onUploadSuccess: (documentId: number, filename: string) => void;
  onUploadError: (error: string) => void;
  userId: string;
}

export default function PDFUpload({ onUploadSuccess, onUploadError, userId }: PDFUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      onUploadError('Please select a PDF file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onUploadError('File size must be less than 10MB.');
      return;
    }

    setUploadedFile(file);
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('pdf', uploadedFile);
    formData.append('userId', userId);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      onUploadSuccess(data.documentId, uploadedFile.name);
      setUploadedFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!uploadedFile ? (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-600 hover:border-gray-500'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            Upload your legal document
          </h3>
          <p className="text-gray-400 mb-4">
            Drag and drop your PDF file here, or click to browse
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Choose PDF File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
          />
          <p className="text-xs text-gray-500 mt-2">
            Maximum file size: 10MB
          </p>
        </div>
      ) : (
        <div className="border border-gray-600 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <File className="w-8 h-8 text-blue-500" />
              <div>
                <h4 className="font-medium text-white">{uploadedFile.name}</h4>
                <p className="text-sm text-gray-400">
                  {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            {!isUploading && (
              <button
                onClick={removeFile}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Upload & Process'
            )}
          </button>
        </div>
      )}
    </div>
  );
}