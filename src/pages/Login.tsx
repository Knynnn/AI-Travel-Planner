import React, { useState } from 'react';
import { getSupabase } from '@/services/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const supabase = getSupabase();
  const disabled = !supabase;

  const onLogin = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? `登录失败：${error.message}` : `登录成功：${data.user?.email}`);
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
    </div>
  );
}