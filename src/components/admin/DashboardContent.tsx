'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  BookOpen, 
  Image as ImageIcon, 
  Eye, 
  Users, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock,
  Activity,
  Plus,
  ArrowRight
} from 'lucide-react';

interface Stats {
  totalNews: number;
  totalPublications: number;
  totalGallery: number;
  totalViews: number;
  totalVisitors: number;
}

interface RecentNews {
  id: string;
  title: string;
  viewCount: number;
  publishedAt: string;
  createdAt: string;
  isPublished: boolean;
  category?: { name: string; color?: string };
}

interface RecentActivity {
  id: string;
  type: 'create' | 'update' | 'delete' | 'publish';
  module: string;
  title: string;
  timestamp: string;
  user?: string;
}

export function DashboardContent() {
  const [stats, setStats] = useState<Stats>({
    totalNews: 0,
    totalPublications: 0,
    totalGallery: 0,
    totalViews: 0,
    totalVisitors: 0,
  });
  const [recentNews, setRecentNews] = useState<RecentNews[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    // Fetch stats
    fetch('/api/public/stats')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setStats(data.data);
        }
      })
      .catch(console.error);

    // Fetch recent news
    fetch('/api/news?limit=5')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setRecentNews(data.data);
        }
      })
      .catch(console.error);

    // Generate mock activity
    setRecentActivity([
      { id: '1', type: 'create', module: 'Berita', title: 'Berita baru dibuat', timestamp: new Date().toISOString(), user: 'Admin' },
      { id: '2', type: 'publish', module: 'Publikasi', title: 'Laporan APBD dipublikasi', timestamp: new Date(Date.now() - 3600000).toISOString(), user: 'Admin' },
      { id: '3', type: 'update', module: 'Galeri', title: 'Album kegiatan diperbarui', timestamp: new Date(Date.now() - 7200000).toISOString(), user: 'Admin' },
    ]);
  }, []);

  const statCards = [
    { 
      label: 'Total Berita', 
      value: stats.totalNews, 
      icon: FileText, 
      color: 'bg-blue-500', 
      change: '+12%',
      trend: 'up',
      description: 'Dari bulan lalu'
    },
    { 
      label: 'Publikasi', 
      value: stats.totalPublications, 
      icon: BookOpen, 
      color: 'bg-emerald-500', 
      change: '+5%',
      trend: 'up',
      description: 'Dokumen aktif'
    },
    { 
      label: 'Galeri', 
      value: stats.totalGallery, 
      icon: ImageIcon, 
      color: 'bg-amber-500', 
      change: '+3%',
      trend: 'up',
      description: 'Foto & video'
    },
    { 
      label: 'Total Views', 
      value: stats.totalViews, 
      icon: Eye, 
      color: 'bg-purple-500', 
      change: '+20%',
      trend: 'up',
      description: 'Bulan ini'
    },
  ];

  const quickActions = [
    { label: 'Tambah Berita', icon: FileText, color: 'bg-blue-100 text-blue-600', action: 'news' },
    { label: 'Upload Publikasi', icon: BookOpen, color: 'bg-emerald-100 text-emerald-600', action: 'publications' },
    { label: 'Upload Galeri', icon: ImageIcon, color: 'bg-amber-100 text-amber-600', action: 'gallery' },
    { label: 'Kelola Slider', icon: Activity, color: 'bg-purple-100 text-purple-600', action: 'sliders' },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'create': return <Plus className="w-4 h-4 text-green-500" />;
      case 'update': return <Activity className="w-4 h-4 text-blue-500" />;
      case 'delete': return <ArrowDownRight className="w-4 h-4 text-red-500" />;
      case 'publish': return <ArrowUpRight className="w-4 h-4 text-purple-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Selamat Datang di Panel Admin</h2>
            <p className="text-emerald-100">
              Kelola konten portal BKAD Kabupaten Seruyan dengan mudah
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl px-4 py-2">
              <p className="text-sm text-emerald-100">Hari ini</p>
              <p className="text-lg font-semibold">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-4 lg:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-800 mt-1">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`w-10 h-10 lg:w-12 lg:h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className={`flex items-center ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {stat.change}
                </span>
                <span className="text-gray-500 ml-2">{stat.description}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Aksi Cepat</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                className="flex items-center gap-3 p-3 lg:p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all group"
              >
                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center ${action.color}`}>
                  <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
                </div>
                <span className="font-medium text-gray-700 group-hover:text-emerald-600 transition-colors text-sm lg:text-base">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent News */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-4 lg:p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Berita Terbaru</h3>
            <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 lg:p-6">
            {recentNews.length > 0 ? (
              <div className="space-y-4">
                {recentNews.map((news) => (
                  <div key={news.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 line-clamp-1">{news.title}</h4>
                      <div className="flex flex-wrap items-center gap-2 lg:gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {news.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(news.publishedAt || news.createdAt).toLocaleDateString('id-ID')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          news.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {news.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Belum ada berita</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-4 lg:p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Aktivitas Terbaru</h3>
          </div>
          <div className="p-4 lg:p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{activity.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>{activity.module}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Belum ada aktivitas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visitor Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Overview */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Statistik Pengunjung</h3>
            <div className="flex items-center gap-2">
              {(['today', 'week', 'month'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    selectedPeriod === period
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {period === 'today' ? 'Hari Ini' : period === 'week' ? 'Minggu' : 'Bulan'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Pengunjung</p>
                  <p className="text-xl font-bold text-gray-800">{stats.totalVisitors.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-emerald-600 font-medium">+15%</p>
                <p className="text-xs text-gray-500">dari sebelumnya</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Views</p>
                  <p className="text-xl font-bold text-gray-800">{stats.totalViews.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-emerald-600 font-medium">+20%</p>
                <p className="text-xs text-gray-500">dari sebelumnya</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Summary */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Ringkasan Konten</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Berita Dipublikasi</span>
                  <span className="text-sm font-medium text-gray-800">{stats.totalNews}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Publikasi</span>
                  <span className="text-sm font-medium text-gray-800">{stats.totalPublications}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Galeri</span>
                  <span className="text-sm font-medium text-gray-800">{stats.totalGallery}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
