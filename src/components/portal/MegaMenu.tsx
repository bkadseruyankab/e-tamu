'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, FileText, BookOpen, Image, Link as LinkIcon, Briefcase, Home } from 'lucide-react';

interface MegaMenuProps {
  categories: { id: string; name: string; slug: string }[];
  onNavigate: (section: string) => void;
}

export function MegaMenu({ categories, onNavigate }: MegaMenuProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    {
      id: 'beranda',
      label: 'Beranda',
      icon: Home,
    },
    {
      id: 'berita',
      label: 'Berita',
      icon: FileText,
      children: categories.length > 0 ? categories.map(cat => ({
        id: cat.slug,
        label: cat.name,
      })) : [
        { id: 'berita-utama', label: 'Berita Utama' },
        { id: 'pengumuman', label: 'Pengumuman' },
        { id: 'regulasi', label: 'Regulasi' },
      ],
    },
    {
      id: 'layanan',
      label: 'Layanan',
      icon: Briefcase,
      children: [
        { id: 'apbd', label: 'Informasi APBD' },
        { id: 'laporan', label: 'Laporan Keuangan' },
        { id: 'aset', label: 'Data Aset Daerah' },
        { id: 'peraturan', label: 'Peraturan' },
      ],
    },
    {
      id: 'publikasi',
      label: 'Publikasi',
      icon: BookOpen,
      children: [
        { id: 'laporan-keuangan', label: 'Laporan Keuangan' },
        { id: 'apbd-docs', label: 'Dokumen APBD' },
        { id: 'peraturan-docs', label: 'Peraturan' },
        { id: 'panduan', label: 'Panduan' },
      ],
    },
    {
      id: 'galeri',
      label: 'Galeri',
      icon: Image,
    },
    {
      id: 'tautan',
      label: 'Tautan',
      icon: LinkIcon,
    },
  ];

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (item.children) {
      setActiveMenu(activeMenu === item.id ? null : item.id);
    } else {
      onNavigate(item.id);
      setActiveMenu(null);
    }
  };

  const handleSubmenuClick = (parentId: string) => {
    onNavigate(parentId);
    setActiveMenu(null);
  };

  return (
    <nav ref={menuRef} className="flex items-center gap-1">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const hasChildren = item.children && item.children.length > 0;
        const isActive = activeMenu === item.id;

        return (
          <div key={item.id} className="relative">
            <button
              onClick={() => handleMenuClick(item)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                isActive
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.label}
              {hasChildren && (
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`} />
              )}
            </button>

            {/* Dropdown Menu */}
            {hasChildren && isActive && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {item.children!.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => handleSubmenuClick(item.id)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4 text-gray-400" />
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
