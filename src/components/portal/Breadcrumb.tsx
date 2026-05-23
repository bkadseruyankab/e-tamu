'use client';

import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 py-2">
      <a href="#beranda" className="hover:text-emerald-600 transition-colors">
        <Home className="w-4 h-4" />
      </a>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4 text-gray-300" />
          {item.href ? (
            <a href={item.href} className="hover:text-emerald-600 transition-colors">
              {item.label}
            </a>
          ) : (
            <span className="text-gray-800 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
