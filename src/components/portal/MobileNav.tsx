'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronRight, Home, FileText, BookOpen, Image, Link as LinkIcon, Briefcase, Search, Phone, Mail, MapPin } from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  categories: { id: string; name: string; slug: string }[];
  onNavigate: (section: string) => void;
  onSearch: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  children?: { id: string; label: string }[];
}

export function MobileNav({ isOpen, onClose, categories, onNavigate, onSearch }: MobileNavProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const navItems: NavItem[] = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    {
      id: 'berita',
      label: 'Berita',
      icon: FileText,
      children: categories.map(c => ({ id: c.slug, label: c.name })),
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
        { id: 'dokumen-apbd', label: 'Dokumen APBD' },
        { id: 'peraturan-docs', label: 'Peraturan' },
      ],
    },
    { id: 'galeri', label: 'Galeri', icon: Image },
    { id: 'tautan', label: 'Tautan', icon: LinkIcon },
  ];

  const toggleExpand = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleNavClick = (item: NavItem, child?: { id: string; label: string }) => {
    onNavigate(item.id);
    onClose();
  };

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-emerald-600 text-white">
          <h2 className="font-bold text-lg">Menu Navigasi</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Button */}
        <div className="p-4 border-b">
          <button
            onClick={() => {
              onSearch();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <Search className="w-5 h-5" />
            <span>Cari berita, publikasi...</span>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedItems.includes(item.id);

              return (
                <div key={item.id}>
                  <button
                    onClick={() => hasChildren ? toggleExpand(item.id) : handleNavClick(item)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {hasChildren && (
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    )}
                  </button>

                  {/* Children */}
                  {hasChildren && isExpanded && (
                    <div className="ml-8 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                      {item.children!.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => handleNavClick(item, child)}
                          className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Contact Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t">
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>(0532) 123456</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-600" />
              <span>bkad@seruyankab.go.id</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 mt-0.5" />
              <span>Kuala Pembuang, Kab. Seruyan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
