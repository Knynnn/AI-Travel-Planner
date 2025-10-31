import React, { useEffect, useState } from 'react';
import PlanForm from '@/components/PlanForm';
import ItineraryView from '@/components/ItineraryView';
import { Itinerary } from '@/types';
import { syncItinerary } from '@/services/sync';
import { getSupabase } from '@/services/supabaseClient';

export default function Plan() {
  const [itinerary, setItinerary] = useState<Itinerary | undefined>();
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('cloud_itinerary');
    if (raw) {
      try { setItinerary(JSON.parse(raw)); } catch {}
      localStorage.removeItem('cloud_itinerary');
    }
  }, []);

  return (
    <div>
      <PlanForm onItinerary={(it) => { setGenerating(false); setItinerary(it); }} onLoadingChange={setGenerating} />
      <div style={{ marginTop: 16 }}>
        <ItineraryView itinerary={itinerary} generating={generating} />
      </div>
      {!!itinerary?.budget && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>AI 预算分析</h3>
          <p className="muted">总计：{itinerary.budget.total} {itinerary.budget.currency}</p>
          <ul>
            {Object.entries(itinerary.budget.breakdown || {}).map(([k, v]) => (
              <li key={k}>{k}: {v}</li>
            ))}
          </ul>
          {itinerary.budget.notes && <p className="muted">说明：{itinerary.budget.notes}</p>}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn secondary" disabled={!itinerary || !getSupabase()} onClick={async () => {
          if (!itinerary) return;
          try { await syncItinerary(itinerary); alert('同步成功'); } catch (e: any) { alert('同步失败：' + (e.message || e)); }
        }}>同步到云端</button>
      </div>
    </div>
  );
}