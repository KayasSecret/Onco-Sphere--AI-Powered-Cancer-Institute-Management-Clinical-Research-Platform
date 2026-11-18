import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
  RiSearchLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseCircleLine,
  RiDatabase2Line,
} from 'react-icons/ri'
import EmptyState from './EmptyState'

/**
 * Reusable DataTable component
 * Props:
 * - columns: { header: string, accessor: string | function, cell?: function }[]
 * - items: array of objects
 * - total: total count (for server side paginated data)
 * - page: current page
 * - limit: items per page
 * - onPageChange: callback function(page)
 * - searchPlaceholder: string
 * - onSearchChange: callback function(search_term)
 * - emptyMessage: string
 */
export default function DataTable({
  columns,
  items = [],
  total = 0,
  page = 1,
  limit = 10,
  onPageChange,
  searchPlaceholder = 'Search...',
  onSearchChange,
  emptyMessage = 'No records found.',
}) {
  const [searchValue, setSearchValue] = useState('')

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (onSearchChange) {
      onSearchChange(searchValue)
    }
  }

  const handleClearSearch = () => {
    setSearchValue('')
    if (onSearchChange) {
      onSearchChange('')
    }
  }

  const totalPages = Math.ceil(total / limit) || 1
  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1
  const endRecord = Math.min(page * limit, total)

  return (
    <div className="space-y-4">
      {/* ── Search & Registry Control Bar ────────────────────────────────── */}
      {onSearchChange && (
        <div className="onco-search-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-card border border-surface-border shadow-xs">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2.5 w-full sm:max-w-md"
          >
            <div className="relative flex-1 group">
              <RiSearchLine
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-secondary group-focus-within:text-brand-blue dark:group-focus-within:text-sky-400 transition-colors pointer-events-none"
              />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10 pr-9 h-10 bg-surface-base/70 dark:bg-slate-900/60 border-surface-border focus-visible:border-brand-blue focus-visible:ring-2 focus-visible:ring-brand-blue/20 text-ink-primary placeholder:text-ink-disabled text-xs sm:text-sm rounded-lg transition-all"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  title="Clear search"
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-disabled hover:text-ink-primary transition-colors p-0.5 cursor-pointer"
                >
                  <RiCloseCircleLine size={16} />
                </button>
              )}
            </div>
            <Button
              type="submit"
              className="onco-btn-search h-10 px-5 text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
            >
              Search
            </Button>
          </form>

          {/* Registry Telemetry Counter */}
          <div className="hidden md:flex items-center gap-2 text-xs text-ink-secondary bg-surface-base/80 dark:bg-slate-900/50 border border-surface-border/80 px-3 py-1.5 rounded-lg shrink-0">
            <RiDatabase2Line size={14} className="text-brand-blue dark:text-sky-400" />
            <span>
              Registry Volume:{' '}
              <strong className="font-mono font-bold text-ink-primary">{total}</strong>{' '}
              {total === 1 ? 'record' : 'records'}
            </span>
          </div>
        </div>
      )}

      {/* ── Enterprise Clinical Data Table ───────────────────────────────── */}
      <div className="onco-table-shell border border-surface-border rounded-xl bg-surface-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="onco-table-header border-b border-surface-border">
              <TableRow className="hover:bg-transparent">
                {columns.map((col, idx) => (
                  <TableHead
                    key={idx}
                    className={`text-brand-navy dark:text-slate-300 font-bold text-[11px] py-3.5 px-4 uppercase tracking-[0.09em] text-left whitespace-nowrap${
                      col.headerClassName ? ` ${col.headerClassName}` : ''
                    }`}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-surface-border/70">
              {items.length > 0 ? (
                items.map((row, rowIdx) => (
                  <TableRow
                    key={row.id || rowIdx}
                    className="onco-table-row group transition-colors duration-150"
                  >
                    {columns.map((col, colIdx) => {
                      let val = ''
                      if (typeof col.accessor === 'function') {
                        val = col.accessor(row)
                      } else if (col.accessor) {
                        val = row[col.accessor]
                      }

                      return (
                        <TableCell
                          key={colIdx}
                          className={`py-4 px-4 text-sm text-ink-primary align-middle${
                            col.cellClassName ? ` ${col.cellClassName}` : ''
                          }`}
                        >
                          {col.cell ? col.cell(row, val) : val}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="p-10">
                    <EmptyState message={emptyMessage} />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Server-Side Pagination Footer ──────────────────────────────── */}
        {onPageChange && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-surface-base/50 dark:bg-slate-900/40 border-t border-surface-border text-xs text-ink-secondary font-medium">
            <div>
              Showing <span className="text-ink-primary font-bold font-mono">{startRecord}</span> to{' '}
              <span className="text-ink-primary font-bold font-mono">{endRecord}</span> of{' '}
              <span className="text-ink-primary font-bold font-mono">{total}</span> clinical records
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8 rounded-lg border-surface-border bg-surface-card hover:bg-surface-hover cursor-pointer"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                aria-label="Previous page"
              >
                <RiArrowLeftSLine size={16} />
              </Button>
              <span className="px-2.5 py-1 rounded-md bg-surface-card border border-surface-border font-mono text-[11px]">
                Page <span className="text-ink-primary font-bold">{page}</span> / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8 rounded-lg border-surface-border bg-surface-card hover:bg-surface-hover cursor-pointer"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                aria-label="Next page"
              >
                <RiArrowRightSLine size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
