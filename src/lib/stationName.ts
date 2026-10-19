import { STATIONS } from '../data/mockData';
import { Language } from '../types';

export const stationName = (code: string, language: Language): string => {
  const s = STATIONS.find((x) => x.code === code);
  return s ? (language === 'en' ? s.nameEn : s.nameTa) : code;
};
