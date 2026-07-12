import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Trash2, Loader2, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import { uploadPDF } from '../services/api';

const PDFSummarizer = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [savedItems, setSavedItems] = useState([]);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const abortControllerRef = useRef(null);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');
    setStatusMessage('');

    abortControllerRef.current = new AbortController();

    try {
      const response = await uploadPDF(file, abortControllerRef.current.signal);

      setSavedItems((prev) => [
        ...prev,
        { id: Date.now(), name: response.filename, summary: response.summary },
      ]);
      setStatusMessage("Document embedded in RAG database successfully.");
    } catch (err) {
      if (err.name === 'CanceledError' || err.message?.includes('aborted') || err.name === 'AbortError') {
        console.log('PDF upload aborted.');
      } else {
        setError('Only PDF files can be uploaded or the backend failed to process it.');
      }
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const deleteItem = (id) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/20 p-2 rounded-lg">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">PDF Summarizer</h1>
          <p className="text-sm text-gray-400">Upload an academic PDF and get a structured summary.</p>
        </div>
      </div>

      <label
        className={`border-2 border-dashed border-gray-700/50 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors
          ${!isUploading ? 'hover:bg-gray-800/20 hover:border-gray-600' : 'opacity-50 cursor-not-allowed'} mb-8`}
      >
        <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={isUploading} />
        <Upload className="w-8 h-8 text-gray-400 mb-4" />
        <p className="font-semibold text-white mb-1">Upload a PDF</p>
        <p className="text-xs text-gray-500">PDF only, max 15MB • Education content only</p>
      </label>

      {isUploading && (
        <div className="flex items-center justify-between bg-gray-800/30 border border-gray-800/50 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-3 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            Analyzing Document...
          </div>
          <button
            onClick={handleCancel}
            title="Cancel (Ctrl+D)"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-red-500 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Square className="w-4 h-4 fill-current" />
            Stop
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
      {statusMessage && <p className="text-sm text-primary mb-4">{statusMessage}</p>}

      {savedItems.length > 0 && (
        <div className="mt-12">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">Saved items</h2>
          <div className="space-y-2">
            {savedItems.map((item) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.id}
                className="bg-gray-800/30 border border-gray-800/50 rounded-xl p-4 flex items-center justify-between group hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-200">{item.name}</span>
                  {item.summary && <span className="text-xs text-gray-500">{item.summary}</span>}
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-gray-500 text-sm hover:text-red-400 transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFSummarizer;
