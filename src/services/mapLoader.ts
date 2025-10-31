import AMapLoader from '@amap/amap-jsapi-loader';
import { useSettings } from '@/store/settings';

export async function loadAMap() {
  const key = useSettings.getState().amapKey;
  if (!key) throw new Error('请在设置中填写高德地图 Key');
  return AMapLoader.load({
    key,
    version: '2.0',
    plugins: ['AMap.ToolBar', 'AMap.Scale', 'AMap.Driving', 'AMap.Geocoder']
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

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const key = useSettings.getState().amapKey;
  if (!key) return null;
  const url = `https://restapi.amap.com/v3/geocode/regeo?location=${lng},${lat}&key=${key}`;
  const resp = await fetch(url);
  const data = await resp.json();
  const addr = data?.regeocode?.formatted_address;
  return addr || null;
}

export function drawDrivingRoutes(map: any, coords: Array<{ lat: number; lng: number }>) {
  const AMap = (window as any).AMap;
  if (!AMap || !map || !coords || coords.length < 2) return;
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    const driving = new AMap.Driving({ map, hideMarkers: true });
    driving.search(new AMap.LngLat(a.lng, a.lat), new AMap.LngLat(b.lng, b.lat));
  }
}