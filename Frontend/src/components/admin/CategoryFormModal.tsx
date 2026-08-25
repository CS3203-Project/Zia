import React, { useEffect, useState } from 'react';
import { XCircle } from 'lucide-react';
import Button from '../shared/Button';
import type { Category, CategoryInput } from '../../api/adminApi';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryInput) => Promise<void>;
  category?: Category | null;
  parentCategory?: Category | null;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  category,
  parentCategory,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(category?.name || '');
      setDescription(category?.description || '');
      setError(null);
    }
  }, [isOpen, category]);

  if (!isOpen) return null;

  const isEdit = !!category;
  const title = isEdit
    ? `Edit ${category?.parentId ? 'Subcategory' : 'Category'}`
    : parentCategory
    ? `Add Subcategory to "${parentCategory.name}"`
    : 'Add Category';

  const slug = slugify(name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }
    if (description.trim() && description.trim().length < 10) {
      setError('Description must be at least 10 characters long, or left empty');
      return;
    }
    if (!slug) {
      setError('Name must contain at least one letter or number');
      return;
    }

    const data: CategoryInput = {
      name: name.trim(),
      slug,
      ...(description.trim() && { description: description.trim() }),
      ...(!isEdit && parentCategory && { parentId: parentCategory.id }),
    };

    try {
      setSubmitting(true);
      await onSubmit(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-gray-100 shadow-xl">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                id="category-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Home Services"
                autoFocus
                className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {slug && (
                <p className="text-xs text-gray-400 mt-1">URL slug: {slug}</p>
              )}
            </div>

            <div>
              <label htmlFor="category-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="category-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe this category"
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryFormModal;
