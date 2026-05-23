'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Clock,
  CheckCircle2,
  Users,
  TrendingUp,
  RefreshCw,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { toast } from 'sonner'
import { getStatusColor, getStatusLabel, formatDateTime } from '@/lib/utils'

// ─── Color Theme ────────────────────────────────────────────────────────────────
const COLORS = {
  navy: '#0c2d57',
  navyLight: '#1a4072',
  gold: '#c9a84c',
  goldLight: '#d4ba6a',
  success: '#22c55e',
  warning: '#eab308',
  danger: '#ef4444',
  info: '#3b82f6',
  slate: '#64748b',
}

const STATUS_COLORS: Record<string, string> = {
  menunggu: COLORS.warning,
  check_in: COLORS.info,
  dilayani: COLORS.gold,
  selesai: COLORS.success,
  ditolak: COLORS.danger,
  diproses: COLORS.info,
}

const STATUS_LABELS: Record<string, string> = {
  menunggu: 'Menunggu',
  check_in: 'Check In',
  dilayani: 'Dilayani',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
  diproses: 'Diproses',
}

// ─── Types ──────────────────────────────────────────────────────────────────────
interface ReportData {
  period: {
    type: string
    startDate: string
    endDate: string
  }
  summary: {
    totalGuests: number
    avgDurationMinutes: number
    completedVisits: number
  }
  statusBreakdown: {
    status: string
    count: number
  }[]
  departmentBreakdown: {
    departmentId: string
    departmentName: string
    count: number
  }[]
  purposeBreakdown: {
    purpose: string
    count: number
  }[]
  hourlyDistribution: {
    hour: number
    label: string
    count: number
  }[]
  dailyTrend: {
    date: string
    count: number
  }[]
  guests: {
    id: string
    name: string
    institution: string | null
    visitPurpose: string
    status: string
    visitDate: string
    department: { name: string } | null
    employee: { name: string } | null
  }[]
}

interface Department {
  id: string
  name: string
  code: string
}

// ─── Chart Configs ──────────────────────────────────────────────────────────────
const trendChartConfig: ChartConfig = {
  count: {
    label: 'Jumlah Kunjungan',
    color: COLORS.navy,
  },
}

const deptChartConfig: ChartConfig = {
  count: {
    label: 'Jumlah Kunjungan',
    color: COLORS.navy,
  },
}

const statusChartConfig: ChartConfig = {
  menunggu: { label: 'Menunggu', color: COLORS.warning },
  check_in: { label: 'Check In', color: COLORS.info },
  dilayani: { label: 'Dilayani', color: COLORS.gold },
  selesai: { label: 'Selesai', color: COLORS.success },
  ditolak: { label: 'Ditolak', color: COLORS.danger },
  diproses: { label: 'Diproses', color: COLORS.info },
}

// ─── Custom Pie Label ───────────────────────────────────────────────────────────
const RADIAN = Math.PI / 180

function renderCustomizedLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
}) {
  if (percent < 0.03) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ─── Skeleton Loaders ───────────────────────────────────────────────────────────
function ReportsSkeleton() {
  return (
    <div className="space-y-0">
      <div className="px-4 md:px-6 pt-5 pb-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48 mt-2" />
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-wrap gap-3 px-4 md:px-6 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-40 rounded-md" />
        ))}
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-6 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 md:px-6 mt-4">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>

      {/* Pie chart skeleton */}
      <div className="px-4 md:px-6 mt-4">
        <Skeleton className="h-72 rounded-xl" />
      </div>

      {/* Table skeleton */}
      <div className="px-4 md:px-6 mt-4 mb-6">
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState<Department[]>([])
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')

  // Set default dates based on report type
  const getDefaultDates = useCallback((type: string) => {
    const now = new Date()
    let from: Date
    let to: Date = now

    switch (type) {
      case 'daily':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'weekly':
        from = new Date(now)
        from.setDate(from.getDate() - 7)
        from.setHours(0, 0, 0, 0)
        break
      case 'monthly':
        from = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      default:
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }

    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    }
  }, [])

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/departments')
      const json = await res.json()
      if (json.success) {
        setDepartments(json.data)
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err)
    }
  }, [])

  // Fetch report data
  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const defaults = getDefaultDates(reportType)
      const dFrom = dateFrom || defaults.from
      const dTo = dateTo || defaults.to
      const deptId = selectedDepartment === 'all' ? '' : selectedDepartment

      const params = new URLSearchParams({
        type: reportType,
        dateFrom: dFrom,
        dateTo: dTo,
      })
      if (deptId) params.set('departmentId', deptId)

      const res = await fetch(`/api/reports?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      } else {
        toast.error('Gagal memuat data laporan')
      }
    } catch (err) {
      console.error('Failed to fetch report:', err)
      toast.error('Gagal memuat data laporan')
    } finally {
      setLoading(false)
    }
  }, [reportType, dateFrom, dateTo, selectedDepartment, getDefaultDates])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  // Reset dates when type changes
  const handleTypeChange = (type: 'daily' | 'weekly' | 'monthly') => {
    setReportType(type)
    const defaults = getDefaultDates(type)
    setDateFrom(defaults.from)
    setDateTo(defaults.to)
  }

  // Compute summary values
  const totalVisits = data?.summary.totalGuests || 0
  const completedCount =
    data?.statusBreakdown.find((s) => s.status === 'selesai')?.count || 0
  const notServedCount =
    (data?.statusBreakdown.find((s) => s.status === 'menunggu')?.count || 0) +
    (data?.statusBreakdown.find((s) => s.status === 'check_in')?.count || 0)
  const daysInRange = data?.dailyTrend.length || 1
  const avgPerDay = daysInRange > 0 ? Math.round(totalVisits / daysInRange) : 0

  // Transform data for charts
  const trendData = (data?.dailyTrend || []).map((d) => ({
    ...d,
    dateLabel: new Date(d.date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
    }),
  }))

  const deptBarData = (data?.departmentBreakdown || []).map((d) => ({
    name: d.departmentName.length > 14 ? d.departmentName.substring(0, 14) + '…' : d.departmentName,
    fullName: d.departmentName,
    count: d.count,
  }))

  const statusPieData = (data?.statusBreakdown || []).map((s) => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
    status: s.status,
    fill: STATUS_COLORS[s.status] || COLORS.slate,
  }))

  if (loading && !data) {
    return <ReportsSkeleton />
  }

  return (
    <div className="space-y-0">
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="px-4 md:px-6 pt-5 pb-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="text-2xl md:text-3xl font-bold tracking-tight"
            style={{ color: COLORS.navy }}
          >
            Laporan & Statistik
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Analisis data kunjungan tamu BKAD
          </p>
        </motion.div>
      </div>

      {/* ─── Filters ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="px-4 md:px-6 mt-3"
      >
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              {/* Report Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: COLORS.navy }}>
                  Jenis Laporan
                </label>
                <Select value={reportType} onValueChange={(v) => handleTypeChange(v as 'daily' | 'weekly' | 'monthly')}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Harian</SelectItem>
                    <SelectItem value="weekly">Mingguan</SelectItem>
                    <SelectItem value="monthly">Bulanan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: COLORS.navy }}>
                  Tanggal Mulai
                </label>
                <Input
                  type="date"
                  value={dateFrom || getDefaultDates(reportType).from}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-[160px]"
                />
              </div>

              {/* Date To */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: COLORS.navy }}>
                  Tanggal Akhir
                </label>
                <Input
                  type="date"
                  value={dateTo || getDefaultDates(reportType).to}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-[160px]"
                />
              </div>

              {/* Department Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: COLORS.navy }}>
                  Bidang
                </label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Semua Bidang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Bidang</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Refresh Button */}
              <Button
                onClick={() => fetchReport()}
                className="gap-1.5 text-white"
                style={{ backgroundColor: COLORS.navy }}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Summary Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-6 mt-4">
        {[
          {
            title: 'Total Kunjungan',
            value: totalVisits,
            icon: Users,
            bgColor: COLORS.navy,
            iconColor: COLORS.gold,
            delay: 0.15,
          },
          {
            title: 'Dilayani',
            value: completedCount,
            icon: CheckCircle2,
            bgColor: COLORS.success,
            iconColor: '#fff',
            delay: 0.2,
          },
          {
            title: 'Belum Dilayani',
            value: notServedCount,
            icon: Clock,
            bgColor: COLORS.warning,
            iconColor: COLORS.navy,
            delay: 0.25,
          },
          {
            title: 'Rata-rata / Hari',
            value: avgPerDay,
            icon: TrendingUp,
            bgColor: COLORS.gold,
            iconColor: COLORS.navy,
            delay: 0.3,
          },
        ].map((card) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: card.delay, ease: 'easeOut' }}
          >
            <Card
              className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow"
              style={{ backgroundColor: card.bgColor }}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">{card.title}</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {card.value.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div
                    className="rounded-full p-3"
                    style={{ backgroundColor: card.iconColor }}
                  >
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
              <div
                className="absolute bottom-0 left-0 right-0 h-1"
                style={{ backgroundColor: card.iconColor }}
              />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ─── Charts Row 1: Trend + Department Bar ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 md:px-6 mt-4">
        {/* Line Chart - Visit Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold" style={{ color: COLORS.navy }}>
                Tren Kunjungan
              </CardTitle>
              <CardDescription>
                Jumlah kunjungan per hari dalam periode yang dipilih
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ChartContainer config={trendChartConfig} className="h-[280px] w-full">
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 11, fill: COLORS.slate }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: COLORS.slate }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={COLORS.navy}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: COLORS.navy, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: COLORS.gold, stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bar Chart - Visits by Department */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold" style={{ color: COLORS.navy }}>
                Kunjungan per Bidang
              </CardTitle>
              <CardDescription>Distribusi kunjungan berdasarkan unit kerja</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ChartContainer config={deptChartConfig} className="h-[280px] w-full">
                <BarChart
                  data={deptBarData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: COLORS.slate }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: COLORS.slate }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, _name, item) => (
                          <span className="font-medium">{value} tamu — {item.payload.fullName}</span>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
                    {deptBarData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index % 2 === 0 ? COLORS.navy : COLORS.navyLight}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Pie Chart - Status Distribution ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="px-4 md:px-6 mt-4"
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold" style={{ color: COLORS.navy }}>
              Distribusi Status
            </CardTitle>
            <CardDescription>Persentase tamu berdasarkan status pelayanan</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="w-full lg:w-1/2">
                <ChartContainer config={statusChartConfig} className="h-[280px] w-full">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      nameKey="name"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                  </PieChart>
                </ChartContainer>
              </div>
              <div className="w-full lg:w-1/2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {statusPieData.map((s) => (
                    <div
                      key={s.status}
                      className="text-center px-3 py-3 rounded-lg"
                      style={{ backgroundColor: `${s.fill}15` }}
                    >
                      <div className="text-2xl font-bold" style={{ color: s.fill }}>
                        {s.value}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Detail Table ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="px-4 md:px-6 mt-4"
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold" style={{ color: COLORS.navy }}>
                  Detail Kunjungan
                </CardTitle>
                <CardDescription>
                  Data kunjungan dalam periode yang dipilih ({totalVisits} tamu)
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  style={{ borderColor: COLORS.navy, color: COLORS.navy }}
                  onClick={() => toast.info('Fitur export PDF akan segera hadir')}
                >
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  style={{ borderColor: COLORS.gold, color: COLORS.gold }}
                  onClick={() => toast.info('Fitur export Excel akan segera hadir')}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div
              className="max-h-96 overflow-y-auto"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: `${COLORS.navyLight} transparent`,
              }}
            >
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[50px] font-semibold" style={{ color: COLORS.navy }}>
                      No
                    </TableHead>
                    <TableHead className="font-semibold" style={{ color: COLORS.navy }}>
                      Nama
                    </TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold" style={{ color: COLORS.navy }}>
                      Bidang
                    </TableHead>
                    <TableHead className="hidden md:table-cell font-semibold" style={{ color: COLORS.navy }}>
                      Tujuan
                    </TableHead>
                    <TableHead className="font-semibold" style={{ color: COLORS.navy }}>
                      Status
                    </TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold text-right" style={{ color: COLORS.navy }}>
                      Waktu
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.guests && data.guests.length > 0 ? (
                    data.guests.map((guest, idx) => (
                      <motion.tr
                        key={guest.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.02 * idx }}
                        className="border-b transition-colors hover:bg-gray-50/80"
                      >
                        <TableCell>
                          <span
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold"
                            style={{ color: COLORS.navy }}
                          >
                            {idx + 1}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">{guest.name}</div>
                          {guest.institution && (
                            <div className="text-xs text-gray-400">{guest.institution}</div>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-sm text-gray-600">
                            {guest.department?.name || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-gray-600 max-w-[200px] truncate block">
                            {guest.visitPurpose}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(guest.status)}>
                            {getStatusLabel(guest.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-right">
                          <span className="text-sm text-gray-500">
                            {formatDateTime(guest.visitDate)}
                          </span>
                        </TableCell>
                      </motion.tr>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <Filter className="h-8 w-8 text-gray-300" />
                          <span>Tidak ada data kunjungan dalam periode ini</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Footer ────────────────────────────────────────────────── */}
      <footer
        className="mt-auto py-3 px-4 text-center text-xs text-white/70"
        style={{ backgroundColor: COLORS.navy }}
      >
        &copy; {new Date().getFullYear()} BKAD — E-Tamu Sistem Tamu Digital
      </footer>
    </div>
  )
}
