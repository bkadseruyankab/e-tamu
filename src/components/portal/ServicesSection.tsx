'use client';

import { useState, useEffect } from 'react';
import { FileText, BarChart2, Building, BookOpen, ArrowRight, ExternalLink, X, Users, Calendar, FileCheck, Download, File, Image, FileSpreadsheet, FileArchive, Settings, HelpCircle, ClipboardList, CreditCard, Landmark, Wallet, Receipt } from 'lucide-react';

interface ServiceFile {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  description?: string;
  downloadCount: number;
  createdAt: string;
}

interface Service {
  id: string;
  title: string;
  slug: string;
  description?: string;
  icon?: string;
  url?: string;
  content?: string;
  requirements?: string;
  procedures?: string;
  files?: ServiceFile[];
}

const iconMap: Record<string, React.ElementType> = {
  FileText: FileText,
  BarChart2: BarChart2,
  Building: Building,
  BookOpen: BookOpen,
  Users: Users,
  Settings: Settings,
  HelpCircle: HelpCircle,
  ClipboardList: ClipboardList,
  CreditCard: CreditCard,
  Landmark: Landmark,
  Wallet: Wallet,
  Receipt: Receipt,
};

export function ServicesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  useEffect(() => {
    fetch('/api/public/services')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setServices(data.data);
        }
      })
      .catch(console.error);
  }, []);

  const handleServiceClick = (service: Service) => {
    if (service.url) {
      window.open(service.url, '_blank');
    } else {
      setSelectedService(service);
    }
  };

  return (
    <>
      <section id="layanan" className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Layanan Kami</h2>
            <p className="text-gray-500 mt-2">Akses layanan informasi keuangan dan aset daerah</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => {
              const Icon = service.icon ? iconMap[service.icon] || FileText : FileText;
              
              return (
                <div
                  key={service.id}
                  onClick={() => handleServiceClick(service)}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all group cursor-pointer border border-gray-100 hover:border-emerald-200 hover:-translate-y-1"
                >
                  <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                    <Icon className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-emerald-600 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-emerald-600 font-medium text-sm group-hover:gap-2 transition-all">
                      {service.url ? (
                        <>
                          Akses Layanan
                          <ExternalLink className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Selengkapnya
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </div>
                    {service.files && service.files.length > 0 && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <File className="w-3 h-3" />
                        {service.files.length} file
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Service Detail Modal */}
      {selectedService && (
        <ServiceDetailModal 
          service={selectedService} 
          onClose={() => setSelectedService(null)} 
        />
      )}
    </>
  );
}

function ServiceDetailModal({ service, onClose }: { service: Service; onClose: () => void }) {
  const Icon = service.icon ? iconMap[service.icon] || FileText : FileText;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return FileArchive;
    return File;
  };

  // Parse requirements and procedures from database or use defaults
  const requirements = service.requirements 
    ? service.requirements.split('\n').filter(r => r.trim())
    : ['Hubungi BKAD untuk informasi persyaratan'];
  
  const procedures = service.procedures 
    ? service.procedures.split('\n').filter(p => p.trim())
    : ['Hubungi petugas BKAD untuk informasi lebih lanjut'];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{service.title}</h2>
              <p className="text-emerald-100 text-sm mt-1">{service.description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Content */}
          {service.content && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-800">Tentang Layanan</h3>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 whitespace-pre-wrap text-gray-700">
                {service.content}
              </div>
            </div>
          )}

          {/* Requirements */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-800">Persyaratan</h3>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <ul className="space-y-2">
                {requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2 text-amber-800">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Procedures */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-800">Alur Layanan</h3>
            </div>
            <div className="relative pl-8 space-y-4">
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-emerald-200"></div>
              {procedures.map((step, index) => (
                <div key={index} className="relative">
                  <div className="absolute -left-5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                  <div className="bg-gray-50 rounded-lg p-3 ml-4">
                    <span className="text-sm text-gray-700">{step}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Files */}
          {service.files && service.files.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Download className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-800">File Lampiran ({service.files.length})</h3>
              </div>
              <div className="space-y-2">
                {service.files.map((file) => {
                  const FileIcon = getFileIcon(file.mimeType);
                  return (
                    <a
                      key={file.id}
                      href={`/api/services/files/download/${file.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 border border-gray-100 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:shadow">
                          <FileIcon className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 group-hover:text-emerald-700">{file.originalName}</div>
                          <div className="text-xs text-gray-500">
                            {formatFileSize(file.size)} • {file.downloadCount}x diunduh
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-600">
                        <Download className="w-5 h-5" />
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className="bg-emerald-50 rounded-xl p-4">
            <h4 className="font-semibold text-emerald-800 mb-2">Butuh Bantuan?</h4>
            <p className="text-sm text-emerald-700 mb-3">
              Hubungi kami untuk informasi lebih lanjut tentang layanan ini.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-emerald-600">📞 (0532) 123456</span>
              <span className="text-emerald-600">📧 bkad@seruyankab.go.id</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Tutup
          </button>
          {service.url && (
            <a
              href={service.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Akses Layanan
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
