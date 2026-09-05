import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { CategoryOption, NewProductFormData, ProductStatus } from './types';

interface AddProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewProductFormData) => void;
  categories: CategoryOption[];
}

export const AddProductDialog: React.FC<AddProductDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<NewProductFormData>({
    sku: '',
    name: '',
    categoryId: categories[0]?.id || '',
    unitPrice: 0,
    costPrice: 0,
    stockQuantity: 0,
    reorderPoint: 10,
    status: 'ACTIVE',
    description: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof NewProductFormData, string>>>({});

  // Trap focus & ESC key listener for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      setTimeout(() => firstInputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof NewProductFormData, string>> = {};

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (formData.unitPrice < 0) {
      newErrors.unitPrice = 'Unit price cannot be negative';
    }
    if (formData.costPrice < 0) {
      newErrors.costPrice = 'Cost price cannot be negative';
    }
    if (formData.stockQuantity < 0) {
      newErrors.stockQuantity = 'Stock quantity cannot be negative (CHECK constraint stock_quantity >= 0)';
    }
    if (formData.reorderPoint < 0) {
      newErrors.reorderPoint = 'Reorder point cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
      onClose();
      // Reset form
      setFormData({
        sku: '',
        name: '',
        categoryId: categories[0]?.id || '',
        unitPrice: 0,
        costPrice: 0,
        stockQuantity: 0,
        reorderPoint: 10,
        status: 'ACTIVE',
        description: '',
      });
      setErrors({});
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-product-dialog-title"
        aria-describedby="add-product-dialog-desc"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2
              id="add-product-dialog-title"
              className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2"
            >
              <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Add New Product to Catalog
            </h2>
            <p id="add-product-dialog-desc" className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enter product specifications, pricing, and initial stock quantities.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <X className="w-5 h-5" />
            <span className="sr-only">Close dialog</span>
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SKU */}
            <div>
              <label htmlFor="prod-sku" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                SKU (Stock Keeping Unit) <span className="text-rose-500">*</span>
              </label>
              <input
                ref={firstInputRef}
                id="prod-sku"
                name="sku"
                type="text"
                required
                placeholder="e.g. ASD-SEN-9300"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
              {errors.sku && <p className="text-xs text-rose-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.sku}</p>}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="prod-category" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                id="prod-category"
                name="category"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-slate-100"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label htmlFor="prod-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="prod-name"
              name="name"
              type="text"
              required
              placeholder="e.g. Dual-Core Digital Telemetry Processor"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.name}</p>}
          </div>

          {/* Pricing & Quantities */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {/* Unit Price */}
            <div>
              <label htmlFor="prod-unit-price" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Unit Price ($) <span className="text-rose-500">*</span>
              </label>
              <input
                id="prod-unit-price"
                name="unitPrice"
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.unitPrice || ''}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Cost Price */}
            <div>
              <label htmlFor="prod-cost-price" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Cost Price ($)
              </label>
              <input
                id="prod-cost-price"
                name="costPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.costPrice || ''}
                onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Current Stock */}
            <div>
              <label htmlFor="prod-stock" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Stock Count <span className="text-rose-500">*</span>
              </label>
              <input
                id="prod-stock"
                name="stockQuantity"
                type="number"
                step="1"
                min="0"
                required
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 font-semibold"
              />
              {errors.stockQuantity && <p className="text-[10px] text-rose-500 mt-0.5">{errors.stockQuantity}</p>}
            </div>

            {/* Reorder Point */}
            <div>
              <label htmlFor="prod-reorder" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Reorder Point
              </label>
              <input
                id="prod-reorder"
                name="reorderPoint"
                type="number"
                step="1"
                min="0"
                value={formData.reorderPoint}
                onChange={(e) => setFormData({ ...formData, reorderPoint: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Catalog Status */}
          <div>
            <label htmlFor="prod-status" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Catalog Status
            </label>
            <select
              id="prod-status"
              name="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
            >
              <option value="ACTIVE">ACTIVE (In Catalog & Purchasable)</option>
              <option value="DRAFT">DRAFT (Hidden from Storefront)</option>
              <option value="OUT_OF_STOCK">OUT OF STOCK</option>
              <option value="DISCONTINUED">DISCONTINUED (End of Life)</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="prod-desc" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Description & Specifications
            </label>
            <textarea
              id="prod-desc"
              name="description"
              rows={3}
              placeholder="Technical specifications, environmental tolerances, compliance standards..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none"
            />
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
