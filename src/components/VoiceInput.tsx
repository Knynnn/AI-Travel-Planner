import React, { useEffect } from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

type Props = {
  onText: (text: string) => void;
};

export default function VoiceInput({ onText }: Props) {
  const { supported, listening, result, start, stop } = useSpeechRecognition({ lang: 'zh-CN' });
  useEffect(() => { if (result) onText(result); }, [result]);
  if (!supported) return <span className="muted">当前浏览器不支持语音识别</span>;
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {listening ? (
        <button className="btn secondary" onClick={stop}>停止录音</button>
      ) : (
        <button className="btn" onClick={start}>🎙️ 开始语音输入</button>
      )}
    </div>
  );
}