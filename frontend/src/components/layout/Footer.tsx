import React from 'react';
import { Apple, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export interface PublicFooterLink {
  id: string;
  label: string;
  url: string;
  sortOrder: number;
}

export interface PublicFooterColumn {
  id: string;
  type: 'column';
  title: string;
  sortOrder: number;
  links: PublicFooterLink[];
}

export interface PublicFooterBottom {
  id: string;
  type: 'bottom';
  copyrightText: string;
  links: PublicFooterLink[];
}

export interface PublicFooterResponse {
  columns: PublicFooterColumn[];
  bottom: PublicFooterBottom | null;
}

const fetchActiveFooter = async (): Promise<PublicFooterResponse> => {
  const res = await fetch(`${API_BASE_URL}/api/footer/active`);
  if (!res.ok) {
    throw new Error('Failed to fetch footer');
  }
  return res.json();
};

export function Footer() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['footer-active'],
    queryFn: fetchActiveFooter,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const isExternal = (url: string) => {
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const renderLink = (link: PublicFooterLink) => {
    if (isExternal(link.url)) {
      return (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline transition-colors"
        >
          {link.label}
        </a>
      );
    }
    return (
      <Link to={link.url} className="hover:underline transition-colors">
        {link.label}
      </Link>
    );
  };

  return (
    <footer className="app-footer bg-[#f5f5f7] border-t border-neutral-300 text-xs text-neutral-500 pt-10 pb-14">
      <div className="max-w-[1024px] mx-auto px-4 md:px-8 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 border-b border-neutral-300 pb-4 text-neutral-600">
          <Apple className="w-4 h-4" />
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Cửa Hàng Trực Tuyến của Apple</span>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-4 bg-neutral-200 rounded w-24"></div>
                  <div className="space-y-2">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="h-3 bg-neutral-200 rounded w-20"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="h-10 bg-neutral-200 rounded w-full"></div>
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-neutral-400">
            {/* Fail silently for user but maintain layout structure */}
          </div>
        ) : (
          <>
            {/* Footer Navigation Columns */}
            {data?.columns && data.columns.length > 0 && (
              <div
                className="grid gap-8 leading-relaxed grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              >
                {data.columns.map((col) => (
                  <div key={col.id} className="space-y-2 break-inside-avoid">
                    <h4 className="font-semibold text-[#1d1d1f]">{col.title}</h4>
                    {col.links && col.links.length > 0 && (
                      <ul className="space-y-1.5 flex flex-col items-start">
                        {col.links.map((link) => (
                          <li key={link.id}>{renderLink(link)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Copyright & Legal Links */}
            {data?.bottom && (
              <div className="pt-6 border-t border-neutral-300 flex flex-col md:flex-row items-center justify-between gap-4 text-[#6e6e73]">
                <p>{data.bottom.copyrightText}</p>
                {data.bottom.links && data.bottom.links.length > 0 && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {data.bottom.links.map((link, index) => (
                      <React.Fragment key={link.id}>
                        {renderLink(link)}
                        {index < data.bottom.links.length - 1 && (
                          <span className="text-neutral-300">|</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </footer>
  );
}
