import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { rememberHomeSection } from '@/lib/homeSectionHistory';

export function useHomeSectionReturn(sectionId: string) {
  const location = useLocation();

  return useCallback(() => {
    rememberHomeSection(sectionId, location.key);
  }, [location.key, sectionId]);
}
