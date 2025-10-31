import { PlanInput, Itinerary, Provider } from '@/types';
import { useSettings } from '@/store/settings';

type ChatMessage = { role: 'system' | 'user'; content: string };

const systemPrompt = `你是一名专业旅行规划助手。根据用户的需求生成详细且可执行的行程，并给出预算分析。
输出必须是 JSON，对象结构如下：
{
  "destination": string,
  "days": [
    { "date": string, "activities": [ { "name": string, "address": string, "time": string, "notes": string } ], "hotel": string }
  ],
  "summary": string,
  "budget": { "currency": "CNY", "total": number, "breakdown": { "transportation": number, "lodging": number, "food": number, "tickets": number, "shopping": number, "misc": number }, "notes": string }
}
不要返回任何多余的文本。`;

export async function generateItinerary(input: PlanInput): Promise<Itinerary> {
  const s = useSettings.getState();
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `目的地: ${input.destination}\n日期: ${input.startDate} 到 ${input.endDate}\n预算(人民币): ${input.budgetCNY}\n同行人数: ${input.people}\n偏好: ${input.preferences}\n出发点: ${input.startAddress || (input.start ? `${input.start.lat},${input.start.lng}` : '未提供')}\n是否包含预算分析: ${input.includeBudget ? '是' : '否'}\n要求：活动给出可到访的具体地址；每天包含合理的酒店；如提供出发点，请按最优游览顺序考虑路线。`
    }
  ];

  const provider: Provider = s.provider;
  const model = s.model || (provider === 'dashscope' ? 'qwen-plus' : 'gpt-4o-mini');

  if (provider === 'dashscope') {
    if (!s.dashscopeKey) throw new Error('缺少 DashScope API Key，请在设置中填写');
    const resp = await fetch(`${s.dashscopeBase || 'https://dashscope.aliyuncs.com/compatible-mode/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${s.dashscopeKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: 'json_object' }
      })
    });
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '{}';
    return JSON.parse(text);
  } else {
    if (!s.openaiKey) throw new Error('缺少 OpenAI API Key，请在设置中填写');
    const base = s.openaiBase || 'https://api.openai.com/v1';
    const resp = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${s.openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, messages, response_format: { type: 'json_object' } })
    });
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '{}';
    return JSON.parse(text);
  }
}

export async function generateItineraryFromText(text: string): Promise<Itinerary> {
  const s = useSettings.getState();
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `${text}\n请按以上描述生成行程与预算分析，输出严格遵守 JSON 结构。` }
  ];

  const provider: Provider = s.provider;
  const model = s.model || (provider === 'dashscope' ? 'qwen-plus' : 'gpt-4o-mini');

  if (provider === 'dashscope') {
    if (!s.dashscopeKey) throw new Error('缺少 DashScope API Key，请在设置中填写');
    const resp = await fetch(`${s.dashscopeBase || 'https://dashscope.aliyuncs.com/compatible-mode/v1'}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${s.dashscopeKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, response_format: { type: 'json_object' } })
    });
    const data = await resp.json();
    const t = data.choices?.[0]?.message?.content || '{}';
    return JSON.parse(t);
  } else {
    if (!s.openaiKey) throw new Error('缺少 OpenAI API Key，请在设置中填写');
    const base = s.openaiBase || 'https://api.openai.com/v1';
    const resp = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${s.openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, response_format: { type: 'json_object' } })
    });
    const data = await resp.json();
    const t = data.choices?.[0]?.message?.content || '{}';
    return JSON.parse(t);
  }
}

// 流式生成：逐字输出 JSON，并在可解析时回传部分草稿
export async function generateItineraryFromTextStream(
  text: string,
  onProgress?: (update: { raw: string; parsed?: Itinerary }) => void
): Promise<Itinerary> {
  const s = useSettings.getState();
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `${text}\n请按以上描述生成行程与预算分析，输出严格遵守 JSON 结构。` }
  ];

  const provider: Provider = s.provider;
  const model = s.model || (provider === 'dashscope' ? 'qwen-plus' : 'gpt-4o-mini');

  const tryParse = (raw: string): Itinerary | undefined => {
    try { return JSON.parse(raw); } catch { return undefined; }
  };

  const emit = (acc: string) => {
    const parsed = tryParse(acc);
    onProgress?.({ raw: acc, parsed });
  };

  const decoder = new TextDecoder('utf-8');
  let acc = '';

  if (provider === 'dashscope') {
    if (!s.dashscopeKey) throw new Error('缺少 DashScope API Key，请在设置中填写');
    const resp = await fetch(`${s.dashscopeBase || 'https://dashscope.aliyuncs.com/compatible-mode/v1'}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${s.dashscopeKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, response_format: { type: 'json_object' }, stream: true })
    });
    if (!resp.body) {
      // 兼容不支持流的情况：降级到一次性生成
      const once = await generateItineraryFromText(text);
      emit(JSON.stringify(once));
      return once;
    }
    const reader = resp.body.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      // 解析 SSE 的 data 行
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === '[DONE]') continue;
        try {
          const json = JSON.parse(dataStr);
          const delta = json.choices?.[0]?.delta?.content || '';
          if (delta) { acc += delta; emit(acc); }
        } catch { /* 忽略非 JSON 行 */ }
      }
    }
    const final = tryParse(acc) || { destination: '', days: [] } as Itinerary;
    return final;
  } else {
    if (!s.openaiKey) throw new Error('缺少 OpenAI API Key，请在设置中填写');
    const base = s.openaiBase || 'https://api.openai.com/v1';
    const resp = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${s.openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, response_format: { type: 'json_object' }, stream: true })
    });
    if (!resp.body) {
      const once = await generateItineraryFromText(text);
      emit(JSON.stringify(once));
      return once;
    }
    const reader = resp.body.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === '[DONE]') continue;
        try {
          const json = JSON.parse(dataStr);
          const delta = json.choices?.[0]?.delta?.content || '';
          if (delta) { acc += delta; emit(acc); }
        } catch { }
      }
    }
    const final = tryParse(acc) || { destination: '', days: [] } as Itinerary;
    return final;
  }
}

// 基于上一版行程的对话式调整（流式），返回更新后的 JSON
export async function refineItineraryFromTextStream(
  previous: Itinerary,
  feedback: string,
  onProgress?: (update: { raw: string; parsed?: Itinerary }) => void
): Promise<Itinerary> {
  const s = useSettings.getState();
  const refineSystem = `你是一名专业旅行规划助手。你将收到一份已生成的行程(JSON)与用户的调整意见，请据此对行程进行修改与完善，并保持可执行性(活动给出可到访的具体地址、每天包含合理的酒店)。
输出必须是完整的 JSON(与原结构一致，不要包含解释文字)。如目的地或天数需变化，请直接在 JSON 中体现，并保证预算字段合理。`;
  const messages: ChatMessage[] = [
    { role: 'system', content: refineSystem },
    { role: 'user', content: `上一版行程(JSON)：\n${JSON.stringify(previous)}\n用户的调整意见：\n${feedback}\n请输出更新后的完整 JSON。` }
  ];

  const provider: Provider = s.provider;
  const model = s.model || (provider === 'dashscope' ? 'qwen-plus' : 'gpt-4o-mini');

  const tryParse = (raw: string): Itinerary | undefined => { try { return JSON.parse(raw); } catch { return undefined; } };
  const emit = (acc: string) => { const parsed = tryParse(acc); onProgress?.({ raw: acc, parsed }); };
  const decoder = new TextDecoder('utf-8');
  let acc = '';

  if (provider === 'dashscope') {
    if (!s.dashscopeKey) throw new Error('缺少 DashScope API Key，请在设置中填写');
    const resp = await fetch(`${s.dashscopeBase || 'https://dashscope.aliyuncs.com/compatible-mode/v1'}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${s.dashscopeKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, response_format: { type: 'json_object' }, stream: true })
    });
    if (!resp.body) {
      // 回退到一次性生成
      const once = await generateItineraryFromText(`${JSON.stringify(previous)}\n调整：${feedback}`);
      emit(JSON.stringify(once));
      return once;
    }
    const reader = resp.body.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === '[DONE]') continue;
        try {
          const json = JSON.parse(dataStr);
          const delta = json.choices?.[0]?.delta?.content || '';
          if (delta) { acc += delta; emit(acc); }
        } catch { }
      }
    }
    const final = tryParse(acc) || { destination: '', days: [] } as Itinerary;
    return final;
  } else {
    if (!s.openaiKey) throw new Error('缺少 OpenAI API Key，请在设置中填写');
    const base = s.openaiBase || 'https://api.openai.com/v1';
    const resp = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${s.openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, response_format: { type: 'json_object' }, stream: true })
    });
    if (!resp.body) {
      const once = await generateItineraryFromText(`${JSON.stringify(previous)}\n调整：${feedback}`);
      emit(JSON.stringify(once));
      return once;
    }
    const reader = resp.body.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === '[DONE]') continue;
        try {
          const json = JSON.parse(dataStr);
          const delta = json.choices?.[0]?.delta?.content || '';
          if (delta) { acc += delta; emit(acc); }
        } catch { }
      }
    }
    const final = tryParse(acc) || { destination: '', days: [] } as Itinerary;
    return final;
  }
}