import React from 'react';
import { useLocalization } from '../hooks/useLocalization';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const { t } = useLocalization();
  const pageSizes = [25, 50, 100];

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems <= pageSizes[0] && itemsPerPage !== 0) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 w-full">
      <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <span>{t('pagination.itemsPerPage')}</span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="bg-white dark:bg-neutral-darker border border-neutral-900/20 dark:border-neutral-light/20 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
        >
          {pageSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
          <option value={0}>{t('pagination.all')}</option>
        </select>
      </div>

      <div className="text-sm text-neutral-600 dark:text-neutral-400">
        {itemsPerPage > 0 && totalItems > 0 &&
          t('pagination.showingOf', {
            start: startItem,
            end: endItem,
            total: totalItems,
          })}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1 || totalPages === 0}
          className="px-4 py-2 text-sm font-medium bg-white dark:bg-neutral-dark border border-neutral-900/20 dark:border-neutral-light/20 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-dark/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('pagination.previous')}
        </button>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-4 py-2 text-sm font-medium bg-white dark:bg-neutral-dark border border-neutral-900/20 dark:border-neutral-light/20 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-dark/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('pagination.next')}
        </button>
      </div>
    </div>
  );
};

export default Pagination;