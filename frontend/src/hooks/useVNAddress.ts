import { useState, useEffect, useRef, useCallback } from 'react';
import { createLatestRequest } from '../lib/latest-request';

export interface Province {
  code: number;
  name: string;
}

export interface District {
  code: number;
  name: string;
  province_code: number;
}

export interface Ward {
  code: number;
  name: string;
  district_code: number;
}

export function useVNAddress() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [wardsLoading, setWardsLoading] = useState(false);
  const districtRequest = useRef(createLatestRequest());
  const wardRequest = useRef(createLatestRequest());

  useEffect(() => {
    const controller = new AbortController();
    fetch('https://provinces.open-api.vn/api/p/', { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch provinces');
        return res.json();
      })
      .then(data => { if (!controller.signal.aborted) setProvinces(data); })
      .catch(error => { if (!controller.signal.aborted) console.error(error); });
    return () => {
      controller.abort();
      districtRequest.current.cancel();
      wardRequest.current.cancel();
    };
  }, []);

  const fetchDistricts = useCallback(async (provinceCode: number | string) => {
    const request = districtRequest.current.start();
    wardRequest.current.cancel();
    setWardsLoading(false);
    setDistricts([]);
    setWards([]);
    if (!provinceCode) {
      setDistrictsLoading(false);
      return;
    }
    setDistrictsLoading(true);
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`, { signal: request.signal });
      if (!res.ok) throw new Error('Failed to fetch districts');
      const data = await res.json();
      if (request.isCurrent()) setDistricts(data.districts || []);
    } catch (error) {
      if (request.isCurrent()) console.error(error);
    } finally {
      if (request.isCurrent()) setDistrictsLoading(false);
    }
  }, []);

  const fetchWards = useCallback(async (districtCode: number | string) => {
    const request = wardRequest.current.start();
    setWards([]);
    if (!districtCode) {
      setWardsLoading(false);
      return;
    }
    setWardsLoading(true);
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`, { signal: request.signal });
      if (!res.ok) throw new Error('Failed to fetch wards');
      const data = await res.json();
      if (request.isCurrent()) setWards(data.wards || []);
    } catch (error) {
      if (request.isCurrent()) console.error(error);
    } finally {
      if (request.isCurrent()) setWardsLoading(false);
    }
  }, []);

  return {
    provinces,
    districts,
    wards,
    fetchDistricts,
    fetchWards,
    isLoading: districtsLoading || wardsLoading
  };
}
