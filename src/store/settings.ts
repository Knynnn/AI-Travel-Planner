import { create } from 'zustand';

type SettingsState = {
  provider: 'dashscope' | 'openai';
  dashscopeKey?: string;
  dashscopeBase?: string; // default compatible mode API
  openaiKey?: string;
  openaiBase?: string; // allow custom base
  model?: string;
  amapKey?: string;
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