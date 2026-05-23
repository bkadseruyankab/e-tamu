'use client';

import { useState, useEffect } from 'react';
import { Download, FileText, Calendar } from 'lucide-react';

interface Publication {
  id: string;
  title: string;
  slug: string;
  description?: string;
  fileUrl: string;
  coverImage?: string;
  category: string;
  year: number;
  downloadCount?: number;
  publishedAt?: string;
}

export function PublicationSection() {
  const [publications, setPublications] = useState<Publication[]>([]);

  useEffect(() => {
    fetch('/api/public/publications?limit=4')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setPublications(data.data);
        }
      })
      .catch(console.error);
  }, []);

  const handleDownload = async (pub: Publication) => {
    // Increment download count
    window.open(pub.fileUrl, '_blank');
  };

  return (
    <section id="publikasi" className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Publikasi</h2>
            <p className="text-gray-500 mt-1">Dokumen dan laporan keuangan daerah</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {publications.map((pub) => (
            <div
              key={pub.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-all group"
            >
              <div className="relative h-48 bg-gradient-to-br from-emerald-500 to-emerald-700">
                {pub.coverImage ? (
                  <img
                    src={pub.coverImage}
                    alt={pub.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-16 h-16 text-white/50" />
                  </div>
                )}
                <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 rounded-full text-xs font-medium text-gray-700">
                  {pub.year}
                </div>
              </div>
              <div className="p-4">
                <span className="text-xs text-emerald-600 font-medium uppercase">
                  {pub.category}
                </span>
                <h3 className="font-semibold text-gray-800 mt-1 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                  {pub.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {pub.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {pub.publishedAt ? new Date(pub.publishedAt).toLocaleDateString('id-ID', {
                      month: 'short',
                      year: 'numeric',
                    }) : '-'}
                  </span>
                  <button
                    onClick={() => handleDownload(pub)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Unduh
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {publications.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Belum ada publikasi tersedia</p>
          </div>
        )}
      </div>
    </section>
  );
}
