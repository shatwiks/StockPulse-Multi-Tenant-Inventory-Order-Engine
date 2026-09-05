import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { statusMeta, type StockStatus } from '@/lib/inventory-data'
import { cn } from '@/lib/utils'

const styles: Record<
  StockStatus,
  { chip: string; dot: string; Icon: typeof CheckCircle2 }
> = {
  'in-stock': {
    chip: 'border-success/30 bg-success/12 text-success',
    dot: 'bg-success',
    Icon: CheckCircle2,
  },
  'low-stock': {
    chip: 'border-warning/30 bg-warning/12 text-warning',
    dot: 'bg-warning',
    Icon: AlertTriangle,
  },
  'out-of-stock': {
    chip: 'border-danger/35 bg-danger/15 text-danger',
    dot: 'bg-danger',
    Icon: XCircle,
  },
}

export function StatusBadge({
  status,
  className,
}: {
  status: StockStatus
  className?: string
}) {
  const { chip, Icon } = styles[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        chip,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {statusMeta[status].label}
    </span>
  )
}

export function StatusDot({ status }: { status: StockStatus }) {
  return (
    <span
      className={cn('inline-block size-2 rounded-full', styles[status].dot)}
      aria-hidden="true"
    />
  )
}
