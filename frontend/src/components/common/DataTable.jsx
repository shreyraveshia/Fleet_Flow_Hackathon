import * as React from 'react';
import {
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
    ChevronLeft,
    ChevronRight,
    Search,
    LayoutList
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '../ui/table';
import { Skeleton } from '../ui/skeleton';
import { useDebounce } from '../../hooks/useDebounce';
import EmptyState from './EmptyState';

export default function DataTable({
    columns,
    data = [],
    isLoading = false,
    emptyMessage = "No records found matching your criteria",
    emptyIcon = LayoutList,
    onRowClick,
    searchable = true,
    searchPlaceholder = "Search...",
    onSearch,
    pagination = true,
    total = 0,
    page = 1,
    limit = 25,
    onPageChange,
    onLimitChange,
    getRowClassName
}) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortConfig, setSortConfig] = React.useState({ key: null, direction: null });

    const debouncedSearch = useDebounce(searchTerm, 300);

    React.useEffect(() => {
        if (onSearch) onSearch(debouncedSearch);
    }, [debouncedSearch, onSearch]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortedData = React.useMemo(() => {
        if (!sortConfig.key) return data;
        return [...data].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const totalPages = Math.ceil(total / limit);
    const startRange = (page - 1) * limit + 1;
    const endRange = Math.min(page * limit, total);

    return (
        <div className="space-y-4">
            {/* Table Controls */}
            {searchable && (
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="pl-10"
                        />
                    </div>
                    {pagination && (
                        <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
                            <span>Rows per page:</span>
                            <select
                                value={limit}
                                onChange={(e) => onLimitChange?.(parseInt(e.target.value))}
                                className="bg-transparent border-none focus:ring-0 cursor-pointer font-medium text-slate-900 dark:text-white"
                            >
                                {[10, 25, 50, 100].map(val => <option key={val} value={val}>{val}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            )}

            {/* Table Area */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                {columns.map((col) => (
                                    <TableHead
                                        key={col.key}
                                        style={{ width: col.width }}
                                        className={cn(col.sortable && "cursor-pointer select-none")}
                                        onClick={() => col.sortable && handleSort(col.key)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {col.label}
                                            {col.sortable && (
                                                sortConfig.key === col.key ? (
                                                    sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                                ) : <ChevronsUpDown className="h-3 w-3 opacity-30" />
                                            )}
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                /* Loading Skeletons */
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        {columns.map((col) => (
                                            <TableCell key={col.key}><Skeleton className="h-4 w-full" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : sortedData.length === 0 ? (
                                /* Empty State */
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-64 text-center">
                                        <EmptyState
                                            icon={emptyIcon}
                                            title="No results"
                                            message={emptyMessage}
                                            className="border-none bg-transparent"
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                /* Data Rows */
                                sortedData.map((row, rowIndex) => (
                                    <TableRow
                                        key={row._id || row.id}
                                        className={cn(
                                            onRowClick && "cursor-pointer",
                                            getRowClassName && getRowClassName(row)
                                        )}
                                        onClick={() => onRowClick?.(row)}
                                    >
                                        {columns.map((col) => (
                                            <TableCell key={col.key} className="py-4">
                                                {col.render ? col.render(row, col, rowIndex) : (row[col.key] ?? '-')}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination Footer */}
            {pagination && sortedData.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-2">
                    <p className="text-sm text-slate-500">
                        Showing <span className="font-medium text-slate-900 dark:text-white">{startRange}</span> to <span className="font-medium text-slate-900 dark:text-white">{endRange}</span> of <span className="font-medium text-slate-900 dark:text-white">{total}</span> results
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(page - 1)}
                            disabled={page === 1 || isLoading}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>
                        <div className="flex items-center gap-1 mx-2">
                            <span className="text-sm font-medium">Page {page}</span>
                            <span className="text-sm text-slate-500">of {totalPages}</span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(page + 1)}
                            disabled={page >= totalPages || isLoading}
                        >
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
