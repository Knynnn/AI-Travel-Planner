import React, { useState } from 'react';
import { Itinerary } from '@/types';
import VoiceInput from './VoiceInput';
import { generateItineraryFromText } from '@/services/llm';

type Props = {
  onItinerary: (it: Itinerary) => void;
  onLoadingChange?: (loading: boolean) => void;
};

export default function PlanForm({ onItinerary, onLoadingChange }: Props) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setLoading(true); onLoadingChange?.(true); setError(null);
    try {
      if (!prompt.trim()) throw new Error('请先输入行程描述');
      const it = await generateItineraryFromText(prompt.trim());
      onItinerary(it);
    } catch (e: any) {
      setError(e.message || '生成失败');
    } finally {
      setLoading(false); onLoadingChange?.(false);
    }
  };

  return (
    <div className="card">
      <div className="field" style={{ position: 'relative' }}>
        <label>行程描述（像 ChatGPT 输入一段话）</label>
        <textarea rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="例如：12 月初从上海出发，去日本东京 5 天，两个人，预算 8000 元，喜欢美食和动漫，尽量安排去秋叶原和筑地市场，靠近地铁的酒店。" disabled={loading} />
        <VoiceInput onText={(t) => setPrompt(t)} />
        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="spinner" style={{ width: 16, height: 16, border: '2px solid #5fb3f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span className="muted">正在生成行程，请稍候…</span>
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="btn" onClick={onSubmit} disabled={loading}>{loading ? '生成中…' : '生成行程'}</button>
        {error && <span className="muted">{error}</span>}
      </div>
    </div>
  );
}