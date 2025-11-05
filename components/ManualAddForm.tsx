import React, { useState, FormEvent } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { GameItem } from '../types';
import Modal from './Modal';

interface ManualAddFormProps {
    isOpen: boolean;
    onClose: () => void;
    onAddItem: (item: Omit<GameItem, 'id' | 'sourceId' | 'estimatedPrices'>, target: 'collection' | 'wishlist') => void;
    targetList: 'collection' | 'wishlist';
}

const initialFormState = {
    title: '',
    platform: '',
    publisher: '',
    releaseYear: new Date().getFullYear(),
    itemType: 'Game' as 'Game' | 'Console' | 'Accessory',
    condition: 'Unknown' as 'Boxed' | 'Loose' | 'Unknown',
};

const ManualAddForm: React.FC<ManualAddFormProps> = ({ isOpen, onClose, onAddItem, targetList }) => {
    const { t } = useLocalization();
    const [formData, setFormData] = useState(initialFormState);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'releaseYear' ? parseInt(value) || '' : value
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Basic validation
        if (!formData.title || !formData.platform || !formData.releaseYear) {
            alert('Please fill in all required fields.');
            setIsLoading(false);
            return;
        }
        
        onAddItem(formData, targetList);
        setFormData(initialFormState); // Reset form
        setIsLoading(false);
        onClose();
    };

    const defaultInputClass = "appearance-none block w-full px-3 py-2 border border-neutral-900/20 dark:border-neutral-light/20 rounded-md shadow-sm placeholder-neutral-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-neutral-darker text-black dark:text-white";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={targetList === 'collection' ? t('manualForm.titleCollection') : t('manualForm.titleWishlist')}
            footer={
                <>
                    <button type="button" onClick={onClose} className="w-full sm:w-auto inline-flex justify-center rounded-md bg-white dark:bg-neutral-700 px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-600">
                        {t('common.cancel')}
                    </button>
                    <button type="submit" form="manual-add-form" disabled={isLoading} className="w-full sm:w-auto inline-flex justify-center rounded-md bg-brand-primary hover:bg-brand-primary/90 text-white px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-50">
                        {isLoading ? t('common.processing') : t('manualForm.addButton')}
                    </button>
                </>
            }
        >
            <form id="manual-add-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('tableHeaders.title')}</label>
                    <input type="text" name="title" id="title" required value={formData.title} onChange={handleChange} className={defaultInputClass} />
                </div>
                <div>
                    <label htmlFor="platform" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('tableHeaders.platform')}</label>
                    <input type="text" name="platform" id="platform" required value={formData.platform} onChange={handleChange} className={defaultInputClass} />
                </div>
                <div>
                    <label htmlFor="publisher" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('tableHeaders.publisher')}</label>
                    <input type="text" name="publisher" id="publisher" value={formData.publisher} onChange={handleChange} className={defaultInputClass} />
                </div>
                <div>
                    <label htmlFor="releaseYear" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('tableHeaders.year')}</label>
                    <input type="number" name="releaseYear" id="releaseYear" required value={formData.releaseYear} onChange={handleChange} className={defaultInputClass} />
                </div>
                <div>
                    <label htmlFor="itemType" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('tableHeaders.itemType')}</label>
                    <select name="itemType" id="itemType" value={formData.itemType} onChange={handleChange} className={defaultInputClass}>
                        <option value="Game">Game</option>
                        <option value="Console">Console</option>
                        <option value="Accessory">Accessory</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="condition" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('tableHeaders.condition')}</label>
                     <select name="condition" id="condition" value={formData.condition} onChange={handleChange} className={defaultInputClass}>
                        <option value="Boxed">{t('conditions.boxed')}</option>
                        <option value="Loose">{t('conditions.loose')}</option>
                        <option value="Unknown">{t('conditions.unknown')}</option>
                    </select>
                </div>
            </form>
        </Modal>
    );
};

export default ManualAddForm;
