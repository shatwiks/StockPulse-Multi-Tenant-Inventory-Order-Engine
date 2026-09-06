'use client'

import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from './modal'
import { AddCategoryModal } from './add-category-modal'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from '@/lib/toast-context'
import { Loader2, Plus } from 'lucide-react'

type AddProductModalProps = {
  open: boolean
  onClose: () => void
}

const fieldClass =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

export function AddProductModal({ open, onClose }: AddProductModalProps) {
  const queryClient = useQueryClient()
  const nameId = useId()
  const skuId = useId()
  const catId = useId()
  const priceId = useId()
  const stockId = useId()
  const reorderId = useId()
  const descId = useId()

  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [reorderPoint, setReorderPoint] = useState('10')
  const [description, setDescription] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showAddCategory, setShowAddCategory] = useState(false)

  // Fetch categories from live backend
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get('categories')
      return res.data || []
    },
    enabled: open,
  })

  const categoriesList = categoriesData || []

  function reset() {
    setName('')
    setSku('')
    setCategoryId('')
    setPrice('')
    setStock('')
    setReorderPoint('10')
    setDescription('')
    setValidationError(null)
  }

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post('products', payload)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(`Product ${data.data?.sku || ''} created successfully!`, 'Product Saved')
      reset()
      onClose()
    },
    onError: (err: any) => {
      const msg = err.message || 'Failed to create product.'
      setValidationError(msg)
      toast.error(msg, 'Creation Error')
    },
  })

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setValidationError(null)

    // Client-side validation guardrails
    const parsedPrice = Number.parseFloat(price)
    const parsedStock = Number.parseInt(stock, 10)
    const parsedReorder = Number.parseInt(reorderPoint, 10)

    if (!name.trim()) {
      setValidationError('Product name is required.')
      return
    }
    if (!sku.trim()) {
      setValidationError('SKU is required.')
      return
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setValidationError('Unit price must be strictly greater than 0.')
      return
    }
    if (isNaN(parsedStock) || parsedStock < 0) {
      setValidationError('Current stock must be greater than or equal to 0.')
      return
    }
    if (isNaN(parsedReorder) || parsedReorder < 0) {
      setValidationError('Reorder point must be greater than or equal to 0.')
      return
    }

    const selectedCat = categoryId || categoriesList[0]?.id
    if (!selectedCat) {
      setValidationError('Please select a valid category.')
      return
    }

    createMutation.mutate({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      categoryId: selectedCat,
      unitPrice: parsedPrice,
      costPrice: parsedPrice * 0.6, // estimated 40% margin
      stockQuantity: parsedStock,
      reorderLevel: parsedReorder,
      description: description.trim() || undefined,
    })
  }

  return (
    <>
      <Modal
        open={open}
      onClose={onClose}
      title="Add new product"
      description="Create a verified SKU and establish initial inventory stock levels."
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-product-form"
            disabled={createMutation.isPending}
            className="gap-2"
          >
            {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            <span>{createMutation.isPending ? 'Saving...' : 'Save product'}</span>
          </Button>
        </>
      }
    >
      <form id="add-product-form" onSubmit={handleSubmit} className="grid gap-4">
        {validationError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/15 px-3 py-2 text-xs font-semibold text-destructive"
          >
            {validationError}
          </div>
        )}

        <div className="grid gap-1.5">
          <label htmlFor={nameId} className="text-sm font-medium">
            Product name <span className="text-destructive">*</span>
          </label>
          <input
            id={nameId}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Wireless Noise-Cancelling Headphones"
            className={fieldClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label htmlFor={skuId} className="text-sm font-medium">
              SKU <span className="text-destructive">*</span>
            </label>
            <input
              id={skuId}
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="BHT-SAF-1005"
              className={`${fieldClass} font-mono uppercase`}
            />
          </div>
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={catId} className="text-sm font-medium">
                Category <span className="text-destructive">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddCategory(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <Plus className="size-3" aria-hidden="true" />
                <span>New Category</span>
              </button>
            </div>
            <select
              id={catId}
              value={categoryId || categoriesList[0]?.id || ''}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={categoriesLoading}
              className={fieldClass}
            >
              {categoriesList.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <label htmlFor={priceId} className="text-sm font-medium">
              Unit price (INR) <span className="text-destructive">*</span>
            </label>
            <input
              id={priceId}
              required
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="2499.00"
              className={fieldClass}
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor={stockId} className="text-sm font-medium">
              Initial stock <span className="text-destructive">*</span>
            </label>
            <input
              id={stockId}
              required
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="50"
              className={fieldClass}
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor={reorderId} className="text-sm font-medium">
              Reorder point <span className="text-destructive">*</span>
            </label>
            <input
              id={reorderId}
              required
              type="number"
              min="0"
              step="1"
              value={reorderPoint}
              onChange={(e) => setReorderPoint(e.target.value)}
              placeholder="10"
              className={fieldClass}
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor={descId} className="text-sm font-medium">
            Description (Optional)
          </label>
          <textarea
            id={descId}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed specifications or warehouse bin instructions..."
            className={`${fieldClass} resize-none`}
          />
        </div>
      </form>
    </Modal>
    <AddCategoryModal
      open={showAddCategory}
      onClose={() => setShowAddCategory(false)}
      onCategoryCreated={(newCat) => {
        setCategoryId(newCat.id)
        setShowAddCategory(false)
      }}
    />
  </>
  )
}
