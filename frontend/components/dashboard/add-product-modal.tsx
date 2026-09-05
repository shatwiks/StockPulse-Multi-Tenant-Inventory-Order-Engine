'use client'

import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from './modal'
import { categories, type CategoryKey, type Product } from '@/lib/inventory-data'

type AddProductModalProps = {
  open: boolean
  onClose: () => void
  onCreate: (product: Product) => void
}

const fieldClass =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

export function AddProductModal({ open, onClose, onCreate }: AddProductModalProps) {
  const nameId = useId()
  const skuId = useId()
  const catId = useId()
  const priceId = useId()
  const stockId = useId()
  const reorderId = useId()

  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [category, setCategory] = useState<CategoryKey>('fasteners')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [reorderPoint, setReorderPoint] = useState('')

  function reset() {
    setName('')
    setSku('')
    setCategory('fasteners')
    setPrice('')
    setStock('')
    setReorderPoint('')
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    onCreate({
      id: `p-${Date.now()}`,
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category,
      price: Number.parseFloat(price) || 0,
      stock: Number.parseInt(stock, 10) || 0,
      reorderPoint: Number.parseInt(reorderPoint, 10) || 0,
    })
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add new product"
      description="Create a SKU and set its initial stock levels."
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-product-form">
            Save product
          </Button>
        </>
      }
    >
      <form id="add-product-form" onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-1.5">
          <label htmlFor={nameId} className="text-sm font-medium">
            Product name
          </label>
          <input
            id={nameId}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Hex Bolts M8 x 50mm"
            className={fieldClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label htmlFor={skuId} className="text-sm font-medium">
              SKU
            </label>
            <input
              id={skuId}
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="HEX-M8-50"
              className={`${fieldClass} font-mono uppercase`}
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor={catId} className="text-sm font-medium">
              Category
            </label>
            <select
              id={catId}
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryKey)}
              className={fieldClass}
            >
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <label htmlFor={priceId} className="text-sm font-medium">
              Unit price
            </label>
            <input
              id={priceId}
              required
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className={fieldClass}
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor={stockId} className="text-sm font-medium">
              Current stock
            </label>
            <input
              id={stockId}
              required
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="0"
              className={fieldClass}
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor={reorderId} className="text-sm font-medium">
              Reorder point
            </label>
            <input
              id={reorderId}
              required
              type="number"
              min="0"
              step="1"
              value={reorderPoint}
              onChange={(e) => setReorderPoint(e.target.value)}
              placeholder="0"
              className={fieldClass}
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
