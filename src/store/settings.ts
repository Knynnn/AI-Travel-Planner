import { create } from 'zustand';

type SettingsState = {
  provider: 'dashscope' | 'openai';
  dashscopeKey?: string;
  dashscopeBase?: string; // default compatible mode API
  openaiKey?: string;
  openaiBase?: string; // allow custom base
  model?: string;
  amapKey?: string;
  amapJscode?: string; // 高德安全密钥（jscode），部分 REST API 需配合
  amapServiceKey?: string; // 高德 Web服务 API Key（用于 REST 接口）
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  set: (partial: Partial<SettingsState>) => void;
};

const persisted = localStorage.getItem('ai-travel-settings');
const initial: SettingsState = persisted ? JSON.parse(persisted) : {
  provider: 'dashscope',
  dashscopeBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model: 'qwen-plus'
};

export const useSettings = create<SettingsState>((set) => ({
  ...initial,
  set: (partial) => set((prev) => {
    const next = { ...prev, ...partial };
    localStorage.setItem('ai-travel-settings', JSON.stringify(next));
    return next;
  })
}));