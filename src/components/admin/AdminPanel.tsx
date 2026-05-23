'use client';

import { useState } from 'react';
import { useAuth } from '@/app/page';
import { 
  LayoutDashboard, 
  FileText, 
  FolderTree, 
  BookOpen, 
  Image as ImageIcon, 
  Briefcase, 
  Link2, 
  Sliders, 
  Settings,
  ArrowLeft,
  Bell,
  User,
  Activity,
  FolderOpen,
  Eye,
  Menu,
  X
} from 'lucide-react';
import { DashboardContent } from './DashboardContent';
import { NewsManagement } from './NewsManagement';
import { CategoryManagement } from './CategoryManagement';
import { PublicationManagement } from './PublicationManagement';
import { GalleryManagement } from './GalleryManagement';
import { ServiceManagement } from './ServiceManagement';
import { LinkManagement } from './LinkManagement';
import { SliderManagement } from './SliderManagement';
import { SettingsManagement } from './SettingsManagement';
import { ProfileSettings } from './ProfileSettings';
import { ActivityLogs } from './ActivityLogs';
import { MediaManager } from './MediaManager';
import { NotificationPanel } from './NotificationPanel';

interface AdminPanelProps {
  onBackToPortal: () => void;
}

type AdminView = 'dashboard' | 'news' | 'categories' | 'publications' | 'gallery' | 'services' | 'links' | 'sliders' | 'settings' | 'profile' | 'activity' | 'media';

export function AdminPanel({ onBackToPortal }: AdminPanelProps) {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard' as AdminView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'news' as AdminView, label: 'Berita', icon: FileText },
    { id: 'categories' as AdminView, label: 'Kategori', icon: FolderTree },
    { id: 'publications' as AdminView, label: 'Publikasi', icon: BookOpen },
    { id: 'gallery' as AdminView, label: 'Galeri', icon: ImageIcon },
    { id: 'media' as AdminView, label: 'Media', icon: FolderOpen },
    { id: 'services' as AdminView, label: 'Layanan', icon: Briefcase },
    { id: 'links' as AdminView, label: 'Tautan', icon: Link2 },
    { id: 'sliders' as AdminView, label: 'Slider', icon: Sliders },
    { id: 'activity' as AdminView, label: 'Aktivitas', icon: Activity },
    { id: 'settings' as AdminView, label: 'Pengaturan', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    onBackToPortal();
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardContent />;
      case 'news':
        return <NewsManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'publications':
        return <PublicationManagement />;
      case 'gallery':
        return <GalleryManagement />;
      case 'media':
        return <MediaManager />;
      case 'services':
        return <ServiceManagement />;
      case 'links':
        return <LinkManagement />;
      case 'sliders':
        return <SliderManagement />;
      case 'settings':
        return <SettingsManagement />;
      case 'profile':
        return <ProfileSettings />;
      case 'activity':
        return <ActivityLogs />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen bg-gray-800 text-white transition-all duration-300 z-50 flex flex-col ${
        sidebarOpen ? 'w-64' : 'w-20'
      } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 bg-gray-900 flex-shrink-0">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center">
                <span className="font-bold">B</span>
              </div>
              <span className="font-bold">BKAD Admin</span>
            </div>
          )}
          <button
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              setMobileMenuOpen(false);
            }}
            className="p-1 hover:bg-gray-700 rounded hidden lg:block"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 hover:bg-gray-700 rounded lg:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Info */}
        {sidebarOpen && (
          <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-medium">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Menu - Scrollable */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setCurrentView(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Actions - Fixed at bottom */}
        <div className="flex-shrink-0 p-2 space-y-1 border-t border-gray-700 bg-gray-800">
          {/* Profile Button */}
          <button
            onClick={() => {
              setCurrentView('profile');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 transition-all"
          >
            <User className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="truncate">Profil Saya</span>}
          </button>

          {/* View Portal Button */}
          <button
            onClick={onBackToPortal}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-emerald-600 transition-all"
          >
            <Eye className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="truncate">Lihat Portal</span>}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-400 hover:bg-red-900/50 transition-all"
          >
            <ArrowLeft className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="truncate">Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 flex flex-col min-h-screen ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            
            <div>
              <h1 className="text-lg lg:text-xl font-semibold text-gray-800">
                {menuItems.find(item => item.id === currentView)?.label || 'Dashboard'}
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                BKAD Kabupaten Seruyan - Panel Administrasi
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Quick Preview Button */}
            <button
              onClick={onBackToPortal}
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden md:inline">Preview Portal</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {showNotifications && (
                <NotificationPanel onClose={() => setShowNotifications(false)} />
              )}
            </div>

            {/* User Avatar */}
            <button
              onClick={() => setCurrentView('profile')}
              className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-1 lg:p-2 transition-colors"
            >
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-medium">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="hidden lg:block text-right">
                <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </button>
          </div>
        </header>

        {/* Page Content - Scrollable */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {renderContent()}
        </main>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #1f2937;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
}
