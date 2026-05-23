'use client';

import { useState, useEffect } from 'react';
import { Header } from './Header';
import { HeroSection } from './HeroSection';
import { NewsSection } from './NewsSection';
import { ServicesSection } from './ServicesSection';
import { PublicationSection } from './PublicationSection';
import { GallerySection } from './GallerySection';
import { LinksSection } from './LinksSection';
import { Footer } from './Footer';
import { LoginModal } from './LoginModal';
import { NewsDetailModal } from './NewsDetailModal';
import { MobileNav } from './MobileNav';
import { SearchModal } from './SearchModal';
import { BackToTop } from './BackToTop';

interface PublicPortalProps {
  onAdminClick: () => void;
}

export function PublicPortal({ onAdminClick }: PublicPortalProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [selectedNewsSlug, setSelectedNewsSlug] = useState<string | null>(null);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  
  const [settings, setSettings] = useState({
    siteName: 'BKAD Kabupaten Seruyan',
    siteDescription: 'Portal Resmi Badan Keuangan dan Aset Daerah Kabupaten Seruyan',
    address: 'Jl. H. Ngaliman, Kuala Pembuang, Kab. Seruyan, Kalimantan Tengah',
    phone: '(0532) 123456',
    email: 'bkad@seruyankab.go.id',
    logo: '',
    facebook: '',
    twitter: '',
    instagram: '',
    youtube: '',
    mapLatitude: '-2.4000',
    mapLongitude: '112.1333',
    mapZoom: '14',
  });

  useEffect(() => {
    // Fetch settings
    fetch('/api/public/settings')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setSettings(prev => ({ ...prev, ...data.data }));
        }
      })
      .catch(console.error);

    // Fetch categories
    fetch('/api/public/categories')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setCategories(data.data);
        }
      })
      .catch(console.error);

    // Track visitor
    fetch('/api/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: '/' }),
    }).catch(console.error);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setShowMobileNav(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header 
        siteName={settings.siteName}
        logo={settings.logo}
        email={settings.email}
        phone={settings.phone}
        address={settings.address}
        onLoginClick={() => setShowLogin(true)}
        onAdminClick={onAdminClick}
        onMobileMenuOpen={() => setShowMobileNav(true)}
        onSearchOpen={() => setShowSearch(true)}
        categories={categories}
      />
      
      <main className="flex-1">
        <HeroSection />
        <NewsSection onNewsClick={setSelectedNewsSlug} />
        <ServicesSection />
        <PublicationSection />
        <GallerySection />
        <LinksSection />
      </main>

      <Footer settings={settings} />

      {/* Back to Top Button */}
      <BackToTop />

      {/* Mobile Navigation */}
      <MobileNav 
        isOpen={showMobileNav}
        onClose={() => setShowMobileNav(false)}
        categories={categories}
        onNavigate={scrollToSection}
        onSearch={() => setShowSearch(true)}
      />

      {/* Search Modal */}
      <SearchModal 
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onNewsClick={(slug) => {
          setSelectedNewsSlug(slug);
          setShowSearch(false);
        }}
      />

      {/* Login Modal */}
      {showLogin && (
        <LoginModal 
          onClose={() => setShowLogin(false)} 
          onSuccess={onAdminClick}
        />
      )}

      {/* News Detail Modal */}
      {selectedNewsSlug && (
        <NewsDetailModal 
          slug={selectedNewsSlug}
          onClose={() => setSelectedNewsSlug(null)}
        />
      )}
    </div>
  );
}
