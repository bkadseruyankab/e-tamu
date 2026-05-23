'use client';

import { useState } from 'react';
import { X, Bell, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationPanelProps {
  onClose: () => void;
}

// Mock notifications data
const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Berita Dipublikasi',
    message: 'Berita "Selamat Datang di Portal BKAD" berhasil dipublikasi',
    time: '5 menit lalu',
    read: false,
  },
  {
    id: '2',
    type: 'info',
    title: 'Publikasi Baru',
    message: 'Laporan APBD 2024 telah diupload',
    time: '1 jam lalu',
    read: false,
  },
  {
    id: '3',
    type: 'warning',
    title: 'Galeri Kosong',
    message: 'Folder galeri kegiatan masih kosong',
    time: '2 jam lalu',
    read: true,
  },
];

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'info':
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800">Notifikasi</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-emerald-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.read ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {notification.time}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">Tidak ada notifikasi</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-gray-50">
        <button 
          onClick={markAllAsRead}
          className="w-full text-center text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Tandai Semua Dibaca
        </button>
      </div>
    </div>
  );
}
