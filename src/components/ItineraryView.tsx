import React, { useEffect, useRef } from 'react';
import { Itinerary } from '@/types';
import { loadAMap, geocode } from '@/services/mapLoader';

type Props = { itinerary?: Itinerary };

export default function ItineraryView({ itinerary }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapObjRef = useRef<any>(null);

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
      for (const day of itinerary.days) {
        for (const act of day.activities) {
          const addr = act.address || act.name;
          const loc = await geocode(addr);
          if (loc && AMap) {
            const marker = new AMap.Marker({ position: [loc.lng, loc.lat], title: act.name });
            marker.setMap(map);
            markers.push(marker);
          }
        }
      }
      if (markers.length) {
        map.setFitView();
      }
    })();
  }, [itinerary]);

  return (
    <div className="row">
      <div className="col">
        <div className="card">
          <h3>行程预览</h3>
          {!itinerary ? (
            <p className="muted">生成后将在此展示行程详情与地图。</p>
          ) : (
            <div>
              <p className="muted">目的地：{itinerary.destination}</p>
              {itinerary.days.map((d, i) => (
                <div key={i} className="card" style={{ marginTop: 12 }}>
                  <strong>{d.date}</strong>
                  <ul>
                    {d.activities.map((a, j) => (
                      <li key={j}>{a.time ? `${a.time} ` : ''}{a.name}{a.address ? `（${a.address}）` : ''}{a.notes ? ` - ${a.notes}` : ''}</li>
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
          <div className="map" ref={mapRef} />
        </div>
      </div>
    </div>
  );
}