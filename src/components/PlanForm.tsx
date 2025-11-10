import React, { useState } from 'react';
import { Itinerary } from '@/types';
import VoiceInput from './VoiceInput';
import { generateItineraryFromTextStream, refineItineraryFromTextStream } from '@/services/llm';

type Props = {
  onItinerary: (it: Itinerary) => void;
  onLoadingChange?: (loading: boolean) => void;
  onPreviewUpdate?: (raw: string) => void;
  onDraftUpdate?: (it?: Itinerary) => void;
  currentItinerary?: Itinerary;
};

export default function PlanForm({ onItinerary, onLoadingChange, onPreviewUpdate, onDraftUpdate, currentItinerary }: Props) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewRaw, setPreviewRaw] = useState('');
  const isRefine = !!currentItinerary;

  const onSubmit = async () => {
    setLoading(true); onLoadingChange?.(true); setError(null);
    try {
      if (!prompt.trim()) throw new Error('请先输入行程描述');
      if (isRefine && currentItinerary) {
        const updated = await refineItineraryFromTextStream(currentItinerary, prompt.trim(), (u) => {
          setPreviewRaw(u.raw);
          onPreviewUpdate?.(u.raw);
          if (u.parsed) onDraftUpdate?.(u.parsed);
        });
        onItinerary(updated);
        setPrompt('');
      } else {
        const it = await generateItineraryFromTextStream(prompt.trim(), (u) => {
          setPreviewRaw(u.raw);
          onPreviewUpdate?.(u.raw);
          if (u.parsed) onDraftUpdate?.(u.parsed);
        });
        onItinerary(it);
        setPrompt('');
      }
    } catch (e: any) {
      setError(e.message || (isRefine ? '调整失败' : '生成失败'));
    } finally {
      setLoading(false); onLoadingChange?.(false);
    }
  };

  return (
    <div className="card">
      <div className="field" style={{ position: 'relative' }}>
        <label>行程描述（像 ChatGPT 输入一段话）</label>
        <textarea rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="我想从南京出发去上海，3 天，预算 2 千 元，喜欢美食和城市风光，带孩子" disabled={loading} />
        <VoiceInput onText={(t) => setPrompt(t)} />
        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="spinner" style={{ width: 16, height: 16, border: '2px solid #5fb3f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span className="muted">{isRefine ? '正在应用调整，请稍候…' : '正在生成行程，请稍候…'}</span>
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="btn" onClick={onSubmit} disabled={loading}>{loading ? (isRefine ? '应用中…' : '生成中…') : (isRefine ? '应用调整' : '生成行程')}</button>
        {error && <span className="muted">{error}</span>}
      </div>
    </div>
  );
}