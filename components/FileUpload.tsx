import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';
import { AppState } from '../types';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  appState: AppState;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, appState }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative group cursor-pointer border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ease-in-out
          flex flex-col items-center justify-center text-center
          ${isDragging 
            ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' 
            : 'border-slate-700 hover:border-blue-400 hover:bg-slate-800/50 bg-slate-900/50'
          }
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          accept=".txt,.csv,.log"
          className="hidden"
        />

        {appState === AppState.ANALYZING ? (
          <div className="flex flex-col items-center animate-pulse">
            <Loader2 className="w-16 h-16 text-blue-400 animate-spin mb-4" />
            <h3 className="text-xl font-semibold text-white">Analyzing Log...</h3>
            <p className="text-slate-400 mt-2">Parsing data and consulting AI</p>
          </div>
        ) : (
          <>
            <div className={`
              w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300
              ${isDragging ? 'bg-blue-500/20' : ''}
            `}>
              {isDragging ? (
                <UploadCloud className="w-10 h-10 text-blue-400" />
              ) : (
                <FileText className="w-10 h-10 text-slate-400 group-hover:text-blue-400 transition-colors" />
              )}
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-2">
              {isDragging ? 'Drop file to upload' : 'Upload SPL Log'}
            </h3>
            <p className="text-slate-400 max-w-xs mx-auto">
              Drag and drop your .txt file here, or click to browse.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;