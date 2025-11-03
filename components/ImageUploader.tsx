import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface ImageUploaderProps {
  onImageUpload: (files: File[]) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
      if (files.length > 0) {
        onImageUpload(files);
      }
      e.dataTransfer.clearData();
    }
  }, [onImageUpload]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
       if (files.length > 0) {
        onImageUpload(files);
      }
    }
  };

  const onBrowseClick = () => {
    fileInputRef.current?.click();
  }

  return (
    <div className="w-full max-w-3xl text-center animate-fade-in">
      <h2 className="text-4xl font-extrabold text-neutral-light mb-2">Upload Your Collection</h2>
      <p className="text-lg text-neutral-400 mb-8">Take photos of your games and consoles, and let AI do the rest.</p>
      <div
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative block w-full border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ease-in-out
          ${isDragging 
            ? 'border-brand-primary bg-brand-primary/10 ring-4 ring-brand-primary/20' 
            : 'border-neutral-light/20 hover:border-brand-secondary/70'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center">
            <div className={`p-4 rounded-full transition-colors duration-300 ${isDragging ? 'bg-brand-primary/20' : 'bg-white/5'}`}>
                <UploadIcon className={`h-12 w-12 transition-colors duration-300 ${isDragging ? 'text-brand-primary' : 'text-neutral-400'}`} />
            </div>
            <span className="mt-6 block text-md font-semibold text-neutral-light">
            Drag & drop photos here or{' '}
            <button onClick={onBrowseClick} type="button" className="font-semibold bg-gradient-to-r from-glow-start to-glow-end bg-clip-text text-transparent hover:opacity-80 transition-opacity focus:outline-none">
                browse files
            </button>
            </span>
            <p className="mt-1 block text-sm text-neutral-500">Supports multiple images (PNG, JPG, etc.)</p>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;