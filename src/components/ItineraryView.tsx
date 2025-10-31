import React, { useEffect, useRef, useState } from 'react';
import { Itinerary } from '@/types';
import { loadAMap, geocode, drawDrivingRoutes } from '@/services/mapLoader';
import { buildAmapNavigationUrl, buildAmapSearchUrl } from '@/services/navigation';

type Props = { itinerary?: Itinerary; start?: { lat: number; lng: number }; startAddr?: string; generating?: boolean };

export default function ItineraryView({ itinerary, start, startAddr, generating }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapObjRef = useRef<any>(null);
  const [showRoute, setShowRoute] = useState(false);
  const coordsMapRef = useRef<Record<string, { lat: number; lng: number }>>({});

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
      for (const day of itinerary.days) {
        for (const act of day.activities) {
          const addr = act.address || act.name;
          const loc = await geocode(addr);
          if (loc && AMap) {
            const marker = new AMap.Marker({ position: [loc.lng, loc.lat], title: act.name });
            marker.setMap(map);
            markers.push(marker);
            coords.push(loc);
            coordsMapRef.current[addr] = loc;
          }
        }
      }
      if (markers.length) {
        map.setFitView();
      }
      if (showRoute && coords.length >= 2) {
        drawDrivingRoutes(map, coords);
      }
    })();
  }, [itinerary, showRoute, start]);

  return (
    <div className="row">
      <div className="col">
        <div className="card">
          <h3>行程预览</h3>
          {!itinerary ? (
            <p className="muted">{generating ? '正在根据描述生成行程，请稍候…' : '生成后将在此展示行程详情与地图。'}</p>
          ) : (
            <div>
              <p className="muted">目的地：{itinerary.destination}</p>
              {startAddr && <p className="muted">出发点：{startAddr}</p>}
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
                            try { toLoc = await geocode(key) || undefined as any; } catch {}
                          }
                          if (toLoc) {
                            const url = buildAmapNavigationUrl(start || null, { lat: toLoc.lat, lng: toLoc.lng }, startAddr || '起点', a.name, 'car');
                            window.open(url, '_blank');
                          } else {
                            // 回退到搜索界面，避免报错打断体验
                            const url = buildAmapSearchUrl(key);
                            window.open(url, '_blank');
                          }
                        }}>导航</button>
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
      <div className="col">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>地图</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={showRoute} onChange={(e) => setShowRoute(e.target.checked)} /> 显示导航路线
            </label>
          </div>
          <div className="map" ref={mapRef} />
        </div>
      </div>
    </div>
  );
}