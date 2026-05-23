'use client';

import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Youtube, Map } from 'lucide-react';

interface FooterProps {
  settings: {
    siteName: string;
    siteDescription?: string;
    address: string;
    phone: string;
    email: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    logo?: string;
    mapLatitude?: string;
    mapLongitude?: string;
    mapZoom?: string;
  };
}

export function Footer({ settings }: FooterProps) {
  const currentYear = new Date().getFullYear();
  
  // Check if logo is valid
  const hasLogo = settings.logo && settings.logo.trim() !== '' && settings.logo.startsWith('/');
  
  // Get map coordinates
  const lat = parseFloat(settings.mapLatitude || '-2.4000');
  const lng = parseFloat(settings.mapLongitude || '112.1333');
  const zoom = parseInt(settings.mapZoom || '14');
  
  // Calculate bbox for OpenStreetMap embed
  const delta = 0.01 * (18 - zoom);
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lng}`;
  const googleMapsUrl = `https://maps.google.com/?q=${lat},${lng}`;

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {hasLogo ? (
                <img 
                  src={settings.logo} 
                  alt={settings.siteName} 
                  className="h-12 w-auto object-contain bg-white rounded-lg p-1"
                />
              ) : (
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
              )}
              <h3 className="text-lg font-bold">{settings.siteName}</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              {settings.siteDescription || 'Portal Resmi Badan Keuangan dan Aset Daerah Kabupaten Seruyan, Kalimantan Tengah. Melayani dengan transparansi dan profesionalisme.'}
            </p>
            <div className="flex gap-2">
              {settings.facebook && (
                <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-lg hover:bg-emerald-600 transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {settings.twitter && (
                <a href={settings.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-lg hover:bg-emerald-600 transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {settings.instagram && (
                <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-lg hover:bg-emerald-600 transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings.youtube && (
                <a href={settings.youtube} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-lg hover:bg-emerald-600 transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Tautan Cepat</h3>
            <ul className="space-y-2">
              <li>
                <a href="#beranda" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm">
                  Beranda
                </a>
              </li>
              <li>
                <a href="#berita" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm">
                  Berita
                </a>
              </li>
              <li>
                <a href="#layanan" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm">
                  Layanan
                </a>
              </li>
              <li>
                <a href="#publikasi" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm">
                  Publikasi
                </a>
              </li>
              <li>
                <a href="#galeri" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm">
                  Galeri
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Kontak</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400 text-sm">{settings.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-400" />
                <span className="text-gray-400 text-sm">{settings.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-emerald-400" />
                <span className="text-gray-400 text-sm">{settings.email}</span>
              </li>
            </ul>
          </div>

          {/* Map */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Map className="w-5 h-5 text-emerald-400" />
              Lokasi
            </h3>
            <div className="rounded-lg overflow-hidden border border-gray-700 h-40">
              <iframe 
                src={mapUrl}
                width="100%" 
                height="100%" 
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Lokasi ${settings.siteName}`}
              />
            </div>
            <a 
              href={googleMapsUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm"
            >
              <MapPin className="w-4 h-4" />
              Buka di Google Maps
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-gray-500 text-sm text-center md:text-left">
              © {currentYear} {settings.siteName}. Hak Cipta Dilindungi.
            </p>
            <p className="text-gray-600 text-xs">
              Dikelola oleh BKAD Kabupaten Seruyan
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
