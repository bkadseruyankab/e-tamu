'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Loader2, ExternalLink } from 'lucide-react';
import { showError, showDeleteConfirm, showSuccessToast } from '@/lib/sweetalert';

interface Link {
  id: string;
  title: string;
  url: string;
  logo?: string;
  category: string;
  order: number;
  isActive: boolean;
}

export function LinkManagement() {
  const [items, setItems] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Link | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    url: '',
    logo: '',
    category: 'Pemerintah',
    order: 0,
    isActive: true,
  });

  const categories = ['Pemerintah', 'Kementerian', 'Lainnya'];

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/links');
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
      const url = editingItem ? `/api/links/${editingItem.id}` : '/api/links';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchLinks();
        closeModal();
        showSuccessToast('Tautan berhasil disimpan');
      } else {
        showError('Gagal menyimpan tautan');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Terjadi kesalahan saat menyimpan tautan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showDeleteConfirm('tautan ini');
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLinks();
        showSuccessToast('Tautan berhasil dihapus');
      } else {
        showError('Gagal menghapus tautan');
      }
    } catch (error) {
      showError('Terjadi kesalahan saat menghapus tautan');
    }
  };

  const openModal = (item?: Link) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        url: item.url,
        logo: item.logo || '',
        category: item.category,
        order: item.order,
        isActive: item.isActive,
      });
    } else {
      setEditingItem(null);
      setFormData({ title: '', url: '', logo: '', category: 'Pemerintah', order: 0, isActive: true });
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
        <h2 className="text-xl font-semibold">Manajemen Tautan</h2>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
          <Plus className="w-5 h-5" /> Tambah
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Judul</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">URL</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Kategori</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-right px-6 py-3 text-sm font-semibold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" /></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Tidak ada tautan</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.logo ? (
                        <img src={item.logo} alt="" className="w-8 h-8 object-contain" />
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <span className="font-medium">{item.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{item.url}</td>
                  <td className="px-6 py-4">{item.category}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal(item)} className="p-2 hover:bg-gray-100 rounded-lg"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-600" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">{editingItem ? 'Edit' : 'Tambah'} Tautan</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Judul</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <input type="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="https://..." required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL Logo (opsional)</label>
                <input type="url" value={formData.logo} onChange={(e) => setFormData({ ...formData, logo: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kategori</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Urutan</label>
                  <input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })} className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded" />
                <span className="text-sm">Aktif</span>
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
