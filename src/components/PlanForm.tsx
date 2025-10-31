import React, { useState } from 'react';
import { PlanInput, Itinerary } from '@/types';
import VoiceInput from './VoiceInput';
import { generateItinerary } from '@/services/llm';

type Props = {
  onItinerary: (it: Itinerary) => void;
};

export default function PlanForm({ onItinerary }: Props) {
  const [form, setForm] = useState<PlanInput>({
    destination: '', startDate: '', endDate: '', budgetCNY: 10000, people: 2, preferences: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (k: keyof PlanInput, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async () => {
    setLoading(true); setError(null);
    try {
      const it = await generateItinerary(form);
      onItinerary(it);
    } catch (e: any) {
      setError(e.message || '生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="row">
        <div className="col">
          <div className="field">
            <label>目的地</label>
            <input value={form.destination} onChange={(e) => update('destination', e.target.value)} placeholder="例如：日本东京" />
          </div>
        </div>
        <div className="col">
          <div className="field">
            <label>开始日期</label>
            <input type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />
          </div>
        </div>
        <div className="col">
          <div className="field">
            <label>结束日期</label>
            <input type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} />
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <div className="field">
            <label>预算（人民币）</label>
            <input type="number" value={form.budgetCNY} onChange={(e) => update('budgetCNY', Number(e.target.value))} />
          </div>
        </div>
        <div className="col">
          <div className="field">
            <label>同行人数</label>
            <input type="number" value={form.people} onChange={(e) => update('people', Number(e.target.value))} />
          </div>
        </div>
      </div>
      <div className="field">
        <label>偏好（文本或语音）</label>
        <textarea rows={3} value={form.preferences} onChange={(e) => update('preferences', e.target.value)} placeholder="例如：喜欢美食和动漫，带孩子" />
        <VoiceInput onText={(t) => update('preferences', t)} />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="btn" onClick={onSubmit} disabled={loading}>{loading ? '生成中…' : '生成行程'}</button>
        {error && <span className="muted">{error}</span>}
      </div>
    </div>
  );
}