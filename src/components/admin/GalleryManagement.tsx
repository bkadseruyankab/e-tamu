'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Loader2, Image as ImageIcon, Upload, Link, Check, AlertCircle } from 'lucide-react';
import { showSuccess, showError, showDeleteConfirm, showSuccessToast, showWarning } from '@/lib/sweetalert';

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  category?: string;
  isPublished: boolean;
  createdAt: string;
}

export function GalleryManagement() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    category: '',
    isPublished: true,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const categories = ['Kegiatan', 'Event', 'Rapat', 'Sosialisasi', 'Pelatihan', 'Lainnya'];

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gallery?limit=100&admin=true');
      const data = await res.json();
      if (data.data) setItems(data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Hanya file gambar yang diizinkan (JPG, PNG, GIF, WebP)');
        return;
      }
      if (file.size > 512 * 1024 * 1024) {
        setError('Ukuran file maksimal 512MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFormData({ ...formData, imageUrl: '' });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    setError(null);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Hanya file gambar yang diizinkan (JPG, PNG, GIF, WebP)');
        return;
      }
      if (file.size > 512 * 1024 * 1024) {
        setError('Ukuran file maksimal 512MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFormData({ ...formData, imageUrl: '' });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.title.trim()) {
      setError('Judul harus diisi');
      return;
    }
    
    if (!editingItem && uploadMethod === 'file' && !selectedFile) {
      setError('Pilih file gambar atau masukkan URL');
      return;
    }
    
    if (!editingItem && uploadMethod === 'url' && !formData.imageUrl.trim()) {
      setError('Masukkan URL gambar');
      return;
    }

    setSaving(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim() || '');
      formDataToSend.append('category', formData.category || '');
      formDataToSend.append('isPublished', String(formData.isPublished));

      if (uploadMethod === 'file' && selectedFile) {
        formDataToSend.append('file', selectedFile);
      } else if (uploadMethod === 'url' && formData.imageUrl.trim()) {
        formDataToSend.append('imageUrl', formData.imageUrl.trim());
      } else if (editingItem) {
        formDataToSend.append('imageUrl', editingItem.imageUrl);
      }

      const url = editingItem ? `/api/gallery/${editingItem.id}` : '/api/gallery';
      const method = editingItem ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        body: formDataToSend,
      });

      const result = await res.json();

      if (res.ok) {
        fetchGallery();
        closeModal();
        showSuccessToast('Gambar berhasil disimpan');
      } else {
        showError('Gagal menyimpan', result.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Terjadi kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showDeleteConfirm('gambar ini');
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchGallery();
        showSuccessToast('Gambar berhasil dihapus');
      } else {
        const data = await res.json();
        showError('Gagal menghapus', data.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      showError('Terjadi kesalahan');
    }
  };

  const openModal = (item?: GalleryItem) => {
    setError(null);
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description || '',
        imageUrl: item.imageUrl.startsWith('/api/gallery/file/') ? '' : item.imageUrl,
        category: item.category || '',
        isPublished: item.isPublished,
      });
      setPreviewUrl(item.imageUrl);
      setUploadMethod(item.imageUrl.startsWith('/api/gallery/file/') ? 'file' : 'url');
      setSelectedFile(null);
    } else {
      setEditingItem(null);
      setFormData({ title: '', description: '', imageUrl: '', category: '', isPublished: true });
      setPreviewUrl(null);
      setUploadMethod('file');
      setSelectedFile(null);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Manajemen Galeri</h2>
          <p className="text-sm text-gray-500 mt-1">Upload gambar hingga 512MB per file (JPG, PNG, GIF, WebP)</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" /> Tambah Gambar
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Belum ada gambar</p>
            <p className="text-sm mt-1">Klik &quot;Tambah Gambar&quot; untuk mulai upload</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden group border border-gray-100 hover:shadow-md transition-shadow">
              <div className="aspect-square relative bg-gray-100">
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                    onClick={() => openModal(item)} 
                    className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)} 
                    className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
                {!item.isPublished && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded font-medium">
                    Draft
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                {item.category && <p className="text-xs text-gray-500 mt-0.5">{item.category}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl my-8">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{editingItem ? 'Edit' : 'Tambah'} Gambar</h2>
              <button 
                onClick={closeModal} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Judul <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                  placeholder="Judul gambar"
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">Deskripsi</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  rows={2} 
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none" 
                  placeholder="Deskripsi singkat (opsional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Kategori</label>
                <select 
                  value={formData.category} 
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sumber Gambar <span className="text-red-500">*</span></label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => { setUploadMethod('file'); setError(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                      uploadMethod === 'file' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUploadMethod('url'); setError(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                      uploadMethod === 'url' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Link className="w-4 h-4" />
                    URL Eksternal
                  </button>
                </div>

                {uploadMethod === 'file' ? (
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                      dragOver ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-400 hover:bg-gray-50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {/* Hidden file input - using label for reliable click */}
                    <input
                      type="file"
                      id="gallery-file-input"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    
                    {previewUrl && selectedFile ? (
                      <div className="space-y-3">
                        <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto rounded-lg shadow-sm" />
                        <div className="text-sm text-gray-600">
                          <p className="font-medium truncate">{selectedFile.name}</p>
                          <p className="text-gray-500">{formatFileSize(selectedFile.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { 
                            setSelectedFile(null); 
                            setPreviewUrl(null); 
                          }}
                          className="text-red-600 hover:underline text-sm font-medium"
                        >
                          Hapus file
                        </button>
                      </div>
                    ) : editingItem ? (
                      <label 
                        htmlFor="gallery-file-input"
                        className="cursor-pointer block"
                      >
                        <div className="space-y-2">
                          {editingItem.imageUrl && (
                            <img 
                              src={editingItem.imageUrl} 
                              alt="Current" 
                              className="max-h-32 mx-auto rounded-lg"
                            />
                          )}
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                            <Upload className="w-6 h-6 text-emerald-600" />
                          </div>
                          <p className="text-emerald-600 font-medium">Klik untuk mengganti gambar</p>
                          <p className="text-gray-500 text-sm">atau drag & drop file di sini</p>
                        </div>
                      </label>
                    ) : (
                      <label 
                        htmlFor="gallery-file-input"
                        className="cursor-pointer block"
                      >
                        <div className="space-y-2">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                            <Upload className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-gray-600 font-medium">Klik untuk pilih file</p>
                            <p className="text-gray-500 text-sm mt-1">atau drag & drop di sini</p>
                            <p className="text-emerald-600 text-sm mt-2">JPG, PNG, GIF, WebP • Maks 512MB</p>
                          </div>
                        </div>
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, imageUrl: e.target.value });
                        setPreviewUrl(e.target.value);
                      }}
                      className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="https://example.com/image.jpg"
                    />
                    {formData.imageUrl && previewUrl && (
                      <div className="relative">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="w-full h-40 object-cover rounded-lg bg-gray-100"
                        />
                        <div className="absolute top-2 right-2 p-1 bg-green-500 rounded-full">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer py-2">
                <input 
                  type="checkbox" 
                  checked={formData.isPublished} 
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} 
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" 
                />
                <span className="text-sm font-medium">Publikasikan</span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
