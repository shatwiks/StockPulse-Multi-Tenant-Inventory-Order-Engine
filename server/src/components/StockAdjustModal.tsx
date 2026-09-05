import React, { useState, useEffect, useRef } from 'react';
import { X, Layers, AlertCircle } from 'lucide-react';
import { InventoryProduct } from './types';

interface StockAdjustModalProps {
  product: InventoryProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (productId: string, newStock: number, reason: string) => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [adjustment, setAdjustment] = useState<number>(0);
  const [reason, setReason] = useState<string>('Cycle Count Reconciliation');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setAdjustment(0);
      setError('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const resultingStock = product.stockQuantity + adjustment;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resultingStock < 0) {
      setError(`Cannot reduce stock below 0. Resulting stock would be ${resultingStock}. (Enforces CHECK constraint stock_quantity >= 0)`);
      return;
    }
    onConfirm(product.id, resultingStock, reason);
    onClose();
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="adjust-stock-title"
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 id="adjust-stock-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Adjust Inventory Count
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
            <span className="sr-only">Close adjust stock modal</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-1">
            <p className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
              {product.sku}
            </p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
              {product.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Current Available Stock: <span className="font-semibold text-slate-900 dark:text-slate-100">{product.stockQuantity} units</span>
            </p>
          </div>

          <div>
            <label htmlFor="adjust-qty" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Adjustment Quantity (+/- units)
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                id="adjust-qty"
                type="number"
                step="1"
                required
                value={adjustment || ''}
                onChange={(e) => {
                  setAdjustment(parseInt(e.target.value, 10) || 0);
                  setError('');
                }}
                className="w-full px-3 py-2 text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-slate-100"
                placeholder="e.g. +25 or -10"
              />
              <div className="text-sm whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium">
                New Total: <span className={`font-bold ${resultingStock < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-slate-100'}`}>{resultingStock}</span>
              </div>
            </div>
            {error && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="adjust-reason" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Audit Reason
            </label>
            <select
              id="adjust-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
            >
              <option value="Cycle Count Reconciliation">Cycle Count Reconciliation</option>
              <option value="Warehouse Receiving Restock">Warehouse Receiving Restock</option>
              <option value="Damaged / Scrap Write-off">Damaged / Scrap Write-off</option>
              <option value="Customer Return Restock">Customer Return Restock</option>
              <option value="Manual Audit Adjustment">Manual Audit Adjustment</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resultingStock < 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm"
            >
              Apply Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
