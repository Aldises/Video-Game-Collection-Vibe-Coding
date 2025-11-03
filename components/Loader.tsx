import React from 'react';

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <div className="flex items-center justify-center space-x-2 mb-4">
        <div className="w-4 h-4 rounded-full bg-brand-primary animate-pulse [animation-delay:-0.3s]"></div>
	      <div className="w-4 h-4 rounded-full bg-brand-primary animate-pulse [animation-delay:-0.15s]"></div>
	      <div className="w-4 h-4 rounded-full bg-brand-primary animate-pulse"></div>
      </div>
      <p className="text-neutral-300 max-w-sm">{message}</p>
    </div>
  );
};

export default Loader;