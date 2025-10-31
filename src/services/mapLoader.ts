import AMapLoader from '@amap/amap-jsapi-loader';
import { useSettings } from '@/store/settings';

export async function loadAMap() {
  const key = useSettings.getState().amapKey;
  if (!key) throw new Error('请在设置中填写高德地图 Key');
  return AMapLoader.load({
    key,
    version: '2.0',
    plugins: ['AMap.ToolBar', 'AMap.Scale']
  });
}

export async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const key = useSettings.getState().amapKey;
  if (!key) return null;
  const url = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(address)}&key=${key}`;
  const resp = await fetch(url);
  const data = await resp.json();
  const loc = data?.geocodes?.[0]?.location;
  if (!loc) return null;
  const [lng, lat] = loc.split(',').map(Number);
  return { lat, lng };
}