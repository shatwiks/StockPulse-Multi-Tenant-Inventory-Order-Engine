import React from 'react';
import { InventoryDataTable } from './InventoryDataTable';
import { Package, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';
import { initialMockProducts } from './mockData';

export const InventoryPage: React.FC = () => {
  // Aggregate KPIs
  const totalSkuCount = initialMockProducts.length;
  const inStockCount = initialMockProducts.filter((p) => p.stockQuantity > 0).length;
  const lowStockCount = initialMockProducts.filter(
    (p) => p.stockQuantity > 0 && p.stockQuantity <= p.reorderPoint
  ).length;
  const totalValuation = initialMockProducts.reduce(
    (sum, p) => sum + p.stockQuantity * p.unitPrice,
    0
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-8 space-y-6">
      {/* Top Tenant Navigation / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Tenants</span>
            <span>/</span>
            <span className="text-indigo-600 dark:text-indigo-400">AeroShield Dynamics Corp.</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Enterprise Inventory Management
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>PostgreSQL Read Committed / RLS Active</span>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total SKUs */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total SKUs</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalSkuCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Active In-Stock */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Stock</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{inStockCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Low Stock Reorder Alerts */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Alerts</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{lowStockCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Total Inventory Valuation */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inventory Value</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              ${totalValuation.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Accessible Inventory Data Table */}
      <InventoryDataTable />
    </div>
  );
};

export default InventoryPage;
