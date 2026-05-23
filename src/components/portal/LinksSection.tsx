'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Link as LinkIcon } from 'lucide-react';

interface Link {
  id: string;
  title: string;
  url: string;
  logo?: string;
  category: string;
}

export function LinksSection() {
  const [links, setLinks] = useState<Link[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/public/links')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setLinks(data.data);
          // Extract unique categories
          const cats = [...new Set(data.data.map((l: Link) => l.category))];
          setCategories(cats);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <section id="tautan" className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Tautan Terkait</h2>
          <p className="text-gray-500 mt-2">Link ke situs web pemerintah dan instansi terkait</p>
        </div>

        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">{category}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {links
                .filter(link => link.category === category)
                .map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 border border-gray-100 transition-all group"
                  >
                    {link.logo ? (
                      <img
                        src={link.logo}
                        alt={link.title}
                        className="w-10 h-10 object-contain"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <LinkIcon className="w-5 h-5 text-emerald-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 group-hover:text-emerald-600 transition-colors truncate">
                        {link.title}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
                  </a>
                ))}
            </div>
          </div>
        ))}

        {links.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <LinkIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Belum ada tautan tersedia</p>
          </div>
        )}
      </div>
    </section>
  );
}
