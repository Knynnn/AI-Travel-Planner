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
            <label>高德安全密钥（jscode）</label>
            <input value={s.amapJscode || ''} onChange={(e) => set({ amapJscode: e.target.value })} placeholder="2021-12-02 后申请的 Key 调用 REST 需配合" />
            <small className="muted">生产环境建议通过服务端代理自动附加；本地可在此填写。</small>
          </div>
          <div className="field">
            <label>高德 Web服务 API Key（REST）</label>
            <input value={s.amapServiceKey || ''} onChange={(e) => set({ amapServiceKey: e.target.value })} placeholder="用于 Web 服务接口（推荐）" />
            <small className="muted">避免 USERKEY_PLAT_NOMATCH：REST 请使用 Web服务 Key；JS API 仅用于前端地图库与插件。</small>
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