'use client';

import { X } from 'lucide-react';

interface LimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: 'pdf' | 'questions';
}

export default function LimitModal({ isOpen, onClose, limitType }: LimitModalProps) {
  if (!isOpen) return null;

  const handleContactUs = () => {
    const subject = encodeURIComponent('Subscription');
    const body = encodeURIComponent('How many PDFs and how many queries per month? You can give the range.');
    const mailtoUrl = `mailto:adarshkumar1711@gmail.com?subject=${subject}&body=${body}`;
    window.open(mailtoUrl, '_blank');
  };

  const getMessage = () => {
    if (limitType === 'pdf') {
      return "You've reached your PDF upload limit. We've moved to a pay-as-you-go model.";
    }
    return "You've reached your trial limit. We've moved to a pay-as-you-go model.";
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Upgrade Required</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-300 leading-relaxed">
            {getMessage()}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleContactUs}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Contact Us
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}