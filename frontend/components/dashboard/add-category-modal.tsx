'use client'

import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from './modal'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from '@/lib/toast-context'
import { Loader2 } from 'lucide-react'

type AddCategoryModalProps = {
  open: boolean
  onClose: () => void
  onCategoryCreated?: (category: any) => void
}

const fieldClass =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export function AddCategoryModal({ open, onClose, onCategoryCreated }: AddCategoryModalProps) {
  const queryClient = useQueryClient()
  const nameId = useId()
  const slugId = useId()
  const descId = useId()

  const [name, setName] = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [description, setDescription] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const computedSlug = customSlug.trim() ? slugify(customSlug) : slugify(name)

  function reset() {
    setName('')
    setCustomSlug('')
    setDescription('')
    setValidationError(null)
  }

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; slug?: string; description?: string }) => {
      return await apiClient.post('categories', payload)
    },
    onSuccess: (res: any) => {
      const newCat = res?.data
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success(
        `Category "${newCat?.name || name}" created successfully!`,
        'Category Created'
      )
      if (onCategoryCreated && newCat) {
        onCategoryCreated(newCat)
      }
      reset()
      onClose()
    },
    onError: (err: any) => {
      const msg = err.message || 'Failed to create category.'
      setValidationError(msg)
      toast.error(msg, 'Creation Error')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setValidationError(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setValidationError('Category name is required.')
      return
    }

    createMutation.mutate({
      name: trimmedName,
      slug: customSlug.trim() ? computedSlug : undefined,
      description: description.trim() || undefined,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create New Category"
      description="Add a tenant-isolated product classification category for inventory and POS checkout."
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-category-form"
            disabled={createMutation.isPending}
            className="gap-2"
          >
            {createMutation.isPending && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            {createMutation.isPending ? 'Creating Category...' : 'Create Category'}
          </Button>
        </div>
      }
    >
      <form id="add-category-form" onSubmit={handleSubmit} className="grid gap-4">
        {validationError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
          >
            {validationError}
          </div>
        )}

        <div className="grid gap-1.5">
          <label htmlFor={nameId} className="text-sm font-medium">
            Category Name <span className="text-destructive">*</span>
          </label>
          <input
            id={nameId}
            required
            maxLength={150}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Industrial Automation & Robotics"
            className={fieldClass}
            autoFocus
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor={slugId} className="text-sm font-medium">
            URL Slug <span className="text-xs text-muted-foreground">(optional)</span>
          </label>
          <input
            id={slugId}
            maxLength={150}
            value={customSlug}
            onChange={(e) => setCustomSlug(e.target.value)}
            placeholder={computedSlug || 'industrial-automation'}
            className={`${fieldClass} font-mono`}
          />
          {computedSlug && (
            <p className="text-xs text-muted-foreground">
              Slug preview: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">{computedSlug}</code>
            </p>
          )}
        </div>

        <div className="grid gap-1.5">
          <label htmlFor={descId} className="text-sm font-medium">
            Description <span className="text-xs text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id={descId}
            rows={3}
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Commercial robotics, automated conveyor belts, and sensors..."
            className={fieldClass}
          />
        </div>
      </form>
    </Modal>
  )
}
