'use client'

import { ChevronRight } from 'lucide-react'
import { Fragment } from 'react'

type BreadcrumbsProps = {
  trail: string[]
}

export function Breadcrumbs({ trail }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm">
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1
          return (
            <Fragment key={crumb}>
              <li className="min-w-0">
                {isLast ? (
                  <span
                    aria-current="page"
                    className="truncate font-medium text-foreground"
                  >
                    {crumb}
                  </span>
                ) : (
                  <span className="truncate text-muted-foreground">{crumb}</span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className="text-muted-foreground/60">
                  <ChevronRight className="size-4" />
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
