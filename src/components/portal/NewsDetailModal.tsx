'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Eye, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface NewsDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  image?: string;
  viewCount?: number;
  publishedAt?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    color?: string;
  };
  author?: {
    id: string;
    name: string;
  };
}

interface NewsDetailModalProps {
  slug: string;
  onClose: () => void;
}

export function NewsDetailModal({ slug, onClose }: NewsDetailModalProps) {
  const [news, setNews] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/news/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setNews(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : news ? (
          <>
            {/* Image */}
            <div className="relative h-64 md:h-80 rounded-t-2xl overflow-hidden">
              <img
                src={news.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=500&fit=crop'}
                alt={news.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              {news.category && (
                <span
                  className="absolute bottom-4 left-4 px-3 py-1 rounded-full text-white text-sm font-medium"
                  style={{ backgroundColor: news.category.color || '#059669' }}
                >
                  {news.category.name}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="p-6 md:p-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                {news.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b">
                {news.author && (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {news.author.name}
                  </span>
                )}
                {news.publishedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(news.publishedAt)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {news.viewCount || 0} views
                </span>
              </div>

              <div 
                className="prose prose-emerald max-w-none"
                dangerouslySetInnerHTML={{ __html: news.content }}
              />
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-gray-500">
            Berita tidak ditemukan
          </div>
        )}
      </div>
    </div>
  );
}
