'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Shield,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  Activity,
  User,
  Globe,
} from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn, formatDateTime } from '@/lib/utils'

interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string
  details: string
  ipAddress: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  } | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  LOGIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  LOGOUT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  STATUS_CHANGE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
}

const ENTITY_COLORS: Record<string, string> = {
  Guest: 'bg-navy/10 text-navy dark:bg-navy-light/20 dark:text-gold-light',
  Department: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  Employee: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  User: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  Disposition: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  Settings: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
}

export default function AuditLogViewer() {
  const [logs, setLogs] = React.useState<AuditLog[]>([])
  const [pagination, setPagination] = React.useState<Pagination>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [actionFilter, setActionFilter] = React.useState('all')
  const [entityFilter, setEntityFilter] = React.useState('all')

  const fetchLogs = React.useCallback(
    async (page: number = 1) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(pagination.limit))
        if (actionFilter && actionFilter !== 'all')
          params.set('action', actionFilter)
        if (entityFilter && entityFilter !== 'all')
          params.set('entity', entityFilter)

        const res = await fetch(`/api/audit-logs?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setLogs(data.data || [])
          if (data.pagination) {
            setPagination(data.pagination)
          }
        } else {
          toast.error('Gagal memuat log audit')
        }
      } catch {
        toast.error('Terjadi kesalahan jaringan')
      } finally {
        setLoading(false)
      }
    },
    [actionFilter, entityFilter, pagination.limit]
  )

  React.useEffect(() => {
    fetchLogs(1)
  }, [actionFilter, entityFilter, fetchLogs])

  const handlePageChange = (page: number) => {
    fetchLogs(page)
  }

  // Filter logs by search on client side
  const filteredLogs = React.useMemo(() => {
    if (!search.trim()) return logs
    const q = search.toLowerCase()
    return logs.filter(
      (log) =>
        log.details?.toLowerCase().includes(q) ||
        log.user?.name?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.entity?.toLowerCase().includes(q) ||
        log.ipAddress?.toLowerCase().includes(q)
    )
  }, [logs, search])

  const renderPagination = () => {
    const { page, totalPages } = pagination
    const pages: (number | string)[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('...')
      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (page < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t">
        <p className="text-sm text-muted-foreground">
          Menampilkan {filteredLogs.length} dari {pagination.total} log
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="size-4" />
          </Button>
          {pages.map((p, i) =>
            typeof p === 'string' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm">
                ...
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(p)}
                className={cn(
                  'h-8 w-8 p-0',
                  p === page &&
                    'bg-navy text-white hover:bg-navy-light'
                )}
              >
                {p}
              </Button>
            )
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-l-4 border-l-gold">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-lg bg-navy/10 dark:bg-navy-light/20">
                  <Shield className="size-5 text-navy dark:text-gold" />
                </div>
                <div>
                  <CardTitle className="text-xl text-navy dark:text-gold">
                    Log Audit
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Riwayat aktivitas dan perubahan data sistem
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="border-gold/30 text-gold dark:text-gold-light"
              >
                <Activity className="size-3 mr-1" />
                {pagination.total} log
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Cari log audit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="size-4 text-muted-foreground flex-shrink-0" />
                <Select
                  value={actionFilter}
                  onValueChange={setActionFilter}
                >
                  <SelectTrigger className="w-full sm:w-[160px] h-9">
                    <SelectValue placeholder="Filter Aksi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Aksi</SelectItem>
                    <SelectItem value="CREATE">Create</SelectItem>
                    <SelectItem value="UPDATE">Update</SelectItem>
                    <SelectItem value="DELETE">Delete</SelectItem>
                    <SelectItem value="LOGIN">Login</SelectItem>
                    <SelectItem value="LOGOUT">Logout</SelectItem>
                    <SelectItem value="STATUS_CHANGE">Status Change</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={entityFilter}
                  onValueChange={setEntityFilter}
                >
                  <SelectTrigger className="w-full sm:w-[160px] h-9">
                    <SelectValue placeholder="Filter Entitas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Entitas</SelectItem>
                    <SelectItem value="Guest">Tamu</SelectItem>
                    <SelectItem value="Department">Bidang</SelectItem>
                    <SelectItem value="Employee">Pegawai</SelectItem>
                    <SelectItem value="User">Pengguna</SelectItem>
                    <SelectItem value="Disposition">Disposisi</SelectItem>
                    <SelectItem value="Settings">Pengaturan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardContent className="p-0">
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[180px]">Waktu</TableHead>
                    <TableHead className="w-[150px]">Pengguna</TableHead>
                    <TableHead className="w-[130px]">Aksi</TableHead>
                    <TableHead className="w-[120px]">Entitas</TableHead>
                    <TableHead>Detail</TableHead>
                    <TableHead className="w-[130px]">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        <TableCell>
                          <Skeleton className="h-4 w-[140px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-[80px] rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-[70px] rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-full max-w-[250px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <FileText className="size-10 opacity-40" />
                          <p className="font-medium">Tidak ada log audit</p>
                          <p className="text-sm">
                            Coba ubah filter atau kata kunci pencarian
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <AnimatePresence>
                      {filteredLogs.map((log, index) => (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="hover:bg-muted/50 border-b transition-colors"
                        >
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1.5">
                              <Activity className="size-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="whitespace-nowrap">
                                {formatDateTime(log.createdAt)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center size-6 rounded-full bg-navy/10 dark:bg-navy-light/20 flex-shrink-0">
                                <User className="size-3 text-navy dark:text-gold" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {log.user?.name || 'System'}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {log.user?.email || '-'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                'text-xs font-medium',
                                ACTION_COLORS[log.action] ||
                                  'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                              )}
                            >
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs font-medium',
                                ENTITY_COLORS[log.entity] || ''
                              )}
                            >
                              {log.entity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-muted-foreground max-w-[300px] truncate">
                              {log.details || '-'}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Globe className="size-3.5 flex-shrink-0" />
                              <span>{log.ipAddress || '-'}</span>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {!loading && filteredLogs.length > 0 && renderPagination()}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
