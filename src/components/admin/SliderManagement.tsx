'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { showError, showDeleteConfirm, showSuccessToast } from '@/lib/sweetalert';

interface Slider {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  link?: string;
  order: number;
  isActive: boolean;
}

export function SliderManagement() {
  const [items, setItems] = useState<Slider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Slider | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    link: '',
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchSliders();
  }, []);

  const fetchSliders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sliders');
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
      const url = editingItem ? `/api/sliders/${editingItem.id}` : '/api/sliders';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchSliders();
        closeModal();
        showSuccessToast('Slider berhasil disimpan');
      } else {
        showError('Gagal menyimpan slider');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Terjadi kesalahan saat menyimpan slider');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showDeleteConfirm('slider ini');
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/sliders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSliders();
        showSuccessToast('Slider berhasil dihapus');
      } else {
        showError('Gagal menghapus slider');
      }
    } catch (error) {
      showError('Terjadi kesalahan saat menghapus slider');
    }
  };

  const openModal = (item?: Slider) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description || '',
        imageUrl: item.imageUrl,
        link: item.link || '',
        order: item.order,
        isActive: item.isActive,
      });
    } else {
      setEditingItem(null);
      setFormData({ title: '', description: '', imageUrl: '', link: '', order: 0, isActive: true });
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
        <h2 className="text-xl font-semibold">Manajemen Slider</h2>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
          <Plus className="w-5 h-5" /> Tambah
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" /></div>
        ) : items.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">Tidak ada slider</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="h-40 relative">
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={() => openModal(item)} className="p-2 bg-white rounded-lg shadow"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 bg-white rounded-lg shadow"><Trash2 className="w-4 h-4 text-red-600" /></button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium">{item.title}</h3>
                {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">Order: {item.order}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {item.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
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
              <h2 className="text-xl font-semibold">{editingItem ? 'Edit' : 'Tambah'} Slider</h2>
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
                <label className="block text-sm font-medium mb-1">URL Gambar</label>
                <input type="url" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="https://..." required />
                {formData.imageUrl && (
                  <img src={formData.imageUrl} alt="" className="mt-2 w-full h-32 object-cover rounded-lg" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Link (opsional)</label>
                <input type="url" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
