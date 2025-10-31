import React, { useState } from 'react';
import { getSupabase } from '@/services/supabaseClient';
import { fetchCloudItineraries } from '@/services/sync';
import type { CloudPlanRow } from '@/services/sync';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [plans, setPlans] = useState<CloudPlanRow[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const supabase = getSupabase();
  const disabled = !supabase;

  const onLogin = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(`登录失败：${error.message}`);
      return;
    }
    setMessage(`登录成功：${data.user?.email}`);
    // 拉取云端行程
    try {
      setLoading(true);
      const rows = await fetchCloudItineraries();
      setPlans(rows);
    } catch (e: any) {
      setMessage(`拉取云端行程失败：${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.auth.signUp({ email, password });
    setMessage(error ? `注册失败：${error.message}` : `注册成功，请验证邮箱：${data.user?.email}`);
  };

  return (
    <div className="card">
      <h3>登录 / 注册（可选，需先在设置中配置 Supabase）</h3>
      {disabled && <p className="muted">未配置 Supabase，暂不可用。</p>}
      <div className="field">
        <label>邮箱</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label>密码</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" onClick={onLogin} disabled={disabled}>登录</button>
        <button className="btn secondary" onClick={onSignup} disabled={disabled}>注册</button>
      </div>
      {message && <p className="muted" style={{ marginTop: 10 }}>{message}</p>}
      {!!plans.length && (
        <div className="card" style={{ marginTop: 12 }}>
          <h4>云端保存的行程</h4>
          {loading && <p className="muted">正在加载列表…</p>}
          <ul>
            {plans.map((p) => (
              <li key={p.id} style={{ marginBottom: 8 }}>
                <strong>{p.destination}</strong>
                <span className="muted" style={{ marginLeft: 8 }}>更新于 {new Date(p.updated_at).toLocaleString()}</span>
                <button className="btn tiny" style={{ marginLeft: 8 }} onClick={() => {
                  localStorage.setItem('cloud_itinerary', JSON.stringify(p.data));
                  navigate('/plan');
                }}>导入到规划页</button>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn secondary" onClick={async () => {
              try { setLoading(true); const rows = await fetchCloudItineraries(); setPlans(rows); } catch (e: any) { setMessage(`刷新失败：${e.message || e}`); } finally { setLoading(false); }
            }}>刷新列表</button>
          </div>
        </div>
      )}
    </div>
  );
}