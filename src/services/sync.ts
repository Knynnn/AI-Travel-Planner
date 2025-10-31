import { getSupabase } from './supabaseClient';
import { Itinerary, Expense } from '@/types';

export async function syncItinerary(it: Itinerary) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('未配置 Supabase');
  const id = `${it.destination}-${it.days[0]?.date || ''}`.replace(/\s+/g, '');
  const { error } = await supabase.from('plans').upsert({
    id,
    destination: it.destination,
    data: it,
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
}

export async function syncExpenses(expenses: Expense[]) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('未配置 Supabase');
  if (!expenses.length) return;
  const { error } = await supabase.from('expenses').upsert(expenses.map(e => ({
    id: e.id,
    date: e.date,
    category: e.category,
    amount: e.amount,
    notes: e.notes || ''
  })));
  if (error) throw error;
}