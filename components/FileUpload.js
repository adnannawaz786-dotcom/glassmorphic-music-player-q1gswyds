import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, FileAudio } from 'lucide-react';

const FileUpload = ({ onFileUpload, currentFile, onRemoveFile }) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileSelect = (file) => {
    setUploadError('');
    
    if (!file) return;

    // Validate file type
    if (!file.type.includes('audio/mpeg') && !file.name.toLowerCase().endsWith('.mp3')) {
      setUploadError('Please select an MP3 file only');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File size must be less than 50MB');
      return;
    }

    onFileUpload(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onRemoveFile();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <motion.div
        className={`
          relative p-8 border-2 border-dashed rounded-2xl cursor-pointer
          transition-all duration-300 backdrop-blur-xl
          ${isDragOver 
            ? 'border-purple-400 bg-purple-500/20' 
            : 'border-white/30 bg-white/10 hover:bg-white/20'
          }
          ${currentFile ? 'border-green-400 bg-green-500/20' : ''}
        `}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mpeg,.mp3"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {currentFile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-green-500/20">
                <FileAudio className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium truncate max-w-xs">
                  {currentFile.name}
                </p>
                <p className="text-white/60 text-sm">
                  {(currentFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            </div>
            <motion.button
              onClick={handleRemove}
              className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5 text-red-400" />
            </motion.button>
          </div>
        ) : (
          <div className="text-center">
            <motion.div
              className="inline-flex p-4 rounded-full bg-purple-500/20 mb-4"
              animate={{ 
                y: isDragOver ? -5 : 0,
                scale: isDragOver ? 1.1 : 1
              }}
              transition={{ duration: 0.2 }}
            >
              <Upload className="w-8 h-8 text-purple-400" />
            </motion.div>
            
            <h3 className="text-xl font-semibold text-white mb-2">
              Upload MP3 File
            </h3>
            
            <p className="text-white/60 mb-4">
              Drag and drop your MP3 file here, or click to browse
            </p>
            
            <div className="text-sm text-white/40">
              Maximum file size: 50MB
            </div>
          </div>
        )}
      </motion.div>

      {uploadError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 rounded-lg bg-red-500/20 border border-red-500/30"
        >
          <p className="text-red-400 text-sm">{uploadError}</p>
        </motion.div>
      )}
    </div>
  );
};

export default FileUpload;