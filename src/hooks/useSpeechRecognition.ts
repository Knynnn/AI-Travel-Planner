import { useEffect, useRef, useState } from 'react';

type Options = {
  lang?: string;
  interimResults?: boolean;
  continuous?: boolean;
};

export function useSpeechRecognition(options: Options = {}) {
  const { lang = 'zh-CN', interimResults = true, continuous = false } = options;
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState('');
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = interimResults;
    rec.continuous = continuous;
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setResult(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => rec && rec.stop();
  }, [lang, interimResults, continuous]);

  const start = () => { if (recRef.current) { setResult(''); setListening(true); recRef.current.start(); } };
  const stop = () => { if (recRef.current) { recRef.current.stop(); } };

  return { supported, listening, result, start, stop };
}