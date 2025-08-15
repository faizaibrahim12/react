"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import type { DataTableProps, Column, SortDirection } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { InputField } from "@/components/custom/input-field"
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  selectable = false,
  onRowSelect,
  className,
  searchable = false,
  searchPlaceholder = "Search...",
  paginated = false,
  pageSize = 10,
  showRowCount = true,
}: DataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<T[]>([])
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredData = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return data

    return data.filter((row) =>
      columns.some((column) => {
        if (column.searchable === false) return false
        const value = row[column.key]
        return String(value).toLowerCase().includes(searchQuery.toLowerCase())
      }),
    )
  }, [data, searchQuery, columns, searchable])

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn]
      const bValue = b[sortColumn]

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [filteredData, sortColumn, sortDirection])

  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData

    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return sortedData.slice(startIndex, endIndex)
  }, [sortedData, paginated, currentPage, pageSize])

  const totalPages = Math.ceil(sortedData.length / pageSize)
  const displayData = paginated ? paginatedData : sortedData

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return

    if (sortColumn === column.key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : prev === "desc" ? null : "asc"))
      if (sortDirection === "desc") {
        setSortColumn(null)
      }
    } else {
      setSortColumn(column.key)
      setSortDirection("asc")
    }
  }

  const handleRowSelect = (row: T, checked: boolean) => {
    const newSelectedRows = checked ? [...selectedRows, row] : selectedRows.filter((selectedRow) => selectedRow !== row)

    setSelectedRows(newSelectedRows)
    onRowSelect?.(newSelectedRows)
  }

  const handleSelectAll = (checked: boolean) => {
    const newSelectedRows = checked ? [...displayData] : []
    setSelectedRows(newSelectedRows)
    onRowSelect?.(newSelectedRows)
  }

  const isRowSelected = (row: T) =>
    selectedRows.some((selectedRow) => JSON.stringify(selectedRow) === JSON.stringify(row))
  const isAllSelected = displayData.length > 0 && displayData.every((row) => isRowSelected(row))
  const isIndeterminate = displayData.some((row) => isRowSelected(row)) && !isAllSelected ? true : undefined

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {(searchable || showRowCount) && (
        <div className="flex items-center justify-between gap-4">
          {searchable && (
            <div className="flex-1 max-w-sm">
              <InputField
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={handleSearch}
                clearable
                onClear={() => setSearchQuery("")}
                className="w-full"
              />
            </div>
          )}

          {showRowCount && (
            <div className="text-sm text-muted-foreground">
              {searchQuery ? (
                <>
                  {sortedData.length} of {data.length} rows
                  {paginated && ` (page ${currentPage} of ${totalPages})`}
                </>
              ) : (
                <>
                  {data.length} rows
                  {paginated && ` (page ${currentPage} of ${totalPages})`}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {displayData.length === 0 ? (
        <div className="flex items-center justify-center h-32 border border-border rounded-md">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">{searchQuery ? "No results found" : "No data available"}</p>
            {searchQuery && <p className="text-sm text-muted-foreground">Try adjusting your search terms</p>}
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  {selectable && (
                    <th className="w-12 p-4">
                      <Checkbox
                        checked={isAllSelected}
                        indeterminate={isIndeterminate}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all rows"
                      />
                    </th>
                  )}
                  {columns.map((column) => (
                    <th
                      key={String(column.key)}
                      className={cn(
                        "text-left p-4 font-medium text-muted-foreground",
                        column.sortable && "cursor-pointer hover:text-foreground transition-colors",
                      )}
                      onClick={() => handleSort(column)}
                    >
                      <div className="flex items-center gap-2">
                        {column.header}
                        {column.sortable && (
                          <div className="flex flex-col">
                            <ChevronUp
                              className={cn(
                                "h-3 w-3 transition-colors",
                                sortColumn === column.key && sortDirection === "asc"
                                  ? "text-foreground"
                                  : "text-muted-foreground/50",
                              )}
                            />
                            <ChevronDown
                              className={cn(
                                "h-3 w-3 -mt-1 transition-colors",
                                sortColumn === column.key && sortDirection === "desc"
                                  ? "text-foreground"
                                  : "text-muted-foreground/50",
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayData.map((row, index) => (
                  <tr
                    key={index}
                    className={cn(
                      "border-t border-border hover:bg-muted/50 transition-colors",
                      isRowSelected(row) && "bg-muted/30",
                    )}
                  >
                    {selectable && (
                      <td className="p-4">
                        <Checkbox
                          checked={isRowSelected(row)}
                          onCheckedChange={(checked) => handleRowSelect(row, !!checked)}
                          aria-label={`Select row ${index + 1}`}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={String(column.key)} className="p-4">
                        {column.render ? column.render(row[column.key], row) : String(row[column.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of{" "}
            {sortedData.length} results
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = i + 1
                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNumber}
                  </Button>
                )
              })}
              {totalPages > 5 && (
                <>
                  <span className="text-muted-foreground">...</span>
                  <Button
                    variant={currentPage === totalPages ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-8 h-8 p-0"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
