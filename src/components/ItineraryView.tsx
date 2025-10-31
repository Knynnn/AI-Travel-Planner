import React, { useEffect, useRef, useState } from 'react';
import { Itinerary } from '@/types';
import { loadAMap, geocode, searchPlace, searchPlaces, drawDrivingRoutes } from '@/services/mapLoader';
import { useSettings } from '@/store/settings';

type Props = { itinerary?: Itinerary; start?: { lat: number; lng: number }; startAddr?: string; generating?: boolean };

export default function ItineraryView({ itinerary, start, startAddr, generating }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapObjRef = useRef<any>(null);
  const coordsMapRef = useRef<Record<string, { lat: number; lng: number }>>({});
  const markerMapRef = useRef<Record<string, any>>({});
  const amapKey = useSettings.getState().amapKey;
  const [suggestions, setSuggestions] = useState<Record<string, Array<{ lat: number; lng: number; name: string; address?: string; district?: string }>>>({});

  useEffect(() => {
    if (!mapRef.current) return;
    let disposed = false;
    loadAMap().then((AMap) => {
      if (disposed) return;
      const map = new AMap.Map(mapRef.current!, { zoom: 11 });
      mapObjRef.current = map;
    }).catch(() => {});
    return () => { disposed = true; };
  }, []);

  useEffect(() => {
    const map = mapObjRef.current;
    if (!map || !itinerary) return;
    (async () => {
      map.clearMap();
      const AMap = (window as any).AMap;
      const markers: any[] = [];
      const coords: Array<{ lat: number; lng: number }> = [];
      if (start) coords.push(start);
      coordsMapRef.current = {};
      markerMapRef.current = {};
      for (const day of itinerary.days) {
        for (const act of day.activities) {
          const addr = act.address || act.name;
          let loc: { lat: number; lng: number } | null = null;
          if (typeof act.lat === 'number' && typeof act.lng === 'number') {
            loc = { lat: act.lat, lng: act.lng };
          }
          if (!loc) {
            // 初始地图标注按目的地城市限定，提升命中率
            loc = await geocode(addr, itinerary.destination);
          }
          if (!loc) {
            const poi = await searchPlace(addr, itinerary.destination);
            if (poi) loc = { lat: poi.lat, lng: poi.lng };
          }
          if (loc && AMap) {
            // 使用星形图标标注目的点
            const starIcon = new AMap.Icon({
              size: new AMap.Size(24, 24),
              imageSize: new AMap.Size(24, 24),
              image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_bs.png'
            });
            const marker = new AMap.Marker({ position: [loc.lng, loc.lat], title: act.name, icon: starIcon });
            marker.setMap(map);
            markers.push(marker);
            coords.push(loc);
            coordsMapRef.current[addr] = loc;
            markerMapRef.current[addr] = marker;
          }
        }
      }
      if (markers.length) {
        map.setFitView();
      }
      // 自动绘制整段路线：按行程内的坐标顺序连接
      if (coords.length >= 2) {
        drawDrivingRoutes(map, coords);
      }
    })();
  }, [itinerary, start]);

  return (
    <div className="row">
      <div className="col" style={{ flex: 1 }}>
        <div className="card">
          <h3>行程预览</h3>
          {!itinerary ? (
            <p className="muted">{generating ? '正在根据描述生成行程，请稍候…' : '生成后将在此展示行程详情与地图。'}</p>
          ) : (
            <div>
              <img src={`https://source.unsplash.com/featured/?${encodeURIComponent(itinerary.destination)}`} alt={itinerary.destination} style={{ width: '100%', borderRadius: 10, marginBottom: 8 }} />
              <p className="muted">目的地：{itinerary.destination}</p>
              {startAddr && <p className="muted">出发点：{startAddr}</p>}
              {!amapKey && <p className="muted">提示：未配置高德地图 Key，地图与定位功能不可用。请前往“设置”页面输入 Key。</p>}
              {itinerary.days.map((d, i) => (
                <div key={i} className="card" style={{ marginTop: 12 }}>
                  <strong>{d.date}</strong>
                  <ul>
                    {d.activities.map((a, j) => (
                      <li key={j}>
                        {a.time ? `${a.time} ` : ''}{a.name}{a.address ? `（${a.address}）` : ''}{a.notes ? ` - ${a.notes}` : ''}
                        <button className="btn tiny" style={{ marginLeft: 8 }} onClick={async () => {
                          const key = a.address || a.name;
                          let toLoc = coordsMapRef.current[key];
                          if (!toLoc) {
                            try {
                              if (typeof a.lat === 'number' && typeof a.lng === 'number') {
                                toLoc = { lat: a.lat, lng: a.lng } as any;
                              }
                              if (!toLoc) {
                                // 导航定位不携带 city，避免跨城 30001 错误
                                toLoc = await geocode(key) || undefined as any;
                              }
                              if (!toLoc) {
                                // 导航定位不携带 city，仅按地址/名称全局匹配
                                const poi = await searchPlace(key);
                                if (poi) toLoc = { lat: poi.lat, lng: poi.lng } as any;
                              }
                            } catch {}
                          }
                          const map = mapObjRef.current;
                          const AMap = (window as any).AMap;
                          if (toLoc && map && AMap) {
                            try { map.setZoomAndCenter(15, [toLoc.lng, toLoc.lat]); } catch { map.setCenter([toLoc.lng, toLoc.lat]); }
                            const marker = markerMapRef.current[key];
                            if (marker && typeof marker.setAnimation === 'function') {
                              try {
                                marker.setAnimation('AMAP_ANIMATION_BOUNCE');
                                setTimeout(() => { try { marker.setAnimation(null); } catch {} }, 1200);
                              } catch {}
                            }
                          } else {
                            // 候选检索也不携带 city，仅按关键词匹配
                            const list = await searchPlaces(key, undefined, 5);
                            if (list.length) {
                              setSuggestions((prev) => ({ ...prev, [key]: list }));
                            } else {
                              alert('未能定位到该地点。建议：1) 在描述中补充更明确的地址/地标；2) 确认“设置”页已填写高德地图 Key；3) 试用更完整的目的地城市名称。');
                            }
                          }
                        }}>导航</button>
                        {suggestions[(a.address || a.name)] && (
                          <div className="card" style={{ marginTop: 8 }}>
                            <div className="muted">未能直接定位，以下为候选地点：</div>
                            <ul>
                              {suggestions[(a.address || a.name)].map((sug, si) => (
                                <li key={si}>
                                  <button className="btn tiny" onClick={() => {
                                    const map = mapObjRef.current;
                                    const AMap = (window as any).AMap;
                                    if (!map || !AMap) return;
                                    // 设置坐标与标记
                                    const key2 = a.address || a.name;
                                    coordsMapRef.current[key2] = { lat: sug.lat, lng: sug.lng };
                                    let marker = markerMapRef.current[key2];
                                    if (!marker) {
                                      const starIcon = new AMap.Icon({
                                        size: new AMap.Size(24, 24),
                                        imageSize: new AMap.Size(24, 24),
                                        image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_bs.png'
                                      });
                                      marker = new AMap.Marker({ position: [sug.lng, sug.lat], title: sug.name, icon: starIcon });
                                      marker.setMap(map);
                                      markerMapRef.current[key2] = marker;
                                    }
                                    try { map.setZoomAndCenter(15, [sug.lng, sug.lat]); } catch { map.setCenter([sug.lng, sug.lat]); }
                                    setSuggestions((prev) => ({ ...prev, [key2]: [] }));
                                  }}>
                                    选择
                                  </button>
                                  <span style={{ marginLeft: 8 }}>{sug.name}（{sug.district || '未知区域'}，{sug.address || '无详细地址'}）</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                  {d.hotel && <div>酒店：{d.hotel}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="col" style={{ flex: 2 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <span>地图</span>
          </div>
          <div className="map" ref={mapRef} />
        </div>
      </div>
    </div>
  );
}