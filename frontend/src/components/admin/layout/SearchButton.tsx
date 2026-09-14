'use client';

import { cn } from '@/lib/utils';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Calendar,
  ChevronRight,
  Files,
  Folder,
  Globe,
  Image,
  LayoutGrid,
  Mail,
  MessageSquare,
  Music,
  Search,
  Settings,
  StickyNote,
  Terminal,
  Sparkles
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { LottieIcon } from '@/components/ui/LottieIcon';
import dashboardAnimation from '@/data/dashboard.json';
import calendarAnimation from '@/data/calendar.json';
import productAnimation from '@/data/product.json';
import ordersAnimation from '@/data/orders.json';

interface Shortcut {
  label: string;
  icon: React.ReactNode | ((isHovered: boolean) => React.ReactNode);
  link: string;
}

interface SearchResult {
  icon: React.ReactNode;
  label: string;
  description: string;
  link: string;
}



interface ShortcutButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
}

const ShortcutButton = ({ icon, onClick }: ShortcutButtonProps) => {
  return (
    <button type="button" onClick={onClick} className="rounded-full cursor-pointer hover:shadow-lg opacity-30 hover:opacity-100 transition-[opacity,shadow] duration-200">
      <div className="size-9 aspect-square flex items-center justify-center bg-transparent">{icon}</div>
    </button>
  );
}

interface SpotlightPlaceholderProps {
  text: string;
  className?: string;
}

const SpotlightPlaceholder = ({ text, className }: SpotlightPlaceholderProps) => {
  return (
    <div
      className={cn('absolute inset-0 flex items-center pointer-events-none z-10 pr-4', className)}
    >
      <span className="block truncate w-full">{text}</span>
    </div>
  );
};

interface SpotlightInputProps {
  placeholder: string;
  hidePlaceholder: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholderClassName?: string;
}

const SpotlightInput = ({
  placeholder,
  hidePlaceholder,
  value,
  onChange,
  placeholderClassName
}: SpotlightInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input when the component mounts
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex items-center w-full justify-start gap-2 px-4 h-10">
      <motion.div layoutId="search-icon">
        <Search size={16} />
      </motion.div>
      <div className="flex-1 relative text-sm flex items-center">
        {!hidePlaceholder && (
          <SpotlightPlaceholder text={placeholder} className={placeholderClassName} />
        )}

        <motion.input
          ref={inputRef}
          layout="position"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent outline-none ring-0 border-none m-0 p-0 text-sm text-white truncate pr-4"
        />
      </div>
    </div>
  );
};

interface SearchResultCardProps extends SearchResult {
  isLast: boolean;
}

const SearchResultCard = ({ icon, label, description, link, isLast }: SearchResultCardProps) => {
  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className="overflow-hidden w-full group/card block">
      <div
        className={cn(
          'flex items-center text-white justify-start hover:bg-white/10 gap-3 py-2 px-2 rounded-xl transition-colors duration-200 w-full',
          isLast && 'rounded-b-3xl'
        )}
      >
        <div className="size-8 [&_svg]:stroke-[1.5] [&_svg]:size-6 aspect-square flex items-center justify-center">
          {icon}
        </div>
        <div className="flex flex-col">
          <p className="font-medium text-sm m-0 leading-tight">{label}</p>
          <p className="text-xs opacity-50 m-0 leading-tight">{description}</p>
        </div>
        <div className="flex-1 flex items-center justify-end opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
          <ChevronRight className="size-6" />
        </div>
      </div>
    </a>
  );
};

interface SearchResultsContainerProps {
  searchResults: SearchResult[];
  onHover: (index: number | null) => void;
}

const SearchResultsContainer = ({ searchResults, onHover }: SearchResultsContainerProps) => {
  return (
    <motion.div
      onMouseLeave={() => onHover(null)}
      className="flex flex-col max-h-96 overflow-y-auto w-full p-2 custom-scrollbar"
    >
      {searchResults.map((result, index) => {
        return (
          <motion.div
            key={`search-result-${index}`}
            onMouseEnter={() => onHover(index)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              delay: index * 0.1,
              duration: 0.2,
              ease: 'easeOut'
            }}
          >
            <SearchResultCard
              icon={result.icon}
              label={result.label}
              description={result.description}
              link={result.link}
              isLast={index === searchResults.length - 1}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
};

interface SearchButtonProps {
  shortcuts?: Shortcut[];
  isOpen?: boolean;
  handleClose?: () => void;
}

export const SearchButton = ({
  shortcuts,
  isOpen = true,
  handleClose = () => {}
}: SearchButtonProps) => {
  const [hovered, setHovered] = useState(false);
  const [hoveredSearchResult, setHoveredSearchResult] = useState<number | null>(null);
  const [hoveredShortcut, setHoveredShortcut] = useState<number | null>(null);
  const [searchValue, setSearchValue] = useState('');

  const defaultShortcuts: Shortcut[] = [
    {
      label: 'Tổng quan',
      icon: (isHovered: boolean) => <LottieIcon animationData={dashboardAnimation} className="w-5 h-5" autoplay={false} playing={isHovered} />,
      link: '/dashboard'
    },
    {
      label: 'Lịch',
      icon: (isHovered: boolean) => <LottieIcon animationData={calendarAnimation} className="w-5 h-5" autoplay={false} playing={isHovered} />,
      link: '/calendar'
    },
    {
      label: 'Sản phẩm',
      icon: (isHovered: boolean) => <LottieIcon animationData={productAnimation} className="w-5 h-5" autoplay={false} playing={isHovered} />,
      link: '/product'
    },
    {
      label: 'Đơn hàng',
      icon: (isHovered: boolean) => <LottieIcon animationData={ordersAnimation} className="w-5 h-5" autoplay={false} playing={isHovered} />,
      link: '/orders'
    }
  ];

  const activeShortcuts = shortcuts || defaultShortcuts;

  const handleSearchValueChange = (value: string) => {
    setSearchValue(value);
  };

  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/plans')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPlans(data);
      })
      .catch(err => console.error('Failed to fetch plans for search', err));
  }, []);

  const staticResults: SearchResult[] = [
    {
      icon: <Calendar />,
      label: 'Lịch / Lịch kế hoạch',
      description: 'Xem các sự kiện, kế hoạch sắp tới của bạn.',
      link: '/calendar'
    },
    {
      icon: <Calendar />,
      label: 'Lịch / Chiến dịch marketing',
      description: 'Quản lý và theo dõi các chiến dịch tiếp thị.',
      link: '/calendar'
    },
    {
      icon: <Calendar />,
      label: 'Lịch / Lịch giao hàng',
      description: 'Kiểm tra trạng thái và lịch trình giao hàng.',
      link: '/calendar'
    }
  ];

  const planResults: SearchResult[] = plans.map(p => ({
    icon: <StickyNote />,
    label: `Lịch / Lịch kế hoạch / ${p.title}`,
    description: `Ngày: ${p.date} ${p.time || ''} ${p.location ? '- ' + p.location : ''}`,
    link: `/calendar`
  }));

  const allResults = [...staticResults, ...planResults];
  const searchResults = allResults.filter(r => 
    r.label.toLowerCase().includes(searchValue.toLowerCase()) || 
    r.description.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  return (
    <div 
      className="relative w-full flex flex-col items-center justify-center"
      onMouseLeave={() => {
        setHovered(false);
        setHoveredShortcut(null);
        setSearchValue('');
      }}
    >
          <div
            onMouseEnter={() => setHovered(true)}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'w-full flex items-center justify-end gap-2 z-20 group',
              '[&_svg]:size-4 [&_svg]:stroke-[1.4]',
              'max-w-3xl'
            )}
          >
            <AnimatePresence mode="popLayout">
              <motion.div
                layoutId="search-input-container"
                transition={{
                  layout: {
                    duration: 0.5,
                    type: 'spring',
                    bounce: 0.2
                  }
                }}
                style={{ transformOrigin: "left center", borderRadius: 9999 }}
                className="w-full flex flex-col items-center justify-start z-10 relative overflow-hidden bg-[#222222] border border-white/10"
              >
                <SpotlightInput
                  placeholder={
                    hoveredShortcut !== null
                      ? activeShortcuts[hoveredShortcut].label
                      : hoveredSearchResult !== null
                      ? searchResults[hoveredSearchResult].label
                      : 'Search...'
                  }
                  placeholderClassName={
                    hoveredSearchResult !== null ? 'text-white opacity-50' : 'text-gray-500'
                  }
                  hidePlaceholder={!(hoveredSearchResult !== null || !searchValue)}
                  value={searchValue}
                  onChange={handleSearchValueChange}
                />
              </motion.div>
              
              <AnimatePresence>
                {searchValue && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 w-full pt-2 z-50"
                  >
                    <div className="w-full bg-[#222222] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                      <SearchResultsContainer
                        searchResults={searchResults}
                        onHover={setHoveredSearchResult}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {hovered &&
                activeShortcuts.map((shortcut, index) => (
                  <motion.div
                    key={`shortcut-${index}`}
                    onMouseEnter={() => setHoveredShortcut(index)}
                    layout
                    initial={{ scale: 0.7, x: -1 * (44 * (index + 1)) }}
                    animate={{ scale: 1, x: 0 }}
                    exit={{
                      scale: 0.7,
                      x: -1 * (44 * (index + 1))
                    }}
                    transition={{
                      duration: 0.8,
                      type: 'spring',
                      bounce: 0.2,
                      delay: index * 0.05
                    }}
                    className="rounded-full cursor-pointer bg-white/5 border border-white/10 text-white shadow-lg"
                  >
                    <ShortcutButton 
                      icon={typeof shortcut.icon === 'function' ? shortcut.icon(hoveredShortcut === index) : shortcut.icon} 
                      onClick={() => handleSearchValueChange(`${shortcut.label} / `)} 
                    />
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
    </div>
  );
};
