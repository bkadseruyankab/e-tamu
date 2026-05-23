'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search, FileText, BookOpen, Image as ImageIcon, Loader2 } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'news' | 'publication' | 'gallery';
  title: string;
  excerpt?: string;
  image?: string;
  slug?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewsClick: (slug: string) => void;
}

export function SearchModal({ isOpen, onClose, onNewsClick }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'news' | 'publication' | 'gallery'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        // Search news
        const newsRes = await fetch(`/api/public/news?limit=10`);
        const newsData = await newsRes.json();
        
        const filteredResults: SearchResult[] = [];
        
        if (newsData.data) {
          const filtered = newsData.data.filter((item: SearchResult) =>
            item.title.toLowerCase().includes(query.toLowerCase())
          );
          filtered.forEach((item: SearchResult) => {
            filteredResults.push({
              ...item,
              type: 'news',
            });
          });
        }

        setResults(filteredResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'news' && result.slug) {
      onNewsClick(result.slug);
      onClose();
      setQuery('');
      setResults([]);
    }
  };

  const filteredResults = results.filter(r => 
    activeTab === 'all' || r.type === activeTab
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-top-4 duration-200">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari berita, publikasi, galeri..."
            className="flex-1 text-lg outline-none placeholder:text-gray-400"
          />
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b bg-gray-50">
          {[
            { id: 'all' as const, label: 'Semua' },
            { id: 'news' as const, label: 'Berita' },
            { id: 'publication' as const, label: 'Publikasi' },
            { id: 'gallery' as const, label: 'Galeri' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : query && filteredResults.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Tidak ada hasil untuk "{query}"</p>
            </div>
          ) : !query ? (
            <div className="py-12 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Ketik untuk mencari berita, publikasi, atau galeri</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    {result.type === 'news' && <FileText className="w-6 h-6 text-gray-400" />}
                    {result.type === 'publication' && <BookOpen className="w-6 h-6 text-gray-400" />}
                    {result.type === 'gallery' && <ImageIcon className="w-6 h-6 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-emerald-600 font-medium uppercase">
                        {result.type === 'news' ? 'Berita' : result.type === 'publication' ? 'Publikasi' : 'Galeri'}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-800 line-clamp-1">{result.title}</h4>
                    {result.excerpt && (
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">{result.excerpt}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50 text-center">
          <p className="text-xs text-gray-400">
            Tekan <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600">ESC</kbd> untuk menutup
          </p>
        </div>
      </div>
    </div>
  );
}
