'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, Upload, X, Image as ImageIcon, MapPin } from 'lucide-react';
import { showSuccess, showError, showSuccessToast, showDeleteConfirm, showWarning } from '@/lib/sweetalert';

export function SettingsManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'favicon' | null>(null);

  const [formData, setFormData] = useState({
    siteName: '',
    siteDescription: '',
    siteKeywords: '',
    address: '',
    phone: '',
    email: '',
    facebook: '',
    twitter: '',
    instagram: '',
    youtube: '',
    logo: '',
    favicon: '',
    mapLatitude: '-2.4000',
    mapLongitude: '112.1333',
    mapZoom: '14',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/public/settings');
      const data = await res.json();
      if (data.data) {
        setFormData(prev => ({ ...prev, ...data.data }));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showSuccess('Berhasil', 'Pengaturan berhasil disimpan');
      } else {
        showError('Gagal menyimpan pengaturan');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Terjadi kesalahan saat menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!allowedTypes.includes(file.type)) {
      showWarning('Tipe file tidak diizinkan', 'Gunakan JPG, PNG, GIF, WebP, atau ICO');
      return;
    }

    const maxSize = type === 'favicon' ? 1 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showWarning('Ukuran file terlalu besar', `Maksimal ${type === 'favicon' ? '1MB' : '10MB'}`);
      return;
    }

    if (type === 'favicon') {
      try {
        const img = new window.Image();
        img.src = URL.createObjectURL(file);
        await new Promise((resolve, reject) => {
          img.onload = () => {
            if (img.width > 256 || img.height > 256) {
              reject(new Error('Dimensi favicon maksimal 256x256 pixel'));
            }
            resolve(true);
          };
          img.onerror = () => reject(new Error('Gagal memuat gambar'));
        });
      } catch (error) {
        showWarning('Dimensi tidak valid', error instanceof Error ? error.message : 'Gagal validasi gambar');
        return;
      }
    }

    setUploading(type);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      formDataToSend.append('type', type);

      const res = await fetch('/api/settings/logo', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await res.json();

      if (res.ok) {
        setFormData(prev => ({ ...prev, [type]: result.url }));
        showSuccessToast(`${type === 'logo' ? 'Logo' : 'Favicon'} berhasil diupload`);
      } else {
        showError('Gagal mengupload', result.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Terjadi kesalahan saat mengupload');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const handleDeleteLogo = async (type: 'logo' | 'favicon') => {
    const confirmed = await showDeleteConfirm(`${type === 'logo' ? 'logo' : 'favicon'}`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/settings/logo?type=${type}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setFormData(prev => ({ ...prev, [type]: '' }));
        showSuccessToast(`${type === 'logo' ? 'Logo' : 'Favicon'} berhasil dihapus`);
      } else {
        const data = await res.json();
        showError('Gagal menghapus', data.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      showError('Terjadi kesalahan');
    }
  };

  // Generate map preview URL
  const getMapPreviewUrl = () => {
    const lat = parseFloat(formData.mapLatitude) || -2.4;
    const lng = parseFloat(formData.mapLongitude) || 112.1333;
    const zoom = parseInt(formData.mapZoom) || 14;
    const delta = 0.01 * (18 - zoom);
    
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lng}`;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Pengaturan Website</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo & Favicon */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Logo & Favicon</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <label className="block text-sm font-medium mb-2">Logo Website</label>
              <div className="space-y-3">
                {formData.logo ? (
                  <div className="relative inline-block">
                    <img 
                      src={formData.logo} 
                      alt="Logo" 
                      className="h-20 w-auto object-contain bg-gray-50 rounded-lg p-2 border"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteLogo('logo')}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 mx-auto text-gray-300" />
                      <p className="text-sm text-gray-500 mt-1">Belum ada logo</p>
                    </div>
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => handleLogoUpload(e, 'logo')}
                    disabled={uploading !== null}
                  />
                  <label
                    htmlFor="logo-upload"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                      uploading === 'logo'
                        ? 'bg-gray-100 text-gray-400'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {uploading === 'logo' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Mengupload...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Logo
                      </>
                    )}
                  </label>
                </div>
                <p className="text-xs text-gray-500">Format: JPG, PNG, GIF, WebP. Maksimal 10MB</p>
              </div>
            </div>

            {/* Favicon */}
            <div>
              <label className="block text-sm font-medium mb-2">Favicon</label>
              <div className="space-y-3">
                {formData.favicon ? (
                  <div className="relative inline-block">
                    <img 
                      src={formData.favicon} 
                      alt="Favicon" 
                      className="h-16 w-16 object-contain bg-gray-50 rounded-lg p-2 border"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteLogo('favicon')}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-16 w-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    id="favicon-upload"
                    accept="image/png,image/x-icon,image/vnd.microsoft.icon"
                    className="hidden"
                    onChange={(e) => handleLogoUpload(e, 'favicon')}
                    disabled={uploading !== null}
                  />
                  <label
                    htmlFor="favicon-upload"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                      uploading === 'favicon'
                        ? 'bg-gray-100 text-gray-400'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {uploading === 'favicon' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Mengupload...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Favicon
                      </>
                    )}
                  </label>
                </div>
                <p className="text-xs text-gray-500">Format: PNG, ICO. Ukuran 32x32 atau 64x64 pixel, maks 1MB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Site Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Informasi Website</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Website</label>
              <input
                type="text"
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Deskripsi</label>
              <textarea
                value={formData.siteDescription}
                onChange={(e) => setFormData({ ...formData, siteDescription: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Keywords</label>
              <input
                type="text"
                value={formData.siteKeywords}
                onChange={(e) => setFormData({ ...formData, siteKeywords: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="bkad, seruyan, keuangan (pisahkan dengan koma)"
              />
            </div>
          </div>
        </div>

        {/* Contact Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Kontak</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Alamat</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telepon</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Map Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            Pengaturan Peta Lokasi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Latitude</label>
              <input
                type="text"
                value={formData.mapLatitude}
                onChange={(e) => setFormData({ ...formData, mapLatitude: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="-2.4000"
              />
              <p className="text-xs text-gray-500 mt-1">Contoh: -2.4000</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Longitude</label>
              <input
                type="text"
                value={formData.mapLongitude}
                onChange={(e) => setFormData({ ...formData, mapLongitude: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="112.1333"
              />
              <p className="text-xs text-gray-500 mt-1">Contoh: 112.1333</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Zoom Level</label>
              <select
                value={formData.mapZoom}
                onChange={(e) => setFormData({ ...formData, mapZoom: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="10">10 - Area Luas</option>
                <option value="12">12 - Kota</option>
                <option value="14">14 - Kecamatan</option>
                <option value="16">16 - Kelurahan</option>
                <option value="18">18 - Detail</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Semakin tinggi = semakin dekat</p>
            </div>
          </div>

          {/* Map Preview */}
          <div>
            <label className="block text-sm font-medium mb-2">Preview Peta</label>
            <div className="rounded-lg overflow-hidden border border-gray-200 h-48">
              <iframe 
                src={getMapPreviewUrl()}
                width="100%" 
                height="100%" 
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Preview Peta"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Tips: Dapatkan koordinat dari{' '}
              <a 
                href="https://www.openstreetmap.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                OpenStreetMap
              </a>
              {' '}atau{' '}
              <a 
                href="https://www.google.com/maps" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                Google Maps
              </a>
            </p>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Media Sosial</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Facebook</label>
              <input
                type="url"
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Twitter</label>
              <input
                type="url"
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="https://twitter.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Instagram</label>
              <input
                type="url"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">YouTube</label>
              <input
                type="url"
                value={formData.youtube}
                onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="https://youtube.com/..."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Simpan Pengaturan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
