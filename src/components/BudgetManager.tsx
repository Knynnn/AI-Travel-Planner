import React, { useEffect, useMemo, useState } from 'react';
import { Expense } from '@/types';
import VoiceInput from './VoiceInput';
import { syncExpenses } from '@/services/sync';
import { getSupabase } from '@/services/supabaseClient';

const CATEGORIES = ['餐饮', '交通', '住宿', '门票', '购物', '其他'];

function parseExpenseText(text: string): Partial<Expense> | null {
  // very simple parser: "餐饮 80 元" or "hotel 300" -> category + amount
  const amountMatch = text.match(/(\d+[\.]?\d*)/);
  if (!amountMatch) return null;
  const amount = Number(amountMatch[1]);
  const category = CATEGORIES.find(c => text.includes(c)) || '其他';
  return { amount, category, notes: text };
}

export default function BudgetManager() {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const raw = localStorage.getItem('ai-travel-expenses');
    return raw ? JSON.parse(raw) : [];
  });
  useEffect(() => localStorage.setItem('ai-travel-expenses', JSON.stringify(expenses)), [expenses]);

  const [text, setText] = useState('');
  const addExpense = (p: Partial<Expense>) => {
    const exp: Expense = {
      id: Math.random().toString(36).slice(2),
      date: new Date().toISOString().slice(0, 10),
      category: p.category || '其他',
      amount: p.amount || 0,
      notes: p.notes || ''
    };
    setExpenses((arr) => [exp, ...arr]);
  };

  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const c of CATEGORIES) t[c] = 0;
    for (const e of expenses) t[e.category] = (t[e.category] || 0) + e.amount;
    const sum = expenses.reduce((acc, e) => acc + e.amount, 0);
    return { byCat: t, sum };
  }, [expenses]);

  return (
    <div className="card">
      <h3>费用记录</h3>
      <div className="row">
        <div className="col">
          <div className="field">
            <label>快速文本记录</label>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="示例：餐饮 80 元" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={() => { const p = parseExpenseText(text); if (p) addExpense(p); setText(''); }}>添加</button>
            <VoiceInput onText={(t) => { const p = parseExpenseText(t); if (p) addExpense(p); }} />
          </div>
        </div>
        <div className="col">
          <div className="card">
            <strong>总计：¥{totals.sum.toFixed(2)}</strong>
            <ul>
              {CATEGORIES.map(c => (
                <li key={c} className="muted">{c}: ¥{totals.byCat[c].toFixed(2)}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h4>记录列表</h4>
        {!expenses.length ? (
          <p className="muted">暂无记录</p>
        ) : (
          <ul>
            {expenses.map(e => (
              <li key={e.id}>{e.date} - {e.category} - ¥{e.amount.toFixed(2)}{e.notes ? ` - ${e.notes}` : ''}</li>
            ))}
          </ul>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="btn secondary" disabled={!expenses.length || !getSupabase()} onClick={async () => {
            try { await syncExpenses(expenses); alert('同步成功'); } catch (e: any) { alert('同步失败：' + (e.message || e)); }
          }}>同步到云端</button>
        </div>
      </div>
    </div>
  );
}