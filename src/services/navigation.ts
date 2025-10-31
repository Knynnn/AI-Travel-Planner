import { Coords } from '@/types';

export function buildAmapNavigationUrl(from: Coords | null, to: Coords, fromName?: string, toName?: string, mode: 'car' | 'walk' | 'bus' = 'car') {
  const params = new URLSearchParams();
  if (from) {
    params.set('from', `${from.lng},${from.lat},${encodeURIComponent(fromName || '起点')}`);
  }
  params.set('to', `${to.lng},${to.lat},${encodeURIComponent(toName || '目的地')}`);
  params.set('mode', mode);
  params.set('policy', '0');
  params.set('callnative', '1');
  params.set('src', 'AI-Travel-Planner');
  return `https://uri.amap.com/navigation?${params.toString()}`;
}

export function buildAmapSearchUrl(keyword: string, city?: string) {
  const params = new URLSearchParams();
  params.set('keyword', keyword);
  if (city) params.set('city', city);
  params.set('view', 'map');
  return `https://uri.amap.com/search?${params.toString()}`;
}