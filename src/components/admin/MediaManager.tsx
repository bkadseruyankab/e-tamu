'use client';

import { useState } from 'react';
import { 
  FolderOpen, 
  Image as ImageIcon, 
  FileText, 
  Upload, 
  Search, 
  Grid, 
  List, 
  Trash2, 
  Download,
  Copy,
  Check,
  X,
  FolderPlus,
  MoreVertical
} from 'lucide-react';

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'document';
  size: string;
  url: string;
  uploadedAt: string;
  folder: string;
}

export function MediaManager() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('all');

  // Mock files
  const files: MediaFile[] = [
    { id: '1', name: 'hero-banner.jpg', type: 'image', size: '2.4 MB', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800', uploadedAt: '2024-01-15', folder: 'sliders' },
    { id: '2', name: 'laporan-apbd-2024.pdf', type: 'document', size: '1.2 MB', url: '#', uploadedAt: '2024-01-14', folder: 'documents' },
    { id: '3', name: 'kegiatan-rapat.jpg', type: 'image', size: '1.8 MB', url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', uploadedAt: '2024-01-13', folder: 'gallery' },
    { id: '4', name: 'peraturan-daerah.pdf', type: 'document', size: '890 KB', url: '#', uploadedAt: '2024-01-12', folder: 'documents' },
    { id: '5', name: 'kantor-bkad.jpg', type: 'image', size: '3.1 MB', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', uploadedAt: '2024-01-11', folder: 'gallery' },
  ];

  const folders = [
    { id: 'all', name: 'Semua File', count: files.length },
    { id: 'sliders', name: 'Slider', count: files.filter(f => f.folder === 'sliders').length },
    { id: 'gallery', name: 'Galeri', count: files.filter(f => f.folder === 'gallery').length },
    { id: 'documents', name: 'Dokumen', count: files.filter(f => f.folder === 'documents').length },
  ];

  const filteredFiles = files.filter(file => {
    if (currentFolder !== 'all' && file.folder !== currentFolder) return false;
    if (search && !file.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Media Manager</h2>
          <p className="text-sm text-gray-500">Kelola file dan media untuk website</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
          <Upload className="w-5 h-5" />
          Upload File
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Folders */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Folder</h3>
              <button className="p-1 hover:bg-gray-100 rounded-lg">
                <FolderPlus className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <nav className="space-y-1">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setCurrentFolder(folder.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    currentFolder === folder.id
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    <span className="text-sm">{folder.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{folder.count}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Storage Info */}
          <div className="bg-white rounded-xl shadow-sm p-4 mt-4">
            <h3 className="font-semibold text-gray-800 mb-3">Penyimpanan</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Digunakan</span>
                <span className="font-medium text-gray-800">8.5 MB</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '17%' }}></div>
              </div>
              <p className="text-xs text-gray-400">dari 50 MB</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari file..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400 hover:bg-gray-100'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400 hover:bg-gray-100'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Files */}
            <div className="p-4">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFile(file)}
                      className="group relative bg-gray-50 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-all"
                    >
                      {file.type === 'image' ? (
                        <img src={file.url} alt={file.name} className="w-full aspect-square object-cover" />
                      ) : (
                        <div className="w-full aspect-square flex items-center justify-center bg-gray-100">
                          <FileText className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button className="p-2 bg-white rounded-lg hover:bg-gray-100">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-white rounded-lg hover:bg-gray-100">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{file.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFile(file)}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      {file.type === 'image' ? (
                        <img src={file.url} alt={file.name} className="w-12 h-12 object-cover rounded-lg" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{file.name}</p>
                        <p className="text-sm text-gray-500">{file.size} • {file.uploadedAt}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-white rounded-lg">
                          <Copy className="w-4 h-4 text-gray-400" />
                        </button>
                        <button className="p-2 hover:bg-white rounded-lg">
                          <Download className="w-4 h-4 text-gray-400" />
                        </button>
                        <button className="p-2 hover:bg-white rounded-lg">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredFiles.length === 0 && (
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Tidak ada file ditemukan</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* File Detail Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-800">Detail File</h3>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {selectedFile.type === 'image' ? (
                <img src={selectedFile.url} alt={selectedFile.name} className="w-full max-h-64 object-contain rounded-lg mb-4" />
              ) : (
                <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-16 h-16 text-gray-300" />
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Nama File</label>
                  <p className="font-medium text-gray-800">{selectedFile.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={selectedFile.url}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border rounded-lg text-sm"
                    />
                    <button
                      onClick={() => handleCopyUrl(selectedFile.url)}
                      className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Ukuran</label>
                    <p className="font-medium text-gray-800">{selectedFile.size}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Diupload</label>
                    <p className="font-medium text-gray-800">{selectedFile.uploadedAt}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={() => setSelectedFile(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Tutup
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                <Trash2 className="w-4 h-4" />
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
