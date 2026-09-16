import { useState, useEffect } from 'react';

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
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(console.error);
  }, []);

  const fetchDistricts = async (provinceCode: number | string) => {
    if (!provinceCode) {
      setDistricts([]);
      setWards([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
      const data = await res.json();
      setDistricts(data.districts || []);
      setWards([]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWards = async (districtCode: number | string) => {
    if (!districtCode) {
      setWards([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
      const data = await res.json();
      setWards(data.wards || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    provinces,
    districts,
    wards,
    fetchDistricts,
    fetchWards,
    isLoading
  };
}
