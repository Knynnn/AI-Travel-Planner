import React, { useEffect, useState } from 'react';
import PlanForm from '@/components/PlanForm';
import ItineraryView from '@/components/ItineraryView';
import { Itinerary } from '@/types';
import { syncItinerary } from '@/services/sync';
import { getSupabase } from '@/services/supabaseClient';
// 调整行为改由 PlanForm 统一处理

export default function Plan() {
  const [itinerary, setItinerary] = useState<Itinerary | undefined>();
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<Itinerary | undefined>();
  const [previewRaw, setPreviewRaw] = useState('');
  // 生成/调整统一使用一个 loading 状态
  const [budgetEdit, setBudgetEdit] = useState<{ transportation?: number; lodging?: number; food?: number; tickets?: number; shopping?: number; misc?: number }>({});

  useEffect(() => {
    const raw = localStorage.getItem('cloud_itinerary');
    if (raw) {
      try { setItinerary(JSON.parse(raw)); } catch {}
      localStorage.removeItem('cloud_itinerary');
    }
  }, []);

  useEffect(() => {
    if (!itinerary?.budget?.breakdown) return;
    setBudgetEdit({ ...itinerary.budget.breakdown });
  }, [itinerary?.budget?.breakdown]);

  return (
    <div>
      <PlanForm
        currentItinerary={itinerary}
        onItinerary={(it) => { setGenerating(false); setItinerary(it); setDraft(undefined); setPreviewRaw(''); }}
        onLoadingChange={setGenerating}
        onPreviewUpdate={setPreviewRaw}
        onDraftUpdate={setDraft}
      />
      {generating && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>生成/调整过程（实时预览）</h3>
          <pre style={{ maxHeight: 180, overflow: 'auto', background: '#0b0c10', color: '#9fc5e8', padding: 8, borderRadius: 6 }}>{previewRaw || '模型输出中…'}</pre>
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <ItineraryView itinerary={draft || itinerary} generating={generating} />
      </div>
      {/* 调整对话卡片已移除；请使用上方的原始对话框进行生成/调整 */}
      {!!itinerary?.budget && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>AI 预算分析（中文显示）</h3>
          <p className="muted">总计：{itinerary.budget.total} {itinerary.budget.currency}</p>
          <ul>
            {Object.entries(itinerary.budget.breakdown || {}).map(([k, v]) => {
              const zh: Record<string, string> = { transportation: '交通', lodging: '住宿', food: '餐饮', tickets: '门票', shopping: '购物', misc: '其他' };
              return <li key={k}>{zh[k] || k}: {v}</li>;
            })}
          </ul>
          {itinerary.budget.notes && <p className="muted">说明：{itinerary.budget.notes}</p>}
          <div className="card" style={{ marginTop: 12 }}>
            <h4>手动调整预算（人民币）</h4>
            <div className="row">
              <div className="col">
                <div className="field"><label>交通</label><input type="number" value={budgetEdit.transportation ?? ''} onChange={(e) => setBudgetEdit({ ...budgetEdit, transportation: Number(e.target.value) })} /></div>
                <div className="field"><label>住宿</label><input type="number" value={budgetEdit.lodging ?? ''} onChange={(e) => setBudgetEdit({ ...budgetEdit, lodging: Number(e.target.value) })} /></div>
                <div className="field"><label>餐饮</label><input type="number" value={budgetEdit.food ?? ''} onChange={(e) => setBudgetEdit({ ...budgetEdit, food: Number(e.target.value) })} /></div>
              </div>
              <div className="col">
                <div className="field"><label>门票</label><input type="number" value={budgetEdit.tickets ?? ''} onChange={(e) => setBudgetEdit({ ...budgetEdit, tickets: Number(e.target.value) })} /></div>
                <div className="field"><label>购物</label><input type="number" value={budgetEdit.shopping ?? ''} onChange={(e) => setBudgetEdit({ ...budgetEdit, shopping: Number(e.target.value) })} /></div>
                <div className="field"><label>其他</label><input type="number" value={budgetEdit.misc ?? ''} onChange={(e) => setBudgetEdit({ ...budgetEdit, misc: Number(e.target.value) })} /></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => {
                if (!itinerary) return;
                const breakdown = { ...itinerary.budget.breakdown, ...budgetEdit };
                const total = Object.values(breakdown).reduce((acc, n) => acc + (Number(n) || 0), 0);
                const updated: Itinerary = {
                  ...itinerary,
                  budget: { currency: itinerary.budget.currency || 'CNY', total, breakdown, notes: itinerary.budget.notes }
                };
                setItinerary(updated);
              }}>应用预算调整</button>
              <button className="btn secondary" onClick={() => setBudgetEdit({})}>重置输入</button>
            </div>
          </div>
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