'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/page';
import { User, Mail, Lock, Camera, Save, Loader2, CheckCircle } from 'lucide-react';
import { showSuccess, showError, showWarning } from '@/lib/sweetalert';

export function ProfileSettings() {
  const { user } = useAuth();
  const [loading, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords if changing
    if (profile.newPassword || profile.confirmPassword) {
      if (!profile.currentPassword) {
        showWarning('Password saat ini diperlukan', 'Masukkan password saat ini untuk mengubah password');
        return;
      }
      if (profile.newPassword !== profile.confirmPassword) {
        showWarning('Password tidak cocok', 'Password baru dan konfirmasi password harus sama');
        return;
      }
      if (profile.newPassword.length < 6) {
        showWarning('Password terlalu pendek', 'Password minimal 6 karakter');
        return;
      }
    }
    
    setSaving(true);
    
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSaving(false);
    setSaved(true);
    showSuccess('Berhasil', 'Profil berhasil diperbarui');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-emerald-600 to-emerald-700 relative">
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {user?.name?.charAt(0) || 'A'}
              </div>
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-emerald-600 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="pt-16 px-6 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{profile.name}</h2>
              <p className="text-gray-500">{profile.email}</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
              {user?.role || 'Admin'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Informasi Dasar
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
              </div>
            </div>

            {/* Password Change */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" />
                Ubah Password
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Saat Ini</label>
                <input
                  type="password"
                  value={profile.currentPassword}
                  onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Masukkan password saat ini"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                  <input
                    type="password"
                    value={profile.newPassword}
                    onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Masukkan password baru"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                  <input
                    type="password"
                    value={profile.confirmPassword}
                    onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Konfirmasi password baru"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Simpan Perubahan
                  </>
                )}
              </button>
              
              {saved && (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>Tersimpan!</span>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Akun</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">ID Akun</p>
            <p className="font-medium text-gray-800">{user?.id}</p>
          </div>
          <div>
            <p className="text-gray-500">Role</p>
            <p className="font-medium text-gray-800 capitalize">{user?.role}</p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
            <p className="font-medium text-emerald-600">Aktif</p>
          </div>
          <div>
            <p className="text-gray-500">Terakhir Login</p>
            <p className="font-medium text-gray-800">Hari ini</p>
          </div>
        </div>
      </div>
    </div>
  );
}
