'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Loader2, Download } from 'lucide-react';
import { showError, showDeleteConfirm, showSuccessToast } from '@/lib/sweetalert';

interface Publication {
  id: string;
  title: string;
  slug: string;
  description?: string;
  fileUrl: string;
  coverImage?: string;
  category: string;
  year: number;
  isPublished: boolean;
  downloadCount: number;
  createdAt: string;
}

export function PublicationManagement() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Publication | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fileUrl: '',
    coverImage: '',
    category: 'Laporan',
    year: new Date().getFullYear(),
    isPublished: false,
  });

  const categories = ['Laporan', 'APBD', 'Peraturan', 'Panduan', 'Lainnya'];

  useEffect(() => {
    fetchPublications();
  }, []);

  const fetchPublications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/publications?limit=50');
      const data = await res.json();
      if (data.data) setPublications(data.data);
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
      const url = editingItem ? `/api/publications/${editingItem.id}` : '/api/publications';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchPublications();
        closeModal();
        showSuccessToast('Publikasi berhasil disimpan');
      } else {
        showError('Gagal menyimpan publikasi');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Terjadi kesalahan saat menyimpan publikasi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showDeleteConfirm('publikasi ini');
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/publications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPublications();
        showSuccessToast('Publikasi berhasil dihapus');
      } else {
        showError('Gagal menghapus publikasi');
      }
    } catch (error) {
      showError('Terjadi kesalahan saat menghapus publikasi');
    }
  };

  const openModal = (item?: Publication) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description || '',
        fileUrl: item.fileUrl,
        coverImage: item.coverImage || '',
        category: item.category,
        year: item.year,
        isPublished: item.isPublished,
      });
    } else {
      setEditingItem(null);
      setFormData({ title: '', description: '', fileUrl: '', coverImage: '', category: 'Laporan', year: new Date().getFullYear(), isPublished: false });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">Manajemen Publikasi</h2>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
          <Plus className="w-5 h-5" /> Tambah
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" /></div>
        ) : publications.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">Tidak ada publikasi</div>
        ) : (
          publications.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                {item.coverImage ? (
                  <img src={item.coverImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Download className="w-12 h-12 text-white/50" />
                )}
              </div>
              <div className="p-4">
                <span className="text-xs text-emerald-600">{item.category} • {item.year}</span>
                <h3 className="font-medium mt-1 line-clamp-2">{item.title}</h3>
                <div className="flex items-center justify-between mt-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${item.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {item.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(item)} className="p-2 hover:bg-gray-100 rounded-lg"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-600" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">{editingItem ? 'Edit' : 'Tambah'} Publikasi</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Judul</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL File</label>
                <input type="url" value={formData.fileUrl} onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="https://..." required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL Cover</label>
                <input type="url" value={formData.coverImage} onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kategori</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tahun</label>
                  <input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isPublished} onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} className="rounded" />
                <span className="text-sm">Publikasikan</span>
              </label>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Batal</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
