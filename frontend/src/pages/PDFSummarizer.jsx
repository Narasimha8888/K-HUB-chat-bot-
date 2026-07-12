import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Trash2, Loader2, Square, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { uploadPDF, getDocuments, deleteDocument } from '../services/api';

const PDFSummarizer = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [savedItems, setSavedItems] = useState([]);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const abortControllerRef = useRef(null);
  const navigate = useNavigate();

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsUploading(false);
    }
  };

  useEffect(() => {
    getDocuments().then(data => {
      setSavedItems(data || []);
    }).catch(console.error);
  }, []);

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

    abortControllerRef.current = new AbortController();

    try {
      const response = await uploadPDF(file, abortControllerRef.current.signal);

      setSavedItems((prev) => [
        { id: response.doc_id, filename: response.filename, summary: response.summary },
        ...prev,
      ]);
      
      // Navigate to trigger history update in sidebar
      navigate(`/pdf-summarizer?id=${response.doc_id}`, { replace: true });
    } catch (err) {
      if (err.name === 'CanceledError' || err.message?.includes('aborted') || err.name === 'AbortError') {
        console.log('PDF upload aborted.');
      } else {
        const errorData = err.response?.data?.error?.message || err.response?.data?.detail;
        setError(errorData || 'Only PDF files can be uploaded or the backend failed to process it.');
      }
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const deleteItem = async (id) => {
    try {
      await deleteDocument(id);
      setSavedItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to delete document', err);
      setError('Failed to delete document');
    }
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

      {savedItems.length > 0 && (
        <div className="mt-12">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">Uploaded Documents</h2>
          <div className="space-y-2">
            {savedItems.map((item) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.id}
                className="bg-gray-800/30 border border-gray-800/50 rounded-xl overflow-hidden group transition-colors hover:bg-gray-800/40"
              >
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-gray-200">{item.filename || item.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(item.id);
                      }}
                      className="text-gray-500 hover:text-red-400 transition-colors flex items-center gap-2 p-1 rounded-md hover:bg-gray-700/50"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {item.summary && (
                      <motion.div
                        animate={{ rotate: expandedId === item.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </motion.div>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === item.id && item.summary && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-4 pb-4 pt-1">
                        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                          <p className="text-sm text-gray-300 leading-relaxed">
                            {item.summary}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFSummarizer;
