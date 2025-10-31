import React, { useState } from 'react';
import PlanForm from '@/components/PlanForm';
import ItineraryView from '@/components/ItineraryView';
import { Itinerary } from '@/types';
import { syncItinerary } from '@/services/sync';
import { getSupabase } from '@/services/supabaseClient';

export default function Plan() {
  const [itinerary, setItinerary] = useState<Itinerary | undefined>();
  return (
    <div>
      <PlanForm onItinerary={setItinerary} />
      <div style={{ marginTop: 16 }}>
        <ItineraryView itinerary={itinerary} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn secondary" disabled={!itinerary || !getSupabase()} onClick={async () => {
          if (!itinerary) return; 
          try { await syncItinerary(itinerary); alert('同步成功'); } catch (e: any) { alert('同步失败：' + (e.message || e)); }
        }}>同步到云端</button>
      </div>
    </div>
  );
}