'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, X, Save, Loader2, Upload, Download, FileText, File, Image, FileSpreadsheet, FileArchive, ExternalLink, Eye } from 'lucide-react';
import { showSuccess, showError, showDeleteConfirm, showSuccessToast, showWarning } from '@/lib/sweetalert';

interface ServiceFile {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  description?: string;
  downloadCount: number;
  createdAt: string;
}

interface Service {
  id: string;
  title: string;
  slug: string;
  description?: string;
  icon?: string;
  url?: string;
  content?: string;
  requirements?: string;
  procedures?: string;
  order: number;
  isActive: boolean;
  files?: ServiceFile[];
}

export function ServiceManagement() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'FileText',
    url: '',
    content: '',
    requirements: '',
    procedures: '',
    order: 0,
    isActive: true,
  });

  const [detailData, setDetailData] = useState<Service | null>(null);

  const icons = ['FileText', 'BarChart2', 'Building', 'BookOpen', 'Users', 'Settings', 'HelpCircle', 'ClipboardList', 'CreditCard', 'Landmark', 'Wallet', 'Receipt'];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/services?admin=true');
      const data = await res.json();
      if (data.data) setItems(data.data);
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
      const url = editingItem ? `/api/services/${editingItem.id}` : '/api/services';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchServices();
        closeModal();
        showSuccessToast('Layanan berhasil disimpan');
      } else {
        showError('Gagal menyimpan layanan');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Terjadi kesalahan saat menyimpan layanan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showDeleteConfirm('layanan ini');
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchServices();
        showSuccessToast('Layanan berhasil dihapus');
      } else {
        showError('Gagal menghapus layanan');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Terjadi kesalahan saat menghapus layanan');
    }
  };

  const openModal = (item?: Service) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description || '',
        icon: item.icon || 'FileText',
        url: item.url || '',
        content: item.content || '',
        requirements: item.requirements || '',
        procedures: item.procedures || '',
        order: item.order,
        isActive: item.isActive,
      });
    } else {
      setEditingItem(null);
      setFormData({ title: '', description: '', icon: 'FileText', url: '', content: '', requirements: '', procedures: '', order: 0, isActive: true });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const openDetailModal = async (item: Service) => {
    // Fetch full service data with files
    const res = await fetch(`/api/services/${item.id}`);
    const data = await res.json();
    if (data.data) {
      setDetailData(data.data);
      setShowDetailModal(true);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !detailData) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('serviceId', detailData.id);
      
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const res = await fetch('/api/services/files', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        // Refresh detail data
        const refreshRes = await fetch(`/api/services/${detailData.id}`);
        const refreshData = await refreshRes.json();
        if (refreshData.data) {
          setDetailData(refreshData.data);
        }
        fetchServices();
        showSuccessToast('File berhasil diupload');
      } else {
        showError('Gagal mengupload file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showError('Terjadi kesalahan saat mengupload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileDelete = async (fileId: string) => {
    const confirmed = await showDeleteConfirm('file ini');
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/services/files/${fileId}`, {
        method: 'DELETE',
      });

      if (res.ok && detailData) {
        setDetailData({
          ...detailData,
          files: detailData.files?.filter(f => f.id !== fileId) || []
        });
        fetchServices();
        showSuccessToast('File berhasil dihapus');
      } else {
        showError('Gagal menghapus file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showError('Terjadi kesalahan saat menghapus file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return FileArchive;
    return File;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Manajemen Layanan</h2>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus className="w-5 h-5" /> Tambah Layanan
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Layanan</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Deskripsi</th>
              <th className="text-center px-6 py-3 text-sm font-semibold text-gray-700">File</th>
              <th className="text-center px-6 py-3 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-right px-6 py-3 text-sm font-semibold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" /></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Tidak ada layanan</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-gray-500">/{item.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{item.description || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      <File className="w-4 h-4" />
                      {item.files?.length || 0} file
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openDetailModal(item)} 
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600" 
                        title="Kelola Detail & File"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openModal(item)} className="p-2 hover:bg-gray-100 rounded-lg" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl my-8">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-xl">
              <h2 className="text-xl font-semibold">{editingItem ? 'Edit' : 'Tambah'} Layanan</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Judul <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Icon</label>
                  <select value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                    {icons.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi Singkat</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Deskripsi singkat tentang layanan..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL Eksternal (opsional)</label>
                <input type="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Konten Lengkap</label>
                <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={4} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Penjelasan lengkap tentang layanan..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Persyaratan</label>
                <textarea value={formData.requirements} onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Daftar persyaratan yang diperlukan... (gunakan baris baru untuk setiap item)" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prosedur</label>
                <textarea value={formData.procedures} onChange={(e) => setFormData({ ...formData, procedures: e.target.value })} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Langkah-langkah prosedur... (gunakan baris baru untuk setiap langkah)" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Urutan</label>
                  <input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm font-medium">Aktif</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Batal</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal with File Management */}
      {showDetailModal && detailData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-xl my-8">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-xl z-10">
              <div>
                <h2 className="text-xl font-semibold">Detail Layanan</h2>
                <p className="text-sm text-gray-500">{detailData.title}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Service Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Deskripsi</h3>
                    <p className="text-gray-600">{detailData.description || 'Tidak ada deskripsi'}</p>
                  </div>
                  {detailData.url && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">URL Eksternal</h3>
                      <a href={detailData.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-600 hover:underline">
                        {detailData.url} <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {detailData.requirements && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Persyaratan</h3>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        {detailData.requirements.split('\n').map((req, i) => (
                          <div key={i} className="flex items-start gap-2 py-1">
                            <span className="text-emerald-600 mt-1">•</span>
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {detailData.content && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Konten Lengkap</h3>
                  <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">{detailData.content}</div>
                </div>
              )}

              {detailData.procedures && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Prosedur</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    {detailData.procedures.split('\n').map((proc, i) => (
                      <div key={i} className="flex items-start gap-3 py-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm">{i + 1}</span>
                        <span className="pt-0.5">{proc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File Management */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">File Lampiran ({detailData.files?.length || 0})</h3>
                  <label className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload File
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.jpg,.jpeg,.png,.gif"
                    />
                  </label>
                </div>

                {uploading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    <span className="ml-2">Mengupload file...</span>
                  </div>
                )}

                {detailData.files && detailData.files.length > 0 ? (
                  <div className="space-y-2">
                    {detailData.files.map((file) => {
                      const FileIcon = getFileIcon(file.mimeType);
                      return (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                              <FileIcon className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{file.originalName}</div>
                              <div className="text-xs text-gray-500">
                                {formatFileSize(file.size)} • {file.downloadCount} download • {new Date(file.createdAt).toLocaleDateString('id-ID')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={`/api/services/files/download/${file.name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-white rounded-lg text-blue-600"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleFileDelete(file.id)}
                              className="p-2 hover:bg-red-50 rounded-lg text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Belum ada file yang diupload</p>
                    <p className="text-sm">Klik tombol "Upload File" untuk menambahkan lampiran</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  openModal(detailData);
                }}
                className="px-4 py-2 text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200"
              >
                Edit Layanan
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
