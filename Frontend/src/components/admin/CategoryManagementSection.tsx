import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, FolderTree, Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import Button from '../shared/Button';
import ConfirmationModal from './ConfirmationModal';
import CategoryFormModal from './CategoryFormModal';
import { adminApi, type Category, type CategoryInput } from '../../api/adminApi';
import { showSuccessToast, showErrorToast } from '../../utils/toastUtils';

const CategoryManagementSection: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentForNew, setParentForNew] = useState<Category | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setParentForNew(null);
    setFormOpen(true);
  };

  const openAddSubcategory = (parent: Category) => {
    setEditingCategory(null);
    setParentForNew(parent);
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setParentForNew(null);
    setFormOpen(true);
  };

  const handleSubmit = async (data: CategoryInput) => {
    if (editingCategory) {
      const response = await adminApi.updateCategory(editingCategory.id, data);
      if (!response.success) throw new Error(response.message);
      showSuccessToast('Category updated successfully');
    } else {
      const response = await adminApi.createCategory(data);
      if (!response.success) throw new Error(response.message);
      showSuccessToast(data.parentId ? 'Subcategory created successfully' : 'Category created successfully');
      if (data.parentId) {
        setExpanded((prev) => new Set(prev).add(data.parentId!));
      }
    }
    await fetchCategories();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteCategory(deleteTarget.id);
      showSuccessToast('Category deleted successfully');
      await fetchCategories();
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Failed to delete category');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm">
          Manage the categories and subcategories customers use to browse services.
        </p>
        <Button onClick={openAddCategory} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-10 text-center">
          <FolderTree className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No categories yet. Create the first one to get started.</p>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 overflow-hidden">
          {categories.map((category) => {
            const isExpanded = expanded.has(category.id);
            const children = category.children || [];
            return (
              <div key={category.id}>
                <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(category.id)}
                    className="flex items-center gap-2 min-w-0 text-left flex-1"
                  >
                    {children.length > 0 ? (
                      isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )
                    ) : (
                      <span className="w-4 flex-shrink-0" />
                    )}
                    <Tag className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900 truncate">{category.name || category.slug}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {children.length > 0 && `${children.length} subcategories · `}
                      {category._count?.services ?? 0} services
                    </span>
                  </button>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                    <button
                      type="button"
                      onClick={() => openAddSubcategory(category)}
                      title="Add subcategory"
                      className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(category)}
                      title="Edit"
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(category)}
                      title="Delete"
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && children.length > 0 && (
                  <div className="bg-gray-50 divide-y divide-gray-100">
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between pl-11 pr-4 py-2.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Tag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate">{child.name || child.slug}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {child._count?.services ?? 0} services
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                          <button
                            type="button"
                            onClick={() => openEdit(child)}
                            title="Edit"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(child)}
                            title="Delete"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CategoryFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        category={editingCategory}
        parentCategory={parentForNew}
      />

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete "${deleteTarget?.name || ''}"?`}
        message={
          deleteTarget?.children && deleteTarget.children.length > 0
            ? 'This category has subcategories and cannot be deleted until they are removed or reassigned.'
            : (deleteTarget?._count?.services ?? 0) > 0
            ? 'This category has services assigned to it and cannot be deleted until they are moved to another category.'
            : 'This action cannot be undone.'
        }
        confirmButtonText="Delete"
        confirmButtonColor="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default CategoryManagementSection;
