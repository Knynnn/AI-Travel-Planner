import React, { useEffect, useRef, useState } from 'react';
import { Itinerary } from '@/types';
import { loadAMap, geocode, searchPlace, drawDrivingRoutes, drawRouteSegment } from '@/services/mapLoader';
import { useSettings } from '@/store/settings';

type Props = { itinerary?: Itinerary; start?: { lat: number; lng: number }; startAddr?: string; generating?: boolean };

export default function ItineraryView({ itinerary, start, startAddr, generating }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapObjRef = useRef<any>(null);
  const coordsMapRef = useRef<Record<string, { lat: number; lng: number }>>({});
  const markerMapRef = useRef<Record<string, any>>({});
  const orderListRef = useRef<string[]>([]);
  const indexMapRef = useRef<Record<string, number>>({});
  const idToKeyRef = useRef<Record<string, string>>({});
  const idToDisplayRef = useRef<Record<string, string>>({});
  const displayToIdRef = useRef<Record<string, string>>({});
  const amapKey = useSettings.getState().amapKey;

  // 地图顶部统一导航入口
  const [routeMode, setRouteMode] = useState<'car' | 'walk'>('car');
  const [routeStartType, setRouteStartType] = useState<'prev' | 'custom'>('prev');
  const [routeStartText, setRouteStartText] = useState('');
  const [routeEndText, setRouteEndText] = useState('');
  // 公交换乘城市由行程目的地自动推断，无需手动输入

  const createNumberMarker = (AMap: any, loc: { lat: number; lng: number }, title: string, num: number) => {
    const el = document.createElement('div');
    el.style.cssText = 'width:24px;height:24px;border-radius:12px;background:#3366FF;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;box-shadow:0 0 0 2px #fff;';
    el.textContent = String(num);
    const marker = new AMap.Marker({ position: [loc.lng, loc.lat], title, content: el, offset: new AMap.Pixel(-12, -12) });
    return marker;
  };

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
      // 先为所有地点（活动+酒店）建立稳定的序号（使用唯一 ID），不依赖是否定位成功
      orderListRef.current = [];
      indexMapRef.current = {};
      idToKeyRef.current = {};
      idToDisplayRef.current = {};
      displayToIdRef.current = {};
      const entries: Array<{ id: string; key: string; title: string; date?: string; lat?: number; lng?: number }> = [];
      itinerary.days.forEach((day, di) => {
        day.activities.forEach((act, ai) => {
          const addr = act.address || act.name;
          const id = `act:${di}:${ai}`;
          const entry: any = { id, key: addr, title: act.name, date: day.date };
          if (typeof act.lat === 'number' && typeof act.lng === 'number') { entry.lat = act.lat; entry.lng = act.lng; }
          entries.push(entry);
        });
        if (day.hotel) {
          const id = `hotel:${di}`;
          entries.push({ id, key: day.hotel, title: day.hotel, date: day.date });
        }
      });
      // 构建显示标签（重复名称追加日期）
      const labelCount: Record<string, number> = {};
      entries.forEach(e => { labelCount[e.key] = (labelCount[e.key] || 0) + 1; });
      entries.forEach((e, i) => {
        const display = labelCount[e.key] > 1 && e.date ? `${e.key}（${e.date}）` : e.key;
        idToKeyRef.current[e.id] = e.key;
        idToDisplayRef.current[e.id] = display;
        displayToIdRef.current[display] = e.id;
        indexMapRef.current[e.id] = i + 1;
        orderListRef.current.push(e.id);
      });

      // 再逐个定位并绘制标记（按唯一 ID 存储）
      for (const e of entries) {
        const addr = e.key;
        const id = e.id;
        let loc: { lat: number; lng: number } | null = null;
        if (typeof e.lat === 'number' && typeof e.lng === 'number') { loc = { lat: e.lat, lng: e.lng }; }
        if (!loc) { loc = await geocode(addr, itinerary.destination); }
        if (!loc) { const poi = await searchPlace(addr, itinerary.destination); if (poi) loc = { lat: poi.lat, lng: poi.lng }; }
        if (loc && AMap) {
          const num = indexMapRef.current[id] || 0;
          const marker = createNumberMarker(AMap, loc, e.title, num);
          marker.setMap(map);
          markers.push(marker);
          coords.push(loc);
          coordsMapRef.current[id] = loc;
          markerMapRef.current[id] = marker;
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
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ display: 'inline-flex', width: 20, height: 20, borderRadius: 10, background: '#3366FF', color: '#fff', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{(indexMapRef.current[`act:${i}:${j}`] || 0) || ''}</span>
                          <span>{a.time ? `${a.time} ` : ''}{a.name}{a.address ? `（${a.address}）` : ''}{a.notes ? ` - ${a.notes}` : ''}</span>
                        </span>
                        <button className="btn tiny" style={{ marginLeft: 8 }} onClick={async () => {
                          const id = `act:${i}:${j}`;
                          const key = a.address || a.name;
                          let toLoc = coordsMapRef.current[id];
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
                                // 全局 POI 匹配
                                const poi = await searchPlace(key);
                                if (poi) toLoc = { lat: poi.lat, lng: poi.lng } as any;
                              }
                            } catch {}
                          }
                          const map = mapObjRef.current;
                          const AMap = (window as any).AMap;
                          if (toLoc && map && AMap) {
                            // 若无标记则补充标记
                            let marker = markerMapRef.current[id];
                            if (!marker) {
                              const num = indexMapRef.current[id] || 1;
                              marker = createNumberMarker(AMap, toLoc, a.name, num);
                              marker.setMap(map);
                              markerMapRef.current[id] = marker;
                              coordsMapRef.current[id] = toLoc;
                            }
                            try { map.setZoomAndCenter(15, [toLoc.lng, toLoc.lat]); } catch { map.setCenter([toLoc.lng, toLoc.lat]); }
                            if (marker && typeof marker.setAnimation === 'function') {
                              try {
                                marker.setAnimation('AMAP_ANIMATION_BOUNCE');
                                setTimeout(() => { try { marker.setAnimation(null); } catch {} }, 1200);
                              } catch {}
                            }
                            // 将参数传入顶部“开始导航”的起点/终点
                            setRouteEndText(idToDisplayRef.current[id] || key);
                            setRouteStartType('prev');
                          } else {
                            alert('未能定位到该地点。请补充更明确的地址或地标。');
                          }
                        }}>导航</button>
                      </li>
                    ))}
                    {d.hotel && (
                      <li>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ display: 'inline-flex', width: 20, height: 20, borderRadius: 10, background: '#3366FF', color: '#fff', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{(indexMapRef.current[`hotel:${i}`] || 0) || ''}</span>
                          <span>酒店：{d.hotel}</span>
                        </span>
                        <button className="btn tiny" style={{ marginLeft: 8 }} onClick={async () => {
                          const id = `hotel:${i}`;
                          const key = d.hotel;
                          if (!key) return;
                          let toLoc = coordsMapRef.current[id];
                          if (!toLoc) {
                            try {
                              // 导航定位不携带 city，避免跨城错误
                              toLoc = await geocode(key) || undefined as any;
                              if (!toLoc) {
                                const poi = await searchPlace(key);
                                if (poi) toLoc = { lat: poi.lat, lng: poi.lng } as any;
                              }
                            } catch {}
                          }
                          const map = mapObjRef.current;
                          const AMap = (window as any).AMap;
                          if (toLoc && map && AMap) {
                            let marker = markerMapRef.current[id];
                            if (!marker) {
                              const num = indexMapRef.current[id] || 1;
                              marker = createNumberMarker(AMap, toLoc, key, num);
                              marker.setMap(map);
                              markerMapRef.current[id] = marker;
                              coordsMapRef.current[id] = toLoc;
                            }
                            try { map.setZoomAndCenter(15, [toLoc.lng, toLoc.lat]); } catch { map.setCenter([toLoc.lng, toLoc.lat]); }
                            if (marker && typeof marker.setAnimation === 'function') {
                              try { marker.setAnimation('AMAP_ANIMATION_BOUNCE'); setTimeout(() => { try { marker.setAnimation(null); } catch {} }, 1200); } catch {}
                            }
                            setRouteEndText(idToDisplayRef.current[id] || key);
                            setRouteStartType('prev');
                          } else {
                            alert('未能定位到酒店地址，请补充更明确的地址或地标。');
                          }
                        }}>导航</button>
                      </li>
                    )}
                  </ul>
                  {/* 酒店已作为地点展示与可导航 */}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="col" style={{ flex: 2 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <span>地图</span>
            {itinerary && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <label>方式</label>
                <select value={routeMode} onChange={(e) => setRouteMode(e.target.value as any)}>
                  <option value="car">驾驶</option>
                  <option value="walk">步行</option>
                </select>
                {/* 公交模式无需城市输入，自动使用行程目的地或回退到插件 */}
                <label>起点</label>
                <label><input type="radio" name="route-start" checked={routeStartType === 'prev'} onChange={() => setRouteStartType('prev')} /> 上一个目的地</label>
                <label><input type="radio" name="route-start" checked={routeStartType === 'custom'} onChange={() => setRouteStartType('custom')} /> 自定义</label>
                {routeStartType === 'custom' && (
                  <input type="text" value={routeStartText} onChange={(e) => setRouteStartText(e.target.value)} placeholder="输入起点地址或名称" style={{ minWidth: 220 }} />
                )}
                <label>终点</label>
                <input list="end-places-list" type="text" value={routeEndText} onChange={(e) => setRouteEndText(e.target.value)} placeholder="输入终点地址或选择下拉项" style={{ minWidth: 240 }} />
                <datalist id="end-places-list">
                  {orderListRef.current.map((id, i) => (
                    <option key={i} value={idToDisplayRef.current[id] || ''} />
                  ))}
                </datalist>
                <button className="btn tiny" onClick={async () => {
                  const endText = routeEndText.trim();
                  if (!endText) { alert('请输入终点'); return; }
                  const targetId = displayToIdRef.current[endText] || null;
                  // 终点坐标
                  let toLoc = targetId ? coordsMapRef.current[targetId] : undefined;
                  if (!toLoc) {
                    try {
                      const poi = await searchPlace(endText);
                      if (poi) toLoc = { lat: poi.lat, lng: poi.lng } as any;
                      if (!toLoc) {
                        const g = await geocode(endText);
                        if (g) toLoc = g as any;
                      }
                    } catch {}
                  }
                  if (!toLoc) { alert('未能获取终点坐标'); return; }
                  // 起点坐标
                  let from: { lat: number; lng: number } | null = null;
                  if (routeStartType === 'prev') {
                    const idx = targetId ? (indexMapRef.current[targetId] || 0) : 0;
                    if (idx > 1) {
                      const prevId = orderListRef.current[idx - 2];
                      from = coordsMapRef.current[prevId] || null;
                    } else if (start) {
                      from = start;
                    }
                    if (!from) { alert('无法确定上一个目的地，请改用自定义起点'); return; }
                  } else {
                    const sText = routeStartText.trim();
                    if (!sText) { alert('请输入自定义起点'); return; }
                    const poi = await searchPlace(sText);
                    if (poi) from = { lat: poi.lat, lng: poi.lng };
                    if (!from) {
                      const g = await geocode(sText);
                      if (g) from = g;
                    }
                    if (!from) { alert('未能获取起点坐标'); return; }
                  }
                  const map = mapObjRef.current;
                  if (!map) { alert('地图未初始化'); return; }
                  const ok = await drawRouteSegment(map, from!, toLoc!, routeMode, { showTraffic: true, autoFitView: true, hideMarkers: false, extensions: 'base' });
                  if (!ok) { alert('路径规划失败，请检查地址或稍后重试'); }
                }}>开始导航</button>
              </div>
            )}
          </div>
          <div className="map" ref={mapRef} />
        </div>
      </div>
    </div>
  );
}