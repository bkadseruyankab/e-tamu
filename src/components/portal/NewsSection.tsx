'use client';

import { useState, useEffect } from 'react';
import { Calendar, Eye, ArrowRight } from 'lucide-react';

interface News {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  image?: string;
  isFeatured?: boolean;
  viewCount?: number;
  publishedAt?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    color?: string;
  };
}

interface NewsSectionProps {
  onNewsClick: (slug: string) => void;
}

export function NewsSection({ onNewsClick }: NewsSectionProps) {
  const [news, setNews] = useState<News[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/categories')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setCategories(data.data);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const url = selectedCategory
      ? `/api/public/news?limit=6&category=${selectedCategory}`
      : '/api/public/news?limit=6';
    
    const fetchNews = async () => {
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (isMounted && data.data) {
          setNews(data.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchNews();
    
    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  const featuredNews = news.filter(n => n.isFeatured)[0];
  const regularNews = news.filter(n => !n.isFeatured || n.id !== featuredNews?.id);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <section id="berita" className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Berita Terbaru</h2>
            <p className="text-gray-500 mt-1">Informasi dan berita terkini dari BKAD</p>
          </div>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === ''
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semua
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.slug
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl animate-pulse h-80" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Featured News */}
            {featuredNews && (
              <div
                onClick={() => onNewsClick(featuredNews.slug)}
                className="lg:row-span-2 bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
              >
                <div className="relative h-64 lg:h-80">
                  <img
                    src={featuredNews.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=400&fit=crop'}
                    alt={featuredNews.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {featuredNews.category && (
                    <span
                      className="absolute top-4 left-4 px-3 py-1 rounded-full text-white text-sm font-medium"
                      style={{ backgroundColor: featuredNews.category.color || '#059669' }}
                    >
                      {featuredNews.category.name}
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-emerald-600 transition-colors">
                    {featuredNews.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {featuredNews.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {featuredNews.publishedAt ? formatDate(featuredNews.publishedAt) : '-'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {featuredNews.viewCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Regular News */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {regularNews.slice(0, 4).map(item => (
                <div
                  key={item.id}
                  onClick={() => onNewsClick(item.slug)}
                  className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                >
                  <div className="relative h-40">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.category && (
                      <span
                        className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-xs font-medium"
                        style={{ backgroundColor: item.category.color || '#059669' }}
                      >
                        {item.category.name}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.publishedAt ? formatDate(item.publishedAt) : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-8">
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
            Lihat Semua Berita
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
