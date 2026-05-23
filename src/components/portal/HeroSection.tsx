'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slider {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  link?: string;
}

const defaultSlides: Slider[] = [
  {
    id: '1',
    title: 'Selamat Datang di Portal BKAD',
    description: 'Portal Resmi Badan Keuangan dan Aset Daerah Kabupaten Seruyan',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=500&fit=crop',
  },
  {
    id: '2',
    title: 'Transparansi Keuangan Daerah',
    description: 'Informasi APBD dan Laporan Keuangan Pemerintah Daerah',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=500&fit=crop',
  },
  {
    id: '3',
    title: 'Pengelolaan Aset Daerah',
    description: 'Data dan Informasi Aset Daerah Kabupaten Seruyan',
    imageUrl: 'https://images.unsplash.com/photo-1464938050520-ef2571cf6f32?w=1200&h=500&fit=crop',
  },
];

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sliders, setSliders] = useState<Slider[]>(defaultSlides);

  useEffect(() => {
    fetch('/api/public/sliders')
      .then(res => res.json())
      .then(data => {
        if (data.data && data.data.length > 0) {
          setSliders(data.data);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliders.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [sliders.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliders.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sliders.length) % sliders.length);
  };

  return (
    <section id="beranda" className="relative">
      {/* Slider */}
      <div className="relative h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden">
        {sliders.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.imageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 to-emerald-800/50" />
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-4">
                <div className="max-w-2xl text-white">
                  <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 animate-fade-in">
                    {slide.title}
                  </h2>
                  {slide.description && (
                    <p className="text-lg md:text-xl opacity-90 mb-6">
                      {slide.description}
                    </p>
                  )}
                  {slide.link && (
                    <a
                      href={slide.link}
                      className="inline-flex items-center px-6 py-3 bg-white text-emerald-700 font-semibold rounded-lg hover:bg-emerald-50 transition-colors"
                    >
                      Selengkapnya
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {sliders.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-emerald-700 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Berita" icon="📰" apiEndpoint="/api/public/stats" dataKey="totalNews" />
            <StatCard label="Publikasi" icon="📊" apiEndpoint="/api/public/stats" dataKey="totalPublications" />
            <StatCard label="Galeri" icon="🖼️" apiEndpoint="/api/public/stats" dataKey="totalGallery" />
            <StatCard label="Pengunjung" icon="👥" apiEndpoint="/api/public/stats" dataKey="totalVisitors" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  icon,
  apiEndpoint,
  dataKey
}: {
  label: string;
  icon: string;
  apiEndpoint: string;
  dataKey: string;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    fetch(apiEndpoint)
      .then(res => res.json())
      .then(data => {
        if (data.data && data.data[dataKey] !== undefined) {
          setValue(data.data[dataKey]);
        }
      })
      .catch(console.error);
  }, [apiEndpoint, dataKey]);

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-2xl md:text-3xl font-bold">{value.toLocaleString()}</span>
      </div>
      <p className="text-emerald-100 text-sm">{label}</p>
    </div>
  );
}
