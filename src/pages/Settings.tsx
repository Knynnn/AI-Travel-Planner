import React from 'react';
import { useSettings } from '@/store/settings';

export default function Settings() {
  const s = useSettings();
  const set = s.set;

  return (
    <div className="card">
      <h3>API Key 与服务配置（仅本机存储）</h3>
      <p className="muted">注意：不要将任何 API Key 写在代码中。这里的设置保存在浏览器本地。</p>
      <div className="row">
        <div className="col">
          <div className="field">
            <label>大模型提供商</label>
            <select value={s.provider} onChange={(e) => set({ provider: e.target.value as any })}>
              <option value="dashscope">阿里云百炼（DashScope）</option>
              <option value="openai">OpenAI 兼容</option>
            </select>
          </div>
          {s.provider === 'dashscope' ? (
            <>
              <div className="field">
                <label>DashScope API Key</label>
                <input value={s.dashscopeKey || ''} onChange={(e) => set({ dashscopeKey: e.target.value })} placeholder="以 Bearer 形式使用" />
              </div>
              <div className="field">
                <label>DashScope Base（兼容接口）</label>
                <input value={s.dashscopeBase || ''} onChange={(e) => set({ dashscopeBase: e.target.value })} placeholder="默认 https://dashscope.aliyuncs.com/compatible-mode/v1" />
              </div>
            </>
          ) : (
            <>
              <div className="field">
                <label>OpenAI API Key</label>
                <input value={s.openaiKey || ''} onChange={(e) => set({ openaiKey: e.target.value })} placeholder="sk-..." />
              </div>
              <div className="field">
                <label>OpenAI Base</label>
                <input value={s.openaiBase || ''} onChange={(e) => set({ openaiBase: e.target.value })} placeholder="例如：自建兼容网关地址" />
              </div>
            </>
          )}
          <div className="field">
            <label>模型名称</label>
            <input value={s.model || ''} onChange={(e) => set({ model: e.target.value })} placeholder="qwen-plus / gpt-4o-mini 等" />
          </div>
        </div>
        <div className="col">
          <div className="field">
            <label>高德地图 Key</label>
            <input value={s.amapKey || ''} onChange={(e) => set({ amapKey: e.target.value })} placeholder="用于地图加载与地理编码" />
          </div>
          <div className="field">
            <label>Supabase URL</label>
            <input value={s.supabaseUrl || ''} onChange={(e) => set({ supabaseUrl: e.target.value })} placeholder="可选：用于云端同步" />
          </div>
          <div className="field">
            <label>Supabase Anon Key</label>
            <input value={s.supabaseAnonKey || ''} onChange={(e) => set({ supabaseAnonKey: e.target.value })} placeholder="可选：用于云端同步" />
          </div>
        </div>
      </div>
      <p className="muted">提示：Key 仅保存在浏览器本地（localStorage），不会写入代码仓库。</p>
    </div>
  );
}