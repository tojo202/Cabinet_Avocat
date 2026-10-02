import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Paginated } from '@/types'
import { Button } from '@/components/ui/button'

interface ListPaginationProps {
  meta?: Paginated<unknown>['meta']
  page: number
  onPageChange: (page: number) => void
  itemLabel?: string
}

export function ListPagination({ meta, page, onPageChange, itemLabel = 'élément' }: ListPaginationProps) {
  if (!meta || (meta.total <= 0 && meta.last_page <= 1)) return null

  const lastPage = meta.last_page

  return (
    <div className="mt-4 flex flex-col gap-3 border-t pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>
        {meta.total} {itemLabel}
        {meta.total > 1 ? 's' : ''} au total • Page {meta.current_page} sur {lastPage}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft className="size-4 mr-1" />
          Précédent
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          Suivant
          <ChevronRight className="size-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
