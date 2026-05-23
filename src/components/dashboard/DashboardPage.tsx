'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  TrendingUp,
  BarChart3,
  Clock,
  Users,
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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

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
}

const STATUS_LABELS: Record<string, string> = {
  menunggu: 'Menunggu',
  check_in: 'Check In',
  dilayani: 'Dilayani',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  menunggu: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  check_in: 'bg-blue-100 text-blue-800 border-blue-300',
  dilayani: 'bg-amber-100 text-amber-800 border-amber-300',
  selesai: 'bg-green-100 text-green-800 border-green-300',
  ditolak: 'bg-red-100 text-red-800 border-red-300',
}

// ─── Types ──────────────────────────────────────────────────────────────────────
interface DashboardData {
  overview: {
    today: number
    thisWeek: number
    thisMonth: number
    total: number
    activeEmployees: number
  }
  guestsByStatus: Record<string, number>
  guestsByDepartment: {
    departmentId: string
    departmentName: string
    count: number
  }[]
  recentGuests: {
    id: string
    name: string
    institution: string | null
    visitPurpose: string
    status: string
    visitDate: string
    checkInTime: string | null
    department: { name: string } | null
    employee: { name: string } | null
  }[]
  hourlyDistribution: {
    hour: number
    count: number
    label: string
  }[]
  weeklyTrend: {
    date: string
    dayName: string
    count: number
  }[]
  dispositionStats: {
    status: string
    count: number
  }[]
}

// ─── Animated Counter ───────────────────────────────────────────────────────────
function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(value)

  useEffect(() => {
    ref.current = value
    const start = display
    const end = value
    const startTime = performance.now()

    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + (end - start) * eased))
      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }
    requestAnimationFrame(step)
  }, [value, duration])

  return <>{display.toLocaleString('id-ID')}</>
}

// ─── Clock Widget ───────────────────────────────────────────────────────────────
function ClockWidget() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeStr = time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const dateStr = time.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="text-center md:text-right">
      <div className="text-3xl md:text-4xl font-bold font-mono tracking-widest" style={{ color: COLORS.navy }}>
        {timeStr}
      </div>
      <div className="text-sm mt-1 font-medium" style={{ color: COLORS.gold }}>
        {dateStr}
      </div>
    </div>
  )
}

// ─── Marquee Running Text ───────────────────────────────────────────────────────
function RunningText({ text }: { text: string }) {
  if (!text) return null

  return (
    <div
      className="overflow-hidden w-full"
      style={{ backgroundColor: COLORS.navy }}
    >
      <div className="flex items-center py-2">
        <div className="shrink-0 px-3 py-0.5 text-xs font-bold uppercase tracking-wider mr-4 rounded-sm" style={{ backgroundColor: COLORS.gold, color: COLORS.navy }}>
          Info
        </div>
        <div className="relative overflow-hidden flex-1">
          <motion.div
            className="whitespace-nowrap text-sm font-medium"
            style={{ color: COLORS.gold }}
            animate={{ x: ['100%', '-100%'] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: Math.max(15, text.length * 0.15),
                ease: 'linear',
              },
            }}
          >
            {text}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// ─── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon: Icon,
  bgColor,
  iconColor,
  delay = 0,
}: {
  title: string
  value: number
  icon: React.ElementType
  bgColor: string
  iconColor: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      <Card
        className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow"
        style={{ backgroundColor: bgColor }}
      >
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90 text-white/80">
                {title}
              </p>
              <p className="text-3xl md:text-4xl font-bold text-white mt-1">
                <AnimatedCounter value={value} />
              </p>
            </div>
            <div
              className="rounded-full p-3"
              style={{ backgroundColor: iconColor }}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
        {/* Decorative bottom stripe */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: iconColor }}
        />
      </Card>
    </motion.div>
  )
}

// ─── Chart Configs ──────────────────────────────────────────────────────────────
const weeklyChartConfig: ChartConfig = {
  count: {
    label: 'Jumlah Tamu',
    color: COLORS.navy,
  },
}

const hourlyChartConfig: ChartConfig = {
  count: {
    label: 'Jumlah Tamu',
    color: COLORS.gold,
  },
}

const statusChartConfig: ChartConfig = {
  menunggu: { label: 'Menunggu', color: COLORS.warning },
  check_in: { label: 'Check In', color: COLORS.info },
  dilayani: { label: 'Dilayani', color: COLORS.gold },
  selesai: { label: 'Selesai', color: COLORS.success },
  ditolak: { label: 'Ditolak', color: COLORS.danger },
}

const deptChartConfig: ChartConfig = {
  count: {
    label: 'Jumlah Tamu',
    color: COLORS.navy,
  },
}

// ─── Skeleton Loaders ───────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-0">
      {/* Header skeleton */}
      <div className="px-4 md:px-6 pt-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-12 w-48" />
        </div>
      </div>

      {/* Stat cards skeleton */}
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

      {/* Middle row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 md:px-6 mt-4">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>

      {/* Table skeleton */}
      <div className="px-4 md:px-6 mt-4 mb-6">
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  )
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

// ─── Main Dashboard ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [runningText, setRunningText] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard')
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRunningText = useCallback(async () => {
    try {
      const res = await fetch('/api/settings')
      const json = await res.json()
      if (json.success && json.data) {
        setRunningText(json.data.running_text || json.data.marquee_text || 'Selamat datang di E-Tamu BKAD — Sistem Tamu Digital')
      }
    } catch {
      setRunningText('Selamat datang di E-Tamu BKAD — Sistem Tamu Digital')
    }
  }, [])

  const handleRefresh = useCallback(() => {
    setLoading(true)
    fetchDashboard()
    setLastRefresh(new Date())
  }, [fetchDashboard])

  useEffect(() => {
    fetchDashboard()
    fetchRunningText()
  }, [fetchDashboard, fetchRunningText])

  if (loading || !data) {
    return <DashboardSkeleton />
  }

  // Transform data for charts
  const statusPieData = Object.entries(data.guestsByStatus).map(([key, value]) => ({
    name: STATUS_LABELS[key] || key,
    value,
    status: key,
    fill: STATUS_COLORS[key] || COLORS.slate,
  }))

  const deptBarData = data.guestsByDepartment.map((d) => ({
    name: d.departmentName.length > 12 ? d.departmentName.substring(0, 12) + '…' : d.departmentName,
    fullName: d.departmentName,
    count: d.count,
  }))

  // Filter hourly distribution to only show working hours (7-17)
  const workingHoursData = data.hourlyDistribution.filter(
    (h) => h.hour >= 7 && h.hour <= 17
  )

  // Calculate waiting count
  const waitingCount = (data.guestsByStatus.menunggu || 0) + (data.guestsByStatus.check_in || 0)

  return (
    <div className="space-y-0">
      {/* ─── Running Text ──────────────────────────────────────────── */}
      <RunningText text={runningText} />

      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="px-4 md:px-6 pt-5 pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1
              className="text-2xl md:text-3xl font-bold tracking-tight"
              style={{ color: COLORS.navy }}
            >
              Dashboard E-Tamu
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Badan Keuangan dan Aset Daerah
            </p>
          </motion.div>
          <div className="flex items-center gap-4">
            <ClockWidget />
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Refresh data"
            >
              <RefreshCw
                className="h-5 w-5"
                style={{ color: COLORS.navy }}
              />
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Terakhir diperbarui: {lastRefresh.toLocaleTimeString('id-ID')}
        </div>
      </div>

      {/* ─── Stat Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-6 mt-2">
        <StatCard
          title="Tamu Hari Ini"
          value={data.overview.today}
          icon={Calendar}
          bgColor={COLORS.navy}
          iconColor={COLORS.gold}
          delay={0}
        />
        <StatCard
          title="Tamu Minggu Ini"
          value={data.overview.thisWeek}
          icon={TrendingUp}
          bgColor={COLORS.navyLight}
          iconColor={COLORS.goldLight}
          delay={0.1}
        />
        <StatCard
          title="Tamu Bulan Ini"
          value={data.overview.thisMonth}
          icon={BarChart3}
          bgColor={COLORS.navyLight}
          iconColor={COLORS.goldLight}
          delay={0.2}
        />
        <StatCard
          title="Belum Dilayani"
          value={waitingCount}
          icon={Clock}
          bgColor={COLORS.gold}
          iconColor={COLORS.navy}
          delay={0.3}
        />
      </div>

      {/* ─── Top Charts Row: Weekly Trend + Hourly Distribution ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 md:px-6 mt-4">
        {/* Weekly Trend - Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle
                className="text-base font-semibold"
                style={{ color: COLORS.navy }}
              >
                Tren Kunjungan Mingguan
              </CardTitle>
              <CardDescription>7 hari terakhir</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ChartContainer config={weeklyChartConfig} className="h-[260px] w-full">
                <AreaChart data={data.weeklyTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="navyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.navy} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.navy} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="dayName"
                    tick={{ fontSize: 12, fill: COLORS.slate }}
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
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={COLORS.navy}
                    strokeWidth={2.5}
                    fill="url(#navyGradient)"
                    dot={{ r: 4, fill: COLORS.navy, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: COLORS.gold, stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Hourly Distribution - Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle
                className="text-base font-semibold"
                style={{ color: COLORS.navy }}
              >
                Distribusi Jam Kunjungan Hari Ini
              </CardTitle>
              <CardDescription>Jam kerja (07:00 - 17:00)</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ChartContainer config={hourlyChartConfig} className="h-[260px] w-full">
                <BarChart data={workingHoursData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
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
                  <Bar
                    dataKey="count"
                    fill={COLORS.gold}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  >
                    {workingHoursData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.count > 0 ? COLORS.gold : '#e2e8f0'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Middle Row: Status Pie + Department Bar ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 md:px-6 mt-4">
        {/* Status Pie / Donut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle
                className="text-base font-semibold"
                style={{ color: COLORS.navy }}
              >
                Status Tamu
              </CardTitle>
              <CardDescription>Distribusi berdasarkan status</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col items-center">
                <ChartContainer config={statusChartConfig} className="h-[240px] w-full">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
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
                    <ChartLegend
                      content={<ChartLegendContent nameKey="name" />}
                    />
                  </PieChart>
                </ChartContainer>
                {/* Summary stats below pie */}
                <div className="grid grid-cols-3 gap-3 mt-3 w-full">
                  {Object.entries(data.guestsByStatus).map(([key, val]) => (
                    <div
                      key={key}
                      className="text-center px-2 py-1.5 rounded-md"
                      style={{ backgroundColor: `${STATUS_COLORS[key]}15` }}
                    >
                      <div
                        className="text-lg font-bold"
                        style={{ color: STATUS_COLORS[key] }}
                      >
                        {val}
                      </div>
                      <div className="text-xs text-gray-500">
                        {STATUS_LABELS[key]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Department Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle
                className="text-base font-semibold"
                style={{ color: COLORS.navy }}
              >
                Tamu per Bidang
              </CardTitle>
              <CardDescription>Distribusi berdasarkan unit kerja</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ChartContainer config={deptChartConfig} className="h-[320px] w-full">
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
                    width={100}
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
                  <Bar
                    dataKey="count"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={28}
                  >
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

      {/* ─── Bottom Section: Recent Guests Table ───────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="px-4 md:px-6 mt-4 pb-6"
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle
                  className="text-base font-semibold"
                  style={{ color: COLORS.navy }}
                >
                  Tamu Terbaru
                </CardTitle>
                <CardDescription>10 tamu terakhir yang terdaftar</CardDescription>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <Users className="h-4 w-4" />
                <span>{data.overview.total} total</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-96 overflow-y-auto" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: `${COLORS.navyLight} transparent`,
            }}>
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
                  <AnimatePresence>
                    {data.recentGuests.map((guest, idx) => (
                      <motion.tr
                        key={guest.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 * idx }}
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
                          <div className="font-medium text-gray-900">
                            {guest.name}
                          </div>
                          {guest.institution && (
                            <div className="text-xs text-gray-400">
                              {guest.institution}
                            </div>
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
                          <Badge
                            variant="outline"
                            className={STATUS_BADGE_CLASSES[guest.status] || 'bg-gray-100 text-gray-800 border-gray-300'}
                          >
                            {STATUS_LABELS[guest.status] || guest.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-right">
                          <span className="text-sm text-gray-500">
                            {new Date(guest.visitDate).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            })}
                          </span>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

    </div>
  )
}
