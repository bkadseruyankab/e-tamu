'use client';

import { useState } from 'react';
import { 
  Activity, 
  FileText, 
  BookOpen, 
  Image as ImageIcon, 
  Settings,
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search,
  Calendar
} from 'lucide-react';

interface LogEntry {
  id: string;
  type: 'create' | 'update' | 'delete' | 'view' | 'publish';
  module: 'news' | 'publication' | 'gallery' | 'service' | 'link' | 'slider' | 'settings';
  action: string;
  details: string;
  user: string;
  ip: string;
  timestamp: string;
}

// Mock logs data
const mockLogs: LogEntry[] = [
  {
    id: '1',
    type: 'create',
    module: 'news',
    action: 'Membuat berita baru',
    details: 'Selamat Datang di Portal BKAD',
    user: 'admin@bkad.go.id',
    ip: '192.168.1.1',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'publish',
    module: 'news',
    action: 'Mempublikasikan berita',
    details: 'Selamat Datang di Portal BKAD',
    user: 'admin@bkad.go.id',
    ip: '192.168.1.1',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    type: 'create',
    module: 'publication',
    action: 'Upload publikasi baru',
    details: 'Laporan APBD 2024',
    user: 'admin@bkad.go.id',
    ip: '192.168.1.1',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '4',
    type: 'update',
    module: 'gallery',
    action: 'Memperbarui galeri',
    details: 'Kegiatan Rapat Koordinasi',
    user: 'admin@bkad.go.id',
    ip: '192.168.1.1',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '5',
    type: 'view',
    module: 'settings',
    action: 'Melihat pengaturan',
    details: 'Halaman pengaturan website',
    user: 'admin@bkad.go.id',
    ip: '192.168.1.1',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
  },
];

export function ActivityLogs() {
  const [logs] = useState<LogEntry[]>(mockLogs);
  const [filter, setFilter] = useState<'all' | LogEntry['module']>('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

  const getTypeIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'create': return <PlusCircle className="w-4 h-4 text-green-500" />;
      case 'update': return <Edit className="w-4 h-4 text-blue-500" />;
      case 'delete': return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'view': return <Eye className="w-4 h-4 text-gray-500" />;
      case 'publish': return <FileText className="w-4 h-4 text-purple-500" />;
    }
  };

  const getModuleIcon = (module: LogEntry['module']) => {
    switch (module) {
      case 'news': return <FileText className="w-4 h-4" />;
      case 'publication': return <BookOpen className="w-4 h-4" />;
      case 'gallery': return <ImageIcon className="w-4 h-4" />;
      case 'service': return <Settings className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'create': return 'bg-green-100 text-green-700';
      case 'update': return 'bg-blue-100 text-blue-700';
      case 'delete': return 'bg-red-100 text-red-700';
      case 'view': return 'bg-gray-100 text-gray-700';
      case 'publish': return 'bg-purple-100 text-purple-700';
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.module !== filter) return false;
    if (search && !log.action.toLowerCase().includes(search.toLowerCase()) && 
        !log.details.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari aktivitas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Module Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="all">Semua Modul</option>
              <option value="news">Berita</option>
              <option value="publication">Publikasi</option>
              <option value="gallery">Galeri</option>
              <option value="settings">Pengaturan</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="today">Hari Ini</option>
              <option value="week">7 Hari Terakhir</option>
              <option value="month">30 Hari Terakhir</option>
              <option value="all">Semua Waktu</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Log Aktivitas</h3>
          <p className="text-sm text-gray-500">{filteredLogs.length} aktivitas ditemukan</p>
        </div>

        <div className="divide-y">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {getTypeIcon(log.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(log.type)}`}>
                        {log.type === 'create' ? 'Buat' : log.type === 'update' ? 'Ubah' : log.type === 'delete' ? 'Hapus' : log.type === 'view' ? 'Lihat' : 'Publikasi'}
                      </span>
                      <span className="text-sm text-gray-800 font-medium">{log.action}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{log.details}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        {getModuleIcon(log.module)}
                        {log.module}
                      </span>
                      <span>•</span>
                      <span>{log.user}</span>
                      <span>•</span>
                      <span>IP: {log.ip}</span>
                      <span>•</span>
                      <span>{formatDate(log.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Tidak ada aktivitas ditemukan</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { type: 'create' as const, label: 'Buat', count: logs.filter(l => l.type === 'create').length, color: 'bg-green-100 text-green-700' },
          { type: 'update' as const, label: 'Ubah', count: logs.filter(l => l.type === 'update').length, color: 'bg-blue-100 text-blue-700' },
          { type: 'delete' as const, label: 'Hapus', count: logs.filter(l => l.type === 'delete').length, color: 'bg-red-100 text-red-700' },
          { type: 'view' as const, label: 'Lihat', count: logs.filter(l => l.type === 'view').length, color: 'bg-gray-100 text-gray-700' },
          { type: 'publish' as const, label: 'Publikasi', count: logs.filter(l => l.type === 'publish').length, color: 'bg-purple-100 text-purple-700' },
        ].map((stat) => (
          <div key={stat.type} className={`rounded-xl p-4 ${stat.color}`}>
            <p className="text-sm font-medium">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
