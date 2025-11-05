import React, { useState, useCallback, useRef, useMemo } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { useLocalization } from '../hooks/useLocalization';
import { useUser } from '../hooks/useUser';
import { Page } from '../App';

interface ImageUploaderProps {
  onImageUpload: (files: File[]) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLocalization();
  const { user } = useUser();
  
  const subscription = user?.profile?.subscription_tier;
  const scansUsed = user?.profile?.scans_used_this_month ?? 0;
  const scansLimit = 10;
  const scansRemaining = useMemo(() => Math.max(0, scansLimit - scansUsed), [scansUsed]);

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
    if (subscription === 'free') return;
    if (subscription === 'lite' && scansRemaining === 0) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter((file: File) => file.type.startsWith('image/'));
      if (files.length > 0) {
        onImageUpload(files);
      }
      e.dataTransfer.clearData();
    }
  }, [onImageUpload, subscription, scansRemaining]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (subscription === 'free') return;
    if (subscription === 'lite' && scansRemaining === 0) return;
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter((file: File) => file.type.startsWith('image/'));
       if (files.length > 0) {
        onImageUpload(files);
      }
    }
  };

  const onBrowseClick = () => {
    fileInputRef.current?.click();
  }
  
  const isUploaderDisabled = subscription === 'free' || (subscription === 'lite' && scansRemaining === 0);

  const getDisabledMessage = () => {
    if (subscription === 'free') {
        return t('scanner.freeTierLimit');
    }
    if (subscription === 'lite' && scansRemaining === 0) {
        return t('scanner.liteTierLimit');
    }
    return '';
  }

  return (
    <div className="w-full max-w-3xl text-center animate-fade-in">
      <h2 className="text-4xl font-extrabold text-neutral-900 dark:text-neutral-light mb-2">{t('uploader.title')}</h2>
      <p className="text-lg text-neutral-500 dark:text-neutral-400 mb-8">{t('uploader.description')}</p>
      
      {subscription === 'lite' && (
        <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/50 border border-blue-500 rounded-lg text-blue-800 dark:text-blue-200">
            {t('scanner.scansRemaining', { count: scansRemaining })}
        </div>
      )}
      
      <div
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative block w-full border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ease-in-out
          ${isDragging && !isUploaderDisabled
            ? 'border-brand-primary bg-brand-primary/10 ring-4 ring-brand-primary/20' 
            : 'border-neutral-900/20 dark:border-neutral-light/20'
          }
          ${!isUploaderDisabled ? 'hover:border-brand-secondary/70' : ''}
          ${isUploaderDisabled ? 'bg-neutral-200/50 dark:bg-neutral-dark/50 cursor-not-allowed' : ''}
          `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploaderDisabled}
        />
        <div className="flex flex-col items-center justify-center">
            <div className={`p-4 rounded-full transition-colors duration-300 ${isDragging && !isUploaderDisabled ? 'bg-brand-primary/20' : 'bg-black/5 dark:bg-white/5'}`}>
                <UploadIcon className={`h-12 w-12 transition-colors duration-300 ${isDragging && !isUploaderDisabled ? 'text-brand-primary' : 'text-neutral-500 dark:text-neutral-400'}`} />
            </div>
            <span className="mt-6 block text-md font-semibold text-neutral-900 dark:text-neutral-light">
            {t('uploader.dropOrBrowse')}{' '}
            <button onClick={onBrowseClick} type="button" disabled={isUploaderDisabled} className="font-semibold bg-gradient-to-r from-glow-start to-glow-end bg-clip-text text-transparent hover:opacity-80 transition-opacity focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
                {t('uploader.browseFiles')}
            </button>
            </span>
            <p className="mt-1 block text-sm text-neutral-400 dark:text-neutral-500">{t('uploader.supports')}</p>
            {isUploaderDisabled && (
                <div className="mt-4 text-center font-semibold text-amber-700 dark:text-amber-400">
                    {getDisabledMessage()}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;