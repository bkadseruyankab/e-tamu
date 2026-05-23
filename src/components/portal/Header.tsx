'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/page';
import { Menu, User, LogOut, Settings, Search } from 'lucide-react';
import { MegaMenu } from './MegaMenu';

interface HeaderProps {
  siteName: string;
  onLoginClick: () => void;
  onAdminClick: () => void;
  onMobileMenuOpen: () => void;
  onSearchOpen: () => void;
  categories: { id: string; name: string; slug: string }[];
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export function Header({ 
  siteName, 
  onLoginClick, 
  onAdminClick, 
  onMobileMenuOpen,
  onSearchOpen,
  categories,
  logo,
  email,
  phone,
  address
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // Check if logo is a valid URL
  const hasLogo = logo && logo.trim() !== '' && logo.startsWith('/');

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-lg' : 'bg-white/95 backdrop-blur-sm'
    }`}>
      {/* Top Bar */}
      <div className="bg-emerald-700 text-white text-sm py-1.5">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4 text-xs md:text-sm">
            <span className="flex items-center gap-1">
              <span className="hidden sm:inline">📧</span> {email || 'bkad@seruyankab.go.id'}
            </span>
            <span className="hidden md:flex items-center gap-1">
              <span>📞</span> {phone || '(0532) 123456'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onAdminClick}
                  className="flex items-center gap-1 hover:text-emerald-200 transition-colors text-xs md:text-sm"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin Panel</span>
                </button>
                <span className="text-emerald-400">|</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 hover:text-red-200 transition-colors text-xs md:text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex items-center gap-1 hover:text-emerald-200 transition-colors text-xs md:text-sm"
              >
                <User className="w-4 h-4" />
                <span>Login Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          {/* Logo */}
          <a href="#beranda" onClick={() => scrollToSection('beranda')} className="flex items-center gap-3">
            {hasLogo ? (
              <img 
                src={logo} 
                alt={siteName} 
                className="h-10 md:h-12 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                  if (nextSibling) {
                    nextSibling.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div 
              className={`w-10 h-10 md:w-12 md:h-12 bg-emerald-600 rounded-lg flex items-center justify-center ${hasLogo ? 'hidden' : 'flex'}`}
            >
              <span className="text-white font-bold text-lg md:text-xl">B</span>
            </div>
            <div>
              <h1 className="text-base md:text-xl font-bold text-emerald-800 leading-tight">
                {siteName}
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                Kabupaten Seruyan, Kalimantan Tengah
              </p>
            </div>
          </a>

          {/* Desktop Navigation with Mega Menu */}
          <div className="hidden lg:block">
            <MegaMenu 
              categories={categories} 
              onNavigate={scrollToSection} 
            />
          </div>

          {/* Search & Mobile Menu */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <button
              onClick={onSearchOpen}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Cari"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={onMobileMenuOpen}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Menu"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Navigation Bar (Desktop) */}
      <div className="hidden lg:block border-t border-gray-100 bg-gray-50">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>📍</span>
              <span>{address || 'Jl. H. Ngaliman, Kuala Pembuang, Kab. Seruyan'}</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#kontak" className="text-xs text-gray-500 hover:text-emerald-600 transition-colors">
                Kontak
              </a>
              <a href="#" className="text-xs text-gray-500 hover:text-emerald-600 transition-colors">
                FAQ
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
