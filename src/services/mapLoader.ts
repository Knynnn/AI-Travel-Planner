import AMapLoader from '@amap/amap-jsapi-loader';
import { useSettings } from '@/store/settings';

export async function loadAMap() {
  const s = useSettings.getState();
  const key = s.amapKey;
  if (!key) throw new Error('请在设置中填写高德地图 Key');
  // 确保在加载 JS API 之前注入全局安全配置，以便内部请求自动附带 jscode
  if (s.amapJscode) {
    (window as any)._AMapSecurityConfig = { securityJsCode: s.amapJscode };
  }
  return AMapLoader.load({
    key,
    // 2021-12-02 后申请的 Key 需配合安全密钥；传递给 JS API 以便内部服务调用自动附带
    securityJsCode: s.amapJscode as any,
    version: '2.0',
    plugins: ['AMap.ToolBar', 'AMap.Scale', 'AMap.Driving', 'AMap.Geocoder', 'AMap.PlaceSearch']
  } as any);
}

// 统一的 AMap 请求封装：优先通过 Nginx 代理附带 jscode，失败则回退到直连并尝试附加环境中的 jscode
async function amapFetch(path: string, params: Record<string, string | number | boolean>) {
  const s = useSettings.getState();
  const key = s.amapServiceKey || s.amapKey; // REST 优先使用 Web服务 Key；无则回退 JS API Key
  if (!key) return null;

  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    search.set(k, String(v));
  });
  search.set('key', key);

  // 优先尝试通过本机 Nginx 代理（/_AMapService/...）以自动附加安全密钥
  const proxyUrl = `/_AMapService${path}?${search.toString()}`;
  try {
    const resp = await fetch(proxyUrl);
    if (resp.ok) return await resp.json();
  } catch {}

  // 回退到直连官方 REST，并尝试附加环境变量中的 jscode（仅本地开发使用）
  const directBase = path.startsWith('/v4/') ? 'https://webapi.amap.com' : 'https://restapi.amap.com';
  let directUrl = `${directBase}${path}?${search.toString()}`;
  const jsStore = useSettings.getState().amapJscode as string | undefined;
  const js = jsStore || ((import.meta as any)?.env?.VITE_AMAP_JSCODE as string | undefined);
  if (js && !directUrl.includes('jscode=')) {
    directUrl += `&jscode=${encodeURIComponent(js)}`;
  }
  const directResp = await fetch(directUrl);
  return await directResp.json();
}

// 通过 JS API 插件进行地理编码（避免 REST 平台不符）
async function geocodeViaJsApi(address: string, city?: string): Promise<{ lat: number; lng: number } | null> {
  try {
    await loadAMap();
    const AMap = (window as any).AMap;
    return await new Promise((resolve) => {
      const geocoder = new AMap.Geocoder({ city: city || undefined });
      geocoder.getLocation(address, (status: string, result: any) => {
        if (status === 'complete' && result?.geocodes?.[0]?.location) {
          const loc = result.geocodes[0].location; // LngLat 或对象
          const lat = loc?.lat ?? loc?.getLat?.();
          const lng = loc?.lng ?? loc?.getLng?.();
          if (typeof lat === 'number' && typeof lng === 'number') return resolve({ lat, lng });
        }
        resolve(null);
      });
    });
  } catch {
    return null;
  }
}

// 通过 JS API 插件进行关键字搜索（同城限制）
async function searchPlacesViaJsApi(keyword: string, city?: string, limit: number = 5): Promise<Array<{ lat: number; lng: number; name: string; address?: string; district?: string }>> {
  try {
    await loadAMap();
    const AMap = (window as any).AMap;
    return await new Promise((resolve) => {
      const ps = new AMap.PlaceSearch({ city: city || undefined, citylimit: true, pageSize: Math.max(1, Math.min(limit, 20)) });
      ps.search(keyword, (status: string, result: any) => {
        const pois = result?.poiList?.pois || result?.pois || [];
        const mapped = pois.slice(0, limit).map((p: any) => {
          const pos = p.location || p.position || p.lnglat;
          const lng = pos?.lng ?? pos?.getLng?.();
          const lat = pos?.lat ?? pos?.getLat?.();
          return { lat, lng, name: p.name, address: p.address, district: p.adname || p.pname };
        }).filter((it: any) => typeof it.lat === 'number' && typeof it.lng === 'number');
        resolve(mapped);
      });
    });
  } catch {
    return [];
  }
}

export async function geocode(address: string, city?: string): Promise<{ lat: number; lng: number } | null> {
  // 优先使用 JS API 插件，避免平台不符
  const viaJs = await geocodeViaJsApi(address, city);
  if (viaJs) return viaJs;
  // 回退 REST（若配置了 Web服务 Key 或 jscode 可用）
  const data = await amapFetch('/v3/geocode/geo', { address, ...(city ? { city } : {}) });
  const status = data?.status;
  const infocode = data?.infocode;
  if (status === '0' && infocode === '10009') return null; // 平台不符，直接返回空
  const loc = data?.geocodes?.[0]?.location;
  if (!loc) return null;
  const [lng, lat] = String(loc).split(',').map(Number);
  return { lat, lng };
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  // 优先使用 JS API 插件
  try {
    await loadAMap();
    const AMap = (window as any).AMap;
    const addr = await new Promise<string | null>((resolve) => {
      const geocoder = new AMap.Geocoder();
      geocoder.getAddress([lng, lat], (status: string, result: any) => {
        if (status === 'complete' && result?.regeocode?.formattedAddress) {
          return resolve(result.regeocode.formattedAddress);
        }
        resolve(null);
      });
    });
    if (addr) return addr;
  } catch {}
  // 回退 REST
  const data = await amapFetch('/v3/geocode/regeo', { location: `${lng},${lat}` });
  return data?.regeocode?.formatted_address || null;
}

export function drawDrivingRoutes(map: any, coords: Array<{ lat: number; lng: number }>) {
  const AMap = (window as any).AMap;
  if (!AMap || !map || !coords || coords.length < 2) return;
  // 确保插件已可用（在某些环境下更稳妥）
  try {
    if (typeof AMap.plugin === 'function') {
      AMap.plugin(['AMap.Driving'], () => {});
    }
  } catch {}

  // 逐段绘制路线；失败时退化为直线 Polyline，保证“有东西可见”
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    try {
      const driving = new AMap.Driving({ map, hideMarkers: true });
      driving.search(new AMap.LngLat(a.lng, a.lat), new AMap.LngLat(b.lng, b.lat));
    } catch {
      try {
        const line = new AMap.Polyline({
          path: [new AMap.LngLat(a.lng, a.lat), new AMap.LngLat(b.lng, b.lat)],
          showDir: true,
          strokeColor: '#3366FF',
          strokeWeight: 4
        });
        line.setMap(map);
      } catch {}
    }
  }
}

export async function searchPlace(keyword: string, city?: string): Promise<{ lat: number; lng: number; name: string } | null> {
  const jsList = await searchPlacesViaJsApi(keyword, city, 1);
  if (jsList.length) {
    const it = jsList[0];
    return { lat: it.lat, lng: it.lng, name: it.name };
  }
  const data = await amapFetch('/v3/place/text', { keywords: keyword, ...(city ? { city } : {}), offset: 1, page: 1, citylimit: true });
  const status = data?.status;
  const infocode = data?.infocode;
  if (status === '0' && infocode === '10009') return null;
  const poi = data?.pois?.[0];
  const loc = poi?.location;
  if (!loc) return null;
  const [lng, lat] = String(loc).split(',').map(Number);
  return { lat, lng, name: poi.name };
}

export async function searchPlaces(keyword: string, city?: string, limit: number = 5): Promise<Array<{ lat: number; lng: number; name: string; address?: string; district?: string }>> {
  const jsList = await searchPlacesViaJsApi(keyword, city, limit);
  if (jsList.length) return jsList;
  const data = await amapFetch('/v3/place/text', { keywords: keyword, ...(city ? { city } : {}), offset: Math.max(1, Math.min(limit, 20)), page: 1, citylimit: true });
  const status = data?.status;
  const infocode = data?.infocode;
  if (status === '0' && infocode === '10009') return [];
  const pois: any[] = data?.pois || [];
  return pois
    .filter(p => !!p?.location)
    .slice(0, limit)
    .map(p => {
      const [lng, lat] = String(p.location).split(',').map(Number);
      return { lat, lng, name: p.name, address: p.address, district: p.adname || p.pname };
    });
}