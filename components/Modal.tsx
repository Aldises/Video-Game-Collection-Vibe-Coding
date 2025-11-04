import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useLocalization } from '../hooks/useLocalization';
import { WarningIcon } from './icons/WarningIcon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText,
  cancelText,
  confirmVariant = 'primary',
  footer
}) => {
  const { t } = useLocalization();
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const confirmClasses = {
      primary: 'bg-brand-primary hover:bg-brand-primary/90 text-white',
      danger: 'bg-red-600 hover:bg-red-500 text-white',
  }
  
  const defaultFooter = (
      <>
        <button
            type="button"
            className="w-full sm:w-auto inline-flex justify-center rounded-md bg-white dark:bg-neutral-700 px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-600"
            onClick={onClose}
        >
            {cancelText || t('common.cancel')}
        </button>
        <button
            type="button"
            className={`w-full sm:w-auto inline-flex justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmClasses[confirmVariant]}`}
            onClick={() => {
                onConfirm?.();
            }}
        >
            {confirmText || t('common.confirm')}
        </button>
      </>
  );

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-lg m-4 bg-white dark:bg-neutral-dark rounded-xl shadow-2xl border border-black/10 dark:border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
            <div className="flex items-start gap-4">
                {confirmVariant === 'danger' && (
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                        <WarningIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                    </div>
                )}
                <div className="text-left w-full">
                    <h3 className="text-xl font-bold leading-6 text-neutral-900 dark:text-neutral-light" id="modal-title">
                        {title}
                    </h3>
                    <div className="mt-2">
                        <div className="text-sm text-neutral-600 dark:text-neutral-300">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="bg-gray-50 dark:bg-neutral-dark/50 px-4 py-3 sm:px-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 rounded-b-xl">
          {footer ? footer : defaultFooter}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;